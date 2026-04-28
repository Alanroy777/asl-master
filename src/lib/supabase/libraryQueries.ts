'use server'

import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { revalidatePath } from 'next/cache'
import type {
  SignLibraryEntry,
  LessonSign,
  LibraryFilters,
  BulkImportSignInput,
  BulkImportResult,
  LibraryCategory,
  LibraryDifficulty,
} from '@/types/library'

// ─── Helper ────────────────────────────────────────────────────────────────

function mapDbEntryToSignLibraryEntry(e: any): SignLibraryEntry {
  return {
    id: e.id,
    name: e.name,
    category: e.category as LibraryCategory,
    videoUrl: e.videoUrl,
    thumbnailUrl: e.thumbnailUrl ?? null,
    landmarkBlueprint: e.landmarkBlueprint ?? null,
    source: e.source,
    difficulty: e.difficulty as LibraryDifficulty,
    tags: e.tags ?? [],
    createdAt: e.createdAt.toISOString(),
    createdById: e.createdById ?? null,
  }
}

function mapDbLessonSign(ls: any): LessonSign {
  return {
    id: ls.id,
    lessonId: ls.lessonId,
    signId: ls.signId ?? null,
    customVideoUrl: ls.customVideoUrl ?? null,
    customBlueprint: ls.customBlueprint ?? null,
    orderIndex: ls.orderIndex,
    useLibrary: ls.useLibrary,
    createdAt: ls.createdAt.toISOString(),
    librarySign: ls.librarySign ? mapDbEntryToSignLibraryEntry(ls.librarySign) : null,
  }
}

// ─── Signs Library Queries ──────────────────────────────────────────────────

/**
 * Fetch all signs in the library with optional filters.
 */
export async function getLibrarySigns(
  filters?: LibraryFilters
): Promise<SignLibraryEntry[]> {
  const where: any = {}

  if (filters?.category && filters.category !== 'all') {
    where.category = filters.category
  }
  if (filters?.difficulty && filters.difficulty !== 'all') {
    where.difficulty = filters.difficulty
  }
  if (filters?.source) {
    where.source = { contains: filters.source, mode: 'insensitive' }
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { tags: { hasSome: [filters.search] } },
    ]
  }

  const results = await (prisma as any).signsLibrary.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return results.map(mapDbEntryToSignLibraryEntry)
}

/**
 * Add a new sign to the library.
 */
export async function addLibrarySign(
  sign: Omit<SignLibraryEntry, 'id' | 'createdAt'>
): Promise<{ success: boolean; message: string; data?: SignLibraryEntry }> {
  const session = await auth()
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized: Admin only' }
  }

  try {
    const created = await (prisma as any).signsLibrary.create({
      data: {
        name: sign.name,
        category: sign.category,
        videoUrl: sign.videoUrl,
        thumbnailUrl: sign.thumbnailUrl ?? null,
        landmarkBlueprint: sign.landmarkBlueprint ?? null,
        source: sign.source ?? 'custom',
        difficulty: sign.difficulty ?? 'beginner',
        tags: sign.tags ?? [],
        createdById: sign.createdById ?? null,
      },
    })

    revalidatePath('/admin/library')
    return { success: true, message: 'Sign added successfully', data: mapDbEntryToSignLibraryEntry(created) }
  } catch (error: any) {
    console.error('addLibrarySign error:', error)
    return { success: false, message: error.message ?? 'Failed to add sign' }
  }
}

/**
 * Update an existing library sign.
 */
export async function updateLibrarySign(
  id: string,
  updates: Partial<Omit<SignLibraryEntry, 'id' | 'createdAt'>>
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized: Admin only' }
  }

  try {
    await (prisma as any).signsLibrary.update({
      where: { id },
      data: {
        ...(updates.name !== undefined && { name: updates.name }),
        ...(updates.category !== undefined && { category: updates.category }),
        ...(updates.videoUrl !== undefined && { videoUrl: updates.videoUrl }),
        ...(updates.thumbnailUrl !== undefined && { thumbnailUrl: updates.thumbnailUrl }),
        ...(updates.landmarkBlueprint !== undefined && { landmarkBlueprint: updates.landmarkBlueprint }),
        ...(updates.source !== undefined && { source: updates.source }),
        ...(updates.difficulty !== undefined && { difficulty: updates.difficulty }),
        ...(updates.tags !== undefined && { tags: updates.tags }),
      },
    })
    revalidatePath('/admin/library')
    return { success: true, message: 'Sign updated successfully' }
  } catch (error: any) {
    console.error('updateLibrarySign error:', error)
    return { success: false, message: error.message ?? 'Failed to update sign' }
  }
}

/**
 * Delete a library sign.
 */
export async function deleteLibrarySign(
  id: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized: Admin only' }
  }

  try {
    await (prisma as any).signsLibrary.delete({ where: { id } })
    revalidatePath('/admin/library')
    return { success: true, message: 'Sign deleted' }
  } catch (error: any) {
    console.error('deleteLibrarySign error:', error)
    return { success: false, message: error.message ?? 'Failed to delete sign' }
  }
}

/**
 * Bulk-import signs from a JSON array (WLASL-compatible format).
 */
