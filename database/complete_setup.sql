-- Complete database setup for Verified Inference System
-- Run this entire file in your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS inference_relationships CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS inferences CASCADE;
DROP TABLE IF EXISTS queries CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add username and stats columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(255);
UPDATE users SET username = name WHERE username IS NULL;
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_queries INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_verifications INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS correct_verifications INTEGER DEFAULT 0;

-- Sessions table (for grouping queries)
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Queries table
CREATE TABLE queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    query_text TEXT NOT NULL,
    total_cycles INTEGER DEFAULT 1,
    current_cycle INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Fix column names for backend compatibility
ALTER TABLE queries ADD COLUMN IF NOT EXISTS topic TEXT;
ALTER TABLE queries ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE queries ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
UPDATE queries SET topic = query_text WHERE topic IS NULL;
UPDATE queries SET context = '' WHERE context IS NULL;

-- Inferences table
CREATE TABLE inferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES queries(id) ON DELETE CASCADE,
    inference_a TEXT NOT NULL,
    inference_b TEXT NOT NULL,
    inference_c TEXT NOT NULL,
    selected_inference CHAR(1) CHECK (selected_inference IN ('A', 'B', 'C')),
    selected_text TEXT,
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    cycle_number INTEGER NOT NULL DEFAULT 1,
    data_source_type VARCHAR(20) NOT NULL CHECK (data_source_type IN ('1st-party', '3rd-party')),
    evidence_links JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP WITH TIME ZONE,
    verification_reason TEXT
);

-- Add missing columns for backend compatibility
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS custom_inference TEXT;
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS verification_correct BOOLEAN;
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS verification_rationale TEXT;
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS data_type VARCHAR(20);
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS source_link TEXT;
UPDATE inferences SET data_type = data_source_type WHERE data_type IS NULL;

-- Predictions table
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    prediction_text TEXT NOT NULL,
    confidence FLOAT NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
    supporting_inferences UUID[] NOT NULL,
    domain VARCHAR(255),
    validation_status VARCHAR(20) DEFAULT 'pending' CHECK (validation_status IN ('pending', 'validated', 'invalidated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inference relationships table
CREATE TABLE inference_relationships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inference_from UUID NOT NULL REFERENCES inferences(id) ON DELETE CASCADE,
    inference_to UUID NOT NULL REFERENCES inferences(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL CHECK (relationship_type IN ('supports', 'contradicts', 'extends', 'refines')),
    strength FLOAT DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inference_from, inference_to)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_queries_user_id ON queries(user_id);
CREATE INDEX IF NOT EXISTS idx_queries_session_id ON queries(session_id);
CREATE INDEX IF NOT EXISTS idx_inferences_query_id ON inferences(query_id);
CREATE INDEX IF NOT EXISTS idx_inferences_selected ON inferences(selected_inference) WHERE selected_inference IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_predictions_user_id ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_status ON predictions(validation_status);
CREATE INDEX IF NOT EXISTS idx_relationships_from ON inference_relationships(inference_from);
CREATE INDEX IF NOT EXISTS idx_relationships_to ON inference_relationships(inference_to);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_queries_updated_at ON queries;
CREATE TRIGGER update_queries_updated_at BEFORE UPDATE ON queries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify setup
SELECT 'Setup complete! Tables created:' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;