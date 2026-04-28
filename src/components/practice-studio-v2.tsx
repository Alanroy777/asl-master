'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import {
  initializeLessonProgress,
  getLessonProgress,
  updateSignStatus,
  unlockNextSign,
  getLessonSummary,
} from '@/lib/supabase/progressQueries'
import { extractLandmarks, recognizeSign } from '@/lib/aslModel'
import { initializeHolistic, stopHolistic, drawLandmarks } from '@/lib/holisticSetup'
import type { SignWithProgress, LessonSummary } from '@/types/practice'
import styles from './practice-studio-v2.module.css'

type Mode = 'loading' | 'learn' | 'practice' | 'completed_sign' | 'completed'

interface Props { lessonId: string; learnerId: string }

const HOLD_FRAMES_NEEDED = 45
const FRAME_BUFFER_SIZE = 30

export default function PracticeStudio({ lessonId, learnerId }: Props) {
  /* ── State ── */
  const [scriptsReady, setScriptsReady] = useState(0) // count of loaded scripts
  const [mode, setMode] = useState<Mode>('loading')
  const [signs, setSigns] = useState<SignWithProgress[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [videoWatched, setVideoWatched] = useState(false)
  const [detectionText, setDetectionText] = useState('Show your hand to the camera')
  const [detectionState, setDetectionState] = useState<'none' | 'wrong' | 'correct'>('none')
  const [holdProgress, setHoldProgress] = useState(0) // 0-100
  const [summary, setSummary] = useState<LessonSummary | null>(null)
  const [lastAttemptScore, setLastAttemptScore] = useState(0)

  /* ── Refs ── */
  const videoRef = useRef<HTMLVideoElement>(null)
  const refVideoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const holisticRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)
  const frameBuffer = useRef<Float32Array[]>([])
  const holdTimer = useRef(0)
  const confidences = useRef<number[]>([])
  const modeRef = useRef<Mode>('loading')
  // Stable refs to avoid stale closures in holistic callback
  const signsRef = useRef<SignWithProgress[]>([])
  const currentIdxRef = useRef(0)

  const currentSign = signs[currentIdx]

  /* ── Sync stable refs ── */
  useEffect(() => { modeRef.current = mode }, [mode])
  useEffect(() => { signsRef.current = signs }, [signs])
  useEffect(() => { currentIdxRef.current = currentIdx }, [currentIdx])

  /* ── Load lesson on mount ── */
  useEffect(() => {
    ; (async () => {
      await initializeLessonProgress(learnerId, lessonId)
      const data = await getLessonProgress(learnerId, lessonId)
      setSigns(data)

      if (!data || data.length === 0) {
        setMode('error' as any)
        return
      }

      const firstNonCompleted = data.findIndex(s => s.progress?.status !== 'completed')
      const idx = firstNonCompleted === -1 ? 0 : firstNonCompleted
      setCurrentIdx(idx)

      if (data.every(s2 => s2.progress?.status === 'completed')) {
        const sum = await getLessonSummary(learnerId, lessonId)
        setSummary(sum); setMode('completed'); return
      }

      const s = data[idx]
      if (s.progress?.status !== 'practicing' && s.progress?.status !== 'completed') {
        await updateSignStatus(learnerId, lessonId, s.sign_id, 'practicing')
      }
      setMode('practice')
    })()
  }, [learnerId, lessonId])

  /* ── Camera cleanup on unmount ── */
  useEffect(() => () => { stopHolistic(holisticRef.current, cameraRef.current) }, [])

  /* ── Script load counter ── */
  const onScriptLoad = useCallback(() => setScriptsReady(n => n + 1), [])

  // Instant check in case scripts were already loaded from a previous page visit
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const w = window as any
      if (w.Holistic && w.Camera && w.drawConnectors) {
        setScriptsReady(3)
      }
    }
  }, [])

  /* ── Start camera (practice mode) ── */
  const startCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return
    frameBuffer.current = []
    holdTimer.current = 0
    confidences.current = []
    setHoldProgress(0)
    setDetectionState('none')
    setDetectionText('Show your hand to the camera')

    try {
      const { holistic, camera } = await initializeHolistic(videoRef.current, onHolisticResults)
      holisticRef.current = holistic
      cameraRef.current = camera
    } catch (e) {
      console.error('[PracticeStudio] camera error', e)
      setDetectionText('Camera error — please allow permissions')
    }
  }, []) // eslint-disable-line

  /* ── Stop camera ── */
  const stopCamera = useCallback(() => {
    stopHolistic(holisticRef.current, cameraRef.current)
    holisticRef.current = null
    cameraRef.current = null
  }, [])

  /* ── Holistic results callback ── */
  const onHolisticResults = useCallback(async (results: any) => {
    if (modeRef.current !== 'practice') return
    if (!canvasRef.current) return

    drawLandmarks(canvasRef.current, results)

    const frame = extractLandmarks(results)
    const hasHands = frame !== null

    if (frame) {
      frameBuffer.current.push(frame)
      if (frameBuffer.current.length > FRAME_BUFFER_SIZE)
        frameBuffer.current.shift()
    }

    if (!hasHands) {
      holdTimer.current = 0
      confidences.current = []
      setDetectionState('none')
      setDetectionText('Show your hand to the camera')
      setHoldProgress(0)
      return
    }

    if (frameBuffer.current.length < FRAME_BUFFER_SIZE) {
      setDetectionText('Buffering frames…')
      return
    }

    const currentSign = signsRef.current[currentIdxRef.current]
    if (!currentSign) return

    // Smarter: Recognize across all signs in the lesson
    const allowedSigns = signsRef.current.map(s => ({
      name: s.name,
      blueprint: s.blueprint
    }))

    const result = await recognizeSign(
      frameBuffer.current,
      allowedSigns,
      hasHands
    )

    if (result && result.confidence >= 0.70) {
      if (result.label === currentSign.name) {
        // CORRECT TARGET SIGN
        holdTimer.current++
        confidences.current.push(result.confidence)
        const pct = Math.min(100, Math.round((holdTimer.current / HOLD_FRAMES_NEEDED) * 100))
        setHoldProgress(pct)
        setDetectionState('correct')
        const pctLabel = Math.round(result.confidence * 100)
        setDetectionText(`${pctLabel}% match for ${currentSign.name} — hold it!`)

        if (holdTimer.current >= HOLD_FRAMES_NEEDED) {
          const avg = confidences.current.reduce((a, b) => a + b, 0) / confidences.current.length
          const score = Math.round(avg * 100)
          await handlePassRef.current(score)
        }
      } else {
        // DETECTED A DIFFERENT SIGN FROM THE LESSON
        holdTimer.current = 0
        confidences.current = []
        setHoldProgress(0)
        setDetectionState('wrong')
        setDetectionText(`That looks like "${result.label}"! Try "${currentSign.name}" instead.`)
      }
    } else {
      // NO CLEAR MATCH
      holdTimer.current = 0
      confidences.current = []
      setHoldProgress(0)
      if (result && result.confidence > 0.4) {
        setDetectionState('wrong')
        setDetectionText('Close! Adjust your hand shape...')
      } else {
        setDetectionState('none')
        setDetectionText('Show your hand to the camera')
      }
    }
  }, []) // refs keep this stable

  /* ── Pass handler ── */
  const handlePass = useCallback(async (score: number) => {
    stopCamera()
    const sign = signsRef.current[currentIdxRef.current]
    if (!sign) return

    setLastAttemptScore(score)
    setHoldProgress(100)
    setDetectionState('correct')
    setDetectionText(`🎉 Passed with ${score}%!`)

    await updateSignStatus(learnerId, lessonId, sign.sign_id, 'completed', score)
    const refreshed = await getLessonProgress(learnerId, lessonId)
    setSigns(refreshed)

    // Brief pause then show overlay
    setTimeout(() => setMode('completed_sign' as any), 600)
  }, [learnerId, lessonId, stopCamera])

  // Fix: stable ref for handlePass to avoid stale closures in holistic callback
  const handlePassRef = useRef(handlePass)
  useEffect(() => { handlePassRef.current = handlePass }, [handlePass])



  /* ── Camera initialization effect ── */
  useEffect(() => {
    if (mode === 'practice' && scriptsReady >= 3) {
      startCamera()
    } else if (mode !== 'practice') {
      stopCamera()
    }
  }, [mode, scriptsReady, startCamera, stopCamera])

  /* ── "Next Sign" click ── */
  const handleNextSign = useCallback(async () => {
    const sign = signs[currentIdx]
    if (!sign) return
    const next = await unlockNextSign(learnerId, lessonId, sign.sign_id)
    const refreshed = await getLessonProgress(learnerId, lessonId)
    setSigns(refreshed)
    if (!next) {
      const sum = await getLessonSummary(learnerId, lessonId)
      setSummary(sum); setMode('completed'); return
    }
    const nextIdx = refreshed.findIndex(s => s.sign_id === next.sign_id)
    setCurrentIdx(nextIdx >= 0 ? nextIdx : currentIdx + 1)

    // Automatically transition to practicing
    if (next.progress?.status !== 'practicing' && next.progress?.status !== 'completed') {
      await updateSignStatus(learnerId, lessonId, next.sign_id, 'practicing')
    }

    setMode('practice')
    setVideoWatched(false)
    holdTimer.current = 0
    confidences.current = []
    setHoldProgress(0)
    setDetectionState('none')
  }, [signs, currentIdx, learnerId, lessonId])

  /* ── Practice Again ── */
  const handlePracticeAgain = useCallback(async () => {
    // Reset all to 'practicing' directly to skip learn mode
    for (const s of signs) {
      await updateSignStatus(learnerId, lessonId, s.sign_id, 'practicing')
    }
    const refreshed = await getLessonProgress(learnerId, lessonId)
    setSigns(refreshed)
    setCurrentIdx(0)
    setMode('practice')
    setVideoWatched(false)
  }, [signs, learnerId, lessonId])

  /* ── Tip text ── */
  const getTip = (cat: string) => {
    if (cat === 'alphabet') return 'Focus on finger positions and hand shape.'
    if (cat === 'numbers') return 'Notice the hand orientation and finger count.'
    return 'Follow the full hand movement from start to finish.'
  }

  /* ── Score label ── */
  const scoreLabel = (score: number) => {
    if (score >= 90) return 'Perfect! 🌟'
    if (score >= 75) return 'Excellent! ✨'
    if (score >= 60) return 'Great job! 👏'
    return 'Good effort! 💪'
  }

  /* ═══════════════════════════ RENDER ═══════════════════════════════ */

  if (mode === 'loading') return (
    <div className={styles.loadingScreen}>
      <div className={styles.spinner} />
      <p>Loading your lesson…</p>
    </div>
  )

  const modeInternal = mode as any

  if (modeInternal === 'error') return (
    <div className={styles.studioRoot}>
      <div className={styles.completedScreen}>
        <h1 className={styles.completedHeading} style={{ color: '#ef4444' }}>Session Error</h1>
        <p className={styles.completedSubtitle}>
          We couldn't load any signs for this lesson. Please ensure the instructor has added signs to this unit.
        </p>
        <div className={styles.completedGrid} style={{ display: 'flex', justifyContent: 'center' }}>
          <button className={styles.primaryBtn} onClick={() => window.location.href = '/practice'}>
            Back to Practice Menu
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className={styles.studioRoot}>
      {/* CDN Scripts */}
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" strategy="afterInteractive" onLoad={onScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" onLoad={onScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" onLoad={onScriptLoad} />

      {/* ── PRACTICE MODE ───────────────────────────────────── */}
      {mode === 'practice' && currentSign && (
        <div className={styles.practiceLayout}>

          {/* Sidebar */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>Lesson Signs</h3>
            <div className={styles.sidebarList}>
              {signs.map((s, i) => {
                const st = s.progress?.status ?? 'locked'
                const isCurrent = i === currentIdx
                return (
                  <div
                    key={s.sign_id}
                    className={`${styles.sidebarItem} ${styles[`sidebar_${st}`]} ${isCurrent ? styles.sidebarCurrent : ''}`}
                    title={st === 'completed' ? `Score: ${s.progress?.score ?? '—'}%` : s.name}
                  >
                    <span className={styles.sidebarIcon}>
                      {st === 'locked' && '🔒'}
                      {st === 'learned' && '👁️'}
                      {st === 'practicing' && '✋'}
                      {st === 'completed' && '✅'}
                    </span>
                    <span className={styles.sidebarName}>{s.name}</span>
                    {st === 'completed' && <span className={styles.sidebarScore}>{s.progress?.score}%</span>}
                  </div>
                )
              })}
            </div>
          </aside>

          {/* Reference */}
          <div className={styles.referenceCol}>
            <h2 className={styles.refSignName}>{currentSign.name}</h2>
            <div className={styles.refVideoSmall}>
              {currentSign.video_url && (
                <video src={currentSign.video_url} autoPlay loop muted playsInline className={styles.refVideoEl} />
              )}
            </div>
            <div className={styles.refStats}>
              <div className={styles.refStat}>
                <span className={styles.refStatLabel}>Best Score</span>
                <span className={styles.refStatValue}>{currentSign.progress?.score ?? '—'}%</span>
              </div>
              <div className={styles.refStat}>
                <span className={styles.refStatLabel}>Attempts</span>
                <span className={styles.refStatValue}>{currentSign.progress?.attempts ?? 0}</span>
              </div>
            </div>
            <p className={styles.hintText}>💡 {getTip(currentSign.category)}</p>
          </div>

          {/* Webcam */}
          <div className={styles.webcamCol}>
            <div className={`${styles.webcamFrame} ${detectionState === 'correct' ? styles.webcamCorrect : ''} ${detectionState === 'none' ? styles.webcamScanning : ''}`}>
              <video ref={videoRef} className="hidden" playsInline muted autoPlay />
              <canvas ref={canvasRef} className="w-full h-full" width={640} height={480} />

              {/* Detection overlay */}
              <div className={styles.detectionOverlay}>
                <p className={`${styles.detectionText} ${styles[`detect_${detectionState}`]}`}>
                  {detectionText}
                </p>
              </div>

              {/* Scanning ring */}
              {detectionState === 'none' && <div className={styles.scanRing} />}
            </div>

            {/* Hold progress bar */}
            <div className={styles.holdBarWrapper}>
              <p className={styles.holdBarLabel}>Hold the sign steady…</p>
              <div className={styles.holdBarTrack}>
                <div className={styles.holdBarFill} style={{ width: `${holdProgress}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SIGN COMPLETED OVERLAY ──────────────────────────── */}
      {mode === 'completed_sign' && currentSign && (() => {
        const lastScore = lastAttemptScore
        return (
          <div className={styles.passOverlay}>
            <div className={styles.confettiCanvas} aria-hidden="true">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={styles.confettiPiece} style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 1.5}s`,
                  backgroundColor: ['#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'][i % 5]
                }} />
              ))}
            </div>
            <div className={styles.passCard}>
              <div className={styles.scoreCircle}>{lastScore}</div>
              <h2 className={styles.scoreLabel}>{scoreLabel(lastScore)}</h2>
              <p className={styles.scoreSubtitle}>You signed <strong>{currentSign.name}</strong> correctly!</p>
              <button id="next-sign-btn" className={styles.primaryBtn} onClick={handleNextSign}>
                Next Sign →
              </button>
            </div>
          </div>
        )
      })()}

      {/* ── LESSON COMPLETED ────────────────────────────────── */}
      {mode === 'completed' && (
        <div className={styles.completedScreen}>
          <h1 className={styles.completedHeading}>Lesson Complete! 🎉</h1>
          {summary && (
            <>
              <p className={styles.completedSubtitle}>
                Average Score: <strong>{summary.averageScore}%</strong> · {summary.completedSigns}/{summary.totalSigns} signs mastered
              </p>
              <div className={styles.completedGrid}>
                {summary.signResults.map(r => (
                  <div key={r.sign_id} className={`${styles.completedCard} ${r.status === 'completed' ? styles.completedCardDone : ''}`}>
                    <span className={styles.completedCardIcon}>
                      {r.status === 'completed' ? '✅' : '🔒'}
                    </span>
                    <span className={styles.completedCardName}>{r.name}</span>
                    {r.score !== null && <span className={styles.completedCardScore}>{r.score}%</span>}
                  </div>
                ))}
              </div>
            </>
          )}
          <div className={styles.completedActions}>
            <a href="/learn" className={styles.secondaryBtn}>Back to Lessons</a>
            <button className={styles.primaryBtn} onClick={handlePracticeAgain}>Practice Again</button>
          </div>
        </div>
      )}
    </div>
  )
}
