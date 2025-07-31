export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
}

export interface Query {
  id: string;
  user_id: string;
  query_text: string;
  session_id: string;
  total_cycles: number;
  current_cycle: number;
  status: 'active' | 'completed' | 'paused';
  created_at: Date;
  updated_at: Date;
}

export interface Inference {
  id: string;
  query_id: string;
  inference_a: string;
  inference_b: string;
  inference_c: string;
  selected_inference: 'A' | 'B' | 'C' | null;
  selected_text: string | null;
  confidence_score: number;
  cycle_number: number;
  data_source_type: '1st-party' | '3rd-party';
  evidence_links: any[];
  created_at: Date;
  verified_at: Date | null;
}

export interface Prediction {
  id: string;
  prediction_text: string;
  confidence: number;
  supporting_inferences: string[];
  domain: string;
  validation_status: 'pending' | 'validated' | 'invalidated';
  created_at: Date;
  updated_at: Date;
}

export interface InferenceRelationship {
  id: string;
  inference_from: string;
  inference_to: string;
  relationship_type: 'supports' | 'contradicts' | 'extends' | 'refines';
  strength: number;
  created_at: Date;
}

export interface InferenceAngle {
  text: string;
  confidence: number;
  angle: 'conservative' | 'progressive' | 'synthetic';
}

export interface InferenceAngles {
  conservative: InferenceAngle;
  progressive: InferenceAngle;
  synthetic: InferenceAngle;
}

export interface Session {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at: Date;
  updated_at: Date;
}