/**
 * WebSocket store — connects to the backend twin stream and exposes the
 * latest snapshot to all components via a simple pub/sub pattern.
 *
 * Usage:
 *   import { subscribe, getSnapshot, connect } from "../store/useTwinStore";
 *   useEffect(() => subscribe(setState), []);
 */

const WS_URL =
  import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws/twin";

let socket = null;
let snapshot = null;
let listeners = new Set();
let reconnectTimer = null;

export function getSnapshot() {
  return snapshot;
}

export function subscribe(listener) {
  listeners.add(listener);
  // Immediately fire with current state if available.
  if (snapshot) listener(snapshot);
  return () => listeners.delete(listener);
}

function notify() {
  for (const fn of listeners) {
    try {
      fn(snapshot);
    } catch (_) {
      /* swallow */
    }
  }
}

export function connect() {
  if (socket && socket.readyState <= 1) return; // already open/connecting

  socket = new WebSocket(WS_URL);

  socket.onopen = () => {
    console.info("[UrbanMine] WebSocket connected");
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "ping") return; // heartbeat
      snapshot = data;
      notify();
    } catch (_) {
      /* ignore malformed frames */
    }
  };

  socket.onclose = () => {
    console.warn("[UrbanMine] WebSocket closed, reconnecting in 2s…");
    scheduleReconnect();
  };

  socket.onerror = () => {
    socket?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, 2000);
}

export function disconnect() {
  if (socket) {
    socket.close();
    socket = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
