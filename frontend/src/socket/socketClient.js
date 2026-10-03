import { io } from 'socket.io-client';
import { API_ORIGIN } from '../api/apiClient.js';

let socket = null;

/**
 * Opens the household's real-time connection, authenticated with the JWT (SDD 5).
 * `onUnauthorized` runs when the server refuses the token.
 */
function watchUnauthorized(onUnauthorized) {
  if (!socket || !onUnauthorized) return;
  socket.off('connect_error', socket.nestmatesUnauthorized);
  function handleError(error) {
    // The server rejects handshakes with an API error code; network losses keep retrying.
    if (socket && !socket.active && error.message === 'UNAUTHENTICATED') {
      onUnauthorized();
    }
  }
  socket.nestmatesUnauthorized = handleError;
  socket.on('connect_error', handleError);
}

export function connectSocket(token, { onUnauthorized } = {}) {
  if (!socket) {
    const options = { auth: { token } };
    socket = API_ORIGIN ? io(API_ORIGIN, options) : io(options);
  }
  watchUnauthorized(onUnauthorized);
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.removeAllListeners();
  socket.disconnect();
  socket = null;
}
