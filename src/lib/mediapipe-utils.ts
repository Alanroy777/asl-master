// Custom definition of HAND_CONNECTIONS to avoid import issues
// Based on standard MediaPipe Hand Landmarks
// 0: Wrist
// 1-4: Thumb
// 5-8: Index
// 9-12: Middle
// 13-16: Ring
// 17-20: Pinky

export const HAND_CONNECTIONS: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [3, 4],  // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],  // Index
    [0, 9], [9, 10], [10, 11], [11, 12], // Middle
    [0, 13], [13, 14], [14, 15], [15, 16], // Ring
    [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
    [5, 9], [9, 13], [13, 17] // Palm (MCP connections)
];
