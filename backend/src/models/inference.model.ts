import { v4 as uuidv4 } from 'uuid';
import { query } from '../db/pool';

export interface Inference {
  id: string;
  query_id: string;
  inference_a: string;
  inference_b: string;
  inference_c: string;
  selected_inference?: 'A' | 'B' | 'C';
  custom_inference?: string;
  verification_correct?: boolean;
  verification_rationale?: string;
  data_type: '1st-party' | '3rd-party';
  source_link?: string;
  confidence_score?: number;
  // Logical coherence metrics
  logical_consistency?: number; // 0-1 score for internal consistency
  evidence_strength?: number; // 0-1 score for evidence support
  reasoning_clarity?: number; // 0-1 score for reasoning clarity
  created_at: Date;
  verified_at?: Date;
}

export class InferenceModel {
  static async create(
    queryId: string,
    inferenceA: string,
    inferenceB: string,
    inferenceC: string,
    dataType: '1st-party' | '3rd-party',
    sourceLink?: string
  ): Promise<Inference> {
    const id = uuidv4();
    
    const result = await query(
      `INSERT INTO inferences (
        id, query_id, inference_a, inference_b, inference_c, 
        data_type, source_link
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [id, queryId, inferenceA, inferenceB, inferenceC, dataType, sourceLink]
    );

    return result.rows[0];
  }

  static async findById(id: string): Promise<Inference | null> {
    const result = await query('SELECT * FROM inferences WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  static async findByQueryId(queryId: string): Promise<Inference[]> {
    const result = await query(
      'SELECT * FROM inferences WHERE query_id = $1 ORDER BY created_at DESC',
      [queryId]
    );
    
    return result.rows;
  }

  static async verify(
    id: string,
    selectedInference: 'A' | 'B' | 'C' | 'custom',
    customInference: string | null,
    correct: boolean,
    rationale: string,
    confidenceScore?: number,
    logicalMetrics?: {
      consistency: number;
      evidenceStrength: number;
      reasoningClarity: number;
    }
  ): Promise<Inference> {
    const result = await query(
      `UPDATE inferences 
       SET selected_inference = $1, 
           custom_inference = $2,
           verification_correct = $3,
           verification_rationale = $4,
           confidence_score = $5,
           logical_consistency = $6,
           evidence_strength = $7,
           reasoning_clarity = $8,
           verified_at = NOW()
       WHERE id = $9
       RETURNING *`,
      [
        selectedInference === 'custom' ? null : selectedInference,
        customInference,
        correct,
        rationale,
        confidenceScore,
        logicalMetrics?.consistency || null,
        logicalMetrics?.evidenceStrength || null,
        logicalMetrics?.reasoningClarity || null,
        id
      ]
    );

    return result.rows[0];
  }

  static async getUnverified(limit: number = 10): Promise<Inference[]> {
    // Fetch unverified inferences BECAUSE the verification queue needs population,
    // THEREFORE we join with queries to get context for verification display
    const result = await query(
      `SELECT i.*, q.topic, q.context 
       FROM inferences i
       JOIN queries q ON i.query_id = q.id
       WHERE i.verified_at IS NULL
       ORDER BY i.created_at ASC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  }

  static async getVerificationStats(): Promise<{
    total: number;
    verified: number;
    correct: number;
    accuracy: number;
  }> {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        COUNT(verified_at) as verified,
        COUNT(CASE WHEN verification_correct = true THEN 1 END) as correct
      FROM inferences
    `);
    
    const stats = result.rows[0];
    const accuracy = stats.verified > 0 ? stats.correct / stats.verified : 0;
    
    return {
      total: parseInt(stats.total, 10),
      verified: parseInt(stats.verified, 10),
      correct: parseInt(stats.correct, 10),
      accuracy: Math.round(accuracy * 100) / 100,
    };
  }
}