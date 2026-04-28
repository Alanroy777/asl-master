// src/lib/aslModel.ts
// ASL LSTM model integration using TensorFlow.js.
// Supports both a real trained model and a mock for development.
//
// Environment switch:
//   NEXT_PUBLIC_USE_MOCK_MODEL=true  → uses mockPredictSign()
//   NEXT_PUBLIC_USE_MOCK_MODEL=false → loads real model from /public/models/asl-model/
//
// Model file paths (add manually when available):
//   /public/models/asl-model/model.json
//   /public/models/asl-model/metadata.json  ({"labels": ["A","B",...]})

import { mockPredictSign } from './mockAslModel'

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK_MODEL === 'true'

// ─── Singleton caches ────────────────────────────────────────────────────────
let cachedModel: any | null = null
let cachedLabels: string[] | null = null

// ─── Real Model Loaders ──────────────────────────────────────────────────────

/**
 * Loads the TensorFlow.js LSTM model from /public/models/asl-model/model.json.
 * Caches the loaded model so subsequent calls return immediately.
 */
export async function loadASLModel(): Promise<any> {
  if (cachedModel) return cachedModel

  // Dynamic import to avoid bundling TF.js in non-camera contexts
  const tf = await import('@tensorflow/tfjs')
  const model = await tf.loadLayersModel('/models/asl-model/model.json')
  cachedModel = model
  return model
}

/**
 * Fetches /public/models/asl-model/metadata.json and returns labels array.
 * Caches result in memory.
 */
export async function loadModelMetadata(): Promise<string[]> {
  if (cachedLabels) return cachedLabels

  const res = await fetch('/models/asl-model/metadata.json')
  if (!res.ok) throw new Error('Failed to fetch model metadata')
  const json = await res.json()
  const labels: string[] = json.labels ?? []
  cachedLabels = labels
  return labels
}

// ─── Landmark Extraction ─────────────────────────────────────────────────────

/**
 * Extracts a flat Float32Array of 258 values from MediaPipe Holistic results:
 *   - Pose:       33 points × 4 values (x, y, z, visibility) = 132
 *   - Left hand:  21 points × 3 values (x, y, z)             =  63
 *   - Right hand: 21 points × 3 values (x, y, z)             =  63
 *
 * Missing landmarks are filled with zeros.
 * Returns null if NEITHER hand is detected (no useful data).
 */
export function extractLandmarks(holisticResults: any): Float32Array | null {
  const POSE_SIZE  = 33 * 4  // 132
  const HAND_SIZE  = 21 * 3  //  63
  const TOTAL_SIZE = POSE_SIZE + HAND_SIZE + HAND_SIZE // 258

  const buffer = new Float32Array(TOTAL_SIZE)

  // ── Pose ────────────────────────────────────────────────────────────────
  const poseLandmarks = holisticResults?.poseLandmarks
  if (poseLandmarks && poseLandmarks.length > 0) {
    for (let i = 0; i < 33; i++) {
      const lm = poseLandmarks[i]
      const offset = i * 4
      if (lm) {
        buffer[offset]     = lm.x ?? 0
        buffer[offset + 1] = lm.y ?? 0
        buffer[offset + 2] = lm.z ?? 0
        buffer[offset + 3] = lm.visibility ?? 0
      }
    }
  }

  // ── Left hand ───────────────────────────────────────────────────────────
  const leftHand = holisticResults?.leftHandLandmarks
  const hasLeft  = leftHand && leftHand.length > 0
  if (hasLeft) {
    for (let i = 0; i < 21; i++) {
      const lm = leftHand[i]
      const offset = POSE_SIZE + i * 3
      if (lm) {
        buffer[offset]     = lm.x ?? 0
        buffer[offset + 1] = lm.y ?? 0
        buffer[offset + 2] = lm.z ?? 0
      }
    }
  }

  // ── Right hand ──────────────────────────────────────────────────────────
  const rightHand = holisticResults?.rightHandLandmarks
  const hasRight  = rightHand && rightHand.length > 0
  if (hasRight) {
    for (let i = 0; i < 21; i++) {
      const lm = rightHand[i]
      const offset = POSE_SIZE + HAND_SIZE + i * 3
      if (lm) {
        buffer[offset]     = lm.x ?? 0
        buffer[offset + 1] = lm.y ?? 0
        buffer[offset + 2] = lm.z ?? 0
      }
    }
  }

  // Return null if no hand data at all
  if (!hasLeft && !hasRight) return null

  return buffer
}

