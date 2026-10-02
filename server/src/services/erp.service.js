'use strict';

/**
 * ErpService — Classifies user intent and fetches structured ERP data from PostgreSQL.
 *
 * This is the routing brain for the Hybrid AI Assistant:
 *   - ERP intent  → fetch from PostgreSQL → format as context → pass to Gemini
 *   - RAG intent  → existing RAG pipeline (unchanged)
 *   - Mixed       → fetch both and merge context
 *
 * Intent detection uses keyword matching (fast, no ML needed, no extra dependencies).
 */

const erpRepository = require('../repositories/erp.repository');

// ─── Intent definitions ──────────────────────────────────────────────────────

const ERP_INTENTS = {
  NOTICES: {
    keywords: ['notice', 'notices', 'announcement', 'announcements', 'circular', 'bulletin', 'notification', 'update', 'news'],
    categories: ['ACADEMIC', 'EXAM', 'EVENT', 'HOSTEL', 'GENERAL', 'URGENT', 'PLACEMENT', 'SCHOLARSHIP'],
  },
  EVENTS: {
    keywords: ['event', 'events', 'upcoming event', 'fest', 'festival', 'seminar', 'workshop', 'competition', 'hackathon', 'cultural', 'technical', 'symposium', 'conference'],
  },
  FEES: {
    keywords: ['fee', 'fees', 'fee structure', 'tuition fee', 'tuition fees', 'hostel fee', 'lab fee', 'exam fee', 'transport fee', 'development fee', 'total fee', 'how much', 'fee for', 'fee of', 'due date', 'due dates', 'late fine'],
  },
  EXAM_TIMETABLE: {
    keywords: ['exam timetable', 'exam schedule', 'exam date', 'exam dates', 'timetable', 'time table', 'when is exam', 'exam time', 'paper schedule', 'examination schedule', 'examination timetable', 'exam on', 'exam for'],
  },
  SCHOLARSHIPS: {
    keywords: ['scholarship', 'scholarships', 'merit scholarship', 'government scholarship', 'ebc', 'sc st scholarship', 'obc scholarship', 'scholarship amount', 'scholarship eligibility', 'scholarship deadline', 'scholarship apply', 'financial aid'],
  },
  ACADEMIC_CALENDAR: {
    keywords: ['academic calendar', 'semester start', 'semester end', 'semester dates', 'holiday', 'holidays', 'vacation', 'college calendar', 'calendar 2025', 'academic year', 'when does semester', 'semester schedule'],
  },
  HOSTEL: {
    keywords: ['hostel', 'hostel fee', 'hostel rules', 'hostel facilities', 'hostel room', 'warden', 'mess', 'mess menu', 'hostel timing', 'boys hostel', 'girls hostel', 'hostel contact', 'accommodation'],
  },
  LIBRARY: {
    keywords: ['library', 'library hours', 'library timing', 'library rules', 'library fine', 'library fee', 'books available', 'ebooks', 'library membership', 'library contact', 'reading room', 'digital library', 'library open', 'borrow book'],
  },
  CLUBS: {
    keywords: ['club', 'clubs', 'student club', 'student society', 'coding club', 'robotics club', 'music club', 'drama club', 'nss', 'ieee', 'cultural club', 'technical club', 'sports club', 'join club', 'club activities'],
  },
  PLACEMENT: {
    keywords: ['placement', 'placements', 'placement stats', 'placement package', 'lpa', 'salary', 'company', 'companies', 'recruiter', 'recruiters', 'campus placement', 'top recruiter', 'average package', 'highest package', 'internship', 'internship company', 'placement percentage', 'placed students'],
  },
  FACILITIES: {
    keywords: ['facility', 'facilities', 'campus facility', 'sports complex', 'gym', 'auditorium', 'canteen', 'cafeteria', 'wifi', 'medical', 'atm', 'bank', 'parking', 'sports', 'basketball', 'cricket', 'ground'],
  },
};

