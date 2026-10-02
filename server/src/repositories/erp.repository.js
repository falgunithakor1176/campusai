'use strict';

/**
 * ErpRepository — Lightweight read-only queries for structured ERP data.
 * Used by the Hybrid AI Assistant to answer questions about live college data
 * (events, notices, fees, timetables, scholarships, etc.) directly from PostgreSQL.
 *
 * No schema changes. Reuses all existing Prisma models.
 */

const prisma = require('../config/database');

class ErpRepository {
  /**
   * Get published notices, optionally filtered by category keywords.
   * @param {string} collegeId
   * @param {string[]} [categories] - Optional Prisma NoticeCategory values
   * @param {number} [limit=5]
   */
  async getNotices(collegeId, categories = [], limit = 5) {
    return prisma.notice.findMany({
      where: {
        collegeId,
        isPublished: true,
        ...(categories.length > 0 ? { category: { in: categories } } : {}),
      },
      orderBy: [{ isPinned: 'desc' }, { publishDate: 'desc' }, { createdAt: 'desc' }],
      take: limit,
      select: {
        id: true,
        title: true,
        content: true,
        category: true,
        targetAudience: true,
        publishDate: true,
        expiryDate: true,
        isPinned: true,
      },
    });
  }

  /**
   * Get upcoming/recent events.
   * @param {string} collegeId
   * @param {number} [limit=5]
   */
  async getEvents(collegeId, limit = 5) {
    const now = new Date();
    return prisma.event.findMany({
      where: {
        collegeId,
        isActive: true,
        eventDate: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }, // last 7 days + future
      },
      orderBy: { eventDate: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        eventDate: true,
        endDate: true,
        venue: true,
        category: true,
        organizer: true,
        maxParticipants: true,
        registrationLink: true,
      },
    });
  }

  /**
   * Get fee structures for a college (all departments).
   * @param {string} collegeId
   * @param {string} [academicYear]
   */
  async getFeeStructures(collegeId, academicYear = '2025-26') {
    return prisma.feeStructure.findMany({
      where: {
        department: { collegeId },
        academicYear,
      },
      orderBy: [{ yearOfStudy: 'asc' }],
      take: 20,
      include: {
        department: { select: { name: true, code: true } },
      },
    });
  }

  /**
   * Get exam timetables.
   * @param {string} collegeId
   * @param {string} [academicYear]
   * @param {number} [limit=15]
   */
  async getExamTimetables(collegeId, academicYear = '2025-26', limit = 15) {
    return prisma.examTimetable.findMany({
      where: {
        department: { collegeId },
        academicYear,
      },
      orderBy: { examDate: 'asc' },
      take: limit,
      include: {
        department: { select: { name: true, code: true } },
      },
    });
  }

  /**
   * Get active scholarships.
   * @param {string} collegeId
   * @param {number} [limit=10]
   */
  async getScholarships(collegeId, limit = 10) {
    return prisma.scholarship.findMany({
      where: { collegeId, isActive: true },
      orderBy: { deadline: 'asc' },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        eligibility: true,
        minimumPercentage: true,
        amount: true,
        fundingSource: true,
        deadline: true,
        documentsRequired: true,
        selectionProcess: true,
      },
    });
  }

  /**
   * Get academic calendar entries.
   * @param {string} collegeId
   * @param {string} [academicYear]
   * @param {number} [limit=20]
   */
  async getAcademicCalendar(collegeId, academicYear = '2025-26', limit = 20) {
    return prisma.academicCalendar.findMany({
      where: { collegeId, academicYear },
      orderBy: { startDate: 'asc' },
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        category: true,
        isHoliday: true,
      },
    });
  }

  /**
   * Get attendance policies.
   * @param {string} collegeId
   */
  async getAttendancePolicies(collegeId) {
    return prisma.attendancePolicy.findMany({
      where: { department: { collegeId } },
      take: 5,
      include: {
        department: { select: { name: true, code: true } },
      },
    });
  }

  /**
   * Get hostel info.
   * @param {string} collegeId
   */
  async getHostelInfo(collegeId) {
    return prisma.hostelInfo.findMany({
      where: { collegeId },
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        capacity: true,
        occupancy: true,
        wardenName: true,
        wardenContact: true,
        rules: true,
        facilities: true,
        feePerYear: true,
        messFeePerYear: true,
        location: true,
      },
    });
  }

  /**
   * Get library info.
   * @param {string} collegeId
   */
  async getLibraryInfo(collegeId) {
    return prisma.libraryInfo.findFirst({
      where: { collegeId },
      select: {
        openingTime: true,
        closingTime: true,
        workingDays: true,
        rules: true,
        totalBooks: true,
        totalJournals: true,
        totalEBooks: true,
        membershipFee: true,
        finePerDayLate: true,
        contactEmail: true,
        contactPhone: true,
        location: true,
      },
    });
  }

  /**
   * Get active clubs.
   * @param {string} collegeId
   * @param {number} [limit=10]
   */
  async getClubs(collegeId, limit = 10) {
    return prisma.club.findMany({
      where: { collegeId, isActive: true },
      take: limit,
      select: {
        id: true,
        name: true,
        category: true,
        description: true,
        facultyAdvisor: true,
        presidentName: true,
        meetingDay: true,
        meetingTime: true,
        achievements: true,
      },
    });
  }

  /**
   * Get placement stats.
   * @param {string} collegeId
   * @param {string} [academicYear]
   */
  async getPlacementStats(collegeId, academicYear = '2023-24') {
    return prisma.placementStat.findMany({
      where: {
        department: { collegeId },
        academicYear,
      },
      orderBy: { packageLpa: 'desc' },
      take: 20,
      include: {
        department: { select: { name: true, code: true } },
      },
    });
  }

  /**
   * Get campus facilities.
   * @param {string} collegeId
   */
  async getFacilities(collegeId) {
    return prisma.facility.findMany({
      where: { collegeId, isActive: true },
      take: 20,
      select: {
        name: true,
        category: true,
        description: true,
        location: true,
        capacity: true,
        timings: true,
        contactInfo: true,
      },
    });
  }
}

module.exports = new ErpRepository();
