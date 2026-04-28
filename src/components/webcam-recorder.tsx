
'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Camera, Video, StopCircle } from 'lucide-react'
import { Card } from '@/components/ui/card'

interface WebcamRecorderProps {
    onCapture?: (blob: Blob) => void;
    isRecording?: boolean;
}

export default function WebcamRecorder({ onCapture, isRecording: externalIsRecording }: WebcamRecorderProps) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const [hasPermission, setHasPermission] = useState<boolean>(false)
    const [stream, setStream] = useState<MediaStream | null>(null)

    useEffect(() => {
        async function setupCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false
                })
                setStream(mediaStream)
                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream
                }
                setHasPermission(true)
            } catch (err) {
                console.error("Error accessing camera:", err)
                setHasPermission(false)
            }
        }

        setupCamera()

        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop())
            }
        }
    }, [])

    return (
        <Card className="aspect-video bg-black flex items-center justify-center relative overflow-hidden rounded-2xl border-2 border-muted">
            {!hasPermission ? (
                <div className="text-center p-6 text-muted-foreground">
                    <Camera className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>Camera access required for practice.</p>
                    <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
                        Enable Camera
                    </Button>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                    {externalIsRecording && (
                        <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/80 text-white px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                            Recording
                        </div>
                    )}
                </>
            )}
        </Card>
    )
}
