/**
 * Types for the mecabite-back integration contract, protocol 0.2.0 (MVP).
 * Keep field names in snake_case: they are sent/received as-is.
 */

export const PROTOCOL_VERSION = '0.2.0';

export type ComponentName = 'configuration' | 'orientation' | 'localization' | 'movement';

// ─── REST ────────────────────────────────────────────────────────────────────

export type HealthResponse = { status: 'ok' | string; environment: string };

export type CatalogLevel = {
  level: 1 | 2 | 3;
  name: string;
  required_components: ComponentName[];
};

export type CatalogSign = {
  id: string;
  display_name: string;
  level: 1 | 2 | 3;
  type: 'static' | 'dynamic';
  required_components: ComponentName[];
  hold_time_ms: number | null;
  max_duration_ms: number | null;
  reference_asset: string | null;
  components: Record<ComponentName, string | null>;
  validated: boolean;
};

export type CatalogResponse = {
  catalog_version: string;
  levels: CatalogLevel[];
  signs: CatalogSign[];
};

export type SessionMode = 'practice' | 'demo';

export type CreateSessionRequest = {
  mode: SessionMode;
  target_sign: string | null;
  participant_id: string;
  device_id: string;
  client_version: string;
  calibration_id: null;
  record: boolean;
};

export type CreateSessionResponse = {
  session_id: string;
  mode: SessionMode;
  target_sign: string | null;
  level: 1 | 2 | 3 | null;
  status: 'created' | string;
  websocket_path: string;
  expires_in_seconds: number;
  protocol_version: string;
  catalog_version: string;
  model_version: string;
};

export type ApiErrorCode =
  | 'INVALID_REQUEST'
  | 'SIGN_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_NOT_READY'
  | 'INVALID_OBSERVATION'
  | 'PROTOCOL_VERSION_UNSUPPORTED'
  | 'INFERENCE_ERROR'
  /** The backend has no trained vision model (`vision train`). */
  | 'MODEL_NOT_AVAILABLE'
  /** The sign is in the catalog but the model has no data for it yet. */
  | 'SIGN_NOT_TRAINED';

export type ApiErrorBody = {
  error: { code: ApiErrorCode | string; message: string; details?: Record<string, unknown> };
};

// ─── WebSocket: app → backend ────────────────────────────────────────────────

/** [x, y, z] normalized to the portrait image, rounded to 5 decimals. */
export type Landmark = [number, number, number];

export type ObservationHand = {
  landmarks: Landmark[];
  handedness: { label: 'Left' | 'Right' | string; score: number };
};

export type ObservationMessage = {
  type: 'observation';
  sequence: number;
  timestamp_ms: number;
  vision: {
    image_width: number;
    image_height: number;
    mirrored: boolean;
    hands: ObservationHand[];
    /**
     * 33 × [x, y, z, visibility], sent in every level: the backend uses it to check the person
     * faces the camera with face and shoulders visible. `null` only when no body is detected.
     */
    pose_landmarks: [number, number, number, number][] | null;
  };
  /** Reserved until the glove exists. */
  glove: null;
};

export type EndSessionMessage = { type: 'end_session'; reason: 'user_finished' | string };

export type ClientMessage = ObservationMessage | EndSessionMessage;

// ─── WebSocket: backend → app ────────────────────────────────────────────────

export type ReadyMessage = {
  type: 'ready';
  session_id: string;
  protocol_version: string;
  model_version: string;
  min_sample_rate_hz: number;
  required_inputs: ('hand' | 'pose' | 'glove')[];
  server_timestamp_ms: number;
};

export type FeedbackState =
  | 'waiting'
  | 'candidate'
  | 'confirmed'
  | 'approved'
  | 'rejected'
  | 'no_hand'
  | 'disconnected';

export type ComponentStatus = 'correct' | 'incorrect' | 'not_required' | 'not_available' | 'insufficient_data';

export type FeedbackCode =
  | 'show_hand'
  | 'hold_position'
  | 'correct'
  | 'approved'
  | 'wrong_configuration'
  | 'wrong_orientation'
  | 'wrong_movement'
  | 'wrong_localization'
  | 'too_slow'
  /** A two-handed sign (gracias, por favor) done with one hand. */
  | 'use_both_hands'
  /** Face and shoulders must be visible, facing the camera; `message` says what to fix. */
  | 'adjust_framing';

export type GloveFinger = 'pulgar' | 'indice' | 'medio' | 'anular' | 'menique';

/**
 * A concrete fix, e.g. "Estira más el dedo anular". Ordered by priority; the backend sends
 * at most two and only once they have held for ~0.4 s, so they can be shown as-is.
 */
export type Correction = {
  component: ComponentName;
  /** A finger (GloveFinger), 'hand', 'palm', 'fingers', 'wrist' or 'arm'. */
  part: GloveFinger | 'hand' | 'palm' | 'fingers' | 'wrist' | 'arm' | string;
  /** extend | flex | curve | open | rotate_facing | rotate_side | point_up | point_down | tilt_up | tilt_down | roll_left | roll_right | raise */
  action: string;
  message: string;
  source: 'glove' | 'camera';
};

/** What the glove reads now (1 = bent, 2 = half, 3 = stretched; tilt in degrees). */
export type GloveStatus = {
  connected: boolean;
  fingers?: Record<GloveFinger, number>;
  roll?: number;
  pitch?: number;
};

export type FeedbackMessage = {
  type: 'feedback';
  sequence: number;
  timestamp_ms: number;
  state: FeedbackState;
  target_sign: string | null;
  predicted_sign: string | null;
  confidence: number | null;
  progress: number | null;
  correct: boolean | null;
  approved: boolean | null;
  consecutive_correct: number | null;
  components: Record<ComponentName, ComponentStatus>;
  feedback_code: FeedbackCode | null;
  message: string;
  /** Fixes to show under the title (empty when nothing to fix). Optional for older servers. */
  corrections?: Correction[];
  glove?: GloveStatus;
  processing_time_ms: number;
};

export type SessionSummaryMessage = {
  type: 'session_summary';
  session_id: string;
  target_sign: string | null;
  attempts: number;
  correct_attempts: number;
  approved: boolean;
  average_processing_time_ms: number;
};

export type ErrorMessage = {
  type: 'error';
  sequence?: number;
  code: ApiErrorCode | string;
  message: string;
};

export type ServerMessage = ReadyMessage | FeedbackMessage | SessionSummaryMessage | ErrorMessage;
