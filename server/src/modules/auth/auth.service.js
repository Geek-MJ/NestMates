import { createHash, randomBytes } from 'node:crypto';
import mongoose from 'mongoose';
import User from '../../models/User.js';
import { hashPassword, verifyAgainstNoAccount, verifyPassword } from '../../services/passwordService.js';
import { signAccessToken } from '../../services/tokenService.js';
import { badRequest, conflict, serviceUnavailable, unauthenticated } from '../../utils/AppError.js';
import { buildPasswordResetEmail } from './passwordResetEmail.js';

// FR-ACC-04: reset links are valid for 1 hour.
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function isDuplicateEmailError(error) {
  return error?.code === 11000 && Boolean(error.keyPattern?.email);
}

export function createAuthService({ config, mailer }) {
  const issueToken = (userId) => ({ token: signAccessToken(userId, config.jwt) });

  return {
    async register({ name, email, password, language }) {
      const passwordHash = await hashPassword(password);
      try {
        const user = await User.create({
          name,
          email,
          passwordHash,
          language,
          privacyAcceptedAt: new Date(),
        });
        return issueToken(user._id);
      } catch (error) {
        if (isDuplicateEmailError(error)) {
          throw conflict('EMAIL_TAKEN', 'An account already uses this email address');
        }
        throw error;
      }
    },

    async login({ email, password }) {
      const user = await User.findOne({ email }).select('+passwordHash');
      const valid = user
        ? await verifyPassword(password, user.passwordHash)
        : await verifyAgainstNoAccount(password);
      if (!valid) {
        throw unauthenticated('INVALID_CREDENTIALS', 'The email address or password is incorrect');
      }
      return issueToken(user._id);
    },

    /**
     * FR-ACC-04 / SDD 6.1: stores only the SHA-256 hash of a random 32-byte token and emails the
     * link. The outcome is the same whether or not the address is registered.
     */
    async requestPasswordReset({ email }) {
      if (!mailer.isConfigured) {
        throw serviceUnavailable('EMAIL_NOT_CONFIGURED', 'Email delivery is not configured');
      }

      const user = await User.findOne({ email });
      if (!user) return;

      const token = randomBytes(32).toString('base64url');
      user.resetTokenHash = hashResetToken(token);
      user.resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
      await user.save();

      const resetUrl = new URL('/reset-password', config.frontendOrigin);
      resetUrl.searchParams.set('token', token);

      await mailer.send({
        to: user.email,
        ...buildPasswordResetEmail({
          name: user.name,
          language: user.language,
          resetUrl: resetUrl.toString(),
        }),
      });
    },

    async resetPassword({ token, password }) {
      const passwordHash = await hashPassword(password);
      const user = await User.findOneAndUpdate(
        {
          resetTokenHash: hashResetToken(token),
          resetTokenExpiresAt: mongoose.trusted({ $gt: new Date() }),
        },
        { $set: { passwordHash, resetTokenHash: null, resetTokenExpiresAt: null } },
      );
      if (!user) {
        throw badRequest('INVALID_RESET_TOKEN', 'The reset link is invalid or has expired');
      }
    },
  };
}
