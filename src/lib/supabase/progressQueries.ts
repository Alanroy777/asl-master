'use server'
// src/lib/supabase/progressQueries.ts
// Next.js Server Actions for learner progress tracking.
// Uses supabase-js with the anon key (RLS disabled; access controlled by app logic).

import { supabase } from './client'
import type {
  LearnerProgress,
  ProgressStatus,
  SignWithProgress,
  SignResult,
  LessonSummary,
} from '@/types/practice'
import { prisma } from '@/lib/prisma'
import { logPracticeSession } from '@/app/lib/actions'

// ─── Initialize ──────────────────────────────────────────────────────────────

export async function initializeLessonProgress(
  learnerId: string,
  lessonId: string
): Promise<void> {
  try {
    // Mimic the RPC logic using Prisma
    const lessonSigns = await prisma.lessonSign.findMany({
      where: { lessonId },
      orderBy: { orderIndex: 'asc' }
    })

    if (lessonSigns.length === 0) return

    let firstSign = true
    for (const ls of lessonSigns) {
      const desiredStatus = firstSign ? 'learned' : 'locked'
      firstSign = false

      // Use executeRaw to handle ON CONFLICT easily, since learner_progress is a raw SQL table
      await prisma.$executeRawUnsafe(`
        INSERT INTO public.learner_progress (learner_id, lesson_id, sign_id, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (learner_id, lesson_id, sign_id) DO NOTHING;
      `, learnerId, lessonId, ls.id, desiredStatus)
    }
  } catch (error: any) {
    console.error('[progressQueries] initializeLessonProgress:', error.message)
  }
}

// ─── Read ────────────────────────────────────────────────────────────────────

export async function getLessonProgress(
  learnerId: string,
  lessonId: string
): Promise<SignWithProgress[]> {
  // Fetch lesson_signs using Prisma to avoid Supabase anon key permission issues
  const lessonSigns = await prisma.lessonSign.findMany({
    where: { lessonId },
    include: { librarySign: true },
    orderBy: { orderIndex: 'asc' }
  })

  if (!lessonSigns || lessonSigns.length === 0) return []

  const signIds = lessonSigns.map(ls => ls.id)

  // Fetch progress rows for learner+lesson using raw SQL since table is not in Prisma schema
  let progressRows: any[] = []
  try {
    if (signIds.length > 0) {
      const placeholders = signIds.map((_, i) => `$${i + 3}`).join(',')
      progressRows = await prisma.$queryRawUnsafe(`
        SELECT * FROM public.learner_progress
        WHERE learner_id = $1 AND lesson_id = $2 AND sign_id IN (${placeholders})
      `, learnerId, lessonId, ...signIds)
    }
  } catch (prError: any) {
    console.error('[progressQueries] getLessonProgress progress:', prError.message)
  }

  const progressMap = new Map<string, LearnerProgress>()
  for (const row of progressRows ?? []) {
    progressMap.set(row.sign_id, row as LearnerProgress)
  }

  return lessonSigns.map(ls => {
    const lib = ls.librarySign
    return {
      sign_id: ls.id,
      name: lib?.name ?? 'Unknown',
      category: lib?.category ?? 'custom',
      video_url: lib?.videoUrl ?? ls.customVideoUrl ?? '',
      difficulty: lib?.difficulty ?? 'beginner',
      order_index: ls.orderIndex ?? 0,
      blueprint: lib?.landmarkBlueprint ?? ls.customBlueprint ?? null,
      progress: progressMap.get(ls.id) ?? null,
    } satisfies SignWithProgress
  })

}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateSignStatus(
  learnerId: string,
  lessonId: string,
  signId: string,
  status: ProgressStatus,
  score?: number
): Promise<void> {
  try {
    let updateSql = `UPDATE public.learner_progress SET status = $1, updated_at = now()`
    const params: any[] = [status]
    let paramIdx = 2

    if (score !== undefined) {
      updateSql += `, score = $${paramIdx}`
      params.push(score)
      paramIdx++
    }

    if (status === 'practicing') {
      updateSql += `, learned_at = now(), attempts = attempts + 1`
    }
    if (status === 'completed') {
      updateSql += `, completed_at = now()`
    }

    updateSql += ` WHERE learner_id = $${paramIdx} AND lesson_id = $${paramIdx + 1} AND sign_id = $${paramIdx + 2}`
    params.push(learnerId, lessonId, signId)

    await prisma.$executeRawUnsafe(updateSql, ...params)

    // Log the practice session globally to Vocabulary Trainer if it was completed
    if (status === 'completed' && score !== undefined) {
      const lessonSign = await prisma.lessonSign.findUnique({
        where: { id: signId },
        select: { signId: true }
      })

      if (lessonSign?.signId) {
        await logPracticeSession(lessonSign.signId, score)
      }
    }
  } catch (error: any) {
    console.error('[progressQueries] updateSignStatus:', error.message)
  }
}

// ─── Unlock Next ─────────────────────────────────────────────────────────────

export async function unlockNextSign(
  learnerId: string,
  lessonId: string,
  currentSignId: string
): Promise<SignWithProgress | null> {
  const allSigns = await getLessonProgress(learnerId, lessonId)
  const currentIdx = allSigns.findIndex(s => s.sign_id === currentSignId)
  if (currentIdx === -1 || currentIdx + 1 >= allSigns.length) return null

  const nextSign = allSigns[currentIdx + 1]

  try {
    await prisma.$executeRawUnsafe(`
      UPDATE public.learner_progress 
      SET status = 'learned', updated_at = now()
      WHERE learner_id = $1 AND lesson_id = $2 AND sign_id = $3
    `, learnerId, lessonId, nextSign.sign_id)
  } catch (error: any) {
    console.error('[progressQueries] unlockNextSign:', error.message)
  }

  return {
    ...nextSign,
    progress: {
      ...(nextSign.progress ?? {
        id: '', learner_id: learnerId, lesson_id: lessonId,
        sign_id: nextSign.sign_id, score: null, attempts: 0,
        learned_at: null, completed_at: null,
      }),
      status: 'learned',
    } as LearnerProgress,
  }
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export async function getLessonSummary(
  learnerId: string,
  lessonId: string
): Promise<LessonSummary> {
  const signs = await getLessonProgress(learnerId, lessonId)
  const completed = signs.filter(s => s.progress?.status === 'completed')
  const scores = completed
    .map(s => s.progress?.score)
    .filter((s): s is number => s !== null && s !== undefined)

  const averageScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 0

  const signResults: SignResult[] = signs.map(s => ({
    sign_id: s.sign_id,
    name: s.name,
    status: s.progress?.status ?? 'locked',
    score: s.progress?.score ?? null,
    attempts: s.progress?.attempts ?? 0,
  }))

  return { totalSigns: signs.length, completedSigns: completed.length, averageScore, signResults }
}