export async function bulkImportSigns(
  signs: BulkImportSignInput[]
): Promise<BulkImportResult> {
  const session = await auth()
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return { inserted: 0, failed: signs.length, errors: ['Unauthorized'] }
  }

  let inserted = 0
  let failed = 0
  const errors: string[] = []

  for (const sign of signs) {
    try {
      if (!sign.name || !sign.videoUrl) {
        throw new Error(`Missing required fields: name or videoUrl for "${sign.name}"`)
      }

      await (prisma as any).signsLibrary.create({
        data: {
          name: sign.name,
          category: sign.category ?? 'custom',
          videoUrl: sign.videoUrl,
          thumbnailUrl: sign.thumbnailUrl ?? null,
          landmarkBlueprint: sign.landmarkBlueprint ?? null,
          source: sign.source ?? 'custom',
          difficulty: sign.difficulty ?? 'beginner',
          tags: sign.tags ?? [],
        },
      })
      inserted++
    } catch (err: any) {
      failed++
      errors.push(err.message ?? `Failed to insert "${sign.name}"`)
    }
  }

  revalidatePath('/admin/library')
  return { inserted, failed, errors }
}

/**
 * Clear all signs from the library.
 * WARNING: This will break references in lessons that use these signs.
 */
export async function clearLibrarySigns(): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  // @ts-ignore
  if (session?.user?.role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    // We use deleteMany to clear the whole table
    await (prisma as any).signsLibrary.deleteMany({})
    revalidatePath('/admin/library')
    return { success: true, message: 'Library cleared successfully' }
  } catch (error: any) {
    console.error('clearLibrarySigns error:', error)
    return { success: false, message: error.message ?? 'Failed to clear library' }
  }
}

// ─── Lesson Signs Queries ───────────────────────────────────────────────────

/**
 * Get all signs for a lesson, with library sign data joined.
 */
export async function getLessonSigns(lessonId: string): Promise<LessonSign[]> {
  const results = await (prisma as any).lessonSign.findMany({
    where: { lessonId },
    orderBy: { orderIndex: 'asc' },
    include: { librarySign: true },
  })
  return results.map(mapDbLessonSign)
}

/**
 * Add a sign (library or custom) to a lesson.
 */
export async function addSignToLesson(
  lessonId: string,
  signId?: string,
  customData?: { customVideoUrl?: string; customBlueprint?: any }
): Promise<{ success: boolean; message: string; data?: LessonSign }> {
  const session = await auth()
  // @ts-ignore
  const role = session?.user?.role
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    const count = await (prisma as any).lessonSign.count({ where: { lessonId } })
    const useLibrary = !!signId

    const created = await (prisma as any).lessonSign.create({
      data: {
        lessonId,
        signId: signId ?? null,
        customVideoUrl: customData?.customVideoUrl ?? null,
        customBlueprint: customData?.customBlueprint ?? null,
        orderIndex: count,
        useLibrary,
      },
      include: { librarySign: true },
    })

    revalidatePath('/instructor/curriculum')
    return { success: true, message: 'Sign added to lesson', data: mapDbLessonSign(created) }
  } catch (error: any) {
    console.error('addSignToLesson error:', error)
    return { success: false, message: error.message ?? 'Failed to add sign' }
  }
}

/**
 * Update a single lesson sign (e.g. switch between library and custom).
 */
export async function updateLessonSign(
  lessonSignId: string,
  updates: {
    signId?: string | null
    customVideoUrl?: string | null
    customBlueprint?: any | null
    useLibrary?: boolean
  }
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  // @ts-ignore
  const role = session?.user?.role
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await (prisma as any).lessonSign.update({
      where: { id: lessonSignId },
      data: {
        ...(updates.signId !== undefined && { signId: updates.signId }),
        ...(updates.customVideoUrl !== undefined && { customVideoUrl: updates.customVideoUrl }),
        ...(updates.customBlueprint !== undefined && { customBlueprint: updates.customBlueprint }),
        ...(updates.useLibrary !== undefined && { useLibrary: updates.useLibrary }),
      },
    })
    revalidatePath('/instructor/curriculum')
    return { success: true, message: 'Lesson sign updated' }
  } catch (error: any) {
    return { success: false, message: error.message ?? 'Failed to update lesson sign' }
  }
}

/**
 * Reorder signs within a lesson by providing an ordered list of lessonSign IDs.
 */
export async function updateLessonSignOrder(
  lessonId: string,
  orderedIds: string[]
): Promise<void> {
  const session = await auth()
  // @ts-ignore
  const role = session?.user?.role
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') return

  await Promise.all(
    orderedIds.map((id, index) =>
      (prisma as any).lessonSign.update({
        where: { id },
        data: { orderIndex: index },
      })
    )
  )
  revalidatePath('/instructor/curriculum')
}

/**
 * Remove a sign from a lesson.
 */
export async function removeLessonSign(
  lessonSignId: string
): Promise<{ success: boolean; message: string }> {
  const session = await auth()
  // @ts-ignore
  const role = session?.user?.role
  if (role !== 'INSTRUCTOR' && role !== 'ADMIN') {
    return { success: false, message: 'Unauthorized' }
  }

  try {
    await (prisma as any).lessonSign.delete({ where: { id: lessonSignId } })
    revalidatePath('/instructor/curriculum')
    return { success: true, message: 'Sign removed from lesson' }
  } catch (error: any) {
    return { success: false, message: error.message ?? 'Failed to remove sign' }
  }
}
