let activeServer = null;

export function bindSocketServer(io) {
  activeServer = io;
}

/** Removes a member from their household room by closing their sockets (SDD 3.2). */
export function disconnectUser(userId) {
  if (!activeServer) return;
  for (const socket of activeServer.of('/').sockets.values()) {
    if (String(socket.data.userId) === String(userId)) socket.disconnect(true);
  }
}
