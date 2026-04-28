// src/lib/holisticSetup.ts
// MediaPipe Holistic initialization and drawing utilities.
// Uses the CDN build of @mediapipe/holistic via dynamic script loading.

export interface HolisticInstance {
  holistic: any
  camera: any
}

/**
 * Initializes MediaPipe Holistic and the Camera utility.
 *
 * @param videoElement  The <video> element to stream from.
 * @param onResults     Callback fired with holistic results every frame.
 * @returns             { holistic, camera } instances for cleanup.
 */
export async function initializeHolistic(
  videoElement: HTMLVideoElement,
  onResults: (results: any) => void
): Promise<HolisticInstance> {
  // Holistic is loaded via CDN <Script> tag in the component.
  // We access it through window globals set by the CDN bundles.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any

  if (!w.Holistic) {
    throw new Error(
      'MediaPipe Holistic not loaded. Ensure the CDN script is added to the page.'
    )
  }

  const holistic = new w.Holistic({
    locateFile: (file: string) =>
      `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`,
  })

  // Prevent "Cannot pass deleted object as a pointer of type SolutionWasm*"
  holistic._isClosed = false;

  await holistic.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    minDetectionConfidence: 0.7,
    minTrackingConfidence: 0.6,
  })

  holistic.onResults(onResults)

  // Camera utility drives the video loop and sends frames to holistic
  if (!w.Camera) {
    throw new Error(
      'MediaPipe Camera utility not loaded. Ensure the CDN script is added to the page.'
    )
  }

  const camera = new w.Camera(videoElement, {
    onFrame: async () => {
      if (holistic._isClosed) return;
      try {
        await holistic.send({ image: videoElement })
      } catch (e) {
        // Suppress errors during unmount phase
      }
    },
    width: 640,
    height: 480,
    facingMode: 'user',
  })

  await camera.start()

  return { holistic, camera }
}

/**
 * Stops the camera and holistic instance, freeing resources.
 */
export function stopHolistic(holistic: any, camera: any): void {
  if (holistic) {
    holistic._isClosed = true;
  }
  
  try {
    camera?.stop()
  } catch (_) {
    // ignore
  }
  try {
    holistic?.close()
  } catch (_) {
    // ignore
  }
}

/**
 * Draws hand landmarks on a canvas overlay using the project's CSS accent color.
 * Uses window.drawConnectors / window.drawLandmarks from MediaPipe drawing_utils CDN.
 *
 * @param canvasElement  The overlay <canvas> element.
 * @param results        MediaPipe Holistic results object.
 */
export function drawLandmarks(canvasElement: HTMLCanvasElement, results: any): void {
  const ctx = canvasElement.getContext('2d')
  if (!ctx) return

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any
  const drawConnectors = w.drawConnectors
  const drawLandmarks  = w.drawLandmarks
  const HAND_CONNECTIONS = w.HAND_CONNECTIONS

  ctx.save()
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height)
  
  // Mirror for natural feel
  ctx.translate(canvasElement.width, 0)
  ctx.scale(-1, 1)

  // Cache results for recognition access
  if (typeof globalThis !== 'undefined') {
    ;(globalThis as any).lastHolisticResults = results
  }

  // Draw video frame
  if (results.image) {
    ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height)
  }

  // Accent color — matches CSS variable --accent-color used project-wide
  const accentColor = '#7c3aed'  // purple-600

  const handOptions = {
    color: accentColor,
    lineWidth: 3,
  }
  const landmarkOptions = {
    color: '#ffffff',
    fillColor: accentColor,
    lineWidth: 1,
    radius: 4,
  }

  // Left hand
  if (results.leftHandLandmarks && drawConnectors && HAND_CONNECTIONS) {
    drawConnectors(ctx, results.leftHandLandmarks, HAND_CONNECTIONS, handOptions)
    drawLandmarks?.(ctx, results.leftHandLandmarks, landmarkOptions)
  }

  // Right hand
  if (results.rightHandLandmarks && drawConnectors && HAND_CONNECTIONS) {
    drawConnectors(ctx, results.rightHandLandmarks, HAND_CONNECTIONS, handOptions)
    drawLandmarks?.(ctx, results.rightHandLandmarks, landmarkOptions)
  }

  ctx.restore()
}
