import { Router } from 'express';
import { getDatabaseState } from '../../config/database.js';

/** GET /health (SDD 9): used by Render to monitor the service. Reports the real database state. */
export function createHealthRouter() {
  const router = Router();

  router.get('/', (_req, res) => {
    const database = getDatabaseState();
    const healthy = database === 'connected';
    res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'unavailable',
      database,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
