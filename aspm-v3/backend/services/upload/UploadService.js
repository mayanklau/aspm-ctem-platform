'use strict';

/**
 * File upload service.
 *
 * Hardening notes:
 *
 *  - On-disk filenames are UUID-only with a sanitised extension; the original
 *    filename is *never* used as a path component (defeats path traversal,
 *    null-byte injection, and odd-character LFS quirks).
 *  - Extension is checked against an allowlist.
 *  - Size cap is configurable via UPLOAD_MAX_BYTES (default 50 MB).
 *  - Upload directory is configurable via UPLOAD_DIR (default ./uploads).
 *  - The `safeOriginalName` helper is exported for callers who want to log
 *    or persist a sanitised version of the user-supplied filename.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_EXTS = new Set(['.csv', '.json', '.xml', '.xlsx', '.xls', '.pdf']);
const MAX_BYTES = parseInt(process.env.UPLOAD_MAX_BYTES || `${50 * 1024 * 1024}`, 10);

function safeExt(originalName) {
  const ext = path.extname(originalName || '').toLowerCase();
  // strip anything non-alphanumeric just in case
  return ext.replace(/[^a-z0-9.]/g, '');
}

function safeOriginalName(originalName) {
  if (!originalName) return 'unnamed';
  // strip path components, control chars, and limit length
  const base = path.basename(String(originalName));
  return base.replace(/[\x00-\x1f<>:"/\\|?*]/g, '_').slice(0, 200);
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const ext = safeExt(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_BYTES,
    files: 1,
    fields: 20,
  },
  fileFilter: (_req, file, cb) => {
    const ext = safeExt(file.originalname);
    if (!ext) return cb(new Error('File must have an extension'));
    if (!ALLOWED_EXTS.has(ext)) {
      return cb(
        new Error(
          `File type not allowed: ${ext}. Allowed: ${Array.from(ALLOWED_EXTS).join(', ')}`
        )
      );
    }
    return cb(null, true);
  },
});

module.exports = {
  upload,
  UPLOAD_DIR,
  MAX_BYTES,
  ALLOWED_EXTS,
  safeOriginalName,
  safeExt,
};
