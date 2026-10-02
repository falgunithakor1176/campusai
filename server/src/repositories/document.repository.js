'use strict';

const BaseRepository = require('./base.repository');
const prisma = require('../config/database');

class DocumentRepository extends BaseRepository {
  constructor() {
    super('document');
  }

  async findById(id) {
    return prisma.document.findFirst({
      where: {
        id,
        deletedAt: null
      },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        },
        college: {
          select: { id: true, name: true }
        },
        versions: {
          orderBy: { version: 'desc' }
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } }
          }
        }
      }
    });
  }

  async findByChecksum(checksum, collegeId) {
    return prisma.document.findFirst({
      where: {
        checksum,
        collegeId,
        deletedAt: null
      }
    });
  }

  async findMany(options) {
    const { skip, take, where, orderBy } = options;
    
    const [data, total] = await Promise.all([
      prisma.document.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          uploadedBy: {
            select: { id: true, name: true }
          }
        }
      }),
      prisma.document.count({ where })
    ]);

    return { data, total };
  }

  async softDelete(id) {
    return prisma.document.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async restore(id) {
    return prisma.document.update({
      where: { id },
      data: { deletedAt: null }
    });
  }

  async createVersion(data) {
    return prisma.documentVersion.create({ data });
  }

  async findVersions(documentId) {
    return prisma.documentVersion.findMany({
      where: { documentId },
      orderBy: { version: 'desc' },
      include: {
        uploadedBy: { select: { id: true, name: true } }
      }
    });
  }

  async createAuditLog(data) {
    return prisma.documentAuditLog.create({ data });
  }

  async findAuditLogs(documentId) {
    return prisma.documentAuditLog.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true } }
      }
    });
  }

  async updateStatus(id, status) {
    return prisma.document.update({
      where: { id },
      data: { status }
    });
  }

  async updateChunkCount(id, chunkCount) {
    return prisma.document.update({
      where: { id },
      data: { chunkCount }
    });
  }

  async createProcessingJob(data) {
    return prisma.documentProcessingJob.create({ data });
  }

  async updateProcessingJob(id, data) {
    return prisma.documentProcessingJob.update({
      where: { id },
      data
    });
  }

  async createChunks(chunks) {
    return prisma.documentChunk.createMany({ data: chunks });
  }

  async deleteChunksByDocumentId(documentId) {
    return prisma.documentChunk.deleteMany({ where: { documentId } });
  }

  async countAll(collegeId) {
    return prisma.document.count({
      where: { collegeId, deletedAt: null }
    });
  }

  async sumFileSize(collegeId) {
    const result = await prisma.document.aggregate({
      where: { collegeId, deletedAt: null },
      _sum: { fileSize: true }
    });
    return result._sum.fileSize || 0;
  }

  async countByCategory(collegeId) {
    return prisma.document.groupBy({
      by: ['category'],
      where: { collegeId, deletedAt: null },
      _count: { id: true }
    });
  }

  async countByStatus(collegeId) {
    return prisma.document.groupBy({
      by: ['status'],
      where: { collegeId, deletedAt: null },
      _count: { id: true }
    });
  }
}

module.exports = new DocumentRepository();

