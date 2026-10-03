import { basename } from 'node:path';
import { unsupportedMedia } from '../../utils/AppError.js';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

export const ALLOWED_FILES = Object.freeze({
  'application/pdf': { extension: 'pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  'image/jpeg': { extension: 'jpg', magic: [0xff, 0xd8, 0xff] },
  'image/png': { extension: 'png', magic: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
});

function withoutControls(value) {
  return [...value].filter((character) => {
    const code = character.codePointAt(0);
    return code > 31 && code !== 127;
  }).join('');
}

export function sanitizeFileName(originalName) {
  const base = withoutControls(basename(String(originalName ?? ''))).trim();
  const cleaned = base.replace(/[^\w.\- ()\u00C0-\u024F]+/gu, '_').replace(/^\.+/u, '').slice(0, 180);
  return cleaned || 'document';
}

export function matchesMagic(buffer, mimeType) {
  const allowed = ALLOWED_FILES[mimeType];
  if (!allowed || !Buffer.isBuffer(buffer)) return false;
  return allowed.magic.every((byte, index) => buffer[index] === byte);
}

export function assertSupportedFile(file) {
  if (!file) return;
  if (!ALLOWED_FILES[file.mimetype] || !matchesMagic(file.buffer, file.mimetype)) {
    throw unsupportedMedia('UNSUPPORTED_TYPE', 'Only PDF, JPEG and PNG files can be uploaded');
  }
}

export function contentDisposition(fileName, download) {
  const type = download ? 'attachment' : 'inline';
  const ascii = fileName.replace(/[^\w.\- ()]+/gu, '_') || 'document';
  return `${type}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
