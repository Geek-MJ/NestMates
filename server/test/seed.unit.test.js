import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { assertDevelopmentSeed, databaseNameFromUri } from '../src/seed/guard.js';

describe('development seed guard', () => {
  it('reads the database name without the query string', () => {
    assert.equal(
      databaseNameFromUri('mongodb+srv://user:pass@host/nestmates-dev?retryWrites=true'),
      'nestmates-dev',
    );
  });

  it('allows a development process pointed at a development database', () => {
    assert.equal(
      assertDevelopmentSeed({ NODE_ENV: 'development', MONGODB_URI: 'mongodb://127.0.0.1:27018/nestmates-dev' }),
      'nestmates-dev',
    );
  });

  it('refuses production and any database whose name is not clearly development', () => {
    assert.throws(
      () => assertDevelopmentSeed({ NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1/nestmates-dev' }),
      /NODE_ENV must be development/,
    );
    assert.throws(
      () => assertDevelopmentSeed({ NODE_ENV: 'development', MONGODB_URI: 'mongodb://127.0.0.1/nestmates-prod' }),
      /not a development database/,
    );
    assert.throws(
      () => assertDevelopmentSeed({ NODE_ENV: 'development', MONGODB_URI: 'mongodb://127.0.0.1/nestmates-test' }),
      /not a development database/,
    );
    assert.throws(
      () => assertDevelopmentSeed({ NODE_ENV: 'development' }),
      /not a development database/,
    );
  });
});
