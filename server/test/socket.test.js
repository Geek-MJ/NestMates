import assert from 'node:assert/strict';
import { after, before, beforeEach, describe, it } from 'node:test';
import { io as connectClient } from 'socket.io-client';
import { householdRoom } from '../src/realtime/socketServer.js';
import { clearDatabase, closeDatabase, registerAccount, startTestServer } from './helpers.js';

function connect(baseUrl, auth) {
  const socket = connectClient(baseUrl, { auth, reconnection: false, transports: ['websocket'] });
  return new Promise((resolve) => {
    socket.on('connect', () => resolve({ socket, error: null }));
    socket.on('connect_error', (error) => resolve({ socket, error }));
  });
}

describe('Socket.IO handshake (NFR-SEC-06)', () => {
  let server;
  const sockets = [];

  before(async () => {
    server = await startTestServer();
  });

  beforeEach(clearDatabase);

  after(async () => {
    sockets.forEach((socket) => socket.disconnect());
    await clearDatabase();
    await server.close();
    await closeDatabase();
  });

  async function attempt(auth) {
    const result = await connect(server.baseUrl, auth);
    sockets.push(result.socket);
    return result;
  }

  it('rejects connections without a valid JWT', async () => {
    for (const auth of [{}, { token: 'not.a.jwt' }]) {
      const { error } = await attempt(auth);
      assert.equal(error?.message, 'UNAUTHENTICATED');
    }
  });

  it('rejects users who do not belong to a household', async () => {
    const account = await registerAccount(server.request);
    const { error } = await attempt({ token: account.token });
    assert.equal(error?.message, 'FORBIDDEN');
  });

  it("joins a member's socket to the room of their household only", async () => {
    const account = await registerAccount(server.request);
    const { body: household } = await server.request('POST', '/households', {
      token: account.token,
      body: { name: 'Flat' },
    });

    const { socket, error } = await attempt({ token: account.token });
    assert.equal(error, null);

    const [joined] = await server.io.in(householdRoom(household.id)).fetchSockets();
    assert.equal(joined?.id, socket.id);
    assert.deepEqual([...joined.rooms].sort(), [householdRoom(household.id), socket.id].sort());
  });
});
