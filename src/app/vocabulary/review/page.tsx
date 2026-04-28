import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getRecommendedReview } from "@/app/lib/actions"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import ReviewStudio from "@/components/vocabulary/review-studio"
import { ClientBackButton } from "@/components/client-back-button"

export default async function ReviewPage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    // Fetch up to 10 weak signs for review
    const signs = await getRecommendedReview(10)

    return (
        <div className="flex flex-col h-[calc(100vh-65px)]">
            <div className="flex items-center gap-4 p-4 border-b">
                <ClientBackButton fallbackPath="/vocabulary" />
                <div>
                    <h1 className="text-xl font-bold">Weak Sign Review</h1>
                    <p className="text-sm text-muted-foreground">
                        {signs.length > 0
                            ? `Focusing on ${signs.length} signs that need more practice.`
                            : "You don't have any weak signs to review right now!"}
                    </p>
                </div>
            </div>

            {signs.length > 0 ? (
                <div className="flex-1 w-full bg-black/95">
                    <ReviewStudio initialSigns={signs} />
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center flex-1 gap-4">
                    <p className="text-lg text-muted-foreground">No signs currently marked as Weak.</p>
                    <Link href="/vocabulary">
                        <Button>Return to Dashboard</Button>
                    </Link>
                </div>
            )}
        </div>
    )
}
