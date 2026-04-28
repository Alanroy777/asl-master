import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer, Keyboard } from "lucide-react"

export default async function FingerspellingGamePage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
            <div className="mb-2">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors font-medium">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Dashboard
                </Link>
            </div>
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Fingerspelling Games</h1>
                <p className="text-muted-foreground">
                    Challenge your speed and accuracy with AI-powered hand tracking games.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Timer className="w-6 h-6 text-orange-500" />
                            Time Trial (A-Z)
                        </CardTitle>
                        <CardDescription>
                            Race against the clock! Sign the entire alphabet from A to Z as fast as you can.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/games/fingerspelling/time-trial">
                            <Button className="w-full h-12 text-lg">Start Time Trial</Button>
                        </Link>
                    </CardContent>
                </Card>

                <Card className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Keyboard className="w-6 h-6 text-blue-500" />
                            Word Spell
                        </CardTitle>
                        <CardDescription>
                            Spell random words letter by letter. Great for practicing transitions between signs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/games/fingerspelling/word-spell">
                            <Button variant="secondary" className="w-full h-12 text-lg">Start Word Spell</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
