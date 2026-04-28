"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import Link from "next/link"
import { Brain, Zap, CheckCircle2, AlertCircle, Dumbbell, ChevronRight } from "lucide-react"

interface Sign {
    id: string
    name: string
}

interface VocabularyStats {
    totalLearned: number
    byLevel: Record<string, number>
    categorizedSigns?: {
        WEAK: Sign[]
        IMPROVING: Sign[]
        STRONG: Sign[]
        MASTERED: Sign[]
    }
}

export default function VocabularyDashboard({ stats }: { stats: VocabularyStats | null }) {

    if (!stats) return <div>Loading stats...</div>

    const weakCount = stats.byLevel['WEAK'] || 0
    const improvingCount = stats.byLevel['IMPROVING'] || 0
    const strongCount = stats.byLevel['STRONG'] || 0
    const masteredCount = stats.byLevel['MASTERED'] || 0

    return (
        <div className="grid gap-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Signs Learned</CardTitle>
                        <Brain className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalLearned}</div>
                        <p className="text-xs text-muted-foreground">Across all lessons</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Needs Review</CardTitle>
                        <AlertCircle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{weakCount + improvingCount}</div>
                        <p className="text-xs text-muted-foreground">Weak or Improving signs</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mastered</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{masteredCount}</div>
                        <p className="text-xs text-muted-foreground">Strong memory retention</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Mastery Breakdown</CardTitle>
                        <CardDescription>Your sign language retention levels</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { level: 'Weak', count: weakCount, colorClass: 'bg-red-500', signs: stats.categorizedSigns?.WEAK },
                            { level: 'Improving', count: improvingCount, colorClass: 'bg-yellow-500', signs: stats.categorizedSigns?.IMPROVING },
                            { level: 'Strong', count: strongCount, colorClass: 'bg-blue-500', signs: stats.categorizedSigns?.STRONG },
                            { level: 'Mastered', count: masteredCount, colorClass: 'bg-green-500', signs: stats.categorizedSigns?.MASTERED },
                        ].map(({ level, count, colorClass, signs }) => (
                            <Dialog key={level}>
                                <div className="space-y-2">
                                    <DialogTrigger asChild>
                                        <div className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/50 p-1 -mx-1 rounded transition-colors group">
                                            <span className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${colorClass}`} /> 
                                                {level}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span>{count}</span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                            </div>
                                        </div>
                                    </DialogTrigger>
                                    <Progress value={(count / stats.totalLearned) * 100 || 0} className="h-2 bg-muted" indicatorClassName={colorClass} />
                                </div>
                                <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${colorClass}`} />
                                            {level} Signs ({count})
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="pt-4">
                                        {signs && signs.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {signs.map(sign => (
                                                    <Badge key={sign.id} variant="secondary" className="px-3 py-1 text-sm font-normal">
                                                        {sign.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground italic text-center py-8">
                                                No signs in this category yet.
                                            </div>
                                        )}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        ))}
                    </CardContent>
                </Card>

                <Card className="col-span-1 border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle>Spaced Repetition Training</CardTitle>
                        <CardDescription>AI-powered review based on your performance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Our algorithm identifies signs you are likely to forget and schedules them for review.
                            Practice daily to move signs from "Weak" to "Mastered".
                        </p>

                        <div className="grid gap-3">
                            <Link href="/vocabulary/review">
                                <Button size="lg" className="w-full gap-2 text-lg h-14" variant={weakCount > 0 ? "default" : "secondary"}>
                                    <Dumbbell className="w-5 h-5" />
                                    {weakCount > 0 ? `Review ${weakCount} Weak Signs` : "Review Session"}
                                </Button>
                            </Link>
                            <Link href="/vocabulary/flashcards">
                                <Button size="lg" variant="outline" className="w-full gap-2 text-lg h-14">
                                    <Zap className="w-5 h-5" />
                                    Speed Flashcards
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
