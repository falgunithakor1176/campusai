/**
 * @fileoverview Pluggable Storage Abstraction Layer
 * @description Provides a unified interface for file storage operations,
 *              supporting multiple backends (Local filesystem, AWS S3, Supabase).
 *
 *              This abstraction layer allows seamless migration between storage
 *              providers without changing any business logic — only the
 *              STORAGE_PROVIDER environment variable needs to change.
 *
 * @module src/config/storage
 * @pattern Strategy Pattern
 *
 * @example
 * // Automatically picks the right provider from STORAGE_PROVIDER env var
 * const storage = getStorageProvider();
 * const fileUrl = await storage.uploadFile(buffer, 'uploads/documents/file.pdf', 'application/pdf');
 * await storage.deleteFile('uploads/documents/file.pdf');
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const logger = require('./logger');

const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);
const existsAsync = promisify(fs.exists);

// ─── Storage Provider Interface ───────────────────────────────────────────────

/**
 * Abstract storage provider interface.
 * All concrete storage providers must implement these methods.
 * This follows the Strategy Pattern for interchangeable algorithms.
 *
 * @interface StorageProvider
 */
class StorageProvider {
  /**
   * Uploads a file to the storage backend.
   *
   * @param {Buffer} fileBuffer - The file content as a Buffer
   * @param {string} destinationPath - The path/key to store the file at
   * @param {string} mimeType - The MIME type of the file
   * @returns {Promise<string>} The public URL or file path of the uploaded file
   * @throws {Error} If the upload fails
   */
  // eslint-disable-next-line no-unused-vars
  async uploadFile(fileBuffer, destinationPath, mimeType) {
    throw new Error('uploadFile() must be implemented by the storage provider');
  }

  /**
   * Deletes a file from the storage backend.
   *
   * @param {string} filePath - The path/key of the file to delete
   * @returns {Promise<void>}
   * @throws {Error} If the deletion fails
   */
  // eslint-disable-next-line no-unused-vars
  async deleteFile(filePath) {
    throw new Error('deleteFile() must be implemented by the storage provider');
  }

  /**
   * Returns the public URL for accessing a file.
   *
   * @param {string} filePath - The path/key of the file
   * @returns {string} The full public URL
   */
  // eslint-disable-next-line no-unused-vars
  getFileUrl(filePath) {
    throw new Error('getFileUrl() must be implemented by the storage provider');
  }

  /**
   * Returns a readable stream for the given file.
   * Used for serving files directly through Express.
   *
   * @param {string} filePath - The path/key of the file
   * @returns {Promise<NodeJS.ReadableStream>} A readable stream of the file content
   * @throws {Error} If the file cannot be streamed
   */
  // eslint-disable-next-line no-unused-vars
  async getFileStream(filePath) {
    throw new Error('getFileStream() must be implemented by the storage provider');
  }

  /**
   * Checks if a file exists.
   *
   * @param {string} filePath - The path/key of the file
   * @returns {Promise<boolean>} True if the file exists
   */
  // eslint-disable-next-line no-unused-vars
  async fileExists(filePath) {
    throw new Error('fileExists() must be implemented by the storage provider');
  }

  /**
   * Gets the size of a file in bytes.
   *
   * @param {string} filePath - The path/key of the file
   * @returns {Promise<number>} File size in bytes
   */
  // eslint-disable-next-line no-unused-vars
  async getFileSize(filePath) {
    throw new Error('getFileSize() must be implemented by the storage provider');
  }

  /**
   * Copies a file from source to destination.
   *
   * @param {string} sourcePath - The source path/key
   * @param {string} destPath - The destination path/key
   * @returns {Promise<void>}
   */
  // eslint-disable-next-line no-unused-vars
  async copyFile(sourcePath, destPath) {
    throw new Error('copyFile() must be implemented by the storage provider');
  }
}

// ─── Local Storage Provider ───────────────────────────────────────────────────

/**
 * Local filesystem storage provider.
 * Stores files on the same machine running the server.
 *
 * ⚠️  Not suitable for production deployments with multiple instances
 *     or containerized environments where the filesystem is ephemeral.
 *     Use this for development and single-server deployments only.
 *
 * @extends StorageProvider
 */
class LocalStorageProvider extends StorageProvider {
  /**
   * Creates a new LocalStorageProvider instance.
   * Ensures the base upload directory exists.
   *
   * @param {string} [basePath='./uploads'] - The root directory for file storage
   */
  constructor(basePath = './uploads') {
    super();
    this.basePath = basePath;
    this._ensureDirectoryExists(basePath);
    logger.info('📁 LocalStorageProvider initialized', { basePath });
  }

