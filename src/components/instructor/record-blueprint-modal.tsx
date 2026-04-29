'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Loader2, Video, CheckCircle } from "lucide-react"
import { updateSignBlueprint } from "@/app/lib/actions"
import { toast } from "sonner"
import { HAND_CONNECTIONS } from '@/lib/mediapipe-utils'
import Script from 'next/script'

interface RecordBlueprintModalProps {
    signId: string
    signWord: string
    hasExistingData: boolean
}

export function RecordBlueprintModal({ signId, signWord, hasExistingData }: RecordBlueprintModalProps) {
    const [open, setOpen] = useState(false)
    const [isScriptLoaded, setIsScriptLoaded] = useState(false)
    const [status, setStatus] = useState<'idle' | 'loading' | 'active' | 'recording' | 'saving' | 'success'>('idle')
    const [progress, setProgress] = useState(0)

    // Refs
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const handsRef = useRef<any>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const framesRef = useRef<any[]>([])
    const isRecordingRef = useRef<boolean>(false)

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop())
            streamRef.current = null
        }
        if (handsRef.current) {
            handsRef.current.close()
            handsRef.current = null
        }
        setStatus('idle')
        setProgress(0)
        isRecordingRef.current = false
    }, [])

    // Open/Close Handler
    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        if (!newOpen) {
            stopCamera()
        }
    }

    const startCamera = async () => {
        if (!isScriptLoaded || !videoRef.current || !canvasRef.current) return
        setStatus('loading')

        try {
            // @ts-ignore
            const Hands = window.Hands;
            if (!Hands) throw new Error("MediaPipe not loaded")

            const hands = new Hands({
                locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
            })

            await hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            })

            hands.onResults(onResults)
            handsRef.current = hands

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' }
            })
            
            streamRef.current = stream

            if (videoRef.current) {
                videoRef.current.srcObject = stream
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play()
                    requestAnimationFrame(processVideo)
                }
            }
            setStatus('active')
        } catch (error) {
            console.error(error)
            toast.error("Failed to access camera.")
            setStatus('idle')
        }
    }

    const processVideo = () => {
        if (!videoRef.current || !handsRef.current || status === 'saving' || status === 'success') return

        if (videoRef.current && !videoRef.current.paused && !videoRef.current.ended) {
            handsRef.current.send({ image: videoRef.current }).then(() => {
                if (videoRef.current && !videoRef.current.paused) {
                    requestAnimationFrame(processVideo)
                }
            })
        }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const onResults = useCallback((results: any) => {
        if (!canvasRef.current || !videoRef.current) return

        const canvasCtx = canvasRef.current.getContext('2d')
        if (!canvasCtx) return

        canvasCtx.save()
        canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        
        // Draw video mirrored
        canvasCtx.translate(canvasRef.current.width, 0)
        canvasCtx.scale(-1, 1)
        canvasCtx.drawImage(results.image, 0, 0, canvasRef.current.width, canvasRef.current.height)

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0]

            // @ts-ignore
            const drawConnectors = window.drawConnectors;
            // @ts-ignore
            const drawLandmarks = window.drawLandmarks;

            if (drawConnectors && drawLandmarks) {
                drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 })
                drawLandmarks(canvasCtx, landmarks, { color: '#FF0000', lineWidth: 2 })
            }

            // Capture Frame if recording
            if (isRecordingRef.current) {
                // MediaPipe returns coordinates...
                framesRef.current.push(JSON.parse(JSON.stringify(landmarks)))
            }
        }
        canvasCtx.restore()
    }, [status])

    const startRecording = () => {
        framesRef.current = [] // reset
        setStatus('recording')
        isRecordingRef.current = true
        
        // Record for exactly 2 seconds (roughly ~60 frames)
        let startTime = Date.now()
        const duration = 2000

        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime
            setProgress(Math.min((elapsed / duration) * 100, 100))

            if (elapsed >= duration) {
                clearInterval(interval)
                finishRecording()
            }
        }, 50)
    }

    const finishRecording = async () => {
        setStatus('saving')
        isRecordingRef.current = false
        setProgress(100)

        const capturedFrames = framesRef.current
        if (capturedFrames.length < 10) {
            toast.error("Not enough frames captured. Please keep your hand in view.")
            setStatus('active')
            setProgress(0)
            return
        }

        try {
            // @ts-ignore - This component needs to be updated to pass normalized landmarks and angles instead of raw frames
            const result = await updateSignBlueprint(signId, [], [])
            if (result.success) {
                toast.success(result.message)
                setStatus('success')
                setTimeout(() => {
                    handleOpenChange(false)
                }, 1500)
            } else {
                toast.error(result.message)
                setStatus('active')
                setProgress(0)
            }
        } catch (error) {
            setStatus('active')
            toast.error("Failed to save blueprint")
        }
    }

    useEffect(() => {
        return () => stopCamera()
    }, [stopCamera])

    return (
        <>
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
                strategy="lazyOnload"
                onLoad={() => setIsScriptLoaded(true)}
            />
            <Script
                src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"
                strategy="lazyOnload"
            />
            
            <Dialog open={open} onOpenChange={handleOpenChange}>
                <DialogTrigger asChild>
                    <Button variant={hasExistingData ? "outline" : "default"} size="icon" className="h-6 w-6" title="Record AI Blueprint">
                        {hasExistingData ? <CheckCircle className="h-3 w-3 text-green-500" /> : <Video className="h-3 w-3" />}
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] bg-zinc-950 border-zinc-800 text-white">
                    <DialogHeader>
                        <DialogTitle>Record AI Blueprint: {signWord}</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Perform the sign clearly for the camera to train the AI module.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4">
                        <div className="relative aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 flex items-center justify-center">
                            
                            {status === 'idle' && (
                                <Button onClick={startCamera} disabled={!isScriptLoaded}>
                                    {!isScriptLoaded ? "Loading AI..." : "Enable Camera"}
                                </Button>
                            )}

                            {status === 'loading' && (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-zinc-400">Initializing MediaPipe...</p>
                                </div>
                            )}

                            {/* Hidden Video element */}
                            <video ref={videoRef} playsInline className="absolute opacity-0 pointer-events-none w-px h-px" />
                            
                            {/* Rendering Canvas */}
                            <canvas 
                                ref={canvasRef} 
                                width={640} 
                                height={480} 
                                className={`w-full h-full object-cover ${(status === 'idle' || status === 'loading') ? 'hidden' : 'block'}`}
                            />

                            {/* Recording Progress Overlay */}
                            {status === 'recording' && (
                                <div className="absolute top-4 left-4 right-4 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-red-500 transition-all duration-75" 
                                        style={{ width: `${progress}%` }} 
                                    />
                                </div>
                            )}

                             {status === 'recording' && (
                                <div className="absolute top-8 left-4 flex gap-2 items-center text-red-500 font-bold bg-black/50 px-3 py-1 rounded-full text-sm">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> RECORDING
                                </div>
                            )}

                            {status === 'success' && (
                                <div className="absolute inset-0 bg-green-500/20 flex flex-col items-center justify-center backdrop-blur-sm">
                                    <CheckCircle className="h-16 w-16 text-green-500 mb-2" />
                                    <h3 className="text-xl font-bold text-green-500">Blueprint Saved!</h3>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center">
                            <p className="text-sm text-zinc-400">
                                {status === 'active' && 'Camera active. Frame your hands properly before hitting record.'}
                                {status === 'recording' && 'Perform the complete sign now...'}
                                {status === 'saving' && 'Saving blueprint...'}
                            </p>
                            
                            <Button 
                                onClick={startRecording} 
                                disabled={status !== 'active'}
                                variant={status === 'recording' ? "destructive" : "default"}
                            >
                                {status === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {status === 'active' ? "Start Recording (2s)" : (status === 'recording' ? "Recording..." : "Save Data")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