// ─── Intent Classifier ───────────────────────────────────────────────────────

/**
 * Classify a user query and return matched ERP intents.
 * Returns an empty array if the query is purely about policies/docs (use RAG).
 *
 * @param {string} query
 * @returns {string[]} Array of matched intent keys e.g. ['FEES', 'SCHOLARSHIPS']
 */
function classifyIntent(query) {
  const q = query.toLowerCase().trim();
  const matched = [];

  for (const [intentKey, intentDef] of Object.entries(ERP_INTENTS)) {
    if (intentDef.keywords.some(kw => q.includes(kw))) {
      matched.push(intentKey);
    }
  }

  return matched;
}

// ─── ERP Data Fetcher ────────────────────────────────────────────────────────

/**
 * Fetch relevant ERP data based on detected intents.
 * @param {string[]} intents
 * @param {string} collegeId
 * @returns {Promise<Object>} Map of intent → data
 */
async function fetchErpData(intents, collegeId) {
  const results = {};

  await Promise.all(
    intents.map(async (intent) => {
      try {
        switch (intent) {
          case 'NOTICES':
            results.notices = await erpRepository.getNotices(collegeId, [], 5);
            break;
          case 'EVENTS':
            results.events = await erpRepository.getEvents(collegeId, 5);
            break;
          case 'FEES':
            results.feeStructures = await erpRepository.getFeeStructures(collegeId);
            break;
          case 'EXAM_TIMETABLE':
            results.examTimetables = await erpRepository.getExamTimetables(collegeId);
            break;
          case 'SCHOLARSHIPS':
            results.scholarships = await erpRepository.getScholarships(collegeId);
            break;
          case 'ACADEMIC_CALENDAR':
            results.academicCalendar = await erpRepository.getAcademicCalendar(collegeId);
            break;
          case 'HOSTEL':
            results.hostelInfo = await erpRepository.getHostelInfo(collegeId);
            break;
          case 'LIBRARY':
            results.libraryInfo = await erpRepository.getLibraryInfo(collegeId);
            break;
          case 'CLUBS':
            results.clubs = await erpRepository.getClubs(collegeId);
            break;
          case 'PLACEMENT':
            results.placementStats = await erpRepository.getPlacementStats(collegeId);
            break;
          case 'FACILITIES':
            results.facilities = await erpRepository.getFacilities(collegeId);
            break;
        }
      } catch (err) {
        // Non-fatal: if one ERP query fails, skip it silently
        results[intent] = null;
      }
    })
  );

  return results;
}

// ─── ERP Context Formatter ───────────────────────────────────────────────────

/**
 * Format fetched ERP data into a readable context string for Gemini.
 * @param {Object} erpData
 * @returns {string}
 */
