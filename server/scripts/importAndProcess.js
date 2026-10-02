/**
 * Document Import & Ingestion Script
 *
 * Imports generated demo PDFs into the Document Management System:
 * 1. Registers each PDF as a Document record
 * 2. Copies files to the correct storage location
 * 3. Computes checksums
 * 4. Creates audit logs
 * 5. Runs the processing pipeline (text extraction + chunking)
 *
 * Usage: node scripts/importAndProcess.js
 *
 * @module scripts/importAndProcess
 */

'use strict';

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const readFileAsync = promisify(fs.readFile);
const copyFileAsync = promisify(fs.copyFile);
const statAsync = promisify(fs.stat);

const prisma = new PrismaClient();

// Import services directly (not singletons — we need fresh instances)
const DocumentProcessingService = require('../src/services/documentProcessing.service');
const ChunkingService = require('../src/services/chunking.service');

// ─── Document Manifest ────────────────────────────────────────────
const DOCUMENT_MANIFEST = [
  { filename: 'admission_brochure.pdf', title: 'Admission Brochure 2025-26', category: 'ADMISSION', visibility: 'PUBLIC', description: 'Comprehensive guide covering admission process, eligibility criteria, departments offered, fee overview, and campus facilities for prospective students.' },
  { filename: 'academic_calendar_2025_26.pdf', title: 'Academic Calendar 2025-26', category: 'ACADEMICS', visibility: 'PUBLIC', description: 'Official academic calendar with semester dates, examination schedules, holidays, and important event dates for the 2025-26 academic year.' },
  { filename: 'student_handbook.pdf', title: 'Student Handbook 2025-26', category: 'STUDENT_HANDBOOK', visibility: 'STUDENTS', description: 'Complete student guide covering code of conduct, academic policies, grading system, attendance rules, discipline procedures, and campus life.' },
  { filename: 'faculty_handbook.pdf', title: 'Faculty Handbook 2025-26', category: 'FACULTY_HANDBOOK', visibility: 'FACULTY', description: 'Comprehensive faculty reference covering teaching expectations, evaluation methods, leave policies, research guidelines, and mentoring responsibilities.' },
  { filename: 'course_catalogue.pdf', title: 'Course Catalogue 2025-26', category: 'ACADEMICS', visibility: 'PUBLIC', description: 'Complete listing of all courses offered across 12 departments, including credit structure, prerequisites, and elective offerings.' },
  { filename: 'examination_regulations.pdf', title: 'Examination Regulations', category: 'EXAMINATION', visibility: 'STUDENTS', description: 'Official examination rules covering internal/external assessments, grading rubric, re-examination policies, and malpractice penalties.' },
  { filename: 'fee_structure_2025_26.pdf', title: 'Fee Structure 2025-26', category: 'FEES', visibility: 'PUBLIC', description: 'Department-wise fee tables including tuition, development, lab, library, and examination fees with payment schedule and refund policy.' },
  { filename: 'hostel_rules.pdf', title: 'Hostel Rules & Regulations', category: 'HOSTEL', visibility: 'STUDENTS', description: 'Complete hostel guidelines covering accommodation types, room allocation, mess timings, visitor policy, and disciplinary rules.' },
  { filename: 'library_rules.pdf', title: 'Library Rules & Guidelines', category: 'LIBRARY', visibility: 'PUBLIC', description: 'Library membership details, borrowing limits, fine structure, digital library access, reading room hours, and inter-library loan procedures.' },
  { filename: 'placement_brochure.pdf', title: 'Placement Brochure 2025-26', category: 'PLACEMENT', visibility: 'PUBLIC', description: 'Training & Placement Cell brochure with placement statistics, top recruiters, salary packages, and industry partnerships.' },
  { filename: 'scholarship_guide.pdf', title: 'Scholarship Guide 2025-26', category: 'SCHOLARSHIP', visibility: 'PUBLIC', description: 'Guide to government and institutional scholarships including eligibility criteria, application procedures, and award amounts.' },
  { filename: 'internship_guidelines.pdf', title: 'Internship Guidelines', category: 'PLACEMENT', visibility: 'STUDENTS', description: 'Mandatory internship requirements, industry partnership details, documentation guidelines, and evaluation criteria.' },
  { filename: 'transportation_guide.pdf', title: 'Transportation Guide', category: 'TRANSPORTATION', visibility: 'PUBLIC', description: 'Bus routes, schedules, fees, pass information, and pickup/drop points for the college transportation service.' },
  { filename: 'campus_facilities_guide.pdf', title: 'Campus Facilities Guide', category: 'POLICIES', visibility: 'PUBLIC', description: 'Overview of all campus facilities including labs, library, sports complex, auditorium, canteen, medical center, and amenities.' },
  { filename: 'anti_ragging_policy.pdf', title: 'Anti-Ragging Policy', category: 'POLICIES', visibility: 'PUBLIC', description: 'Zero tolerance anti-ragging policy as per UGC regulations, including reporting procedures, helpline numbers, and penalties.' },
  { filename: 'attendance_policy.pdf', title: 'Attendance Policy', category: 'POLICIES', visibility: 'STUDENTS', description: 'Attendance requirements (75% minimum), condonation policy, medical leave procedures, and consequences of attendance shortage.' },
  { filename: 'laboratory_safety_manual.pdf', title: 'Laboratory Safety Manual', category: 'LABORATORY', visibility: 'FACULTY', description: 'Comprehensive lab safety guidelines covering electrical, chemical, and fire safety protocols, emergency procedures, and PPE requirements.' },
  { filename: 'research_innovation_handbook.pdf', title: 'Research & Innovation Handbook', category: 'RESEARCH', visibility: 'FACULTY', description: 'Research center details, funded projects, publication incentives, patent filing procedures, startup incubation, and research ethics.' },
  { filename: 'club_society_handbook.pdf', title: 'Club & Society Handbook', category: 'EVENTS', visibility: 'PUBLIC', description: 'Guide to technical, cultural, and sports clubs, student chapters, registration process, and annual event calendar.' },
  { filename: 'faq_handbook.pdf', title: 'Frequently Asked Questions Handbook', category: 'OTHER', visibility: 'PUBLIC', description: 'Comprehensive FAQ covering admission, fees, academics, hostel, placement, library, examinations, and campus life.' }
];

