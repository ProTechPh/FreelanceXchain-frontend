import { API_URL } from './api';
import type { Notification } from '@/types';

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 8000];

type Listener = {
  onNotification: (notification: Notification) => void;
  onError?: (error: unknown) => void;
};

class NotificationStreamManager {
  private listeners = new Set<Listener>();
  private controller: AbortController | null = null;
  private isConnecting = false;
  private isConnected = false;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  private handleFrame(frame: string) {
    for (const line of frame.split('\n')) {
      if (!line || line.startsWith(':')) continue; // heartbeat comment line
      if (!line.startsWith('data:')) continue;

      try {
        const parsed = JSON.parse(line.slice(5).trim());
        if (parsed && parsed.type === 'connected') continue; // initial handshake frame
        for (const listener of this.listeners) {
          try {
            listener.onNotification(parsed as Notification);
          } catch {
            // ignore listener errors
          }
        }
      } catch {
        // malformed frame, ignore
      }
    }
  }

  private scheduleReconnect() {
    if (this.listeners.size === 0) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = RECONNECT_DELAYS_MS[Math.min(this.attempt, RECONNECT_DELAYS_MS.length - 1)];
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private async connect() {
    if (this.isConnecting || this.isConnected || this.listeners.size === 0) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) return;

    this.isConnecting = true;
    this.controller = new AbortController();

    try {
      const response = await fetch(`${API_URL}/notifications/stream`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: this.controller.signal,
      });

      if (response.status === 401) {
        this.isConnecting = false;
        this.isConnected = false;
        return;
      }

      if (!response.ok || !response.body) {
        throw new Error(`SSE connection failed with status ${response.status}`);
      }

      this.isConnecting = false;
      this.isConnected = true;
      this.attempt = 0;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (this.listeners.size > 0) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let boundary = buffer.indexOf('\n\n');
        while (boundary !== -1) {
          this.handleFrame(buffer.slice(0, boundary));
          buffer = buffer.slice(boundary + 2);
          boundary = buffer.indexOf('\n\n');
        }
      }
    } catch (error) {
      if (this.listeners.size === 0) return;
      for (const listener of this.listeners) {
        listener.onError?.(error);
      }
    } finally {
      this.isConnecting = false;
      this.isConnected = false;
      if (this.listeners.size > 0) {
        this.scheduleReconnect();
      }
    }
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.controller) {
      this.controller.abort();
      this.controller = null;
    }
    this.isConnecting = false;
    this.isConnected = false;
    this.attempt = 0;
  }

  subscribe(
    onNotification: (notification: Notification) => void,
    onError?: (error: unknown) => void
  ): () => void {
    const listener: Listener = { onNotification, onError };
    this.listeners.add(listener);

    if (this.disconnectTimer) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
    }

    if (!this.isConnected && !this.isConnecting) {
      void this.connect();
    }

    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.disconnectTimer = setTimeout(() => {
          if (this.listeners.size === 0) {
            this.disconnect();
          }
        }, 1000);
      }
    };
  }
}

const sharedStreamManager = new NotificationStreamManager();

/**
 * Subscribes to the backend's real-time notification stream (`GET /notifications/stream`).
 *
 * Uses a single shared HTTP connection across all subscribing components to avoid
 * saturating the browser's HTTP/1.1 connection limit (max 6 connections per origin).
 */
export function subscribeToNotificationStream(
  onNotification: (notification: Notification) => void,
  onError?: (error: unknown) => void
): () => void {
  return sharedStreamManager.subscribe(onNotification, onError);
}

