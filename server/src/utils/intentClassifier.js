/**
 * Intent Classifier Utility
 *
 * Classifies natural language queries from students and guests to identify
 * if the query relates to specific structured database categories (e.g., Fees, Courses, Faculty)
 * or if it requires general AI/RAG reasoning.
 *
 * @module utils/intentClassifier
 */

'use strict';

/**
 * All recognized intent types.
 * @enum {string}
 */
const INTENTS = {
  FEE_QUERY: 'FEE_QUERY',
  FACULTY_QUERY: 'FACULTY_QUERY',
  COURSE_QUERY: 'COURSE_QUERY',
  DEPARTMENT_QUERY: 'DEPARTMENT_QUERY',
  NOTICE_QUERY: 'NOTICE_QUERY',
  EVENT_QUERY: 'EVENT_QUERY',
  SCHOLARSHIP_QUERY: 'SCHOLARSHIP_QUERY',
  PLACEMENT_QUERY: 'PLACEMENT_QUERY',
  LIBRARY_QUERY: 'LIBRARY_QUERY',
  HOSTEL_QUERY: 'HOSTEL_QUERY',
  EXAM_QUERY: 'EXAM_QUERY',
  ATTENDANCE_QUERY: 'ATTENDANCE_QUERY',
  GENERAL_QUERY: 'GENERAL_QUERY',
};

// Keyword patterns for classification mapping
const KEYWORDS = {
  [INTENTS.FEE_QUERY]: [/fee/i, /payment/i, /dues/i, /cost/i, /expense/i, /charge/i, /installment/i, /tuition/i],
  [INTENTS.FACULTY_QUERY]: [/faculty/i, /teacher/i, /professor/i, /hod/i, /lecturer/i, /instructor/i, /designation/i, /staff/i],
  [INTENTS.COURSE_QUERY]: [/course/i, /semester/i, /credit/i, /syllabus/i, /curriculum/i, /subject/i, /core/i, /elective/i],
  [INTENTS.DEPARTMENT_QUERY]: [/department/i, /branch/i, /stream/i, /specialization/i, /intake/i, /seat/i],
  [INTENTS.NOTICE_QUERY]: [/notice/i, /announcement/i, /notification/i, /circular/i, /urgent/i, /pinned/i],
  [INTENTS.EVENT_QUERY]: [/event/i, /festival/i, /workshop/i, /hackathon/i, /sports/i, /cultural/i, /seminar/i],
  [INTENTS.SCHOLARSHIP_QUERY]: [/scholarship/i, /stipend/i, /funding/i, /eligibility/i, /deadline/i, /application/i],
  [INTENTS.PLACEMENT_QUERY]: [/placement/i, /job/i, /recruit/i, /company/i, /salary/i, /lpa/i, /package/i, /internship/i, /tpo/i],
  [INTENTS.LIBRARY_QUERY]: [/library/i, /book/i, /journal/i, /borrow/i, /fine/i, /due/i, /overdue/i, /digital resource/i],
  [INTENTS.HOSTEL_QUERY]: [/hostel/i, /mess/i, /room/i, /warden/i, /curfew/i, /rent/i, /stay/i, /accommodation/i],
  [INTENTS.EXAM_QUERY]: [/exam/i, /test/i, /timetable/i, /schedule/i, /mid-sem/i, /backlog/i, /atkt/i, /result/i, /marks/i],
  [INTENTS.ATTENDANCE_QUERY]: [/attendance/i, /percentage/i, /absent/i, /present/i, /detain/i, /medical leave/i, /shortage/i],
};

/**
 * Classifies a user query into one of the predefined intents.
 * Calculates confidence scores based on keyword matching.
 *
 * @param {string} query - The natural language query from the user.
 * @returns {{ intent: string, confidence: number }} Classified intent and confidence score (0 to 1).
 */
const classifyIntent = (query) => {
  if (!query || typeof query !== 'string') {
    return { intent: INTENTS.GENERAL_QUERY, confidence: 1.0 };
  }

  const cleanQuery = query.toLowerCase().trim();
  const scores = {};

  // Initialize scores
  Object.keys(INTENTS).forEach((intent) => {
    scores[intent] = 0;
  });

  // Calculate scores based on regex matches
  for (const [intent, regexList] of Object.entries(KEYWORDS)) {
    let matchCount = 0;
    regexList.forEach((regex) => {
      if (regex.test(cleanQuery)) {
        matchCount++;
      }
    });

    if (matchCount > 0) {
      // Calculate normalized score based on matches
      scores[intent] = matchCount / regexList.length;
    }
  }

  // Find intent with highest score
  let bestIntent = INTENTS.GENERAL_QUERY;
  let maxScore = 0;

  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestIntent = intent;
    }
  }

  // If score is too low, fallback to general query
  if (maxScore < 0.1) {
    return { intent: INTENTS.GENERAL_QUERY, confidence: 1.0 };
  }

  return {
    intent: bestIntent,
    confidence: parseFloat(maxScore.toFixed(2)),
  };
};

module.exports = { INTENTS, classifyIntent };
