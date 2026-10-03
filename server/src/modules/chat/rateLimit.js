import AppError from '../../utils/AppError.js';

const hits = new Map();

/** At most 10 messages per user per 10 seconds (SDD 6.1). */
export function assertChatRateLimit(userId, now = Date.now()) {
  const recent = (hits.get(userId) ?? []).filter((timestamp) => now - timestamp < 10_000);
  if (recent.length >= 10) {
    hits.set(userId, recent);
    throw new AppError(429, 'RATE_LIMITED', 'Too many messages. Please wait a moment.', {
      reason: 'CHAT_RATE_LIMIT',
    });
  }
  recent.push(now);
  hits.set(userId, recent);
}

export function resetChatRateLimits() {
  hits.clear();
}
