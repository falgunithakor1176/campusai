-- ============================================================
-- CampusAI Database Initialization Script
-- Runs automatically when PostgreSQL container starts for the
-- first time. Enables the pgvector extension.
-- ============================================================

-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable uuid-ossp for UUID generation (Prisma handles this but belt-and-suspenders)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Log initialization
DO $$
BEGIN
  RAISE NOTICE 'CampusAI database initialized with pgvector extension';
END $$;
