import { languageFromAcceptLanguage } from '../../utils/language.js';
import {
  parseForgotPassword,
  parseLogin,
  parseRegistration,
  parseResetPassword,
} from './auth.validation.js';

export function createAuthController(authService) {
  return {
    async register(req, res) {
      const input = parseRegistration(req.body);
      const result = await authService.register({
        ...input,
        language: languageFromAcceptLanguage(req.get('accept-language')),
      });
      res.status(201).json(result);
    },

    async login(req, res) {
      res.json(await authService.login(parseLogin(req.body)));
    },

    async forgotPassword(req, res) {
      await authService.requestPasswordReset(parseForgotPassword(req.body));
      res.status(204).end();
    },

    async resetPassword(req, res) {
      await authService.resetPassword(parseResetPassword(req.body));
      res.status(204).end();
    },
  };
}