// ─── Real Prediction ─────────────────────────────────────────────────────────

/**
 * Runs the loaded LSTM model on a 30-frame landmark sequence.
 *
 * @param model        Loaded tf.LayersModel.
 * @param sequence     Array of 30 Float32Array frames, each of length 258.
 * @param allowedSigns Labels that are currently unlocked/in scope.
 * @returns            { label, confidence } if confident, else null.
 */
export async function predictSign(
  model: any,
  sequence: Float32Array[],
  allowedSigns: string[]
): Promise<{ label: string; confidence: number } | null> {
  if (sequence.length < 30) return null

  const tf = await import('@tensorflow/tfjs')
  const labels = await loadModelMetadata()

  // Build tensor [1, 30, 258]
  const flat = new Float32Array(30 * 258)
  for (let f = 0; f < 30; f++) {
    flat.set(sequence[f], f * 258)
  }

  const input  = tf.tensor3d(flat, [1, 30, 258])
  const output = model.predict(input) as any

  const probabilities: number[] = await output.data()

  input.dispose()
  output.dispose()

  // Map to labels and filter to only allowed signs
  const candidates = labels
    .map((label, i) => ({ label, confidence: probabilities[i] }))
    .filter(c => allowedSigns.includes(c.label))
    .sort((a, b) => b.confidence - a.confidence)

  if (candidates.length === 0) return null

  const best = candidates[0]
  if (best.confidence < 0.75) return null

  return { label: best.label, confidence: best.confidence }
}

// ─── Unified API ─────────────────────────────────────────────────────────────

/**
 * Unified recognition function.
 * Routes to mock or real model based on NEXT_PUBLIC_USE_MOCK_MODEL env var.
 *
 * @param frameBuffer  Rolling buffer of up to 30 landmark frames.
 * @param allowedSigns Array of objects { name, blueprint }.
 * @param hasLandmarks Whether any hand landmarks were detected this frame.
 */
export async function recognizeSign(
  frameBuffer: Float32Array[],
  allowedSigns: { name: string; blueprint?: any }[],
  hasLandmarks: boolean
): Promise<{ label: string; confidence: number } | null> {
  // --- PRIORITY 1: Blueprint Engine (Smarter Geometric matching) ---
  const validBlueprints = allowedSigns.filter(s => s.blueprint)
  if (validBlueprints.length > 0) {
    const result = recognizeFromSet(frameBuffer, validBlueprints)
    if (result) return result
  }

  // --- PRIORITY 2: Mock Mode (for dev without models) ---
  if (USE_MOCK) {
    const names = allowedSigns.map(s => s.name)
    return mockPredictSign(names, hasLandmarks)
  }

  // --- PRIORITY 3: Real LSTM Model ---
  if (frameBuffer.length < 30) return null
  try {
    const model = await loadASLModel()
    const names = allowedSigns.map(s => s.name)
    return await predictSign(model, frameBuffer.slice(-30), names)
  } catch (err) {
    console.error('[aslModel] Prediction error:', err)
    return null
  }
}

/**
 * Compares current hand landmarks against a set of blueprints.
 * Returns the best match found.
 */
export function recognizeFromSet(
  frameBuffer: Float32Array[],
  signs: { name: string; blueprint: any }[]
): { label: string; confidence: number } | null {
  const matches = signs
    .map(s => compareToBlueprint(frameBuffer, s.name, s.blueprint))
    .filter((m): m is { label: string; confidence: number } => m !== null)
    .sort((a, b) => b.confidence - a.confidence)

  return matches.length > 0 ? matches[0] : null
}

/**
 * Normalizes a single hand's landmarks (21 points, 63 values).
 * 1. Flips left hand to match right hand orientation.
 * 2. Translates wrist (point 0) to origin.
 * 3. Scales max distance to 1.
 */
export function normalizeHand(hand: any[], isLeft: boolean): Float32Array {
  const normalized = new Float32Array(63)
  
  // Get wrist (point 0)
  const wrist = hand[0]
  const wristX = wrist.x
  const wristY = wrist.y
  const wristZ = wrist.z ?? 0

  let maxDist = 0

  // 1. Translate and Flip (if left)
  for (let i = 0; i < 21; i++) {
    const lm = hand[i]
    let x = lm.x - wristX
    const y = lm.y - wristY
    const z = (lm.z ?? 0) - wristZ

    // Flip X if it's the left hand so it matches right hand blueprints
    if (isLeft) x = -x

    normalized[i * 3] = x
    normalized[i * 3 + 1] = y
    normalized[i * 3 + 2] = z

    const d = Math.sqrt(x*x + y*y + z*z)
    if (d > maxDist) maxDist = d
  }

  // 2. Scale
  if (maxDist > 0) {
    for (let i = 0; i < 63; i++) {
      normalized[i] /= maxDist
    }
  }

  return normalized
}

