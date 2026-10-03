import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ConfigError, loadConfig } from '../src/config/env.js';
import {
  INVITATION_CODE_PATTERN,
  generateInvitationCode,
  normalizeInvitationCode,
} from '../src/modules/households/invitationCode.js';
import { signAccessToken, verifyAccessToken } from '../src/services/tokenService.js';
import { languageFromAcceptLanguage } from '../src/utils/language.js';
import { isValidPassword } from '../src/utils/validation.js';

const SECRET = 'a'.repeat(32);

describe('password rules (FR-ACC-01)', () => {
  it('accepts at least 8 characters with a letter and a digit', () => {
    assert.equal(isValidPassword('abcdefg1'), true);
    assert.equal(isValidPassword('éléphant7'), true);
  });

  it('rejects short passwords, missing letters or missing digits', () => {
    assert.equal(isValidPassword('abc1'), false);
    assert.equal(isValidPassword('12345678'), false);
    assert.equal(isValidPassword('abcdefgh'), false);
  });

  it('rejects passwords longer than the 72 bytes bcrypt uses', () => {
    assert.equal(isValidPassword(`a1${'x'.repeat(71)}`), false);
  });
});

describe('invitation codes (SDD 6.1)', () => {
  it('generates 8 characters without ambiguous characters', () => {
    for (let index = 0; index < 500; index += 1) {
      const code = generateInvitationCode();
      assert.match(code, INVITATION_CODE_PATTERN);
      assert.doesNotMatch(code, /[O0I1]/);
    }
  });

  it('normalises typed codes', () => {
    assert.equal(normalizeInvitationCode(' abcd-ef 23 '), 'ABCDEF23');
  });
});

describe('default language (FR-ACC-16)', () => {
  it('is French when the browser language starts with fr, English otherwise', () => {
    assert.equal(languageFromAcceptLanguage('fr-FR,fr;q=0.9,en;q=0.8'), 'fr');
    assert.equal(languageFromAcceptLanguage('en-GB,en;q=0.9,fr;q=0.8'), 'en');
    assert.equal(languageFromAcceptLanguage('de-DE,fr;q=0.5'), 'en');
    assert.equal(languageFromAcceptLanguage(undefined), 'en');
  });
});

describe('access tokens (NFR-SEC-02)', () => {
  it('round-trips the user id only', () => {
    const userId = '65f1c2a4b7e8d9f0a1b2c3d4';
    const token = signAccessToken(userId, { secret: SECRET, expiresIn: '24h' });
    const [, payload] = token.split('.');
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    assert.deepEqual(Object.keys(claims).sort(), ['exp', 'iat', 'sub']);
    assert.equal(claims.exp - claims.iat, 24 * 60 * 60);
    assert.deepEqual(verifyAccessToken(token, { secret: SECRET }), { userId });
  });

  it('rejects tokens signed with another secret or expired', () => {
    const userId = '65f1c2a4b7e8d9f0a1b2c3d4';
    const forged = signAccessToken(userId, { secret: 'b'.repeat(32), expiresIn: '24h' });
    assert.throws(() => verifyAccessToken(forged, { secret: SECRET }), { details: { reason: 'TOKEN_INVALID' } });

    const expired = signAccessToken(userId, { secret: SECRET, expiresIn: '-1s' });
    assert.throws(() => verifyAccessToken(expired, { secret: SECRET }), { details: { reason: 'TOKEN_EXPIRED' } });
  });
});

describe('configuration', () => {
  it('lists every missing required variable', () => {
    assert.throws(
      () => loadConfig({ NODE_ENV: 'production' }),
      (error) =>
        error instanceof ConfigError &&
        error.problems.some((problem) => problem.startsWith('MONGODB_URI')) &&
        error.problems.some((problem) => problem.startsWith('JWT_SECRET')) &&
        error.problems.some((problem) => problem.startsWith('FRONTEND_ORIGIN')),
    );
  });

  it('rejects a short JWT secret', () => {
    assert.throws(
      () => loadConfig({ MONGODB_URI: 'mongodb://localhost/x', JWT_SECRET: 'short' }),
      ConfigError,
    );
  });

  it('applies the SDD defaults', () => {
    const config = loadConfig({ MONGODB_URI: 'mongodb://localhost/x', JWT_SECRET: SECRET });
    assert.equal(config.jwt.expiresIn, '24h');
    assert.equal(config.smtp.configured, false);
    assert.equal(config.frontendOrigin, 'http://localhost:5173');
  });
});
