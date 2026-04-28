"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, RotateCw } from "lucide-react"
import { logPracticeSession } from "@/app/lib/actions"

interface Sign {
    id: string
    word: string
    videoUrl: string
}

export default function FlashcardGame({ signs }: { signs: Sign[] }) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [score, setScore] = useState({ correct: 0, incorrect: 0 })
    const [isFinished, setIsFinished] = useState(false)

    const currentSign = signs[currentIndex]

    const handleNext = (correct: boolean) => {
        // Send score to backend to update spaced repetition algorithm (fire-and-forget)
        logPracticeSession(currentSign.id, correct ? 100 : 20)

        setScore(prev => ({
            ...prev,
            [correct ? 'correct' : 'incorrect']: prev[correct ? 'correct' : 'incorrect'] + 1
        }))

        if (currentIndex < signs.length - 1) {
            setIsFlipped(false)
            setCurrentIndex(prev => prev + 1)
        } else {
            setIsFinished(true)
        }
    }

    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6">
                <h2 className="text-3xl font-bold">Session Complete!</h2>
                <div className="grid grid-cols-2 gap-8 text-center">
                    <div>
                        <p className="text-4xl font-bold text-green-500">{score.correct}</p>
                        <p className="text-muted-foreground">Correct</p>
                    </div>
                    <div>
                        <p className="text-4xl font-bold text-red-500">{score.incorrect}</p>
                        <p className="text-muted-foreground">Needs Work</p>
                    </div>
                </div>
                <Button onClick={() => window.location.reload()}>Restart Session</Button>
            </div>
        )
    }

    if (signs.length === 0) {
        return <div className="text-center p-8">No signs available for flashcards.</div>
    }

    return (
        <div className="flex flex-col items-center max-w-xl mx-auto space-y-8">
            <div className="w-full text-center text-sm text-muted-foreground">
                Card {currentIndex + 1} of {signs.length}
            </div>

            <div className="relative w-full aspect-video cursor-pointer perspective-1000" onClick={() => setIsFlipped(!isFlipped)}>
                <AnimatePresence mode="wait">
                    {!isFlipped ? (
                        <motion.div
                            key="front"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            <Card className="w-full h-full flex items-center justify-center bg-primary/5 border-2 border-primary/20 shadow-lg">
                                <h2 className="text-5xl font-bold tracking-tighter">{currentSign.word}</h2>
                                <p className="absolute bottom-4 text-sm text-muted-foreground flex items-center gap-2">
                                    <RotateCw className="w-4 h-4" />
                                    Tap to reveal sign
                                </p>
                            </Card>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="back"
                            initial={{ rotateY: 90, opacity: 0 }}
                            animate={{ rotateY: 0, opacity: 1 }}
                            exit={{ rotateY: -90, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0"
                        >
                            <Card className="w-full h-full overflow-hidden border-2 border-primary shadow-lg bg-black">
                                <video
                                    src={currentSign.videoUrl}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                />
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="flex gap-4 w-full h-14">
                {!isFlipped ? (
                    <Button
                        className="w-full h-full text-lg shadow-sm"
                        onClick={() => setIsFlipped(true)}
                    >
                        Reveal Sign
                    </Button>
                ) : (
                    <>
                        <Button
                            variant="outline"
                            className="flex-1 h-full text-lg border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/50 dark:hover:bg-red-950"
                            onClick={() => handleNext(false)}
                        >
                            <X className="mr-2 h-5 w-5" />
                            I Forgot
                        </Button>
                        <Button
                            className="flex-1 h-full text-lg bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleNext(true)}
                        >
                            <Check className="mr-2 h-5 w-5" />
                            I Knew It
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}