function formatErpContext(erpData) {
  const lines = [];

  if (erpData.notices?.length) {
    lines.push('=== COLLEGE NOTICES (Live from ERP) ===');
    erpData.notices.forEach((n, i) => {
      lines.push(`Notice ${i + 1}: [${n.category}] ${n.title}`);
      lines.push(`  Content: ${n.content}`);
      if (n.publishDate) lines.push(`  Published: ${new Date(n.publishDate).toLocaleDateString('en-IN')}`);
      if (n.expiryDate) lines.push(`  Expires: ${new Date(n.expiryDate).toLocaleDateString('en-IN')}`);
    });
    lines.push('');
  }

  if (erpData.events?.length) {
    lines.push('=== UPCOMING EVENTS (Live from ERP) ===');
    erpData.events.forEach((e, i) => {
      lines.push(`Event ${i + 1}: ${e.title}`);
      lines.push(`  Date: ${new Date(e.eventDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`);
      if (e.venue) lines.push(`  Venue: ${e.venue}`);
      if (e.organizer) lines.push(`  Organizer: ${e.organizer}`);
      if (e.description) lines.push(`  Details: ${e.description.slice(0, 200)}`);
      if (e.registrationLink) lines.push(`  Register: ${e.registrationLink}`);
    });
    lines.push('');
  }

  if (erpData.feeStructures?.length) {
    lines.push('=== FEE STRUCTURES 2025-26 (Live from ERP) ===');
    erpData.feeStructures.forEach((f) => {
      lines.push(`${f.department.name} (${f.department.code}) — Year ${f.yearOfStudy}:`);
      lines.push(`  Tuition Fee: ₹${Number(f.tuitionFee).toLocaleString('en-IN')}`);
      if (Number(f.examFee) > 0) lines.push(`  Exam Fee: ₹${Number(f.examFee).toLocaleString('en-IN')}`);
      if (Number(f.labFee) > 0) lines.push(`  Lab Fee: ₹${Number(f.labFee).toLocaleString('en-IN')}`);
      if (Number(f.hostelFee) > 0) lines.push(`  Hostel Fee: ₹${Number(f.hostelFee).toLocaleString('en-IN')}`);
      if (Number(f.transportFee) > 0) lines.push(`  Transport Fee: ₹${Number(f.transportFee).toLocaleString('en-IN')}`);
      lines.push(`  Total Fee: ₹${Number(f.totalFee).toLocaleString('en-IN')}`);
      if (f.lateFine) lines.push(`  Late Fine: ₹${Number(f.lateFine).toLocaleString('en-IN')}`);
      if (f.notes) lines.push(`  Notes: ${f.notes}`);
    });
    lines.push('');
  }

  if (erpData.examTimetables?.length) {
    lines.push('=== EXAM TIMETABLE (Live from ERP) ===');
    erpData.examTimetables.forEach((t) => {
      lines.push(`${t.subjectName} (${t.subjectCode || 'N/A'}) — ${t.department.name}`);
      lines.push(`  Date: ${new Date(t.examDate).toLocaleDateString('en-IN', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}`);
      lines.push(`  Time: ${t.examTime} | Duration: ${t.durationHours} hrs`);
      if (t.roomNumber) lines.push(`  Room: ${t.roomNumber}`);
      lines.push(`  Type: ${t.examType} | Semester: ${t.semester}`);
    });
    lines.push('');
  }

  if (erpData.scholarships?.length) {
    lines.push('=== SCHOLARSHIPS AVAILABLE (Live from ERP) ===');
    erpData.scholarships.forEach((s, i) => {
      lines.push(`Scholarship ${i + 1}: ${s.name}`);
      if (s.fundingSource) lines.push(`  Source: ${s.fundingSource}`);
      if (s.amount) lines.push(`  Amount: ₹${Number(s.amount).toLocaleString('en-IN')}`);
      if (s.eligibility) lines.push(`  Eligibility: ${s.eligibility}`);
      if (s.minimumPercentage) lines.push(`  Min. Percentage: ${s.minimumPercentage}%`);
      if (s.deadline) lines.push(`  Deadline: ${new Date(s.deadline).toLocaleDateString('en-IN')}`);
      if (s.documentsRequired) lines.push(`  Documents: ${s.documentsRequired}`);
    });
    lines.push('');
  }

  if (erpData.academicCalendar?.length) {
    lines.push('=== ACADEMIC CALENDAR 2025-26 (Live from ERP) ===');
    erpData.academicCalendar.forEach((c) => {
      const start = new Date(c.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
      const end = c.endDate ? new Date(c.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
      const dateStr = end ? `${start} – ${end}` : start;
      lines.push(`${c.isHoliday ? '🏖 Holiday' : '📅'} ${c.title}: ${dateStr}`);
      if (c.description) lines.push(`  ${c.description}`);
    });
    lines.push('');
  }

  if (erpData.hostelInfo?.length) {
    lines.push('=== HOSTEL INFORMATION (Live from ERP) ===');
    erpData.hostelInfo.forEach((h) => {
      lines.push(`${h.name} (${h.type} Hostel):`);
      if (h.capacity) lines.push(`  Capacity: ${h.capacity} students | Current Occupancy: ${h.occupancy || 'N/A'}`);
      if (h.wardenName) lines.push(`  Warden: ${h.wardenName} | Contact: ${h.wardenContact || 'N/A'}`);
      if (h.feePerYear) lines.push(`  Annual Fee: ₹${Number(h.feePerYear).toLocaleString('en-IN')}`);
      if (h.messFeePerYear) lines.push(`  Mess Fee: ₹${Number(h.messFeePerYear).toLocaleString('en-IN')}/year`);
      if (h.rules) lines.push(`  Rules: ${h.rules.slice(0, 300)}`);
      if (h.facilities) lines.push(`  Facilities: ${h.facilities.slice(0, 200)}`);
    });
    lines.push('');
  }

  if (erpData.libraryInfo) {
    const lib = erpData.libraryInfo;
    lines.push('=== LIBRARY INFORMATION (Live from ERP) ===');
    lines.push(`  Hours: ${lib.openingTime} – ${lib.closingTime}`);
    lines.push(`  Working Days: ${lib.workingDays}`);
    if (lib.totalBooks) lines.push(`  Total Books: ${lib.totalBooks.toLocaleString('en-IN')}`);
    if (lib.totalEBooks) lines.push(`  E-Books: ${lib.totalEBooks.toLocaleString('en-IN')}`);
    if (lib.finePerDayLate) lines.push(`  Late Return Fine: ₹${Number(lib.finePerDayLate)}/day`);
    if (lib.membershipFee) lines.push(`  Membership Fee: ₹${Number(lib.membershipFee)}`);
    if (lib.rules) lines.push(`  Rules: ${lib.rules.slice(0, 300)}`);
    if (lib.contactEmail) lines.push(`  Contact: ${lib.contactEmail} | ${lib.contactPhone || ''}`);
    lines.push('');
  }

  if (erpData.clubs?.length) {
    lines.push('=== STUDENT CLUBS & SOCIETIES (Live from ERP) ===');
    erpData.clubs.forEach((c) => {
      lines.push(`${c.name} [${c.category || 'General'}]`);
      if (c.description) lines.push(`  ${c.description.slice(0, 150)}`);
      if (c.facultyAdvisor) lines.push(`  Faculty Advisor: ${c.facultyAdvisor}`);
      if (c.meetingDay) lines.push(`  Meets: ${c.meetingDay} at ${c.meetingTime || 'TBD'}`);
    });
    lines.push('');
  }

  if (erpData.placementStats?.length) {
    lines.push('=== PLACEMENT STATISTICS (Live from ERP) ===');
    erpData.placementStats.forEach((p) => {
      lines.push(`${p.companyName} — ${p.department?.name || 'All Depts'} (${p.academicYear})`);
      lines.push(`  Package: ₹${Number(p.packageLpa).toLocaleString('en-IN')} LPA | Students Placed: ${p.studentsPlaced}`);
      if (p.highestPackage) lines.push(`  Highest: ₹${Number(p.highestPackage).toLocaleString('en-IN')} LPA`);
      if (p.roleOffered) lines.push(`  Role: ${p.roleOffered}`);
    });
    lines.push('');
  }

  if (erpData.facilities?.length) {
    lines.push('=== CAMPUS FACILITIES (Live from ERP) ===');
    erpData.facilities.forEach((f) => {
      lines.push(`${f.name} [${f.category || 'General'}]`);
      if (f.description) lines.push(`  ${f.description.slice(0, 150)}`);
      if (f.timings) lines.push(`  Timings: ${f.timings}`);
      if (f.location) lines.push(`  Location: ${f.location}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  classifyIntent,
  fetchErpData,
  formatErpContext,
};
