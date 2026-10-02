/**
 * Main API Router
 *
 * Central router that mounts all sub-routers under their respective paths.
 * All routes are prefixed with /api by the Express app.
 *
 * @module routes/index
 */

'use strict';

const express = require('express');
const router = express.Router();

// ─── Route Modules ────────────────────────────────────────────────
const healthRoutes = require('./health.routes');

const authRoutes = require('./auth.routes');

// ─── Mount Routes ─────────────────────────────────────────────────
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/documents', require('./document.routes'));
router.use('/retrieval', require('./retrieval.routes')); // Phase 6B.2B
router.use('/chat', require('./chat.routes')); // Phase 6C

// ─── Placeholder comments for Phase 3+ routes ─────────────────────
// router.use('/auth', require('./auth.routes'));           // Phase 3
// router.use('/users', require('./user.routes'));          // Phase 3
// router.use('/departments', require('./department.routes')); // Phase 4
// router.use('/faculty', require('./faculty.routes'));     // Phase 4
// router.use('/courses', require('./course.routes'));      // Phase 4
// router.use('/fees', require('./fee.routes'));            // Phase 4
// router.use('/notices', require('./notice.routes'));      // Phase 4
// router.use('/events', require('./event.routes'));        // Phase 4
// router.use('/scholarships', require('./scholarship.routes')); // Phase 4
// router.use('/placement', require('./placement.routes')); // Phase 4
// router.use('/chat', require('./chat.routes'));           // Phase 7
// router.use('/documents', require('./document.routes')); // Phase 8
// router.use('/analytics', require('./analytics.routes')); // Phase 5

module.exports = router;
