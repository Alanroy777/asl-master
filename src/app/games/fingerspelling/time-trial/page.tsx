"use client"

import FingerspellingEngine from "@/components/games/fingerspelling-engine"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Loader2, BookOpen } from "lucide-react"
import { getAlphabetsWithBlueprints } from "@/app/lib/actions"

export default function TimeTrialPage() {
    const [result, setResult] = useState<{ timeSeconds: number, mistakes: number } | null>(null)
    const [learnedSequence, setLearnedSequence] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function load() {
            // Fetch signs that have blueprints (which implies they are in the library)
            // The engine already fetches blueprints, but we need the list of names here to build the sequence.
            // We'll filter this by "Learned Only" logic.
            const allAlphabets = await getAlphabetsWithBlueprints()
            
            // For now, we'll filter to signs that HAVE a blueprint (meaning they are ready to be played)
            // AND we can eventually filter by actual user progress here.
            const sequence = allAlphabets
                .filter(s => s.blueprint !== null) // Only signs with AI data
                .map(s => s.name.replace("Letter ", "").trim())
            
            setLearnedSequence(sequence)
            setIsLoading(false)
        }
        load()
    }, [])

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium">Preparing your custom trial...</p>
            </div>
        )
    }

    if (learnedSequence.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-6">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                    <BookOpen className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-black mb-2">No Signs Learned Yet</h1>
                <p className="text-muted-foreground max-w-md mb-8">
                    You haven't learned any alphabet signs in your lessons yet. Complete a few lessons to unlock them for the Time Trial!
                </p>
                <Link href="/learn">
                    <Button size="lg" className="rounded-full px-8">Go to Lessons</Button>
                </Link>
            </div>
        )
    }

    if (result) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8 p-4">
                <div className="p-8 rounded-full bg-yellow-500/10 border-4 border-yellow-500 text-yellow-500 mb-4 animate-bounce">
                    <Trophy className="w-16 h-16" />
                </div>

                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-black tracking-tighter">New Record!</h1>
                    <p className="text-muted-foreground text-lg">You completed {learnedSequence.length} signs in:</p>
                </div>

                <div className="text-7xl font-mono font-bold tabular-nums text-primary">
                    {result.timeSeconds.toFixed(2)}<span className="text-2xl text-muted-foreground ml-2">sec</span>
                </div>

                <div className="flex gap-4">
                    <Link href="/games/fingerspelling">
                        <Button variant="outline" size="lg">Back to Menu</Button>
                    </Link>
                    <Button size="lg" onClick={() => window.location.reload()}>Play Again</Button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen p-4 md:p-8">
            <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tight">Learned Sprint</h1>
                    <p className="text-sm text-muted-foreground">Racing through {learnedSequence.length} learned signs</p>
                </div>
                <div className="px-4 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20 uppercase tracking-widest">
                    Learned Only Mode
                </div>
            </div>
            <FingerspellingEngine
                mode="TIME_TRIAL"
                targetSequence={learnedSequence}
                onComplete={setResult}
            />
        </div>
    )
}
