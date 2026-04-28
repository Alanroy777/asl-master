import { getAdminStats } from "@/app/lib/actions"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, GraduationCap, BookOpen, Activity, LayoutDashboard, ShieldCheck } from "lucide-react"

export default async function AdminDashboardPage() {
    const stats = await getAdminStats()

    if (!stats) {
        return (
            <div>
                <h1 className="text-3xl font-bold mb-6">Access Denied</h1>
                <p>You do not have permission to view this page.</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-2">
                    <LayoutDashboard className="h-8 w-8 text-primary" />
                    Overview
                </h1>
                <p className="text-muted-foreground">High-level system metrics and platform health.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalUsers}</div>
                        <p className="text-xs text-muted-foreground mt-1 text-green-500 font-medium">
                            {stats.totalLearners} Learners &middot; {stats.totalInstructors} Instructors
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Content Library</CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalSigns} signs</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Across {stats.totalLessons} lessons
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Practice Activity</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalPracticeSessions}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Total sessions globally
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Avg Accuracy</CardTitle>
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.averageAccuracy}%</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Platform-wide performance
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* In a real app we might put charts here, for now keeping it simple but good looking */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 mt-8">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>System Information</CardTitle>
                        <CardDescription>Platform configuration details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Version</span>
                            <span className="font-mono text-sm">v3.0.0-beta</span>
                        </div>

                        <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Admins</span>
                            <span className="font-mono text-sm flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-blue-500" />
                                {stats.totalAdmins}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
