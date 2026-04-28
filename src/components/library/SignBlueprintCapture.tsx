
'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Script from 'next/script'
import { Button } from '@/components/ui/button'
import { Camera, Shield, Check, Loader2, RefreshCw } from 'lucide-react'
import { initializeHolistic, stopHolistic, drawLandmarks } from '@/lib/holisticSetup'
import { normalizeHand, getHandAngles } from '@/lib/aslModel'
import { updateSignBlueprint } from '@/app/lib/actions'
import { toast } from 'sonner'

interface Props {
  signId: string
  signName: string
  onComplete?: () => void
}

export function SignBlueprintCapture({ signId, signName, onComplete }: Props) {
  const [isActive, setIsActive] = useState(false)
  const [isCapturing, setIsCapturing] = useState(false)
  const [scriptsReady, setScriptsReady] = useState(0)
  const [hasLandmarks, setHasLandmarks] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const holisticRef = useRef<any>(null)
  const cameraRef = useRef<any>(null)

  const onScriptLoad = useCallback(() => setScriptsReady(n => n + 1), [])

  const startCamera = useCallback(async () => {
    setIsActive(true) // Render the video/canvas first
  }, [])

  // Effect to initialize holistic once elements are rendered
  useEffect(() => {
    if (!isActive || !videoRef.current || !canvasRef.current || holisticRef.current) return

    const init = async () => {
      try {
        const { holistic, camera } = await initializeHolistic(videoRef.current!, (results) => {
          if (canvasRef.current) {
            drawLandmarks(canvasRef.current, results)
          }
          const handFound = !!(results.leftHandLandmarks || results.rightHandLandmarks)
          setHasLandmarks(handFound)
        })
        holisticRef.current = holistic
        cameraRef.current = camera
      } catch (e) {
        console.error(e)
        toast.error('Could not start camera. Please check permissions.')
        setIsActive(false)
      }
    }
    
    init()
  }, [isActive])

  const stopCamera = useCallback(() => {
    if (cameraRef.current) {
      stopHolistic(holisticRef.current, cameraRef.current)
    }
    holisticRef.current = null
    cameraRef.current = null
    setIsActive(false)
    setHasLandmarks(false)
  }, [])

  const handleCapture = async () => {
    const results = (globalThis as any).lastHolisticResults
    if (!results) {
      toast.error('No landmarks detected yet')
      return
    }

    const hand = results.rightHandLandmarks || results.leftHandLandmarks
    const isLeft = !results.rightHandLandmarks

    if (!hand || hand.length === 0) {
      toast.error('No hand detected in frame')
      return
    }

    setIsCapturing(true)
    try {
      // 1. Normalize
      const normalized = normalizeHand(hand, isLeft)
      // 2. Get Angles
      const angles = getHandAngles(normalized)

      // 3. Save to DB
      const res = await updateSignBlueprint(
        signId, 
        Array.from(normalized), 
        angles
      )

      if (res.success) {
        toast.success(`Blueprint for "${signName}" captured successfully!`)
        stopCamera()
        onComplete?.()
      } else {
        toast.error(res.message || 'Failed to save blueprint')
      }
    } catch (e) {
      console.error(e)
      toast.error('Error during capture')
    } finally {
      setIsCapturing(false)
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [stopCamera])

  return (
    <div className="space-y-4">
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js" strategy="afterInteractive" onLoad={onScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js" strategy="afterInteractive" onLoad={onScriptLoad} />
      <Script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" strategy="afterInteractive" onLoad={onScriptLoad} />

      {!isActive ? (
        <div className="aspect-video bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center gap-4 text-center p-6">
          <div className="p-4 bg-zinc-800 rounded-full">
            <Camera className="h-8 w-8 text-zinc-500" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white">No Blueprint Recorded</p>
            <p className="text-sm text-zinc-500">Record a "Gold Standard" performance to enable AI detection for this sign.</p>
          </div>
          <Button onClick={startCamera} className="bg-indigo-600 hover:bg-indigo-500">
            Start Webcam
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl shadow-indigo-500/10">
            <video ref={videoRef} className="hidden" playsInline muted autoPlay />
            <canvas ref={canvasRef} className="w-full h-full" width={640} height={480} />
            
            <div className="absolute top-4 left-4">
              {hasLandmarks ? (
                <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                  <Check className="h-3 w-3" /> Hand Detected
                </div>
              ) : (
                <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 backdrop-blur-md">
                  <RefreshCw className="h-3 w-3 animate-spin" /> Scanning for Hand...
                </div>
              )}
            </div>

            <div className="absolute bottom-4 left-0 right-0 px-6 flex justify-between items-center">
               <Button variant="ghost" onClick={stopCamera} className="bg-black/50 hover:bg-black/80 text-white border-zinc-700">
                 Cancel
               </Button>
               <Button 
                onClick={handleCapture} 
                disabled={!hasLandmarks || isCapturing}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-8 shadow-xl"
               >
                 {isCapturing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                 Capture Blueprint
               </Button>
            </div>
          </div>
          <p className="text-xs text-zinc-500 italic text-center">
            Position your hand clearly in the frame, perform the sign for "{signName}", and click Capture.
          </p>
        </div>
      )}
    </div>
  )
}
