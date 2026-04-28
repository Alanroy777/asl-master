
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { GripVertical } from "lucide-react"
import { CreateLevelModal } from "@/components/instructor/create-level-modal"
import { CreateLessonModal } from "@/components/instructor/create-lesson-modal"
import { CreateSignModal } from "@/components/instructor/create-sign-modal"
import { EditSignModal } from "@/components/instructor/edit-sign-modal"
import { DeleteSignButton } from "@/components/instructor/delete-sign-button"
import { EditLevelModal } from "@/components/instructor/edit-level-modal"
import { DeleteLevelButton } from "@/components/instructor/delete-level-button"
import { EditLessonModal } from "@/components/instructor/edit-lesson-modal"
import { DeleteLessonButton } from "@/components/instructor/delete-lesson-button"
import { RecordBlueprintModal } from "@/components/instructor/record-blueprint-modal"
import { AddLibrarySignToLesson } from "@/components/instructor/add-library-sign-to-lesson"
import { getLibrarySigns } from "@/lib/supabase/libraryQueries"

export const dynamic = 'force-dynamic'

export default async function CurriculumPage() {
    // Fetch all levels with lessons, legacy signs, AND library lesson signs
    const levels = await prisma.level.findMany({
        orderBy: { orderIndex: 'asc' },
        include: {
            lessons: {
                orderBy: { orderIndex: 'asc' },
                include: {
                    signs: {
                        orderBy: { orderIndex: 'asc' }
                    },
                    // NEW: fetch library-linked signs
                    lessonSigns: {
                        orderBy: { orderIndex: 'asc' },
                        include: {
                            librarySign: true,
                        }
                    },
                    _count: {
                        select: { signs: true }
                    }
                }
            }
        }
    })

    // Flatten lessons for the sign creation modal
    const allLessons = levels.flatMap(level => level.lessons.map(lesson => ({
        id: lesson.id,
        title: `${level.title} - ${lesson.title}`
    })))

    // Fetch library signs server-side for the SignPicker
    const librarySigns = await getLibrarySigns()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Curriculum</h1>
                    <p className="text-muted-foreground">Manage units, chapters, and signs.</p>
                </div>
                <CreateLevelModal />
            </div>

            <div className="space-y-4">
                {levels.length === 0 && (
                    <div className="text-center p-12 border rounded-lg bg-muted/20 text-muted-foreground">
                        No units found. Start by creating one.
                    </div>
                )}

                {levels.map((level) => (
                    <Card key={level.id} className="overflow-hidden">
                        <CardHeader className="bg-muted/30 pb-3">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-move" />
                                        {level.title}
                                    </CardTitle>
                                    <CardDescription>{level.description}</CardDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <EditLevelModal level={{ id: level.id, title: level.title, description: level.description, orderIndex: level.orderIndex }} />
                                    <DeleteLevelButton levelId={level.id} levelTitle={level.title} />
                                    <CreateLessonModal levels={[{ id: level.id, title: level.title }]} />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            {level.lessons.length === 0 ? (
                                <div className="p-4 text-sm text-center text-muted-foreground">
                                    No chapters in this unit.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {level.lessons.map((lesson) => (
                                        <div key={lesson.id} className="group">
                                            <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors pl-8">
                                                <div className="flex items-center gap-3">
                                                    <GripVertical className="h-4 w-4 text-muted-foreground/50 cursor-move" />
                                                    <div>
                                                        <div className="font-medium">{lesson.title}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {lesson._count.signs} signs • {lesson.xpReward} XP
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {/* Library Picker (NEW) */}
                                                    <AddLibrarySignToLesson
                                                        lessonId={lesson.id}
                                                        lessonTitle={lesson.title}
                                                        librarySigns={librarySigns}
                                                    />
                                                    {/* Existing: Custom Sign Upload */}
                                                    <CreateSignModal lessons={[{ id: lesson.id, title: lesson.title }]} defaultLessonId={lesson.id} />
                                                    <EditLessonModal lesson={{
                                                        id: lesson.id,
                                                        title: lesson.title,
                                                        description: lesson.description,
                                                        orderIndex: lesson.orderIndex,
                                                        xpReward: lesson.xpReward,
                                                        isLockedDefault: lesson.isLockedDefault
                                                    }} />
                                                    <DeleteLessonButton lessonId={lesson.id} lessonTitle={lesson.title} />
                                                </div>
                                            </div>
                                            {/* Signs List — legacy + library */}
                                            {(lesson.signs.length > 0 || lesson.lessonSigns.length > 0) && (
                                                <div className="bg-muted/10 pl-16 pr-4 py-2 space-y-1 border-t border-dashed">
                                                    {/* Legacy (manually uploaded) signs */}
                                                    {lesson.signs.map((sign, index) => (
                                                        <div key={sign.id} className="flex items-center justify-between text-sm py-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-muted-foreground text-xs">{index + 1}.</span>
                                                                <span>{sign.word}</span>
                                                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                                    {sign.category}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <RecordBlueprintModal
                                                                    signId={sign.id}
                                                                    signWord={sign.word}
                                                                    hasExistingData={Boolean((sign as any).landmarkData)}
                                                                />
                                                                <EditSignModal sign={{
                                                                    id: sign.id,
                                                                    word: sign.word,
                                                                    description: (sign as any).description || null,
                                                                    videoUrl: sign.videoUrl,
                                                                    category: sign.category,
                                                                    difficulty: sign.difficulty
                                                                }} />
                                                                <DeleteSignButton signId={sign.id} signWord={sign.word} />
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Library / custom lesson signs */}
                                                    {lesson.lessonSigns.map((ls: any, index: number) => {
                                                        const label = ls.useLibrary && ls.librarySign
                                                            ? ls.librarySign.name
                                                            : 'Custom Video'
                                                        const badge = ls.useLibrary
                                                            ? 'Library'
                                                            : 'Custom'
                                                        const videoUrl = ls.useLibrary
                                                            ? ls.librarySign?.videoUrl
                                                            : ls.customVideoUrl

                                                        return (
                                                            <div key={ls.id} className="flex items-center justify-between text-sm py-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-muted-foreground text-xs">
                                                                        {lesson.signs.length + index + 1}.
                                                                    </span>
                                                                    <span className="font-medium">{label}</span>
                                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                                                                        ls.useLibrary
                                                                            ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                                                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                    }`}>
                                                                        {badge}
                                                                    </span>
                                                                    {videoUrl && (
                                                                        <a
                                                                            href={videoUrl}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="text-xs text-blue-500 hover:underline"
                                                                        >
                                                                            View Video ↗
                                                                        </a>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <form action={async () => {
                                                                        'use server'
                                                                        const { removeLessonSign } = await import('@/lib/supabase/libraryQueries')
                                                                        await removeLessonSign(ls.id)
                                                                    }}>
                                                                        <button
                                                                            type="submit"
                                                                            className="text-xs text-red-500 hover:text-red-600 hover:underline transition-colors"
                                                                            title="Remove from lesson"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </form>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}

                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
