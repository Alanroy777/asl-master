
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, BookOpen, Activity, Award } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export default async function InstructorDashboard() {
    const session = await auth()
    const currentUserId = session?.user?.id

    if (!currentUserId) {
        return <div>Not authorized</div>
    }

    // Fetch total learners assigned to this instructor
    const totalLearners = await prisma.user.count({
        where: { role: 'LEARNER', tutorId: currentUserId }
    })

    // Fetch total lessons created by this instructor
    const totalLessons = await prisma.lesson.count({
        where: { createdById: currentUserId }
    })

    // Fetch learners to calculate average accuracy
    const learners = await prisma.user.findMany({
        where: { role: 'LEARNER', tutorId: currentUserId },
        include: { profile: true }
    })

    let avgAccuracy = 0
    if (learners.length > 0) {
        const totalAccuracy = learners.reduce((sum, l) => sum + (l.profile?.averageAccuracy || 0), 0)
        avgAccuracy = Math.round(totalAccuracy / learners.length)
    }

    const stats = [
        {
            title: "My Students",
            value: totalLearners.toString(),
            icon: Users,
            description: "Active assigned learners"
        },
        {
            title: "My Lessons",
            value: totalLessons.toString(),
            icon: BookOpen,
            description: "Curriculum lessons created"
        },
        {
            title: "Avg. Accuracy",
            value: `${avgAccuracy}%`,
            icon: Activity,
            description: "Class average performance"
        },
        {
            title: "Certificates",
            value: "0",
            icon: Award,
            description: "Coming soon"
        }
    ]

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Instructor Dashboard</h1>
                <p className="text-muted-foreground mt-2">Welcome back, <span className="text-foreground font-medium">{session?.user?.name || 'Instructor'}</span>. Here is a quick overview of your students.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, index) => (
                    <Card key={index}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                {stat.title}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stat.value}</div>
                            <p className="text-xs text-muted-foreground">
                                {stat.description}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                        <CardDescription>
                            Latest student progress.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-center p-8 text-muted-foreground">
                            {totalLearners === 0 ? "You have no assigned students yet." : "Activity tracking coming soon."}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                        <CardDescription>
                            Common tasks
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-2">
                        <div className="p-4 border rounded-lg bg-muted/50 text-sm text-center">
                            Curriculum Builder coming next...
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
