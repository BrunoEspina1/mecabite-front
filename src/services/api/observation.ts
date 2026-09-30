import type { LandmarksEvent } from '@/modules/hand-landmarker';
import type { ObservationMessage } from '@/services/api/types';

const round5 = (n: number) => Math.round(n * 1e5) / 1e5;

/**
 * Turns MediaPipe frames into `observation` messages.
 * - `sequence` starts at 0 per session and increases by 1 per processed frame, even if a
 *   frame could not be sent (lost frames are never resent or invented).
 * - `timestamp_ms` is relative to the first frame of the session, using the capture time.
 */
export class ObservationBuilder {
  private sequence = 0;
  private firstTimestamp: number | null = null;

  build(frame: LandmarksEvent, maxHands = 1): ObservationMessage {
    this.firstTimestamp ??= frame.timestampMs;
    return {
      type: 'observation',
      sequence: this.sequence++,
      timestamp_ms: Math.max(0, Math.round(frame.timestampMs - this.firstTimestamp)),
      vision: {
        image_width: frame.imageWidth,
        image_height: frame.imageHeight,
        mirrored: frame.mirrored,
        hands: frame.hands.slice(0, maxHands).map((hand) => ({
          landmarks: hand.landmarks.map(([x, y, z]) => [round5(x), round5(y), round5(z)]),
          handedness: { label: hand.handedness.label, score: round5(hand.handedness.score) },
        })),
        pose_landmarks:
          frame.poseLandmarks?.map(([x, y, z, visibility]) => [round5(x), round5(y), round5(z), round5(visibility)]) ??
          null,
      },
      glove: null,
    };
  }
}
