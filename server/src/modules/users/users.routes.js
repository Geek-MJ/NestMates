import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { changePassword, deleteCurrentUser, getCurrentUser, updateCurrentUser } from './users.service.js';
import { parsePasswordChange, parseProfileUpdate } from './users.validation.js';

export function createUsersRouter({ config }) {
  const router = Router();

  router.use(authenticate(config.jwt));

  /** GET /users/me: current user (profile, language, household id). */
  router.get('/me', async (req, res) => {
    res.json(await getCurrentUser(req.auth.userId));
  });

  /** PATCH /users/me: edit name, email or language (FR-ACC-13, FR-ACC-15). */
  router.patch('/me', async (req, res) => {
    res.json(await updateCurrentUser(req.auth.userId, parseProfileUpdate(req.body)));
  });

  /** PUT /users/me/password: change password (FR-ACC-14). */
  router.put('/me/password', async (req, res) => {
    await changePassword(req.auth.userId, parsePasswordChange(req.body));
    res.status(204).end();
  });

  /** DELETE /users/me: delete the account (FR-ACC-12). 409 while the user is in a household. */
  router.delete('/me', async (req, res) => {
    await deleteCurrentUser(req.auth.userId);
    res.status(204).end();
  });

  return router;
}
