// src/lib/mockAslModel.ts
// Mock ASL recognition model for development and testing.
// Simulates model output without requiring real model files.
// Replace with real model by setting NEXT_PUBLIC_USE_MOCK_MODEL=false

/**
 * Mock sign prediction — simulates LSTM model output.
 *
 * @param allowedSigns   Array of sign labels that are currently unlocked/in scope.
 * @param hasLandmarks   Whether MediaPipe detected any landmarks this frame.
 * @returns              Predicted { label, confidence } or null if no detection.
 */
export function mockPredictSign(
  allowedSigns: string[],
  hasLandmarks: boolean
): { label: string; confidence: number } | null {
  // No hand in frame → no prediction
  if (!hasLandmarks || allowedSigns.length === 0) return null

  // For development testing, always return a stable, high-confidence match
  // for the expected sign. This allows the 45-frame hold timer to complete
  // without randomly resetting.
  const label = allowedSigns[0]
  
  // Confidence: uniformly distributed between 0.80 and 0.95
  const confidence = 0.80 + Math.random() * 0.15
  return { label, confidence }
}
