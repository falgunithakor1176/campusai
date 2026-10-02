/**
 * File Upload Middleware (Multer Configuration)
 *
 * Provides configurable Multer instances for PDF and image uploads.
 * File names are randomized using UUID to prevent collisions.
 *
 * @module middleware/upload
 */

'use strict';

const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

// ─── Ensure Upload Directories Exist ─────────────────────────────
const pdfUploadPath = process.env.UPLOAD_PATH || path.join(__dirname, '../../storage/documents/temp');
const imageUploadPath = path.join(__dirname, '../../uploads/images');

[pdfUploadPath, imageUploadPath].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ─── PDF Storage Engine ───────────────────────────────────────────
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, pdfUploadPath),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only PDF files are accepted.'), false);
  }
};

/**
 * uploadPdf - Multer middleware for single PDF upload.
 * Field name: 'document'
 */
const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024 },
}).single('document');

// ─── Image Storage Engine ─────────────────────────────────────────
const imageStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, imageUploadPath),
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'Only JPEG, PNG, WEBP, and GIF images are accepted.'), false);
  }
};

/**
 * uploadImage - Multer middleware for single image upload.
 * Field name: 'image'
 */
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
}).single('image');

module.exports = { uploadPdf, uploadImage };
