
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, Trophy, Flame, Book } from "lucide-react"
import Link from "next/link"
import { auth } from "@/auth"
import { getDashboardStats, getRecommendedReview, getRecentActivity } from "../lib/actions"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const session = await auth()
    if (!session?.user?.email) redirect('/login')

    const stats = await getDashboardStats(session.user.email) || {
        totalXP: 0, currentStreak: 0, completedLessons: 0, totalLessons: 10, signsLearned: 0, name: 'Learner'
    }

    const reviewItems = await getRecommendedReview()
    const recentActivity = await getRecentActivity()

    const progressPercentage = Math.round((stats.completedLessons / (stats.totalLessons || 1)) * 100)

    return (
        <div className="flex flex-col gap-6">
            <div className="mb-4">
                <h2 className="text-2xl font-bold tracking-tight">Welcome back, {stats.name}!</h2>
                <p className="text-muted-foreground">Ready to continue your ASL journey?</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total XP</CardTitle>
                        <Trophy className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalXP}</div>
                        <p className="text-xs text-muted-foreground">Lifetime points</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Daily Streak</CardTitle>
                        <Flame className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.currentStreak} Days</div>
                        <p className="text-xs text-muted-foreground">Keep it up!</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Signs Learned</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.signsLearned}</div>
                        <p className="text-xs text-muted-foreground">Total mastered</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Level 1 Progress</CardTitle>
                        <Book className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{progressPercentage}%</div>
                        <div className="h-2 w-full bg-secondary mt-2 rounded-full overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>


            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recommended Review</CardTitle>
                        <CardDescription>
                            Strengthen your weak signs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {reviewItems.length > 0 ? (
                                <div className="grid gap-2">
                                    {reviewItems.map((item: { id: string; word: string; masteryLevel: string; masteryScore: number }) => (
                                        <div key={item.id} className="flex items-center justify-between p-2 border rounded hover:bg-muted/50 transition-colors">
                                            <div>
                                                <p className="font-medium">{item.word}</p>
                                                <p className="text-xs text-muted-foreground">{item.masteryLevel} ({Math.round(item.masteryScore || 0)}%)</p>
                                            </div>
                                            <Link href={`/practice?signId=${item.id}`}>
                                                <Button size="sm" variant="secondary">Practice</Button>
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">Great job! No weak signs found.</p>
                            )}
                            <Link href="/practice">
                                <Button variant="outline" className="w-full mt-2">
                                    Open Practice Studio
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Your latest progress.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-8">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity: any) => (
                                    <div key={activity.id} className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{activity.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(activity.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="ml-auto font-medium text-green-500">{activity.description}</div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent activity yet. Start learning!</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    )
}
