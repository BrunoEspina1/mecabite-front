import { useEffect, useRef, useState } from 'react';

import type { Sena } from '@/data/senas';
import type { LandmarksEvent } from '@/modules/hand-landmarker';
import { api, ApiError } from '@/services/api/client';
import { createMockSession, MockTransport, type MockSign } from '@/services/api/mock-backend';
import { ObservationBuilder } from '@/services/api/observation';
import { WebSocketTransport, type SessionTransport, type TransportStatus } from '@/services/api/session-transport';
import { getApiSettings, getDeviceId } from '@/services/api/settings';
import type {
  CreateSessionRequest,
  FeedbackMessage,
  ServerMessage,
  SessionSummaryMessage,
} from '@/services/api/types';
import { PROTOCOL_VERSION } from '@/services/api/types';

export type SessionPhase = 'creating' | 'connecting' | 'ready' | 'ended' | 'error';

export type SessionStats = {
  /** Observations sent per second (contract: ≥ 15 Hz). */
  sendRateHz: number;
  /** Round trip of the latest feedback, measured on the phone (target < 500 ms). */
  rttMs: number | null;
  dropped: number;
};

// Until the catalog is fetched from the backend, derive sign rules from the local data.
function toMockSign(sena: Sena): MockSign {
  const level = Number(sena.nivel) as 1 | 2 | 3;
  const isStatic = level === 1;
  return {
    id: sena.id,
    level,
    type: isStatic ? 'static' : 'dynamic',
    holdTimeMs: isStatic ? 1000 : null,
    maxDurationMs: isStatic ? null : 3000,
  };
}

/**
 * Practice session against mecabite-back (protocol 0.2.0) or the in-app mock:
 * POST /sessions → WebSocket → ready → observation/feedback → end_session → summary.
 * One hook instance = one session: to start a new one, remount the component (change its `key`).
 */
export function usePracticeSession(sena: Sena | undefined, enabled: boolean) {
  const [phase, setPhase] = useState<SessionPhase>('creating');
  const [transportStatus, setTransportStatus] = useState<TransportStatus>('connecting');
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [summary, setSummary] = useState<SessionSummaryMessage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<SessionStats>({ sendRateHz: 0, rttMs: null, dropped: 0 });
  const [isMock] = useState(() => getApiSettings().useMock);

  const transport = useRef<SessionTransport | null>(null);
  const builder = useRef<ObservationBuilder>(null);
  const ready = useRef(false);
  const sentAt = useRef(new Map<number, number>());
  const counters = useRef({ sent: 0, dropped: 0, windowStart: 0 });
  const lastFeedbackSeq = useRef(-1);

  useEffect(() => {
    if (!sena || !enabled) return;
    let cancelled = false;
    const settings = getApiSettings();
    const sign = toMockSign(sena);
    builder.current = new ObservationBuilder();
    counters.current.windowStart = Date.now();

    const handleMessage = (message: ServerMessage) => {
      switch (message.type) {
        case 'ready':
          ready.current = true;
          setPhase('ready');
          break;
        case 'feedback': {
          // The backend may skip old observations; ignore anything older than what we have.
          if (message.sequence <= lastFeedbackSeq.current) break;
          lastFeedbackSeq.current = message.sequence;
          const sent = sentAt.current.get(message.sequence);
          for (const seq of sentAt.current.keys()) if (seq <= message.sequence) sentAt.current.delete(seq);
          if (sent !== undefined) setStats((s) => ({ ...s, rttMs: Date.now() - sent }));
          setFeedback(message);
          break;
        }
        case 'session_summary':
          setSummary(message);
          setPhase('ended');
          break;
        case 'error':
          // Recoverable: the connection stays open.
          setError(`${message.code}: ${message.message}`);
          break;
      }
    };

    const events = {
      onMessage: (m: ServerMessage) => !cancelled && handleMessage(m),
      onStatus: (s: TransportStatus) => !cancelled && setTransportStatus(s),
      onFatal: (message: string) => {
        if (cancelled) return;
        setError(message);
        setPhase('error');
      },
    };

    const request: CreateSessionRequest = {
      mode: 'practice',
      target_sign: sena.id,
      participant_id: settings.participantId,
      device_id: getDeviceId(),
      client_version: PROTOCOL_VERSION,
      calibration_id: null,
      record: settings.record,
    };

    (async () => {
      try {
        if (settings.useMock) {
          transport.current = new MockTransport(createMockSession(request, sign), sign, events);
        } else {
          const session = await api.createSession(request);
          if (cancelled) return;
          transport.current = new WebSocketTransport(session, events);
        }
        setPhase((p) => (p === 'creating' ? 'connecting' : p));
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof ApiError ? e.message : 'No se pudo crear la sesión.');
        setPhase('error');
      }
    })();

    const rateTimer = setInterval(() => {
      const c = counters.current;
      const seconds = (Date.now() - c.windowStart) / 1000;
      setStats((s) => ({ ...s, sendRateHz: Math.round(c.sent / seconds), dropped: c.dropped }));
      c.sent = 0;
      c.windowStart = Date.now();
    }, 1000);

    return () => {
      cancelled = true;
      clearInterval(rateTimer);
      const t = transport.current;
      transport.current = null;
      if (t) {
        t.send({ type: 'end_session', reason: 'user_finished' });
        // Give the end_session message a moment to leave before closing.
        setTimeout(() => t.close(), 300);
      }
    };
  }, [sena, enabled]);

  /** Call for every MediaPipe frame, including frames without hands. */
  const sendFrame = (frame: LandmarksEvent) => {
    const t = transport.current;
    if (!t || !ready.current || !builder.current) return;
    const observation = builder.current.build(frame);
    if (t.send(observation)) {
      sentAt.current.set(observation.sequence, Date.now());
      counters.current.sent += 1;
    } else {
      counters.current.dropped += 1;
    }
  };

  const endSession = () => {
    transport.current?.send({ type: 'end_session', reason: 'user_finished' });
  };

  return { phase, transportStatus, feedback, summary, error, stats, isMock, sendFrame, endSession };
}
