// src/types/library.ts
// TypeScript types for the Centralized Sign Resource Library feature

export interface Landmark {
  x: number
  y: number
  z: number
  visibility?: number
}

// A sequence of landmark frames captured from MediaPipe
export type LandmarkSequence = Landmark[][]

export type LibraryCategory = 'alphabet' | 'numbers' | 'greetings' | 'common_words' | 'custom'
export type LibraryDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface SignLibraryEntry {
  id: string
  name: string
  category: LibraryCategory
  videoUrl: string
  thumbnailUrl?: string | null
  landmarkBlueprint?: LandmarkSequence | null
  source: string
  difficulty: LibraryDifficulty
  tags: string[]
  createdAt: string
  createdById?: string | null
}

export interface LessonSign {
  id: string
  lessonId: string
  signId?: string | null
  customVideoUrl?: string | null
  customBlueprint?: LandmarkSequence | null
  orderIndex: number
  useLibrary: boolean
  createdAt: string
  // Joined when fetching
  librarySign?: SignLibraryEntry | null
}

// Resolved sign used by Practice Studio
export interface ResolvedSign {
  videoUrl: string
  blueprint: LandmarkSequence | null
  name: string
}

export interface BulkImportSignInput {
  name: string
  category: LibraryCategory
  videoUrl: string
  thumbnailUrl?: string
  source?: string
  difficulty?: LibraryDifficulty
  tags?: string[]
  landmarkBlueprint?: LandmarkSequence
}

export interface BulkImportResult {
  inserted: number
  failed: number
  errors: string[]
}

export interface LibraryFilters {
  category?: LibraryCategory | 'all'
  difficulty?: LibraryDifficulty | 'all'
  search?: string
  source?: string
}
