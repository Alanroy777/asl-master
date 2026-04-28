import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getRecommendedReview, getAllLearnedSigns, searchSigns } from "@/app/lib/actions"
import FlashcardGame from "@/components/vocabulary/flashcard-game"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ClientBackButton } from "@/components/client-back-button"

export default async function FlashcardsPage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    // For flashcards, we want all learned signs (not just weak ones) to reinforce the full vocabulary.
    // This still excludes signs they haven't learned yet.
    const signs = await getAllLearnedSigns(20)

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <ClientBackButton fallbackPath="/vocabulary" />
                <div>
                    <h1 className="text-3xl font-bold">Flashcards</h1>
                    <p className="text-muted-foreground">Test your memory with rapid-fire cards.</p>
                </div>
            </div>

            <FlashcardGame signs={signs} />
        </div>
    )
}
