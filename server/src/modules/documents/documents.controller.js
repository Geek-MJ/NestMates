import { deleteDocument, listDocuments, openDocument, uploadDocument } from './documents.service.js';

export const documentsController = {
  async list(req, res) {
    res.json(await listDocuments(req.householdId, req.query));
  },

  async upload(req, res) {
    res.status(201).json(await uploadDocument(req.householdId, req.auth.userId, req.file));
  },

  async content(req, res) {
    await openDocument(req.householdId, req.params.documentId, {
      download: req.query.disposition === 'attachment',
      res,
    });
  },

  async remove(req, res) {
    await deleteDocument(req.householdId, req.params.documentId);
    res.status(204).end();
  },
};
