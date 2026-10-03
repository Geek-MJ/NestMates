import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { closeDatabase, startTestServer } from './helpers.js';

describe('application foundation', () => {
  let server;

  before(async () => {
    server = await startTestServer();
  });

  after(async () => {
    await server.close();
    await closeDatabase();
  });

  it('GET /api/health reports the real database state', async () => {
    const response = await server.request('GET', '/health');
    assert.equal(response.status, 200);
    assert.equal(response.body.status, 'ok');
    assert.equal(response.body.database, 'connected');
    assert.equal(typeof response.body.uptimeSeconds, 'number');
  });

  it('returns a request id and security headers', async () => {
    const response = await server.request('GET', '/health');
    assert.match(response.headers.get('x-request-id'), /^[\w.-]+$/);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-powered-by'), null);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.get('etag'), null);
  });

  it('allows CORS only for the frontend origin', async () => {
    const allowed = await server.request('GET', '/health', {
      headers: { Origin: 'http://localhost:5173' },
    });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'http://localhost:5173');

    const other = await server.request('GET', '/health', {
      headers: { Origin: 'https://elsewhere.example' },
    });
    assert.notEqual(other.headers.get('access-control-allow-origin'), 'https://elsewhere.example');
  });

  it('answers unknown routes with the SDD error format', async () => {
    const response = await server.request('GET', '/does-not-exist');
    assert.equal(response.status, 404);
    assert.deepEqual(response.body, {
      error: {
        code: 'NOT_FOUND',
        message: 'No route for GET /api/does-not-exist',
        details: { reason: 'ROUTE_NOT_FOUND' },
      },
    });
  });

  it('rejects malformed JSON without leaking internals', async () => {
    const response = await server.request('POST', '/auth/login', { body: '{"email":' });
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'VALIDATION_ERROR');
    assert.equal(response.body.error.details.reason, 'INVALID_JSON');
    assert.equal(JSON.stringify(response.body).includes('stack'), false);
  });

  it('answers 503 once the database is disconnected, starting with GET /api/health', async () => {
    await closeDatabase();
    const response = await server.request('GET', '/health');
    assert.equal(response.status, 503);
    assert.equal(response.body.status, 'unavailable');
    assert.equal(response.body.database, 'disconnected');

    const login = await server.request('POST', '/auth/login', {
      body: { email: 'someone@example.test', password: 'any password 1' },
    });
    assert.equal(login.status, 503);
    assert.equal(login.body.error.code, 'SERVICE_UNAVAILABLE');
    assert.equal(login.body.error.details.reason, 'DATABASE_UNAVAILABLE');
  });
});
