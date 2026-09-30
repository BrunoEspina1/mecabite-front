import type { ViewProps } from 'react-native';

/** One hand as returned by MediaPipe: 21 normalized [x, y, z] points + raw handedness. */
export type DetectedHand = {
  landmarks: [number, number, number][];
  handedness: { label: string; score: number };
};

/** One body point as returned by MediaPipe Pose: normalized [x, y, z, visibility]. */
export type PoseLandmark = [number, number, number, number];

/** Hand and pose results of the SAME frame (same image, same timestamp). */
export type LandmarksEvent = {
  /** Capture time (presentation timestamp) in ms, monotonic. Not relative to anything yet. */
  timestampMs: number;
  /** Size of the portrait image MediaPipe processed. */
  imageWidth: number;
  imageHeight: number;
  /** Whether the image MediaPipe received was horizontally flipped. */
  mirrored: boolean;
  /** Empty when no hand is detected. */
  hands: DetectedHand[];
  /** 33 points of the first detected person; null when no body is detected. */
  poseLandmarks: PoseLandmark[] | null;
};

export type HandLandmarkerViewProps = ViewProps & {
  active: boolean;
  facing?: 'front' | 'back';
  numHands?: number;
  onLandmarks?: (event: { nativeEvent: LandmarksEvent }) => void;
  onReady?: () => void;
  onError?: (event: { nativeEvent: { message: string } }) => void;
};
