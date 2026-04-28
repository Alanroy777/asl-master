"use client"

import FingerspellingEngine from "@/components/games/fingerspelling-engine"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, ArrowRight } from "lucide-react"

// A small built-in dictionary for the MVP. 
// Ideally, this fetches from the DB or an API.
const COMMON_WORDS = [
    "CAT", "DOG", "FISH", "BIRD", "OAK", "RED", "BLUE", "MILK", "EGG", "CAR",
    "BUS", "LOVE", "HELP", "BOOK", "PEN", "CUP", "KEY", "MAP", "SUN", "MOON"
]

export default function WordSpellPage() {
    const [result, setResult] = useState<{ timeSeconds: number, mistakes: number } | null>(null)
    const [targetWord, setTargetWord] = useState<string>("")

    useEffect(() => {
        setTargetWord(COMMON_WORDS[Math.floor(Math.random() * COMMON_WORDS.length)])
    }, [])

    if (!targetWord) return <div className="min-h-screen flex items-center justify-center">Loading game...</div>

    const targetSequence = targetWord.split("")

    if (result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4">
                <div className="p-8 rounded-full bg-blue-500/10 border-4 border-blue-500 text-blue-500 mb-4 animate-bounce">
                    <Trophy className="w-16 h-16" />
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter">Spelltacular!</h1>
                    <p className="text-muted-foreground text-lg">You spelled <span className="font-bold text-primary">"{targetWord}"</span> in:</p>
                </div>

                <div className="text-7xl font-mono font-bold tabular-nums text-primary">
                    {result.timeSeconds.toFixed(2)}<span className="text-2xl text-muted-foreground ml-2">sec</span>
                </div>

                <div className="flex gap-4">
                    <Link href="/games/fingerspelling">
                        <Button variant="outline" size="lg">Back to Menu</Button>
                    </Link>
                    <Button size="lg" onClick={() => window.location.reload()} className="gap-2">
                        Next Word <ArrowRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <FingerspellingEngine
                mode="WORD_SPELL"
                targetSequence={targetSequence}
                onComplete={setResult}
            />
        </div>
    )
}
