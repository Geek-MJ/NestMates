import mongoose from 'mongoose';
import Document from '../../models/Document.js';
import { notFound, validationError } from '../../utils/AppError.js';
import { FIELD_ERRORS } from '../../utils/validation.js';
import { isObjectId } from '../../utils/ids.js';
import { HISTORY_PAGE_SIZE, pageResult, readPage } from '../../utils/pagination.js';
import { loadPeople, presentPerson } from '../../utils/people.js';
import { assertSupportedFile, contentDisposition, sanitizeFileName } from './files.js';
import { getBucket, openDownloadStream, storeBuffer } from './storage.js';

async function presentDocuments(householdId, documents) {
  const people = await loadPeople(documents.map((document) => document.uploadedBy));
  return documents.map((document) => ({
    id: String(document._id),
    fileName: document.fileName,
    mimeType: document.mimeType,
    size: document.size,
    uploadedBy: presentPerson(document.uploadedBy, householdId, people),
    uploadedAt: document.uploadedAt,
  }));
}

export async function listDocuments(householdId, query) {
  const page = readPage(query);
  const filter = { householdId };
  const [total, documents] = await Promise.all([
    Document.countDocuments(filter),
    Document.find(filter)
      .sort({ uploadedAt: -1 })
      .skip((page - 1) * HISTORY_PAGE_SIZE)
      .limit(HISTORY_PAGE_SIZE)
      .lean(),
  ]);
  return pageResult(await presentDocuments(householdId, documents), { page, total });
}

export async function uploadDocument(householdId, userId, file) {
  if (!file) throw validationError([{ field: 'file', code: FIELD_ERRORS.REQUIRED }]);
  assertSupportedFile(file);

  const fileName = sanitizeFileName(file.originalname);
  const gridFsFileId = await storeBuffer(file.buffer, fileName, {
    contentType: file.mimetype,
    metadata: { householdId: String(householdId) },
  });

  try {
    const document = await Document.create({
      householdId,
      fileName,
      mimeType: file.mimetype,
      size: file.size,
      gridFsFileId,
      uploadedBy: userId,
      uploadedAt: new Date(),
    });
    const [presented] = await presentDocuments(householdId, [document]);
    return presented;
  } catch (error) {
    await getBucket().delete(gridFsFileId).catch(() => {});
    throw error;
  }
}

async function findDocument(householdId, documentId) {
  if (!isObjectId(documentId)) throw notFound('DOCUMENT_NOT_FOUND', 'Document not found');
  const document = await Document.findOne({ _id: documentId, householdId }).lean();
  if (!document) throw notFound('DOCUMENT_NOT_FOUND', 'Document not found');
  return document;
}

export async function openDocument(householdId, documentId, { download, res }) {
  const document = await findDocument(householdId, documentId);
  res.status(200);
  res.setHeader('Content-Type', document.mimeType);
  res.setHeader('Content-Length', String(document.size));
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Disposition', contentDisposition(document.fileName, download));
  res.setHeader('Cache-Control', 'private, no-store');

  const stream = openDownloadStream(document.gridFsFileId);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Document not found', details: { reason: 'DOCUMENT_NOT_FOUND' } },
      });
      return;
    }
    res.destroy();
  });
  stream.pipe(res);
}

export async function deleteDocument(householdId, documentId) {
  const document = await findDocument(householdId, documentId);
  await Document.deleteOne({ _id: document._id, householdId });
  await getBucket().delete(new mongoose.Types.ObjectId(document.gridFsFileId)).catch(() => {});
}
