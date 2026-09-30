import { getApiSettings, restUrl } from '@/services/api/settings';
import type {
  ApiErrorBody,
  CatalogResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  HealthResponse,
} from '@/services/api/types';

const TIMEOUT_MS = 5000;

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status?: number,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${restUrl(getApiSettings().baseUrl)}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...init?.headers },
      signal: controller.signal,
    });
  } catch {
    // iOS gives no clear error when local network access is denied.
    throw new ApiError(
      'No se pudo conectar con el servidor. Revisa la URL, que estés en la misma red Wi-Fi y el permiso de Red local.',
      'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeout);
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = (body as ApiErrorBody | null)?.error;
    throw new ApiError(
      error?.message ?? `Error ${response.status}`,
      error?.code ?? 'HTTP_ERROR',
      response.status,
      error?.details,
    );
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>('/health'),
  catalog: () => request<CatalogResponse>('/catalog/signs'),
  createSession: (payload: CreateSessionRequest) =>
    request<CreateSessionResponse>('/sessions', { method: 'POST', body: JSON.stringify(payload) }),
};
