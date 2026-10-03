import nodemailer from 'nodemailer';
import { serviceUnavailable } from '../utils/AppError.js';
import logger, { serializeError } from '../utils/logger.js';

/**
 * SMTP mailer (Nodemailer). When SMTP is not configured, sending fails with a
 * SERVICE_UNAVAILABLE error instead of pretending an email was sent.
 */
export function createMailer(smtp) {
  if (!smtp.configured) {
    return {
      isConfigured: false,
      async send() {
        throw serviceUnavailable('EMAIL_NOT_CONFIGURED', 'Email delivery is not configured');
      },
      close() {},
    };
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    // SDD 3.1: SMTP over TLS. Port 465 uses implicit TLS, other ports must upgrade with STARTTLS.
    requireTLS: !smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password } : undefined,
  });

  return {
    isConfigured: true,
    async send({ to, subject, text, html }) {
      try {
        await transporter.sendMail({ from: smtp.from, to, subject, text, html });
      } catch (error) {
        logger.error('mail.delivery_failed', { error: serializeError(error) });
        throw serviceUnavailable('EMAIL_DELIVERY_FAILED', 'The email could not be sent');
      }
    },
    close() {
      transporter.close();
    },
  };
}
