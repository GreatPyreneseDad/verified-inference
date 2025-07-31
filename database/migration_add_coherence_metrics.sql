-- Migration to add logical coherence metrics to inferences table
-- Run this after the complete_setup.sql

-- Add logical coherence metric columns
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS logical_consistency FLOAT CHECK (logical_consistency >= 0 AND logical_consistency <= 1);
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS evidence_strength FLOAT CHECK (evidence_strength >= 0 AND evidence_strength <= 1);
ALTER TABLE inferences ADD COLUMN IF NOT EXISTS reasoning_clarity FLOAT CHECK (reasoning_clarity >= 0 AND reasoning_clarity <= 1);

-- Add high coherence tracking to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS high_coherence_verifications INTEGER DEFAULT 0;

-- Create index for coherence analysis
CREATE INDEX IF NOT EXISTS idx_inferences_coherence ON inferences(logical_consistency, evidence_strength, reasoning_clarity) 
WHERE logical_consistency IS NOT NULL;

-- Add coherence score view for analytics
CREATE OR REPLACE VIEW inference_coherence_stats AS
SELECT 
    i.id,
    i.query_id,
    i.logical_consistency,
    i.evidence_strength,
    i.reasoning_clarity,
    (COALESCE(i.logical_consistency, 0) * 0.4 + 
     COALESCE(i.evidence_strength, 0) * 0.35 + 
     COALESCE(i.reasoning_clarity, 0) * 0.25) as coherence_score,
    i.verification_correct,
    i.created_at,
    i.verified_at
FROM inferences i
WHERE i.verified_at IS NOT NULL;

-- Verify migration
SELECT 'Coherence metrics migration complete!' as message;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inferences' 
AND column_name IN ('logical_consistency', 'evidence_strength', 'reasoning_clarity');