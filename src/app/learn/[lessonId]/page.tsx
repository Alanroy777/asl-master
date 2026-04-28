
import { getLessonData, getLevelLessons } from '@/app/lib/actions'
import LessonPlayer from '@/components/lesson-player'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'

interface PageProps {
    params: Promise<{ lessonId: string }>
}

export default async function LessonPage({ params }: PageProps) {
    const { lessonId } = await params
    const session = await auth()

    if (!session?.user?.email) redirect('/login')

    const lesson = await getLessonData(lessonId)

    if (!lesson) {
        return <div className="p-8 text-center">Lesson not found.</div>
    }

    // Check if locked using the lesson's actual level
    const allLessons = await getLevelLessons(lesson.levelId)
    const currentLessonStatus = allLessons.find(l => l.id === lesson.id || l.slug === lesson.slug)

    if (currentLessonStatus?.isLocked) {
        redirect('/learn')
    }

    return <LessonPlayer lesson={lesson} />
}
