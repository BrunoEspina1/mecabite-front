import { AppState, type AppStateStatus } from 'react-native';

import { getApiSettings, wsUrl } from '@/services/api/settings';
import type { ClientMessage, CreateSessionResponse, ServerMessage } from '@/services/api/types';

export type TransportStatus = 'connecting' | 'open' | 'reconnecting' | 'closed';

export type TransportEvents = {
  onMessage: (message: ServerMessage) => void;
  onStatus: (status: TransportStatus) => void;
  /** Fatal: the session is gone (e.g. close code 4404). */
  onFatal: (message: string) => void;
};

/** Shared interface for the real WebSocket and the in-app simulated backend. */
export interface SessionTransport {
  readonly session: CreateSessionResponse;
  /** Returns false when the channel is not open; the frame is dropped, never resent. */
  send(message: ClientMessage): boolean;
  close(): void;
}

const SESSION_NOT_FOUND_CODE = 4404;
const RECONNECT_DELAY_MS = 1000;

/**
 * WebSocket to `/api/v1/ws/sessions/{id}`. iOS suspends sockets in background:
 * when the app returns to foreground it reconnects to the SAME session.
 */
export class WebSocketTransport implements SessionTransport {
  private socket: WebSocket | null = null;
  private closedByUser = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSub: { remove: () => void };

  constructor(
    readonly session: CreateSessionResponse,
    private readonly events: TransportEvents,
  ) {
    this.appStateSub = AppState.addEventListener('change', this.handleAppState);
    this.connect('connecting');
  }

  private connect(status: TransportStatus) {
    this.events.onStatus(status);
    const socket = new WebSocket(wsUrl(getApiSettings().baseUrl, this.session.websocket_path));
    this.socket = socket;

    socket.onopen = () => this.events.onStatus('open');
    socket.onmessage = (event) => {
      try {
        this.events.onMessage(JSON.parse(String(event.data)) as ServerMessage);
      } catch {
        // Ignore malformed server messages.
      }
    };
    socket.onclose = (event) => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (this.closedByUser) {
        this.events.onStatus('closed');
      } else if (event.code === SESSION_NOT_FOUND_CODE) {
        this.events.onFatal('La sesión no existe o expiró.');
        this.events.onStatus('closed');
      } else if (AppState.currentState === 'active') {
        this.scheduleReconnect();
      } else {
        this.events.onStatus('reconnecting');
      }
    };
  }

  private scheduleReconnect() {
    if (this.retryTimer || this.closedByUser) return;
    this.events.onStatus('reconnecting');
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.closedByUser && !this.socket) this.connect('reconnecting');
    }, RECONNECT_DELAY_MS);
  }

  private handleAppState = (state: AppStateStatus) => {
    if (state === 'active' && !this.socket && !this.closedByUser) this.scheduleReconnect();
  };

  send(message: ClientMessage): boolean {
    if (this.socket?.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  close() {
    this.closedByUser = true;
    this.appStateSub.remove();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.close(1000, 'client_closed');
  }
}
