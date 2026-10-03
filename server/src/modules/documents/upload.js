import multer from 'multer';
import { payloadTooLarge, unsupportedMedia } from '../../utils/AppError.js';
import { ALLOWED_FILES, MAX_FILE_BYTES } from './files.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter(_req, file, callback) {
    if (ALLOWED_FILES[file.mimetype]) {
      callback(null, true);
      return;
    }
    callback(unsupportedMedia('UNSUPPORTED_TYPE', 'Only PDF, JPEG and PNG files can be uploaded'));
  },
});

/** Multipart field name is "file" (SDD 5). */
export function uploadDocument(req, res, next) {
  upload.single('file')(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
      next(payloadTooLarge('FILE_TOO_LARGE', 'The file is larger than 10 MB'));
      return;
    }
    next(error);
  });
}