/**
 * Calculates the cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0
  let normA = 0
  let normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

/**
 * Extracts finger joint angles (15 angles total).
 * These are rotation-invariant and great for static shapes.
 */
export function getHandAngles(normalized: Float32Array): number[] {
  const angles: number[] = []
  
  // Finger joint indices: [wrist, mcp, pip, dip, tip]
  const fingers = [
    [0, 1, 2, 3, 4],    // Thumb
    [0, 5, 6, 7, 8],    // Index
    [0, 9, 10, 11, 12], // Middle
    [0, 13, 14, 15, 16], // Ring
    [0, 17, 18, 19, 20]  // Pinky
  ]

  for (const finger of fingers) {
    for (let j = 0; j < finger.length - 2; j++) {
      const p1 = finger[j]
      const p2 = finger[j+1]
      const p3 = finger[j+2]

      // Vector v1 = p2 - p1
      const v1 = [
        normalized[p2*3] - normalized[p1*3],
        normalized[p2*3+1] - normalized[p1*3+1],
        normalized[p2*3+2] - normalized[p1*3+2]
      ]
      // Vector v2 = p3 - p2
      const v2 = [
        normalized[p3*3] - normalized[p2*3],
        normalized[p3*3+1] - normalized[p2*3+1],
        normalized[p3*3+2] - normalized[p2*3+2]
      ]

      angles.push(cosineSimilarity(v1, v2))
    }
  }
  return angles
}

/**
 * Compares current hand landmarks to a saved blueprint.
 * Uses a hybrid of Euclidean distance and Joint Angles.
 */
export function compareToBlueprint(
  frameBuffer: Float32Array[],
  targetLabel: string,
  blueprint: any
): { label: string; confidence: number } | null {
  const currentResults = (globalThis as any).lastHolisticResults
  if (!currentResults) return null

  const leftHand = currentResults.leftHandLandmarks
  const rightHand = currentResults.rightHandLandmarks

  const hasLeft = leftHand && leftHand.length > 0
  const hasRight = rightHand && rightHand.length > 0

  if (!hasLeft && !hasRight) return null

  // Process the most visible hand
  const hand = hasRight ? rightHand : leftHand
  const isLeft = !hasRight

  const normalized = normalizeHand(hand, isLeft)
  const currentAngles = getHandAngles(normalized)

  // Blueprint handling
  let targetNormalized: Float32Array
  let targetAngles: number[]

  if (Array.isArray(blueprint)) {
    targetNormalized = new Float32Array(blueprint)
    targetAngles = getHandAngles(targetNormalized)
  } else if (blueprint && blueprint.angles) {
    targetNormalized = new Float32Array(blueprint.landmarks || [])
    targetAngles = blueprint.angles
  } else if (blueprint && blueprint.landmarks) {
    targetNormalized = new Float32Array(blueprint.landmarks)
    targetAngles = getHandAngles(targetNormalized)
  } else {
    // No valid blueprint, fallback to mock high confidence for development
    return { label: targetLabel, confidence: 0.85 }
  }

  // 1. Angle Similarity (Primary) - Rotation & Position invariant
  let angleSimilarity = 0
  for (let i = 0; i < currentAngles.length; i++) {
    // Square the difference to penalize large mismatches (like curled vs straight fingers)
    angleSimilarity += Math.pow(currentAngles[i] - targetAngles[i], 2)
  }
  
  // Adjusted for squared sum: 4.2 -> 1.8 (threshold for squared sum is lower)
  const angleConfidence = Math.max(0, 1 - (Math.sqrt(angleSimilarity) / 2.2))

  // 2. Euclidean Distance (Secondary) - Scale sensitive
  let euclideanDist = 0
  for (let i = 0; i < 63; i++) {
    euclideanDist += Math.pow(normalized[i] - targetNormalized[i], 2)
  }
  const euclideanConfidence = Math.max(0, 1 - (Math.sqrt(euclideanDist) / 1.1))

  // Weighted Confidence: Heavy lean on Angles (90%) for hand shape distinction
  const confidence = (angleConfidence * 0.9) + (euclideanConfidence * 0.1)

  if (confidence < 0.55) return null // More forgiving for fast games

  return { label: targetLabel, confidence }
}
