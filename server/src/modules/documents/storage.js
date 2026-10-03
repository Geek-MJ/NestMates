import mongoose from 'mongoose';

export function getBucket() {
  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'fs' });
}

export function openUploadStream(fileName, { contentType, metadata }) {
  return getBucket().openUploadStream(fileName, { contentType, metadata });
}

export function openDownloadStream(fileId) {
  return getBucket().openDownloadStream(fileId);
}

export function storeBuffer(buffer, fileName, options) {
  return new Promise((resolve, reject) => {
    const stream = openUploadStream(fileName, options);
    stream.on('error', reject);
    stream.on('finish', () => resolve(stream.id));
    stream.end(buffer);
  });
}
