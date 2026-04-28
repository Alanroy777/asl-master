// src/lib/practiceUtils.ts
// Utility for resolving a LessonSign into a concrete videoUrl + blueprint
// Used by Practice Studio so it can work with both library and custom signs.

import type { LessonSign, ResolvedSign } from '@/types/library'

/**
 * resolveSign — Given a LessonSign record (with librarySign joined),
 * returns the concrete video URL and landmark blueprint to use.
 *
 * Rules:
 *  - If use_library is true  → use library sign's videoUrl and landmarkBlueprint
 *  - If use_library is false → use custom_video_url and custom_blueprint
 */
export function resolveSign(lessonSign: LessonSign): ResolvedSign {
  if (lessonSign.useLibrary && lessonSign.librarySign) {
    return {
      videoUrl: lessonSign.librarySign.videoUrl,
      blueprint: lessonSign.librarySign.landmarkBlueprint ?? null,
      name: lessonSign.librarySign.name,
    }
  }

  return {
    videoUrl: lessonSign.customVideoUrl ?? '',
    blueprint: lessonSign.customBlueprint ?? null,
    name: `Custom Sign #${lessonSign.orderIndex + 1}`,
  }
}

/**
 * Convenience helper: resolve all lesson signs for a lesson.
 */
export function resolveAllSigns(lessonSigns: LessonSign[]): ResolvedSign[] {
  return lessonSigns
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .map(resolveSign)
}
