import { io } from 'socket.io-client';

let socket;

export function getSocket() {
  if (!socket) {
    // IMPORTANT: same host as API; NO /api here
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8080')
      .replace(/\/$/, '');

    socket = io(base, {
      path: '/socket.io',
      transports: ['websocket'],
      withCredentials: false,
    });
  }
  return socket;
}
