// src/middleware/upload.middleware.js
//
// Multipart handling for the few endpoints that take a real file: resume and
// portfolio uploads, and the dataset importer.
//
// Storage decision: local disk under UPLOAD_DIR (default ./uploads), served
// back statically at /uploads. The sibling backends have no shared object-store
// convention to follow — stdFac carries AWS keys in its .env.example, this
// service has none — so introducing S3 here would mean inventing credentials
// and a bucket policy nobody has agreed on. Disk keeps every stored URL a plain
// string in the same column shape the models already use, and swapping in S3
// later is a change to this one file plus the URL it returns.
//
// ponytail: local disk, no CDN/virus-scan/dedupe. Move to presigned S3 uploads
// if files need to outlive the container or be served from more than one node.
import fs from "node:fs";
import path from "node:path";
import multer from "multer";

export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    // Keep the extension (the browser needs it to preview a PDF) but never the
    // caller's path or name — a filename like "../../.env" would otherwise
    // escape the upload directory.
    const ext = path.extname(file.originalname || "").slice(0, 10).replace(/[^.\w]/g, "");
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${req.user?.id || "anon"}-${unique}${ext}`);
  },
});

const ALLOWED = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png", "image/jpeg",
  "text/csv", "application/vnd.ms-excel",
  "text/plain",
]);

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    const err = new Error(`Unsupported file type: ${file.mimetype}`);
    err.statusCode = 400;
    cb(err);
  },
});

/** Public URL for a stored file, as written into the *_url columns. */
export const publicUrl = (filename) => `/uploads/${filename}`;
