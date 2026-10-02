/**
 * Document Processing Service
 *
 * Handles the ingestion pipeline for documents:
 * PDF → Text Extraction → Cleaning → Page/Section Detection → Storage
 *
 * Uses pdf-parse for text extraction and preserves structural metadata
 * (page numbers, headings, sections) for future RAG indexing.
 *
 * @module services/documentProcessing.service
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const pdfParse = require('pdf-parse');
const documentRepository = require('../repositories/document.repository');
const { getStorageProvider } = require('../config/storage');
const logger = require('../config/logger');

const readFileAsync = promisify(fs.readFile);

class DocumentProcessingService {
  /**
   * Processes a single document through the full ingestion pipeline.
   * Creates a processing job, extracts text, stores extracted content.
   *
   * @param {string} documentId - The ID of the document to process
   * @returns {Promise<Object>} Processing result with extracted data
   */
  async processDocument(documentId) {
    const doc = await documentRepository.findById(documentId);
    if (!doc) {
      throw new Error(`Document not found: ${documentId}`);
    }

    // Create processing job
    const job = await documentRepository.createProcessingJob({
      documentId,
      jobType: 'EXTRACT_TEXT',
      status: 'RUNNING',
      startedAt: new Date()
    });

    try {
      // Update document status to PROCESSING
      await documentRepository.updateStatus(documentId, 'PROCESSING');

      logger.info('📄 Starting document processing', {
        documentId,
        title: doc.title,
        jobId: job.id
      });

      // Step 1: Read PDF file
      const storage = getStorageProvider();
      const fullPath = path.join(storage.basePath, doc.filePath);
      const fileBuffer = await readFileAsync(fullPath);

      // Step 2: Extract text from PDF
      const extracted = await this._extractText(fileBuffer);

      // Step 3: Parse into pages with structure
      const pages = this._parsePages(extracted);

      // Step 4: Clean and structure content
      const structured = this._structureContent(pages);

      // Update processing job as completed
      await documentRepository.updateProcessingJob(job.id, {
        status: 'COMPLETED',
        completedAt: new Date(),
        result: {
          totalPages: structured.totalPages,
          totalCharacters: structured.totalCharacters,
          headingsFound: structured.headings.length,
          sectionsFound: structured.sections.length
        }
      });

      // Update document status to READY
      await documentRepository.updateStatus(documentId, 'READY');

      logger.info('✅ Document processing completed', {
        documentId,
        totalPages: structured.totalPages,
        totalCharacters: structured.totalCharacters,
        headingsFound: structured.headings.length
      });

      return structured;
    } catch (error) {
      logger.error('❌ Document processing failed', {
        documentId,
        error: error.message
      });

      await documentRepository.updateProcessingJob(job.id, {
        status: 'FAILED',
        completedAt: new Date(),
        errorMessage: error.message,
        attempts: job.attempts + 1
      });

      await documentRepository.updateStatus(documentId, 'FAILED');
      throw error;
    }
  }

  /**
   * Extracts raw text from a PDF buffer using pdf-parse.
   *
   * @param {Buffer} fileBuffer - The PDF file as a buffer
   * @returns {Promise<Object>} Extracted text data with page info
   * @private
   */
  async _extractText(fileBuffer) {
    const pageTexts = [];

    const options = {
      // Custom page renderer to capture per-page text
      pagerender: (pageData) => {
        return pageData.getTextContent().then((textContent) => {
          let lastY = -1;
          let text = '';

          for (const item of textContent.items) {
            if (lastY !== -1 && Math.abs(lastY - item.transform[5]) > 2) {
              text += '\n';
            }
            text += item.str;
            lastY = item.transform[5];
          }

          pageTexts.push(text);
          return text;
        });
      }
    };

    const result = await pdfParse(fileBuffer, options);

    return {
      fullText: result.text,
      pageTexts,
      numPages: result.numpages,
      info: result.info || {},
      metadata: result.metadata || {}
    };
  }

  /**
   * Parses extracted text into page-by-page structured data.
   *
   * @param {Object} extracted - The raw extracted data from pdf-parse
   * @returns {Array<Object>} Array of page objects with text and metadata
   * @private
   */
  _parsePages(extracted) {
    const pages = [];

    for (let i = 0; i < extracted.pageTexts.length; i++) {
      const rawText = extracted.pageTexts[i];
      const cleanedText = this._cleanText(rawText);

      if (cleanedText.trim().length === 0) continue;

      const headings = this._extractHeadings(cleanedText);

      pages.push({
        pageNumber: i + 1,
        rawText,
        cleanedText,
        headings,
        charCount: cleanedText.length
      });
    }

    return pages;
  }

  /**
   * Cleans raw extracted text by fixing common PDF extraction artifacts.
   *
   * @param {string} text - Raw text from PDF
   * @returns {string} Cleaned text
   * @private
   */
  _cleanText(text) {
    if (!text) return '';

    let cleaned = text;

    // Fix common PDF extraction issues
    // Remove excessive whitespace between characters (common in PDFs)
    cleaned = cleaned.replace(/([a-zA-Z])\s{2,}([a-zA-Z])/g, '$1 $2');

    // Normalize line endings
    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/\r/g, '\n');

    // Remove page numbers that appear alone on a line
    cleaned = cleaned.replace(/^\s*\d+\s*$/gm, '');

    // Fix hyphenation at line breaks
    cleaned = cleaned.replace(/(\w)-\n(\w)/g, '$1$2');

    // Collapse multiple blank lines into at most two
    cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');

    // Trim each line
    cleaned = cleaned
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n');

    // Trim overall
    cleaned = cleaned.trim();

    return cleaned;
  }

  /**
   * Extracts heading-like lines from text using heuristics.
   * Detects patterns like numbered sections, ALL-CAPS lines, etc.
   *
   * @param {string} text - Cleaned page text
   * @returns {Array<Object>} Array of {text, level} heading objects
   * @private
   */
  _extractHeadings(text) {
    const headings = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.length < 3 || trimmed.length > 200) continue;

      // Pattern 1: Numbered sections like "1. Introduction", "2.1 Overview"
      const numberedMatch = trimmed.match(/^(\d+(?:\.\d+)*)\s+(.+)/);
      if (numberedMatch) {
        const depth = numberedMatch[1].split('.').length;
        const headingText = numberedMatch[2].trim();
        // Only consider it a heading if it's relatively short
        if (headingText.length < 100 && !headingText.endsWith('.')) {
          headings.push({
            text: trimmed,
            level: Math.min(depth, 4)
          });
          continue;
        }
      }

      // Pattern 2: ALL CAPS lines (likely headings)
      if (
        trimmed === trimmed.toUpperCase() &&
        trimmed.length > 3 &&
        trimmed.length < 80 &&
        /[A-Z]/.test(trimmed) &&
        !trimmed.match(/^\d+$/) &&
        !trimmed.includes('@') &&
        !trimmed.includes('http')
      ) {
        headings.push({
          text: trimmed,
          level: 1
        });
        continue;
      }

      // Pattern 3: Chapter/Section prefixed lines
      const chapterMatch = trimmed.match(/^(Chapter|Section|Part|Article|Appendix)\s+[\dIVXivx]+[.:]\s*(.*)/i);
      if (chapterMatch) {
        headings.push({
          text: trimmed,
          level: 1
        });
      }
    }

    return headings;
  }

  /**
   * Structures the full document content from page data.
   *
   * @param {Array<Object>} pages - Array of page objects
   * @returns {Object} Structured document content
   * @private
   */
  _structureContent(pages) {
    const allHeadings = [];
    const sections = [];
    let currentSection = null;
    let totalCharacters = 0;

    for (const page of pages) {
      totalCharacters += page.charCount;

      for (const heading of page.headings) {
        allHeadings.push({
          ...heading,
          pageNumber: page.pageNumber
        });
      }

      // Build sections from headings
      if (page.headings.length > 0) {
        for (const heading of page.headings) {
          if (currentSection) {
            sections.push(currentSection);
          }
          currentSection = {
            title: heading.text,
            level: heading.level,
            startPage: page.pageNumber,
            endPage: page.pageNumber,
            content: page.cleanedText
          };
        }
      } else if (currentSection) {
        currentSection.endPage = page.pageNumber;
        currentSection.content += '\n\n' + page.cleanedText;
      } else {
        currentSection = {
          title: 'Introduction',
          level: 1,
          startPage: page.pageNumber,
          endPage: page.pageNumber,
          content: page.cleanedText
        };
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return {
      totalPages: pages.length,
      totalCharacters,
      pages,
      headings: allHeadings,
      sections
    };
  }
}

module.exports = new DocumentProcessingService();
