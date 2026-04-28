"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import WebcamRecorder from '@/components/webcam-recorder'
import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision'
// Removed broken import
import { normalizeHand } from '@/lib/aslModel'
import { extractLandmarks, recognizeSign } from '@/lib/aslModel'
import { initializeHolistic, stopHolistic, drawLandmarks } from '@/lib/holisticSetup'
import { ArrowLeft, Loader2, Trophy, RefreshCcw, Hand, Play, Target, HelpCircle } from 'lucide-react'
import Link from 'next/link'
import { logFingerspellingScore, getAlphabetsWithBlueprints } from '@/app/lib/actions'

import Script from 'next/script'

interface Sign {
    id: string;
    name: string;
    videoUrl: string;
    blueprint: any;
}

interface FingerspellingEngineProps {
    mode: 'TIME_TRIAL' | 'WORD_SPELL'
    targetSequence: string[] // legacy support
    onComplete: (stats: { timeSeconds: number, mistakes: number }) => void
}

export default function FingerspellingEngine({ mode, targetSequence, onComplete }: FingerspellingEngineProps) {
    const [scriptsReady, setScriptsReady] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0)
    const [elapsedTime, setElapsedTime] = useState(0)
    const [feedback, setFeedback] = useState<string>('Show your hand to start')
    const [holdProgress, setHoldProgress] = useState(0)
    const [signs, setSigns] = useState<Sign[]>([])
    const [showHint, setShowHint] = useState(false)

    // Refs for AI loop
    const isPlayingRef = useRef(false)
    const currentIndexRef = useRef(0)
    const startTimeRef = useRef<number | null>(null)
    const holdTimer = useRef(0)
    const frameBuffer = useRef<Float32Array[]>([])
    const signsRef = useRef<Sign[]>([])

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const holisticRef = useRef<any>(null)
    const cameraRef = useRef<any>(null)

    const HOLD_FRAMES_NEEDED = 30 // Fast for game
    const FRAME_BUFFER_SIZE = 30

    const onScriptLoad = useCallback(() => setScriptsReady(n => n + 1), [])

    // Load signs from library on mount
    useEffect(() => {
        async function load() {
            const data = await getAlphabetsWithBlueprints() as Sign[]
            setSigns(data)
            signsRef.current = data
            setIsLoading(false)
        }
        load()
    }, [])

    useEffect(() => {
        isPlayingRef.current = isPlaying
        currentIndexRef.current = currentIndex
    }, [isPlaying, currentIndex])

    // Effect to start camera once isPlaying is true AND elements are ready
    useEffect(() => {
        if (!isPlaying || holisticRef.current || scriptsReady < 3) return

        const init = async () => {
            if (!videoRef.current || !canvasRef.current) {
                // Wait for next tick if refs aren't set yet
                setTimeout(init, 50)
                return
            }

            try {
                const { holistic, camera } = await initializeHolistic(videoRef.current, onHolisticResults)
                holisticRef.current = holistic
                cameraRef.current = camera
            } catch (e) {
                console.error(e)
                setFeedback("Camera failed. Check permissions.")
            }
        }
        init()
    }, [isPlaying, scriptsReady])

    const stopCamera = useCallback(() => {
        if (cameraRef.current) {
            stopHolistic(holisticRef.current, cameraRef.current)
        }
        holisticRef.current = null
        cameraRef.current = null
    }, [])

    const onHolisticResults = useCallback(async (results: any) => {
        if (!isPlayingRef.current || !canvasRef.current) return

        // Cache results for the geometric engine
        (globalThis as any).lastHolisticResults = results

        drawLandmarks(canvasRef.current, results)

        const frame = extractLandmarks(results)
        if (frame) {
            frameBuffer.current.push(frame)
            if (frameBuffer.current.length > FRAME_BUFFER_SIZE) frameBuffer.current.shift()
        }

        if (!frame || frameBuffer.current.length < FRAME_BUFFER_SIZE) {
            setHoldProgress(0)
            holdTimer.current = 0
            return
        }

        const currentTargetName = targetSequence[currentIndexRef.current]
        
        // Smarter: Check against all alphabets for corrective feedback
        const result = await recognizeSign(
            frameBuffer.current,
            signsRef.current.map(s => ({ name: s.name, blueprint: s.blueprint })),
            true
        )

        // Flexible name matching (e.g., "Letter A" matches "A")
        const isCorrectSign = result && (
            result.label === currentTargetName || 
            result.label === `Letter ${currentTargetName}` ||
            result.label.endsWith(` ${currentTargetName}`)
        )

        if (result && result.confidence >= 0.55) {
            if (isCorrectSign) {
                holdTimer.current++
                const pct = Math.min(100, Math.round((holdTimer.current / HOLD_FRAMES_NEEDED) * 100))
                setHoldProgress(pct)
                setFeedback(`${Math.round(result.confidence * 100)}% match! Hold it...`)

                if (holdTimer.current >= HOLD_FRAMES_NEEDED) {
                    const nextIdx = currentIndexRef.current + 1
                    if (nextIdx < targetSequence.length) {
                        setCurrentIndex(nextIdx)
                        setHoldProgress(0)
                        holdTimer.current = 0
                        setFeedback(`Great! Next is ${targetSequence[nextIdx]}`)
                    } else {
                        finishGame()
                    }
                }
            } else {
                // Wrong sign
                holdTimer.current = 0
                setHoldProgress(0)
                setFeedback(`That looks like ${result.label}! Try ${currentTargetName}.`)
            }
        } else {
            holdTimer.current = 0
            setHoldProgress(0)
            setFeedback(`Sign "${currentTargetName}"`)
        }
    }, [targetSequence])

    // Cleanup
    useEffect(() => {
        return () => { stopCamera() }
    }, [stopCamera])

    // Timer loop
    useEffect(() => {
        let interval: any
        if (isPlaying) {
            interval = setInterval(() => {
                if (startTimeRef.current) {
                    setElapsedTime((Date.now() - startTimeRef.current) / 1000)
                }
            }, 100)
        }
        return () => clearInterval(interval)
    }, [isPlaying])

    const startGame = async () => {
        setIsPlaying(true)
        startTimeRef.current = Date.now()
    }

    const finishGame = async () => {
        const totalTime = (Date.now() - (startTimeRef.current || 0)) / 1000
        setIsPlaying(false)
        stopCamera()
        onComplete({ timeSeconds: totalTime, mistakes: 0 })
        await logFingerspellingScore(mode, totalTime, 0)
    }

    const currentTarget = targetSequence[currentIndex]
    const currentSignData = signs.find(s => s.name === currentTarget)

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" onBlur={onScriptLoad} onLoad={onScriptLoad} />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" onBlur={onScriptLoad} onLoad={onScriptLoad} />
            <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" onBlur={onScriptLoad} onLoad={onScriptLoad} />
            
            {/* HUD */}
            <div className="flex items-center justify-between p-4 bg-zinc-900/50 backdrop-blur-xl rounded-2xl border border-white/5 shadow-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 flex items-center justify-center bg-indigo-600 rounded-2xl text-4xl font-black text-white shadow-lg shadow-indigo-500/20">
                        {currentTarget}
                    </div>
                    <div>
                        <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Target Sign</div>
                        <div className="text-lg font-bold text-white">{mode === 'TIME_TRIAL' ? 'Alphabet Sprint' : 'Word Quest'}</div>
                    </div>
                </div>

                <div className="flex gap-8">
                    <div className="text-center">
                        <div className="text-3xl font-mono font-black text-indigo-400 tabular-nums">
                            {elapsedTime.toFixed(1)}s
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Elapsed Time</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-mono font-black text-emerald-400 tabular-nums">
                            {currentIndex + 1}/{targetSequence.length}
                        </div>
                        <div className="text-[10px] text-zinc-500 uppercase font-bold">Progress</div>
                    </div>
                </div>
            </div>

            {/* Video Area */}
            <div className="relative aspect-video bg-zinc-950 rounded-3xl overflow-hidden border border-white/10 shadow-2xl group">
                <video ref={videoRef} className="hidden" playsInline muted autoPlay />
                <canvas ref={canvasRef} className="w-full h-full" width={640} height={480} />

                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-zinc-950">
                        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                        <span className="text-zinc-400 font-medium">Downloading AI Blueprints...</span>
                    </div>
                )}

                {!isPlaying && !isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center z-40 bg-zinc-950/80 backdrop-blur-sm">
                        <div className="text-center space-y-8 p-8 max-w-sm">
                            <button 
                                onClick={startGame} 
                                className="group relative w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-2xl uppercase tracking-tighter hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-500/20"
                            >
                                Start Trial
                            </button>
                            <p className="text-zinc-400 text-sm leading-relaxed">
                                Sign all letters from A to Z as fast as possible. The AI will move to the next letter once it detects a 1-second hold.
                            </p>
                        </div>
                    </div>
                )}

                {/* Feedback Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 max-w-xs">
                            {isPlaying && (
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden border border-white/5">
                                        <div 
                                            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-100"
                                            style={{ width: `${holdProgress}%` }}
                                        />
                                    </div>
                                    <div className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-white text-sm font-bold inline-block">
                                        {feedback}
                                    </div>
                                </div>
                            )}
                        </div>

                        {isPlaying && currentSignData && (
                            <div className="relative">
                                <button 
                                    onClick={() => setShowHint(!showHint)}
                                    className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-white/20 transition-all"
                                    title="Show Hint"
                                >
                                    <HelpCircle className="w-6 h-6" />
                                </button>
                                
                                {showHint && (
                                    <div className="absolute bottom-full right-0 mb-4 w-48 aspect-video bg-zinc-900 rounded-xl overflow-hidden border border-white/20 shadow-2xl animate-in fade-in slide-in-from-bottom-2">
                                        <video src={currentSignData.videoUrl} autoPlay loop muted playsInline className="w-full h-full object-cover grayscale opacity-70" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-4xl font-black text-white/50">{currentTarget}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center">
                <Link href="/games/fingerspelling" className="text-zinc-500 hover:text-white transition-colors flex items-center gap-2 font-medium text-sm">
                    <ArrowLeft className="w-4 h-4" /> Exit Game
                </Link>
                <button onClick={() => window.location.reload()} className="px-6 py-2 bg-zinc-800 text-zinc-300 rounded-xl hover:bg-zinc-700 transition-all text-sm font-bold flex items-center gap-2">
                    <RefreshCcw className="w-4 h-4" /> Restart
                </button>
            </div>
        </div>
    )
}

