import type { ViewProps } from 'react-native';

/** One hand as returned by MediaPipe: 21 normalized [x, y, z] points + raw handedness. */
export type DetectedHand = {
  landmarks: [number, number, number][];
  handedness: { label: string; score: number };
};

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
};

export type HandLandmarkerViewProps = ViewProps & {
  active: boolean;
  facing?: 'front' | 'back';
  numHands?: number;
  onLandmarks?: (event: { nativeEvent: LandmarksEvent }) => void;
  onReady?: () => void;
  onError?: (event: { nativeEvent: { message: string } }) => void;
};
