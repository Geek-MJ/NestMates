import mongoose from 'mongoose';

function transactionsUnsupported(error) {
  const message = String(error?.message ?? '');
  return (
    error?.code === 20 ||
    error?.codeName === 'IllegalOperation' ||
    message.includes('Transaction numbers are only allowed') ||
    message.includes('replica set')
  );
}

/**
 * Runs `work` in a MongoDB transaction when the server supports one (SDD 4, Atlas).
 * A standalone development server has no replica set, so the same work then runs
 * without a session. `work` receives the session, or null.
 */
export async function runAtomically(work) {
  let session;
  try {
    session = await mongoose.startSession();
  } catch (error) {
    if (transactionsUnsupported(error)) return work(null);
    throw error;
  }

  try {
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    if (transactionsUnsupported(error)) return work(null);
    throw error;
  } finally {
    await session.endSession();
  }
}
