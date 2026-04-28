import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function PracticeIndexPage() {
    const session = await auth()
    if (!session?.user?.email) return null

    const user = await prisma.user.findUnique({
        where: { email: session.user.email }
    })

    if (!user) return null

    // Find all completed lessons
    const completedLessons = await prisma.userLessonProgress.findMany({
        where: { userId: user.id, completed: true },
        select: { lessonId: true }
    })

    const completedLessonIds = completedLessons.map(cl => cl.lessonId)

    // Find lessons that are completed AND have lessonSigns (so they can be practiced)
    const availableLessons = await prisma.lesson.findMany({
        where: {
            id: { in: completedLessonIds },
            lessonSigns: {
                some: {} // Must have at least one sign mapped from the library
            }
        },
        include: {
            level: true,
            _count: {
                select: { lessonSigns: true }
            }
        },
        orderBy: [
            { level: { orderIndex: 'asc' } },
            { orderIndex: 'asc' }
        ]
    })

    if (availableLessons.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4 animate-in fade-in duration-500">
                <div className="p-4 rounded-full bg-secondary text-primary mb-4">
                    <svg className="h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold tracking-tight">Practice Studio is Locked</h1>
                <p className="text-muted-foreground text-lg max-w-md">
                    You haven't completed any lessons with signs yet. Dive into the curriculum, watch the tutorials, and pass a quiz to unlock signs for practice!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 mt-4">
                    <Link href="/learn">
                        <Button size="lg" className="min-w-[150px]">Go to Curriculum</Button>
                    </Link>
                    <Link href="/dashboard">
                        <Button size="lg" variant="secondary" className="min-w-[150px]">Back to Dashboard</Button>
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_20%_10%,_#1e0a3c_0%,_#0d0d1a_60%,_#000_100%)] text-[#f0eeff]">
            <div className="max-w-4xl mx-auto py-12 px-6">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors font-medium">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </Link>
                </div>

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-500 bg-clip-text text-transparent">
                        Practice Studio
                    </h1>
                    <p className="text-muted-foreground mt-3 text-lg">
                        Select an unlocked lesson to start your interactive AI practice session.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {availableLessons.map((lesson) => (
                        <Link key={lesson.id} href={`/practice/${lesson.id}`}>
                            <div className="group flex flex-col justify-between p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(124,58,237,0.15)] h-full cursor-pointer overflow-hidden relative">
                                {/* Decorative glow */}
                                <div className="absolute -inset-px bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl opacity-0 group-hover:opacity-20 transition-opacity blur-md" />
                                
                                <div className="relative z-10">
                                    <div className="text-xs font-bold tracking-wider text-violet-400 uppercase mb-2">
                                        {lesson.level.title}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-100 mb-2">
                                        {lesson.title}
                                    </h3>
                                    <p className="text-slate-400 text-sm line-clamp-2">
                                        {lesson.description || "Practice signs from this chapter."}
                                    </p>
                                </div>

                                <div className="relative z-10 mt-6 flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-300 text-xs font-semibold border border-violet-500/20">
                                        ✋ {lesson._count.lessonSigns} Signs
                                    </span>
                                    <span className="text-sm font-bold text-violet-400 group-hover:text-violet-300 flex items-center gap-1 transition-colors">
                                        Start Session <span className="group-hover:translate-x-1 transition-transform">→</span>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
