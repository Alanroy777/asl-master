// src/types/practice.ts
// Types for the LSTM/MediaPipe Holistic practice system

export type ProgressStatus = 'locked' | 'learned' | 'practicing' | 'completed'

export interface LearnerProgress {
  id: string
  learner_id: string
  lesson_id: string
  sign_id: string
  status: ProgressStatus
  score: number | null
  attempts: number
  learned_at: string | null
  completed_at: string | null
  created_at?: string
  updated_at?: string
}

export interface SignWithProgress {
  /** The LessonSign row id */
  sign_id: string
  /** The resolved sign name (from library or custom) */
  name: string
  category: string
  video_url: string
  difficulty: string
  order_index: number
  blueprint?: any | null
  /** null = progress not yet initialized */
  progress: LearnerProgress | null
}

export interface DetectionResult {
  label: string
  confidence: number
  isCorrect: boolean
}

export interface SignResult {
  sign_id: string
  name: string
  status: ProgressStatus
  score: number | null
  attempts: number
}

export interface LessonSummary {
  totalSigns: number
  completedSigns: number
  averageScore: number
  signResults: SignResult[]
}
