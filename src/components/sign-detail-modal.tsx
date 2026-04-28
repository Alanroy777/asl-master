"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PlayCircle, Award, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

interface SignDetailModalProps {
    sign: any
    isOpen: boolean
    onClose: () => void
}

export default function SignDetailModal({ sign, isOpen, onClose }: SignDetailModalProps) {
    if (!sign) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden">
                <div className="grid md:grid-cols-2">
                    {/* Video Section */}
                    <div className="bg-black flex items-center justify-center p-4">
                        {sign.videoUrl ? (
                            <video
                                src={sign.videoUrl}
                                controls
                                autoPlay
                                loop
                                className="w-full h-auto rounded-lg"
                            />
                        ) : (
                            <div className="text-white text-center p-8 bg-zinc-900 rounded-lg w-full h-64 flex items-center justify-center">
                                No video available for this sign.
                            </div>
                        )}
                    </div>

                    {/* Details Section */}
                    <div className="p-6 space-y-6 flex flex-col h-full">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Badge variant="outline" className="text-muted-foreground">{sign.category}</Badge>
                                {sign.isMastered && (
                                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                                        Mastered
                                    </Badge>
                                )}
                            </div>
                            <DialogTitle className="text-3xl font-bold">{sign.word}</DialogTitle>
                        </div>

                        <div className="flex-1 space-y-4">
                            <div>
                                <h4 className="font-medium text-muted-foreground mb-1">Description</h4>
                                <p>{sign.description}</p>
                            </div>

                            {sign.lesson && (
                                <div className="bg-primary/5 rounded-lg p-3 text-sm">
                                    <p className="font-medium text-primary mb-1 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4" /> Part of Lesson
                                    </p>
                                    <p className="text-muted-foreground">
                                        This sign interacts with the "{sign.lesson.title}" curriculum.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 mt-auto pt-4">
                            <Link href={`/practice?signId=${sign.id}`} className="flex-1">
                                <Button className="w-full" size="lg">
                                    <PlayCircle className="mr-2 h-4 w-4" /> Practice Now
                                </Button>
                            </Link>
                            {sign.lesson && (
                                <Link href={`/learn/${sign.lesson.slug}`} className="flex-1">
                                    <Button variant="outline" className="w-full" size="lg">
                                        Go to Lesson <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
