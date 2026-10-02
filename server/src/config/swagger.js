/**
 * @fileoverview Swagger / OpenAPI 3.0 Configuration
 * @description Sets up swagger-jsdoc and swagger-ui-express for interactive
 *              API documentation. Route files are scanned automatically for
 *              JSDoc @swagger annotations.
 *
 * @module src/config/swagger
 *
 * @example
 * // In app.js:
 * const { swaggerSpec, swaggerUi } = require('./config/swagger');
 * app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 */

'use strict';

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

// ─── OpenAPI Specification ────────────────────────────────────────────────────

/**
 * swagger-jsdoc options that define the OpenAPI specification structure.
 * All JSDoc @swagger / @openapi annotations in route files are automatically
 * merged into this spec at startup.
 *
 * @type {import('swagger-jsdoc').Options}
 */
const swaggerOptions = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'CampusAI API',
      version: '1.0.0',
      description: `
## CampusAI — Intelligent College Assistant

A production-grade REST API powering the CampusAI platform, providing:
- 🔐 **JWT Authentication** with role-based access control
- 🤖 **AI-powered Chat** using Google Gemini 2.0 Flash
- 📚 **RAG Pipeline** with pgvector semantic search
- 🏫 **College Management** — departments, faculty, courses, fees
- 📢 **Notices & Events** management
- 💰 **Scholarships & Placements** tracking
- 📄 **Document Processing** (PDF → vector embeddings)

### Authentication
Use the **Authorize** button (🔒) to set your Bearer token.
Format: \`Bearer <your_access_token>\`

### Rate Limits
| Endpoint Type | Limit |
|---|---|
| Global | 100 req / 15 min |
| Auth endpoints | 5 req / 15 min |
| AI Chat | 20 req / min |
| File Upload | 5 req / hour |
| Guest queries | 5 per day |
      `.trim(),
      contact: {
        name: 'CampusAI Support',
        email: 'support@campusai.edu',
        url: 'https://campusai.edu',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },

    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Development Server',
      },
      {
        url: 'https://api.campusai.edu',
        description: 'Production Server',
      },
    ],

    // ── Security Schemes ────────────────────────────────────────────────────
    components: {
      securitySchemes: {
        /**
         * JWT Bearer Authentication.
         * Tokens are obtained via POST /api/auth/login or POST /api/auth/register.
         * Access tokens expire in 15 minutes; refresh tokens expire in 7 days.
         */
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token. Obtain it from /api/auth/login',
        },
      },

      // ── Reusable Response Schemas ─────────────────────────────────────────
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation successful' },
            data: { type: 'object', description: 'Response payload' },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', format: 'uuid' },
          },
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            code: { type: 'string', example: 'VALIDATION_ERROR' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
            requestId: { type: 'string', format: 'uuid' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
              },
            },
          },
        },
        CitationChunk: {
          type: 'object',
          description: 'A citation-ready document chunk returned from vector search',
          properties: {
            chunkId: { type: 'string', format: 'uuid', description: 'Unique chunk identifier', example: '6ae151bf-108f-49d3-9aed-c53bd4db7c0f' },
            documentId: { type: 'string', format: 'uuid', description: 'Parent document UUID' },
            documentTitle: { type: 'string', description: 'Title of the parent document', example: 'Fee Structure 2025-26' },
            pageNumber: { type: 'integer', description: 'Page number in the source PDF', example: 1 },
            sectionTitle: { type: 'string', description: 'Section title extracted during chunking', example: 'Tuition Fee Table' },
            heading: { type: 'string', description: 'Heading of the chunk', example: 'Department-wise Fee Breakdown' },
            content: { type: 'string', description: 'Full text content of the chunk' },
            similarityScore: { type: 'number', format: 'float', description: 'Cosine similarity score (0.0–1.0)', example: 0.6844 },
            category: { type: 'string', enum: ['ADMISSION', 'ACADEMICS', 'EXAMINATION', 'LIBRARY', 'HOSTEL', 'FEES', 'PLACEMENT', 'SCHOLARSHIP', 'TRANSPORTATION', 'LABORATORY', 'POLICIES', 'STUDENT_HANDBOOK', 'FACULTY_HANDBOOK', 'RESEARCH', 'EVENTS', 'NOTICES', 'OTHER'], example: 'FEES' },
            visibility: { type: 'string', enum: ['PUBLIC', 'STUDENTS', 'FACULTY', 'ADMIN', 'PRIVATE'], example: 'ADMIN' },
            chunkIndex: { type: 'integer', description: 'Order index within the document', example: 0 },
            tokenCount: { type: 'integer', description: 'Estimated token count', example: 512 },
          },
        },
        ChatSession: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            title: { type: 'string', example: 'Attendance and Examination Rules' },
            isActive: { type: 'boolean', example: true },
            messageCount: { type: 'integer', example: 4 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ChatMessage: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            sessionId: { type: 'string', format: 'uuid' },
            role: { type: 'string', enum: ['USER', 'ASSISTANT'], example: 'ASSISTANT' },
            content: { type: 'string', example: 'According to the Attendance Policy, students must maintain a minimum of 75% attendance...' },
            sources: { type: 'array', items: { $ref: '#/components/schemas/CitationChunk' } },
            tokensUsed: { type: 'integer', example: 420 },
            responseTimeMs: { type: 'integer', example: 1250 },
            feedback: { type: 'string', enum: ['POSITIVE', 'NEGATIVE', 'NONE'], example: 'NONE' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },

      // ── Reusable Parameters ───────────────────────────────────────────────
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number (1-indexed)',
          schema: { type: 'integer', minimum: 1, default: 1 },
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of records per page',
          schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search term for filtering results',
          schema: { type: 'string' },
        },
        IdParam: {
          name: 'id',
          in: 'path',
          required: true,
          description: 'Resource UUID',
          schema: { type: 'string', format: 'uuid' },
        },
      },

      // ── Reusable Responses ────────────────────────────────────────────────
      responses: {
        Unauthorized: {
          description: 'Unauthorized — missing or invalid JWT token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
              example: {
                success: false,
                message: 'Authentication required',
                code: 'UNAUTHORIZED',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden — insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
              example: {
                success: false,
                message: 'You do not have permission to perform this action',
                code: 'FORBIDDEN',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
              example: {
                success: false,
                message: 'Resource not found',
                code: 'NOT_FOUND',
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation error — invalid request body',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
              example: {
                success: false,
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                errors: [{ field: 'email', message: 'Invalid email format' }],
              },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
              example: {
                success: false,
                message: 'Too many requests. Please try again later.',
                code: 'RATE_LIMIT_EXCEEDED',
              },
            },
          },
        },
        InternalError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
              example: {
                success: false,
                message: 'An unexpected error occurred. Please try again.',
                code: 'INTERNAL_SERVER_ERROR',
              },
            },
          },
        },
      },
    },

    // ── API Tags ──────────────────────────────────────────────────────────────
    tags: [
      { name: 'Health', description: 'System health and connectivity checks' },
      { name: 'Auth', description: 'Authentication — register, login, refresh, logout' },
      { name: 'Users', description: 'User profile management' },
      { name: 'Departments', description: 'Academic department management' },
      { name: 'Faculty', description: 'Faculty member management' },
      { name: 'Courses', description: 'Course catalog management' },
      { name: 'Fees', description: 'Fee structure management' },
      { name: 'Notices', description: 'College notices and announcements' },
      { name: 'Events', description: 'College events management' },
      { name: 'Scholarships', description: 'Scholarship listings' },
      { name: 'Placement', description: 'Placement statistics and records' },
      { name: 'Chat', description: 'AI-powered chat with RAG pipeline' },
      { name: 'Documents', description: 'PDF document upload and processing' },
      { name: 'Retrieval', description: 'AI Vector Similarity Search — semantic retrieval over document embeddings (pgvector)' },
      { name: 'Analytics', description: 'Usage analytics and reporting' },
    ],

    // ── Global Security ───────────────────────────────────────────────────────
    security: [{ bearerAuth: [] }],

    // ── Retrieval API Paths (Phase 6B.2B) ─────────────────────────────────────
    paths: {
      '/api/retrieval/search': {
        post: {
          summary: 'Semantic vector search across all document chunks',
          description: 'Generates a 768-dim embedding for the query text using Google Gemini (models/gemini-embedding-001), then performs cosine similarity search over all DocumentChunk embeddings using the pgvector HNSW index. Supports metadata filtering by category, visibility, and specific document. RBAC is automatically enforced based on the caller JWT role.',
          tags: ['Retrieval'],
          security: [{ bearerAuth: [] }, {}],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['query'],
                  properties: {
                    query: { type: 'string', description: 'Natural language search query', example: 'What are the tuition fees for Computer Engineering?' },
                    topK: { type: 'integer', description: 'Maximum number of chunks to return (1-50)', default: 5, minimum: 1, maximum: 50, example: 5 },
                    minSimilarity: { type: 'number', format: 'float', description: 'Minimum cosine similarity threshold (0.0-1.0)', default: 0.25, example: 0.3 },
                    category: { type: 'string', description: 'Filter by document category', enum: ['ADMISSION', 'ACADEMICS', 'EXAMINATION', 'LIBRARY', 'HOSTEL', 'FEES', 'PLACEMENT', 'SCHOLARSHIP', 'TRANSPORTATION', 'LABORATORY', 'POLICIES', 'STUDENT_HANDBOOK', 'FACULTY_HANDBOOK', 'RESEARCH', 'EVENTS', 'NOTICES', 'OTHER'], example: 'FEES' },
                    visibility: { type: 'string', description: 'Explicit visibility filter (overrides RBAC for admins)', enum: ['PUBLIC', 'STUDENTS', 'FACULTY', 'ADMIN', 'PRIVATE'] },
                    documentId: { type: 'string', format: 'uuid', description: 'Restrict search to a specific parent document' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Vector search results ranked by cosine similarity',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Found 3 relevant citation chunks' },
                      data: {
                        type: 'object',
                        properties: {
                          query: { type: 'string' },
                          totalResults: { type: 'integer', example: 3 },
                          topK: { type: 'integer', example: 5 },
                          durationMs: { type: 'integer', example: 81 },
                          results: { type: 'array', items: { $ref: '#/components/schemas/CitationChunk' } },
                        },
                      },
                    },
                  },
                },
              },
            },
            400: { description: 'Missing or empty query parameter', content: { 'application/json': { schema: { $ref: '#/components/schemas/ApiError' } } } },
            500: { $ref: '#/components/responses/InternalError' },
          },
        },
        get: {
          summary: 'Semantic vector search (GET variant)',
          description: 'Same as POST /api/retrieval/search but accepts the query via query parameters. Useful for browser testing and cURL.',
          tags: ['Retrieval'],
          security: [{ bearerAuth: [] }, {}],
          parameters: [
            { name: 'q', in: 'query', required: true, description: 'Natural language search query', schema: { type: 'string', example: 'What is the minimum attendance required?' } },
            { name: 'topK', in: 'query', description: 'Maximum number of results (1-50)', schema: { type: 'integer', default: 5 } },
            { name: 'minSimilarity', in: 'query', description: 'Minimum cosine similarity threshold (0.0-1.0)', schema: { type: 'number', default: 0.25 } },
            { name: 'category', in: 'query', description: 'Filter by document category', schema: { type: 'string', enum: ['ADMISSION', 'ACADEMICS', 'EXAMINATION', 'LIBRARY', 'HOSTEL', 'FEES', 'PLACEMENT', 'SCHOLARSHIP', 'TRANSPORTATION', 'LABORATORY', 'POLICIES', 'STUDENT_HANDBOOK', 'FACULTY_HANDBOOK', 'RESEARCH', 'EVENTS', 'NOTICES', 'OTHER'] } },
            { name: 'documentId', in: 'query', description: 'Restrict search to a specific document UUID', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: {
              description: 'Vector search results ranked by cosine similarity',
              content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { query: { type: 'string' }, totalResults: { type: 'integer' }, results: { type: 'array', items: { $ref: '#/components/schemas/CitationChunk' } } } } } } } },
            },
            400: { description: 'Missing query parameter' },
          },
        },
      },

      '/api/retrieval/document/{documentId}/search': {
        post: {
          summary: 'Search within a specific document',
          description: 'Restricts vector similarity search to chunks belonging to a single parent document. Useful for in-document Q&A.',
          tags: ['Retrieval'],
          security: [{ bearerAuth: [] }, {}],
          parameters: [
            { name: 'documentId', in: 'path', required: true, description: 'UUID of the parent document to search within', schema: { type: 'string', format: 'uuid' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['query'], properties: { query: { type: 'string', example: 'What is the late fee penalty?' }, topK: { type: 'integer', default: 5 }, minSimilarity: { type: 'number', default: 0.2 } } },
              },
            },
          },
          responses: {
            200: { description: 'Chunks matching query within the specified document', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { query: { type: 'string' }, documentId: { type: 'string' }, totalResults: { type: 'integer' }, results: { type: 'array', items: { $ref: '#/components/schemas/CitationChunk' } } } } } } } } },
            400: { description: 'Missing query parameter' },
          },
        },
      },

      '/api/retrieval/category/{category}/search': {
        post: {
          summary: 'Search within a specific document category',
          description: 'Restricts vector similarity search to documents matching the specified category (e.g. FEES, ADMISSION, HOSTEL, PLACEMENT).',
          tags: ['Retrieval'],
          security: [{ bearerAuth: [] }, {}],
          parameters: [
            { name: 'category', in: 'path', required: true, description: 'Document category to filter by', schema: { type: 'string', enum: ['ADMISSION', 'ACADEMICS', 'EXAMINATION', 'LIBRARY', 'HOSTEL', 'FEES', 'PLACEMENT', 'SCHOLARSHIP', 'TRANSPORTATION', 'LABORATORY', 'POLICIES', 'STUDENT_HANDBOOK', 'FACULTY_HANDBOOK', 'RESEARCH', 'EVENTS', 'NOTICES', 'OTHER'], example: 'FEES' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { type: 'object', required: ['query'], properties: { query: { type: 'string', example: 'What are the scholarship eligibility criteria?' }, topK: { type: 'integer', default: 5 }, minSimilarity: { type: 'number', default: 0.25 } } },
              },
            },
          },
          responses: {
            200: { description: 'Chunks matching query within the specified category', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { query: { type: 'string' }, category: { type: 'string' }, totalResults: { type: 'integer' }, results: { type: 'array', items: { $ref: '#/components/schemas/CitationChunk' } } } } } } } } },
            400: { description: 'Missing query parameter' },
          },
        },
      },

      '/api/retrieval/similar/{chunkId}': {
        get: {
          summary: 'Find chunks semantically similar to a target chunk',
          description: 'Given a chunk ID, finds other document chunks with the highest cosine similarity to its embedding vector. Useful for "See Related Sections" and knowledge graph exploration. Excludes the target chunk itself from results.',
          tags: ['Retrieval'],
          security: [{ bearerAuth: [] }, {}],
          parameters: [
            { name: 'chunkId', in: 'path', required: true, description: 'UUID of the target chunk to compare against', schema: { type: 'string', format: 'uuid' } },
            { name: 'topK', in: 'query', description: 'Maximum number of similar chunks to return', schema: { type: 'integer', default: 5 } },
            { name: 'minSimilarity', in: 'query', description: 'Minimum cosine similarity threshold', schema: { type: 'number', default: 0.3 } },
          ],
          responses: {
            200: { description: 'Chunks most similar to the target', content: { 'application/json': { schema: { type: 'object', properties: { success: { type: 'boolean' }, data: { type: 'object', properties: { targetChunkId: { type: 'string' }, totalResults: { type: 'integer' }, results: { type: 'array', items: { $ref: '#/components/schemas/CitationChunk' } } } } } } } } },
            404: { description: 'Chunk not found or has no embedding' },
          },
        },
      },

      // ── Chat API Paths (Phase 6C) ──────────────────────────────────────────────
      '/api/chat/sessions': {
        post: {
          summary: 'Create a new RAG chat session',
          description: 'Creates a new multi-turn chat session tied to the authenticated user.',
          tags: ['Chat'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: false,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    title: { type: 'string', description: 'Session title', example: 'Attendance Rules Inquiry' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Chat session created successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Chat session created successfully' },
                      data: { $ref: '#/components/schemas/ChatSession' },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
        get: {
          summary: 'List active chat sessions for the authenticated user',
          description: 'Returns all active chat sessions ordered by most recent activity.',
          tags: ['Chat'],
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: 'List of chat sessions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Chat sessions retrieved successfully' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/ChatSession' } },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
          },
        },
      },
      '/api/chat/sessions/{sessionId}': {
        get: {
          summary: 'Get session details along with full message history',
          description: 'Retrieves a specific chat session and all historical user/assistant turns with sources and citations.',
          tags: ['Chat'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'sessionId', in: 'path', required: true, description: 'UUID of the chat session', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: {
              description: 'Chat session with messages',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      data: {
                        allOf: [
                          { $ref: '#/components/schemas/ChatSession' },
                          {
                            type: 'object',
                            properties: {
                              messages: { type: 'array', items: { $ref: '#/components/schemas/ChatMessage' } },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              },
            },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
        delete: {
          summary: 'Delete a chat session',
          description: 'Deletes a chat session and cascades deletion of its message history.',
          tags: ['Chat'],
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'sessionId', in: 'path', required: true, description: 'UUID of the chat session', schema: { type: 'string', format: 'uuid' } },
          ],
          responses: {
            200: { description: 'Session deleted successfully' },
            404: { $ref: '#/components/responses/NotFound' },
          },
        },
      },
      '/api/chat/message': {
        post: {
          summary: 'Send a natural language query to the RAG chatbot',
          description: 'Orchestrates the complete RAG flow: retrieves top-K relevant DocumentChunks using vector search, builds context-grounded prompts, calls Google Gemini API (gemini-2.0-flash), formats citations, extracts follow-up suggested questions, and saves the turn in the session history.',
          tags: ['Chat'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['message'],
                  properties: {
                    sessionId: { type: 'string', format: 'uuid', description: 'Optional session UUID. If omitted, a new session is created automatically.' },
                    message: { type: 'string', description: 'User natural language question', example: 'What is the attendance condonation policy?' },
                    topK: { type: 'integer', description: 'Number of chunks to retrieve for context grounding', default: 5, minimum: 1, maximum: 20 },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Generated chatbot response with citations and suggested questions',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean', example: true },
                      message: { type: 'string', example: 'Chatbot response generated successfully' },
                      data: {
                        type: 'object',
                        properties: {
                          sessionId: { type: 'string', format: 'uuid' },
                          sessionTitle: { type: 'string' },
                          userMessage: { $ref: '#/components/schemas/ChatMessage' },
                          assistantMessage: { $ref: '#/components/schemas/ChatMessage' },
                          suggestedQuestions: { type: 'array', items: { type: 'string' } },
                        },
                      },
                    },
                  },
                },
              },
            },
            401: { $ref: '#/components/responses/Unauthorized' },
            422: { $ref: '#/components/responses/ValidationError' },
          },
        },
      },
      '/api/chat/feedback': {
        post: {
          summary: 'Record user feedback for an assistant message',
          description: 'Updates the feedback field (POSITIVE, NEGATIVE, NONE) on a specific assistant chat message to track RAG quality.',
          tags: ['Chat'],
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['messageId', 'feedback'],
                  properties: {
                    messageId: { type: 'string', format: 'uuid' },
                    feedback: { type: 'string', enum: ['POSITIVE', 'NEGATIVE', 'NONE'], example: 'POSITIVE' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Feedback recorded successfully' },
          },
        },
      },
    },
  },

  // ── JSDoc File Scanning ─────────────────────────────────────────────────────
  /**
   * Glob patterns for files containing @swagger JSDoc annotations.
   * swagger-jsdoc scans these files at startup and merges all
   * @swagger blocks into the generated specification.
   */
  apis: [
    path.join(__dirname, '../routes/*.js'),
    path.join(__dirname, '../routes/**/*.js'),
    path.join(__dirname, '../controllers/*.js'),
    path.join(__dirname, '../controllers/**/*.js'),
  ],
};

// ─── Generate Spec ────────────────────────────────────────────────────────────

/**
 * The generated OpenAPI specification object.
 * Built from the definition above + scanned JSDoc annotations.
 *
 * @type {object}
 */
const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = { swaggerSpec, swaggerUi };
