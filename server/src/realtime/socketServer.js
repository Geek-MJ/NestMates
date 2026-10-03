import { Server } from 'socket.io';
import User from '../models/User.js';
import { sendMessage } from '../modules/chat/chat.service.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { createTranslationService } from '../services/translationService.js';
import AppError from '../utils/AppError.js';
import logger, { serializeError } from '../utils/logger.js';
import { bindSocketServer } from './presence.js';

export function householdRoom(householdId) {
  return `household:${householdId}`;
}

function ackError(error) {
  const appError =
    error instanceof AppError
      ? error
      : new AppError(500, 'INTERNAL_ERROR', 'An unexpected error occurred');
  return appError.toJSON().error;
}

/**
 * Socket.IO server (SDD 5, NFR-SEC-06). The JWT is sent as `auth: { token }`.
 * The socket joins only `household:{id}` for the user's current household.
 */
export function createSocketServer(httpServer, { config, translation = createTranslationService() }) {
  const io = new Server(httpServer, {
    cors: { origin: config.frontendOrigin },
    serveClient: false,
  });
  bindSocketServer(io);

  io.use(async (socket, next) => {
    try {
      const { userId } = verifyAccessToken(socket.handshake.auth?.token, config.jwt);
      const user = await User.findById(userId).select('name householdId').lean();
      if (!user) {
        next(new Error('UNAUTHENTICATED'));
        return;
      }
      if (!user.householdId) {
        next(new Error('FORBIDDEN'));
        return;
      }
      socket.data.userId = String(userId);
      socket.data.householdId = String(user.householdId);
      socket.data.name = user.name;
      next();
    } catch (error) {
      if (error instanceof AppError) {
        next(new Error(error.code));
        return;
      }
      logger.error('socket.handshake_failed', { error: serializeError(error) });
      next(new Error('INTERNAL_ERROR'));
    }
  });

  io.on('connection', (socket) => {
    const room = householdRoom(socket.data.householdId);
    socket.join(room);

    let lastTypingAt = 0;
    socket.on('chat:typing', () => {
      const now = Date.now();
      if (now - lastTypingAt < 2000) return;
      lastTypingAt = now;
      socket.to(room).emit('chat:typing', {
        userId: socket.data.userId,
        name: socket.data.name,
      });
    });

    socket.on('chat:send', async (payload, ack) => {
      const reply = typeof ack === 'function' ? ack : () => {};
      try {
        const message = await sendMessage({
          householdId: socket.data.householdId,
          userId: socket.data.userId,
          body: payload,
          translation,
        });
        io.to(room).emit('chat:message', { message });
        reply({ message });
      } catch (error) {
        if (!(error instanceof AppError)) {
          logger.error('chat.send_failed', { error: serializeError(error) });
        }
        const body = ackError(error);
        reply({ error: body });
        if (body.code === 'FORBIDDEN') socket.disconnect(true);
      }
    });
  });

  return io;
}