/**
 * Computes SHA-256 checksum of a file.
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} Hex checksum
 */
async function computeChecksum(filePath) {
  const buffer = await readFileAsync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Ensures a directory exists, creating it recursively if needed.
 * @param {string} dirPath - Directory path
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Imports all generated demo PDFs and processes them through the ingestion pipeline.
 */
async function importAndProcess() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   CampusAI Document Import & Ingestion Pipeline  ');
  console.log('═══════════════════════════════════════════════════\n');

  // Load environment variables
  require('dotenv').config({ path: path.join(__dirname, '../.env') });

  const generatedDir = path.join(__dirname, '../storage/documents/generated');
  // Use the same base path as the storage provider
  const storagBasePath = process.env.UPLOAD_PATH || path.join(__dirname, '../storage/documents');
  const originalsDir = path.join(storagBasePath, 'originals');

  // Verify generated directory exists
  if (!fs.existsSync(generatedDir)) {
    console.error('❌ Generated documents directory not found:', generatedDir);
    console.log('   Run `node scripts/generateDemoPdfs.js` first.');
    process.exit(1);
  }

  // Get the super admin user and college for ownership
  const superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' }
  });

  if (!superAdmin) {
    console.error('❌ Super Admin user not found. Run seed first.');
    process.exit(1);
  }

  const college = await prisma.college.findFirst();
  if (!college) {
    console.error('❌ No college found. Run seed first.');
    process.exit(1);
  }

  console.log(`📋 College: ${college.name}`);
  console.log(`👤 Uploader: ${superAdmin.name} (${superAdmin.email})`);
  console.log(`📁 Source: ${generatedDir}`);
  console.log(`📁 Target: ${originalsDir}\n`);

  const results = {
    imported: 0,
    processed: 0,
    chunked: 0,
    totalChunks: 0,
    errors: [],
    documents: []
  };

  for (let i = 0; i < DOCUMENT_MANIFEST.length; i++) {
    const manifest = DOCUMENT_MANIFEST[i];
    const sourcePath = path.join(generatedDir, manifest.filename);
    const progress = `[${i + 1}/${DOCUMENT_MANIFEST.length}]`;

    console.log(`${progress} Processing: ${manifest.title}`);

    // Check if file exists
    if (!fs.existsSync(sourcePath)) {
      const errMsg = `File not found: ${manifest.filename}`;
      console.log(`  ⚠️  ${errMsg} — skipping`);
      results.errors.push({ document: manifest.title, error: errMsg });
      continue;
    }

    try {
      // ── Step 1: Import ─────────────────────────────────────────
      const fileStats = await statAsync(sourcePath);
      const checksum = await computeChecksum(sourcePath);
      const { v4: uuidv4 } = require('uuid');
      const storedFileName = `${uuidv4()}-${Date.now()}.pdf`;
      const categoryDir = path.join(originalsDir, manifest.category);
      ensureDir(categoryDir);
      const destPath = path.join(categoryDir, storedFileName);

      // Copy file to storage
      await copyFileAsync(sourcePath, destPath);

      // Check for duplicate
      const existing = await prisma.document.findFirst({
        where: { checksum, collegeId: college.id, deletedAt: null }
      });

      if (existing) {
        console.log(`  ⏩ Duplicate detected (checksum match) — skipping import`);
        continue;
      }

      // Create document record
      const doc = await prisma.document.create({
        data: {
          collegeId: college.id,
          title: manifest.title,
          description: manifest.description,
          category: manifest.category,
          visibility: manifest.visibility,
          tags: [manifest.category.toLowerCase(), 'demo', '2025-26'],
          fileName: storedFileName,
          originalFileName: manifest.filename,
          filePath: `originals/${manifest.category}/${storedFileName}`,
          mimeType: 'application/pdf',
          fileSize: fileStats.size,
          checksum,
          version: 1,
          status: 'UPLOADED',
          uploadedById: superAdmin.id
        }
      });

      // Create audit log
      await prisma.documentAuditLog.create({
        data: {
          documentId: doc.id,
          userId: superAdmin.id,
          action: 'UPLOADED',
          details: {
            source: 'automated_import',
            originalFile: manifest.filename,
            category: manifest.category
          },
          version: 1
        }
      });

      results.imported++;
      console.log(`  ✅ Imported: ${doc.id} (${(fileStats.size / 1024).toFixed(1)} KB)`);

      // ── Step 2: Process (Text Extraction) ─────────────────────
      let structured;
      try {
        structured = await DocumentProcessingService.processDocument(doc.id);
        results.processed++;
        console.log(`  📄 Extracted: ${structured.totalPages} pages, ${structured.totalCharacters} chars, ${structured.headings.length} headings`);
      } catch (procErr) {
        console.log(`  ⚠️  Processing failed: ${procErr.message}`);
        results.errors.push({ document: manifest.title, error: `Processing: ${procErr.message}` });
        continue;
      }

      // ── Step 3: Chunk ─────────────────────────────────────────
      try {
        const chunkResult = await ChunkingService.chunkDocument(doc.id, structured);
        results.chunked++;
        results.totalChunks += chunkResult.totalChunks;
        console.log(`  🔪 Chunked: ${chunkResult.totalChunks} chunks`);
      } catch (chunkErr) {
        console.log(`  ⚠️  Chunking failed: ${chunkErr.message}`);
        results.errors.push({ document: manifest.title, error: `Chunking: ${chunkErr.message}` });
      }

      results.documents.push({
        id: doc.id,
        title: manifest.title,
        category: manifest.category,
        pages: structured ? structured.totalPages : 0,
        chunks: results.totalChunks
      });

      console.log('');
    } catch (err) {
      console.log(`  ❌ Error: ${err.message}`);
      results.errors.push({ document: manifest.title, error: err.message });
    }
  }

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════');
  console.log('                   SUMMARY                        ');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  📥 Imported:  ${results.imported}/${DOCUMENT_MANIFEST.length}`);
  console.log(`  📄 Processed: ${results.processed}/${results.imported}`);
  console.log(`  🔪 Chunked:   ${results.chunked}/${results.processed}`);
  console.log(`  📦 Total Chunks: ${results.totalChunks}`);

  if (results.errors.length > 0) {
    console.log(`\n  ⚠️  Errors (${results.errors.length}):`);
    results.errors.forEach(e => console.log(`    - ${e.document}: ${e.error}`));
  }

  console.log('\n═══════════════════════════════════════════════════\n');

  return results;
}

// ─── Run if executed directly ─────────────────────────────────────
if (require.main === module) {
  importAndProcess()
    .then((results) => {
      console.log('✅ Import & ingestion pipeline complete.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Pipeline failed:', err);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

module.exports = { importAndProcess, DOCUMENT_MANIFEST };