  /**
   * Ensures a directory exists, creating it recursively if needed.
   *
   * @private
   * @param {string} dirPath - The directory path to ensure
   */
  _ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.debug('Created directory', { path: dirPath });
    }
  }

  /**
   * Uploads a file to the local filesystem.
   * Creates parent directories automatically.
   *
   * @param {Buffer} fileBuffer - The file content as a Buffer
   * @param {string} destinationPath - Relative path within basePath
   * @param {string} mimeType - MIME type (informational only for local storage)
   * @returns {Promise<string>} The local file path where the file was saved
   *
   * @example
   * const url = await storage.uploadFile(pdfBuffer, 'documents/report.pdf', 'application/pdf');
   * // Returns: './uploads/documents/report.pdf'
   */
  async uploadFile(fileBuffer, destinationPath, mimeType) {
    const fullPath = path.join(this.basePath, destinationPath);
    const dirPath = path.dirname(fullPath);

    // Ensure parent directory exists
    this._ensureDirectoryExists(dirPath);

    await writeFileAsync(fullPath, fileBuffer);

    logger.debug('File uploaded to local storage', {
      path: fullPath,
      size: fileBuffer.length,
      mimeType,
    });

    return fullPath;
  }

  /**
   * Deletes a file from the local filesystem.
   * Does not throw if the file doesn't exist (idempotent).
   *
   * @param {string} filePath - Absolute or relative path to the file
   * @returns {Promise<void>}
   */
  async deleteFile(filePath) {
    try {
      const exists = await existsAsync(filePath);
      if (exists) {
        await unlinkAsync(filePath);
        logger.debug('File deleted from local storage', { path: filePath });
      } else {
        logger.warn('Attempted to delete non-existent file', { path: filePath });
      }
    } catch (err) {
      logger.error('Failed to delete file from local storage', {
        path: filePath,
        error: err.message,
      });
      throw err;
    }
  }

  /**
   * Returns the local file path as the "URL".
   * In production with local storage, you'd serve these files
   * through an Express static middleware.
   *
   * @param {string} filePath - The file path
   * @returns {string} The file path (served as-is for local storage)
   */
  getFileUrl(filePath) {
    // For local storage, the file path IS the "URL" (served via Express static)
    return filePath;
  }

  /**
   * Returns a readable stream for a local file.
   *
   * @param {string} filePath - Absolute or relative path to the file
   * @returns {Promise<fs.ReadStream>} A readable file stream
   * @throws {Error} If the file does not exist
   */
  async getFileStream(filePath) {
    const exists = await existsAsync(filePath);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
    return fs.createReadStream(filePath);
  }

  /**
   * Checks if a file exists.
   *
   * @param {string} filePath - Absolute or relative path to the file
   * @returns {Promise<boolean>} True if the file exists
   */
  async fileExists(filePath) {
    return await existsAsync(filePath);
  }

  /**
   * Gets the size of a file in bytes.
   *
   * @param {string} filePath - Absolute or relative path to the file
   * @returns {Promise<number>} File size in bytes
   */
  async getFileSize(filePath) {
    const exists = await existsAsync(filePath);
    if (!exists) {
      throw new Error(`File not found: ${filePath}`);
    }
    const statAsync = promisify(fs.stat);
    const stats = await statAsync(filePath);
    return stats.size;
  }

  /**
   * Copies a file from source to destination.
   *
   * @param {string} sourcePath - The source path
   * @param {string} destPath - The destination path
   * @returns {Promise<void>}
   */
  async copyFile(sourcePath, destPath) {
    const exists = await existsAsync(sourcePath);
    if (!exists) {
      throw new Error(`File not found: ${sourcePath}`);
    }
    const dirPath = path.dirname(destPath);
    this._ensureDirectoryExists(dirPath);
    const copyFileAsync = promisify(fs.copyFile);
    await copyFileAsync(sourcePath, destPath);
  }
}

// ─── S3 Storage Provider (Stubbed) ────────────────────────────────────────────

/**
 * AWS S3 storage provider — STUBBED for future implementation.
 *
 * To implement this provider:
 * 1. Install: npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
 * 2. Initialize S3Client with region and credentials
 * 3. Implement uploadFile using PutObjectCommand
 * 4. Implement deleteFile using DeleteObjectCommand
 * 5. Implement getFileUrl using getSignedUrl or public bucket URL
 * 6. Implement getFileStream using GetObjectCommand
 *
 * @extends StorageProvider
 */
class S3StorageProvider extends StorageProvider {
  /**
   * Creates a new S3StorageProvider.
   * Validates required environment variables.
   */
  constructor() {
    super();
    logger.warn('⚠️  S3StorageProvider is not yet implemented. Configure STORAGE_PROVIDER=local.');
    throw new Error(
      'S3 storage is not yet configured. ' +
        'Set STORAGE_PROVIDER=local or implement S3StorageProvider with @aws-sdk/client-s3.'
    );
  }

  async uploadFile() {
    throw new Error('S3 storage not configured');
  }

  async deleteFile() {
    throw new Error('S3 storage not configured');
  }

  getFileUrl() {
    throw new Error('S3 storage not configured');
  }

  async getFileStream() {
    throw new Error('S3 storage not configured');
  }
}

// ─── Storage Provider Factory ─────────────────────────────────────────────────

/**
 * Factory function that returns the appropriate storage provider
 * based on the STORAGE_PROVIDER environment variable.
 *
 * Supported providers:
 * - 'local' (default): LocalStorageProvider — stores files on disk
 * - 's3': S3StorageProvider — stores files in AWS S3 (future)
 * - 'supabase': Not yet implemented
 *
 * This follows the Factory Pattern, allowing the storage backend
 * to be changed via configuration without touching business logic.
 *
 * @returns {StorageProvider} The configured storage provider instance
 * @throws {Error} If an unsupported STORAGE_PROVIDER is specified
 *
 * @example
 * // In your service:
 * const storage = getStorageProvider();
 * const fileUrl = await storage.uploadFile(buffer, 'docs/file.pdf', 'application/pdf');
 */
function getStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER || 'local';
  const defaultBasePath = path.join(__dirname, '../../storage/documents');

  switch (provider.toLowerCase()) {
    case 'local':
      return new LocalStorageProvider(process.env.UPLOAD_PATH || defaultBasePath);

    case 's3':
      return new S3StorageProvider();

    case 'supabase':
      throw new Error(
        'Supabase storage provider is not yet implemented. Use STORAGE_PROVIDER=local.'
      );

    default:
      logger.warn(`Unknown STORAGE_PROVIDER '${provider}'. Falling back to local storage.`);
      return new LocalStorageProvider(process.env.UPLOAD_PATH || defaultBasePath);
  }
}

module.exports = {
  StorageProvider,
  LocalStorageProvider,
  S3StorageProvider,
  getStorageProvider,
};
