export interface User {
  id: string
  email: string
  username: string
  stats: {
    totalQueries: number
    totalVerifications: number
    correctVerifications: number
    accuracy: number
  }
  createdAt: string
}

export interface Query {
  id: string
  topic: string
  context: string
  metadata?: any
  created_at: string
}

export interface Inference {
  id: string
  query_id: string
  inference_a: string
  inference_b: string
  inference_c: string
  selected_inference?: 'A' | 'B' | 'C'
  custom_inference?: string
  verification_correct?: boolean
  verification_rationale?: string
  data_type: '1st-party' | '3rd-party'
  source_link?: string
  confidence_score?: number
  created_at: string
  verified_at?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  email: string
  username: string
  password: string
}

export interface CreateQueryData {
  topic: string
  context: string
  dataType: '1st-party' | '3rd-party'
  sourceLink?: string
}

export interface VerifyInferenceData {
  selectedInference: 'A' | 'B' | 'C' | 'custom'
  customInference?: string
  correct: boolean
  rationale: string
  confidenceScore?: number
}