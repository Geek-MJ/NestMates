import { listMessages, translateExistingMessage } from './chat.service.js';

export function createChatController(translation) {
  return {
    async history(req, res) {
      res.json(await listMessages(req.householdId, req.query));
    },

    async translate(req, res) {
      res.json(await translateExistingMessage({
        householdId: req.householdId,
        messageId: req.params.messageId,
        body: req.body,
        translation,
      }));
    },
  };
}
