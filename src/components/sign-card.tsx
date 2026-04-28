"use client"

import { Card } from "@/components/ui/card"
import { PlayCircle, CheckCircle, BookOpen } from "lucide-react"
import { useState } from "react"
import SignDetailModal from "@/components/sign-detail-modal"

interface SignCardProps {
    sign: any // Typed as result from searchDictionary
}

export default function SignCard({ sign }: SignCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    return (
        <>
            <Card
                className="group cursor-pointer hover:border-primary/50 transition-all overflow-hidden"
                onClick={() => setIsModalOpen(true)}
            >
                <div className="aspect-video relative bg-muted flex items-center justify-center">
                    {sign.videoUrl ? (
                        <video
                            src={sign.videoUrl}
                            className="w-full h-full object-cover rounded-t-lg"
                            muted
                            loop
                            onMouseOver={e => e.currentTarget.play()}
                            onMouseOut={e => {
                                e.currentTarget.pause()
                                e.currentTarget.currentTime = 0
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full w-full bg-secondary/30 text-muted-foreground text-sm">
                            No Video Preview
                        </div>
                    )}
                    {sign.videoUrl && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 text-white">
                            <PlayCircle className="w-12 h-12" />
                        </div>
                    )}
                </div>

                <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg">{sign.word}</h3>
                            <p className="text-xs text-muted-foreground">{sign.category}</p>
                        </div>
                        {sign.isMastered && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                    </div>
                </div>
            </Card>

            <SignDetailModal
                sign={sign}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
            />
        </>
    )
}
