import type { DetectedHand, LandmarksEvent, PoseLandmark } from '@/modules/hand-landmarker';
import type { Hand } from '@/services/preferences';

/** What is wrong with how the person appears in the picture, judged on the phone from the body points. */
export type FramingIssue = 'missing' | 'far' | 'close' | 'cut';

// MediaPipe Pose indices.
const NOSE = 0;
const LEFT_SHOULDER = 11;
const RIGHT_SHOULDER = 12;

/** Below this a point is a guess, not something the camera sees. */
const MIN_VISIBILITY = 0.5;
/** Shoulder width as a fraction of the image width. Starting values: adjust them with real use. */
const FAR_SHOULDERS = 0.2;
const CLOSE_SHOULDERS = 0.62;
/** Vertical limits, as fractions of the image height: head inside the top, shoulders above the bottom. */
const HEAD_TOP = 0.03;
const SHOULDERS_BOTTOM = 0.9;

/**
 * The practice needs the person from the torso up. Returns what stops that, or `null` when the picture is fine.
 */
export function checkFraming(pose: PoseLandmark[] | null): FramingIssue | null {
  if (!pose) return 'missing';
  const nose = pose[NOSE];
  const left = pose[LEFT_SHOULDER];
  const right = pose[RIGHT_SHOULDER];
  if (!nose || !left || !right) return 'missing';
  if (left[3] < MIN_VISIBILITY || right[3] < MIN_VISIBILITY) return 'missing';

  const shoulders = Math.abs(left[0] - right[0]);
  if (shoulders < FAR_SHOULDERS) return 'far';
  if (shoulders > CLOSE_SHOULDERS) return 'close';

  const shouldersY = (left[1] + right[1]) / 2;
  const outsideSides = Math.min(left[0], right[0]) < 0 || Math.max(left[0], right[0]) > 1;
  if (nose[1] < HEAD_TOP || shouldersY > SHOULDERS_BOTTOM || outsideSides) return 'cut';
  return null;
}

/**
 * Which of the person's hands MediaPipe detected. Its label describes the hand as it looks in an ordinary
 * picture (checked against this model with photos of known hands), so in the mirrored picture the front
 * camera gives, a hand it calls "Left" is the person's right one.
 */
export function handOf(hand: DetectedHand, frame: Pick<LandmarksEvent, 'mirrored'>): Hand | null {
  const label = hand.handedness.label.toLowerCase();
  if (label !== 'left' && label !== 'right') return null;
  if (!frame.mirrored) return label;
  return label === 'left' ? 'right' : 'left';
}

/** How sure MediaPipe must be of the hand before a frame is held back for being the other one. */
const MIN_HAND_SCORE = 0.7;

export type HandSelection = {
  /** The frame with only the hands that should be evaluated, or `null` when nothing should be sent. */
  frame: LandmarksEvent | null;
  /** The camera only sees the hand the person doesn't sign with. */
  otherHand: boolean;
};

/**
 * Decides which of the detected hands count. Signs made with both hands keep them all and ignore the chosen
 * hand. For the rest, only the chosen hand is evaluated: if it is in the picture the other one is left out,
 * and if only the other one is, the frame is held back so the person can be told to switch.
 */
export function selectHands(frame: LandmarksEvent, preferred: Hand | null, bothHands: boolean): HandSelection {
  if (bothHands) return { frame, otherHand: false };
  if (!preferred || frame.hands.length === 0) return { frame: { ...frame, hands: frame.hands.slice(0, 1) }, otherHand: false };

  const mine = frame.hands.find((hand) => handOf(hand, frame) === preferred);
  if (mine) return { frame: { ...frame, hands: [mine] }, otherHand: false };

  const clearlyOther = frame.hands.some((hand) => handOf(hand, frame) !== null && hand.handedness.score >= MIN_HAND_SCORE);
  if (clearlyOther) return { frame: null, otherHand: true };
  // MediaPipe isn't sure which hand it is: give it the benefit of the doubt.
  return { frame: { ...frame, hands: frame.hands.slice(0, 1) }, otherHand: false };
}

/**
 * Keeps a condition from flickering: it turns on only after holding for `onMs`, and off after being gone for
 * `offMs`. Feed it every frame.
 */
export class Settled<T> {
  private shown: T | null = null;
  private candidate: T | null = null;
  private since = 0;

  constructor(
    private readonly onMs: number,
    private readonly offMs: number,
  ) {}

  update(value: T | null, now: number): T | null {
    if (value !== this.candidate) {
      this.candidate = value;
      this.since = now;
    }
    if (this.candidate !== this.shown && now - this.since >= (this.candidate === null ? this.offMs : this.onMs)) {
      this.shown = this.candidate;
    }
    return this.shown;
  }
}
