import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";
import { getToken } from "../utils/auth";

// Socket.IO lives on the API origin (strip the trailing /api).
const SOCKET_URL = API_BASE_URL.replace(/\/api$/, "");

let socket = null;
let socketToken = null;

/** Returns the shared authenticated socket, creating/reconnecting it when the token changes. */
export const getSocket = () => {
  const token = getToken();
  if (!token) return null;

  if (socket && socketToken === token) return socket;

  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }

  socketToken = token;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 8000,
  });

  socket.on("connect_error", (err) => {
    if (import.meta.env.DEV) console.warn("[socket] connect_error:", err.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
  }
  socket = null;
  socketToken = null;
};

// Drop the connection on logout / token change.
window.addEventListener("jobsaathi:auth", () => {
  if (!getToken()) disconnectSocket();
});

/**
 * Subscribe to a socket event for the lifetime of a component.
 * Returns an unsubscribe function; safe to call when logged out.
 */
export const onSocket = (event, handler) => {
  const s = getSocket();
  if (!s) return () => {};
  s.on(event, handler);
  return () => s.off(event, handler);
};
