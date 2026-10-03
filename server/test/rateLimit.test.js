import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { closeDatabase, createTestConfig, startTestServer } from './helpers.js';

describe('rate limiting of authentication routes', () => {
  let server;

  before(async () => {
    server = await startTestServer({ config: createTestConfig({ AUTH_RATE_LIMIT_MAX: '3' }) });
  });

  after(async () => {
    await server.close();
    await closeDatabase();
  });

  it('answers 429 RATE_LIMITED once the limit is reached', async () => {
    const attempt = () =>
      server.request('POST', '/auth/login', {
        body: { email: 'nobody@example.test', password: 'wrong password 1' },
      });

    for (let index = 0; index < 3; index += 1) {
      assert.equal((await attempt()).status, 401);
    }
    const limited = await attempt();
    assert.equal(limited.status, 429);
    assert.equal(limited.body.error.code, 'RATE_LIMITED');
    assert.ok(limited.headers.get('ratelimit-policy'));
  });

  it('does not limit the rest of the API', async () => {
    const response = await server.request('GET', '/health');
    assert.equal(response.status, 200);
  });
});
