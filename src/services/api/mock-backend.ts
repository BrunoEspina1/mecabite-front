/**
 * In-app simulated backend that speaks protocol 0.2.0 while `POST /sessions` and the
 * WebSocket don't exist yet. It does NOT recognize signs: any visible hand counts as
 * correct, so the whole UI flow (hold → confirmed ×3 → approved) can be tested.
 */

import type { SessionTransport, TransportEvents } from '@/services/api/session-transport';
import type {
  ClientMessage,
  ComponentName,
  ComponentStatus,
  CreateSessionRequest,
  CreateSessionResponse,
  FeedbackMessage,
  ObservationMessage,
} from '@/services/api/types';
import { PROTOCOL_VERSION } from '@/services/api/types';

export type MockSign = {
  id: string;
  level: 1 | 2 | 3;
  type: 'static' | 'dynamic';
  holdTimeMs: number | null;
  maxDurationMs: number | null;
};

const REQUIRED: Record<1 | 2 | 3, ComponentName[]> = {
  1: ['configuration', 'orientation'],
  2: ['configuration', 'orientation', 'movement'],
  3: ['configuration', 'orientation', 'localization', 'movement'],
};
const APPROVE_AFTER = 3;
/** Simulated time a dynamic sign takes to be "performed". */
const DYNAMIC_DURATION_MS = 1500;
/** After a confirmed execution the hand must leave or rest this long before the next one. */
const COOLDOWN_MS = 800;

export function createMockSession(request: CreateSessionRequest, sign: MockSign): CreateSessionResponse {
  const id = `mock_${Date.now().toString(36)}`;
  return {
    session_id: id,
    mode: request.mode,
    target_sign: request.target_sign,
    level: sign.level,
    status: 'created',
    websocket_path: `/api/v1/ws/sessions/${id}`,
    expires_in_seconds: 900,
    protocol_version: PROTOCOL_VERSION,
    catalog_version: 'mock',
    model_version: 'mock',
  };
}

export class MockTransport implements SessionTransport {
  private startedAt: number | null = null;
  private cooldownUntil = 0;
  private attempts = 0;
  private correctAttempts = 0;
  private consecutive = 0;
  private processingTimes: number[] = [];
  private closed = false;
  private timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(
    readonly session: CreateSessionResponse,
    private readonly sign: MockSign,
    private readonly events: TransportEvents,
  ) {
    events.onStatus('connecting');
    this.later(250, () => {
      events.onStatus('open');
      events.onMessage({
        type: 'ready',
        session_id: session.session_id,
        protocol_version: PROTOCOL_VERSION,
        model_version: 'mock',
        min_sample_rate_hz: 15,
        required_inputs: ['hand', 'pose'],
        server_timestamp_ms: 0,
      });
    });
  }

  private later(ms: number, fn: () => void) {
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.closed) fn();
    }, ms);
    this.timers.add(timer);
  }

  send(message: ClientMessage): boolean {
    if (this.closed) return false;
    if (message.type === 'end_session') {
      this.later(50, () => {
        this.events.onMessage({
          type: 'session_summary',
          session_id: this.session.session_id,
          target_sign: this.session.target_sign,
          attempts: this.attempts,
          correct_attempts: this.correctAttempts,
          approved: this.consecutive >= APPROVE_AFTER,
          average_processing_time_ms: Math.round(
            this.processingTimes.reduce((a, b) => a + b, 0) / Math.max(1, this.processingTimes.length),
          ),
        });
        this.close();
      });
      return true;
    }
    const processing = 10 + Math.round(Math.random() * 15);
    this.processingTimes.push(processing);
    const feedback = this.evaluate(message, processing);
    // Simulated network + inference latency.
    this.later(processing + 15, () => this.events.onMessage(feedback));
    return true;
  }

  private evaluate(obs: ObservationMessage, processing: number): FeedbackMessage {
    const hasHand = obs.vision.hands.length > 0;
    const t = obs.timestamp_ms;
    const required = REQUIRED[this.sign.level];
    const components = (status: ComponentStatus) =>
      Object.fromEntries(
        (['configuration', 'orientation', 'localization', 'movement'] as const).map((c) => [
          c,
          required.includes(c) ? status : 'not_required',
        ]),
      ) as FeedbackMessage['components'];

    const base = {
      type: 'feedback' as const,
      sequence: obs.sequence,
      timestamp_ms: t,
      target_sign: this.session.target_sign,
      processing_time_ms: processing,
      correct: null,
      approved: this.consecutive >= APPROVE_AFTER,
      consecutive_correct: this.consecutive,
    };

    if (this.consecutive >= APPROVE_AFTER) {
      return {
        ...base,
        state: 'approved',
        predicted_sign: this.session.target_sign,
        confidence: 0.95,
        progress: 1,
        correct: true,
        components: components('correct'),
        feedback_code: 'approved',
        message: '¡Seña aprobada!',
      };
    }

    if (!hasHand) {
      this.startedAt = null;
      this.cooldownUntil = 0;
      return {
        ...base,
        state: 'no_hand',
        predicted_sign: null,
        confidence: null,
        progress: this.sign.type === 'static' ? 0 : null,
        components: components('insufficient_data'),
        feedback_code: 'show_hand',
        message: 'Muestra tu mano a la cámara',
      };
    }

    if (t < this.cooldownUntil) {
      return {
        ...base,
        state: 'confirmed',
        predicted_sign: this.session.target_sign,
        confidence: 0.94,
        progress: this.sign.type === 'static' ? 1 : null,
        correct: true,
        components: components('correct'),
        feedback_code: 'correct',
        message: `¡Bien! ${this.consecutive} de ${APPROVE_AFTER}`,
      };
    }

    this.startedAt ??= t;
    const elapsed = t - this.startedAt;
    const duration = this.sign.type === 'static' ? (this.sign.holdTimeMs ?? 1000) : DYNAMIC_DURATION_MS;

    if (elapsed >= duration) {
      this.attempts += 1;
      this.correctAttempts += 1;
      this.consecutive += 1;
      this.startedAt = null;
      this.cooldownUntil = t + COOLDOWN_MS;
      const approved = this.consecutive >= APPROVE_AFTER;
      return {
        ...base,
        state: approved ? 'approved' : 'confirmed',
        predicted_sign: this.session.target_sign,
        confidence: 0.94,
        progress: this.sign.type === 'static' ? 1 : null,
        correct: true,
        approved,
        consecutive_correct: this.consecutive,
        components: components('correct'),
        feedback_code: approved ? 'approved' : 'correct',
        message: approved ? '¡Seña aprobada!' : `¡Bien! ${this.consecutive} de ${APPROVE_AFTER}`,
      };
    }

    return {
      ...base,
      state: 'candidate',
      predicted_sign: this.session.target_sign,
      confidence: 0.8,
      progress: this.sign.type === 'static' ? elapsed / duration : null,
      correct: true,
      components: components('correct'),
      feedback_code: 'hold_position',
      message: this.sign.type === 'static' ? 'Mantén la posición' : 'Realiza el movimiento',
    };
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.timers.forEach(clearTimeout);
    this.timers.clear();
    this.events.onStatus('closed');
  }
}
