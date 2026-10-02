'use strict';

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { promisify } = require('util');
const { AppError } = require('../middleware/errorHandler.middleware');
const { getStorageProvider } = require('../config/storage');
const documentRepository = require('../repositories/document.repository');
const logger = require('../config/logger');

const readFileAsync = promisify(fs.readFile);

class DocumentService {
  async _computeChecksum(filePath) {
    const fileBuffer = await readFileAsync(filePath);
    const hashSum = crypto.createHash('sha256');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  async _validatePdf(filePath) {
    // Basic implementation
    return true;
  }

  async upload(file, data, user) {
    if (!file) {
      throw new AppError('File is required', 400);
    }
    const checksum = await this._computeChecksum(file.path);
    
    const existing = await documentRepository.findByChecksum(checksum, user.collegeId);
    if (existing) {
      throw new AppError('Document already exists', 409);
    }

    const storage = getStorageProvider();
    
    const category = data.category || 'OTHER';
    const destFileName = `originals/${category}/${file.filename}`;
    
    await storage.copyFile(file.path, path.join(storage.basePath, destFileName));
    
    const docData = {
      collegeId: user.collegeId,
      title: data.title,
      description: data.description,
      category: data.category,
      visibility: data.visibility || 'PRIVATE',
      tags: data.tags || [],
      fileName: file.filename,
      originalFileName: file.originalname,
      filePath: destFileName,
      mimeType: file.mimetype,
      fileSize: file.size,
      checksum,
      uploadedById: user.userId,
      status: 'UPLOADED'
    };

    const doc = await documentRepository.create(docData);
    
    await documentRepository.createAuditLog({
      documentId: doc.id,
      userId: user.userId,
      action: 'UPLOAD',
      details: { fileName: file.originalname },
      version: 1,
      ipAddress: '127.0.0.1' // In a real app we'd pass req.ip
    });

    return doc;
  }

  async update(id, data, file, user) {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    const updateData = {
      title: data.title || doc.title,
      description: data.description !== undefined ? data.description : doc.description,
      category: data.category || doc.category,
      visibility: data.visibility || doc.visibility,
      tags: data.tags || doc.tags,
    };

    if (file) {
      const checksum = await this._computeChecksum(file.path);
      const storage = getStorageProvider();
      
      await documentRepository.createVersion({
        documentId: doc.id,
        version: doc.version,
        fileName: doc.fileName,
        originalFileName: doc.originalFileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        checksum: doc.checksum,
        uploadedById: doc.uploadedById
      });

      const destFileName = `originals/${updateData.category}/${file.filename}`;
      await storage.copyFile(file.path, path.join(storage.basePath, destFileName));

      updateData.version = doc.version + 1;
      updateData.fileName = file.filename;
      updateData.originalFileName = file.originalname;
      updateData.filePath = destFileName;
      updateData.fileSize = file.size;
      updateData.checksum = checksum;
      updateData.uploadedById = user.userId;
      
      await documentRepository.createAuditLog({
        documentId: doc.id,
        userId: user.userId,
        action: 'UPDATE_FILE',
        details: { version: updateData.version },
        version: updateData.version,
        ipAddress: '127.0.0.1'
      });
    } else {
      await documentRepository.createAuditLog({
        documentId: doc.id,
        userId: user.userId,
        action: 'UPDATE_METADATA',
        details: { fields: Object.keys(data) },
        version: doc.version,
        ipAddress: '127.0.0.1'
      });
    }

    return documentRepository.update(id, updateData);
  }

  async getById(id, user) {
    const doc = await documentRepository.findById(id);
    if (!doc) {
      throw new AppError('Document not found', 404);
    }
    if (doc.collegeId !== user.collegeId) {
      throw new AppError('Access denied', 403);
    }
    if (doc.visibility === 'PRIVATE' && doc.uploadedById !== user.userId && user.role !== 'SUPER_ADMIN') {
      throw new AppError('Access denied', 403);
    }
    return doc;
  }

  async list(options) {
    const { page = 1, limit = 10, search, sort, order, collegeId, role, userId, ...filters } = options;
    const skip = (page - 1) * limit;

    const where = { collegeId, deletedAt: null };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { originalFileName: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    Object.assign(where, filters);

    if (role !== 'SUPER_ADMIN') {
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: [{ visibility: 'PUBLIC' }, { uploadedById: userId }] }
        ];
        delete where.OR;
      } else {
        where.OR = [
          { visibility: 'PUBLIC' },
          { uploadedById: userId }
        ];
      }
    }

    const orderBy = {};
    if (sort) {
      orderBy[sort] = order || 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return documentRepository.findMany({ skip, take: limit, where, orderBy });
  }

  async download(id, user) {
    const doc = await this.getById(id, user);
    const storage = getStorageProvider();
    
    await documentRepository.createAuditLog({
      documentId: doc.id,
      userId: user.userId,
      action: 'DOWNLOAD',
      details: {},
      version: doc.version,
      ipAddress: '127.0.0.1'
    });

    return path.join(storage.basePath, doc.filePath);
  }

  async softDelete(id, user) {
    const doc = await this.getById(id, user);
    
    await documentRepository.createAuditLog({
      documentId: doc.id,
      userId: user.userId,
      action: 'DELETE',
      details: {},
      version: doc.version,
      ipAddress: '127.0.0.1'
    });

    return documentRepository.softDelete(id);
  }

  async restore(id, user) {
    const doc = await documentRepository.findById(id);
    if (!doc) throw new AppError('Document not found', 404);
    
    await documentRepository.createAuditLog({
      documentId: doc.id,
      userId: user.userId,
      action: 'RESTORE',
      details: {},
      version: doc.version,
      ipAddress: '127.0.0.1'
    });

    return documentRepository.restore(id);
  }

  async getVersions(id, user) {
    await this.getById(id, user);
    return documentRepository.findVersions(id);
  }

  async getAuditLogs(id, user) {
    await this.getById(id, user);
    return documentRepository.findAuditLogs(id);
  }

  async getStats(user) {
    const [totalDocuments, totalStorage, byCategory, byStatus] = await Promise.all([
      documentRepository.countAll(user.collegeId),
      documentRepository.sumFileSize(user.collegeId),
      documentRepository.countByCategory(user.collegeId),
      documentRepository.countByStatus(user.collegeId)
    ]);

    return {
      totalDocuments,
      totalStorage,
      byCategory: byCategory.map(c => ({ category: c.category, count: c._count.id })),
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id }))
    };
  }
}

module.exports = new DocumentService();
