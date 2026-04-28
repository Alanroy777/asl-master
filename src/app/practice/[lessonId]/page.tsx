import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import PracticeStudio from '@/components/practice-studio-v2'

interface PageProps {
  params: Promise<{ lessonId: string }>
}

export default async function PracticeStudioPage({ params }: PageProps) {
  const { lessonId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  return <PracticeStudio lessonId={lessonId} learnerId={session.user.id} />
}
