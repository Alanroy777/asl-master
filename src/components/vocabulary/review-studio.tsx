'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Script from 'next/script'
import { extractLandmarks, recognizeSign } from '@/lib/aslModel'
import { initializeHolistic, stopHolistic, drawLandmarks } from '@/lib/holisticSetup'
import styles from '@/components/practice-studio-v2.module.css'
import { logPracticeSession } from '@/app/lib/actions'

type Mode = 'loading' | 'practice' | 'completed_sign' | 'completed'

interface SignForReview {
    id: string;
    name: string;
    word?: string;
    video_url?: string | null;
    category?: string;
    masteryScore?: number;
    masteryLevel?: string;
    isMastered?: boolean;
    isNew?: boolean;
}

interface Props {
    initialSigns: SignForReview[];
}

const HOLD_FRAMES_NEEDED = 45
const FRAME_BUFFER_SIZE = 30

export default function ReviewStudio({ initialSigns }: Props) {
    const [scriptsReady, setScriptsReady] = useState(0)
    const [mode, setMode] = useState<Mode>('loading')
    const [signs] = useState<SignForReview[]>(initialSigns)
    const [currentIdx, setCurrentIdx] = useState(0)

    const [detectionText, setDetectionText] = useState('Show your hand to the camera')
    const [detectionState, setDetectionState] = useState<'none' | 'wrong' | 'correct'>('none')
    const [holdProgress, setHoldProgress] = useState(0)

    const [sessionScores, setSessionScores] = useState<number[]>([])

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const holisticRef = useRef<any>(null)
    const cameraRef = useRef<any>(null)
    const frameBuffer = useRef<Float32Array[]>([])
    const holdTimer = useRef(0)
    const confidences = useRef<number[]>([])
    const modeRef = useRef<Mode>('loading')

    const signsRef = useRef<SignForReview[]>([])
    const currentIdxRef = useRef(0)

    const currentSign = signs[currentIdx]

    useEffect(() => { modeRef.current = mode }, [mode])
    useEffect(() => { signsRef.current = signs }, [signs])
    useEffect(() => { currentIdxRef.current = currentIdx }, [currentIdx])

    useEffect(() => {
        if (signs.length > 0) {
            setMode('practice')
        } else {
            setMode('completed')
        }
    }, [signs])

    const onScriptLoad = useCallback(() => setScriptsReady(n => n + 1), [])
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const w = window as any
            if (w.Holistic && w.Camera && w.drawConnectors) {
                setScriptsReady(3)
            }
        }
    }, [])

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
            console.error('[ReviewStudio] camera error', e)
            setDetectionText('Camera error — please allow permissions')
        }
    }, [])

    const stopCamera = useCallback(() => {
        stopHolistic(holisticRef.current, cameraRef.current)
        holisticRef.current = null
        cameraRef.current = null
    }, [])

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

        const allowedSigns = signsRef.current.map(s => ({
            name: s.name,
            blueprint: (s as any).blueprint
        }))

        const result = await recognizeSign(
            frameBuffer.current,
            allowedSigns,
            hasHands
        )

        if (result && result.confidence >= 0.65) {
            if (result.label === currentSign.name) {
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
                    await handlePass(score)
                }
            } else {
                holdTimer.current = 0
                confidences.current = []
                setHoldProgress(0)
                setDetectionState('wrong')
                setDetectionText(`That looks like "${result.label}"! Try "${currentSign.name}" instead.`)
            }
        } else {
            holdTimer.current = 0
            confidences.current = []
            setHoldProgress(0)
            if (result && result.confidence > 0.4) {
                setDetectionState('wrong'); setDetectionText('Close! Adjust your hand...')
            } else {
                setDetectionState('none'); setDetectionText('Show your hand to the camera')
            }
        }
    }, [])

    const handlePass = useCallback(async (score: number) => {
        stopCamera()
        const sign = signsRef.current[currentIdxRef.current]
        if (!sign) return

        logPracticeSession(sign.id, score)

        setSessionScores(prev => [...prev, score])
        setDetectionState('correct')
        setDetectionText(`🎉 Passed with ${score}%!`)
        setHoldProgress(100)

        setTimeout(() => setMode('completed_sign'), 600)
    }, [stopCamera])

    useEffect(() => {
        if (mode === 'practice' && scriptsReady >= 3) {
            startCamera()
        } else if (mode !== 'practice') {
            stopCamera()
        }
    }, [mode, scriptsReady, startCamera, stopCamera])

    useEffect(() => () => { stopCamera() }, [stopCamera])

    const handleNextSign = useCallback(() => {
        if (currentIdx + 1 >= signs.length) {
            setMode('completed')
        } else {
            setCurrentIdx(currentIdx + 1)
            setMode('practice')
            holdTimer.current = 0
            confidences.current = []
            setHoldProgress(0)
            setDetectionState('none')
        }
    }, [currentIdx, signs.length])

    const getTip = (cat: string) => {
        if (cat === 'alphabet') return 'Focus on finger positions and hand shape.'
        if (cat === 'numbers') return 'Notice the hand orientation and finger count.'
        return 'Follow the full hand movement from start to finish.'
    }

    const scoreLabel = (score: number) => {
        if (score >= 90) return 'Perfect! 🌟'
        if (score >= 75) return 'Excellent! ✨'
        if (score >= 60) return 'Great job! 👏'
        return 'Good effort! 💪'
    }

    if (mode === 'loading') return (
        <div className={styles.loadingScreen}>
            <div className={styles.spinner} />
            <p>Loading Review Session…</p>
        </div>
    )

    return (
        <div className={styles.studioRoot}>
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" strategy="afterInteractive" onLoad={onScriptLoad} />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" onLoad={onScriptLoad} />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" onLoad={onScriptLoad} />

            {mode === 'practice' && currentSign && (
                <div className={styles.practiceLayout}>
                    <aside className={styles.sidebar}>
                        <h3 className={styles.sidebarTitle}>Review Queue</h3>
                        <div className={styles.sidebarList}>
                            {signs.map((s, i) => {
                                const isCurrent = i === currentIdx
                                const isDone = i < currentIdx
                                return (
                                    <div
                                        key={`${s.id}-${i}`}
                                        className={`${styles.sidebarItem} ${isDone ? styles.sidebar_completed : isCurrent ? styles.sidebar_practicing : styles.sidebar_locked} ${isCurrent ? styles.sidebarCurrent : ''}`}
                                    >
                                        <span className={styles.sidebarIcon}>
                                            {isDone ? '✅' : isCurrent ? (s.isNew ? '✨' : '✋') : '🔒'}
                                        </span>
                                        <span className={styles.sidebarName}>{s.name}</span>
                                        {isDone && <span className={styles.sidebarScore}>{sessionScores[i]}%</span>}
                                        {!isDone && s.isNew && <span className="ml-auto text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">NEW</span>}
                                    </div>
                                )
                            })}
                        </div>
                    </aside>

                    <div className={styles.referenceCol}>
                        <h2 className={styles.refSignName}>{currentSign.name}</h2>
                        <div className={styles.refVideoSmall}>
                            {currentSign.video_url && (
                                <video src={currentSign.video_url} autoPlay loop muted playsInline className={styles.refVideoEl} />
                            )}
                        </div>
                        <div className={styles.refStat}>
                            <span className={styles.refStatLabel}>
                                {currentSign.isNew ? 'Status' : 'Current Mastery'}
                            </span>
                            <span className={styles.refStatValue}>
                                {currentSign.isNew ? 'New Sign' : `${Math.round(currentSign.masteryScore ?? 0)}%`}
                            </span>
                        </div>
                        <p className={styles.hintText}>💡 {getTip(currentSign.category || '')}</p>
                    </div>

                    <div className={styles.webcamCol}>
                        <div className={`${styles.webcamFrame} ${detectionState === 'correct' ? styles.webcamCorrect : ''} ${detectionState === 'none' ? styles.webcamScanning : ''}`}>
                            <video ref={videoRef} className={styles.hiddenVideo} playsInline muted autoPlay />
                            <canvas ref={canvasRef} className={styles.webcamCanvas} width={640} height={480} />

                            <div className={styles.detectionOverlay}>
                                <p className={`${styles.detectionText} ${styles[`detect_${detectionState}`]}`}>
                                    {detectionText}
                                </p>
                            </div>

                            {detectionState === 'none' && <div className={styles.scanRing} />}
                        </div>

                        <div className={styles.holdBarWrapper}>
                            <p className={styles.holdBarLabel}>Hold the sign steady…</p>
                            <div className={styles.holdBarTrack}>
                                <div className={styles.holdBarFill} style={{ width: `${holdProgress}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'completed_sign' && currentSign && (() => {
                const lastScore = sessionScores[sessionScores.length - 1] || 0
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
                            <button className={styles.primaryBtn} onClick={handleNextSign}>
                                Next Sign →
                            </button>
                        </div>
                    </div>
                )
            })()}

            {mode === 'completed' && (
                <div className={styles.completedScreen}>
                    <h1 className={styles.completedHeading}>Review Complete! 🎉</h1>
                    <p className={styles.completedSubtitle}>
                        You reviewed {signs.length} signs. Keep up the great work!
                    </p>
                    <div className={styles.completedGrid}>
                        {signs.map((s, i) => (
                            <div key={s.id} className={`${styles.completedCard} ${styles.completedCardDone}`}>
                                <span className={styles.completedCardIcon}>✅</span>
                                <span className={styles.completedCardName}>{s.name}</span>
                                <span className={styles.completedCardScore}>{sessionScores[i]}%</span>
                            </div>
                        ))}
                    </div>
                    <div className={styles.completedActions}>
                        <a href="/vocabulary" className={styles.primaryBtn}>Return to Dashboard</a>
                    </div>
                </div>
            )}
        </div>
    )
}
