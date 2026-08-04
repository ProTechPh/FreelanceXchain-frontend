import { API_URL } from './api';
import type { Notification } from '@/types';

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 8000];

/**
 * Subscribes to the backend's real-time notification stream (`GET /notifications/stream`).
 *
 * That endpoint only accepts a normal `Authorization: Bearer` header (no query-token
 * fallback), and native `EventSource` can't set custom headers — putting the JWT in the
 * URL instead would leak it into proxy/access logs and browser history. So this reads
 * the stream via `fetch` + a manual `ReadableStream` reader instead.
 */
export function subscribeToNotificationStream(
  onNotification: (notification: Notification) => void,
  onError?: (error: unknown) => void
): () => void {
  let closed = false;
  let controller: AbortController | null = null;
  let attempt = 0;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  function handleFrame(frame: string) {
    for (const line of frame.split('\n')) {
      if (!line || line.startsWith(':')) continue; // heartbeat comment line
      if (!line.startsWith('data:')) continue;

      try {
        const parsed = JSON.parse(line.slice(5).trim());
        if (parsed && parsed.type === 'connected') continue; // initial handshake frame
        onNotification(parsed as Notification);
      } catch {
        // malformed frame, ignore
      }
    }
  }

  function scheduleReconnect() {
    if (closed) return;
    const delay = RECONNECT_DELAYS_MS[Math.min(attempt, RECONNECT_DELAYS_MS.length - 1)];
    attempt += 1;
    reconnectTimer = setTimeout(connect, delay);
  }

  async function connect() {
    if (closed) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    controller = new AbortController();

    try {
      const response = await fetch(`${API_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });

      if (response.status === 401) {
        // Don't redirect from here — the axios interceptor already owns 401 handling
        // on the next regular API call. Just stop trying to reconnect.
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed with status ${response.status}`);
      }

      attempt = 0; // connected successfully, reset backoff
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (!closed) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          handleFrame(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (closed) return;
      onError?.(error);
    } finally {
      if (!closed) scheduleReconnect();
    }
  }

  connect();

  return () => {
    closed = true;
    controller?.abort();
    if (reconnectTimer) clearTimeout(reconnectTimer);
  };
}
