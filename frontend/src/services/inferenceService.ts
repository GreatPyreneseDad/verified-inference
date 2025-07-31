import { api } from '@/lib/axios'
import { Inference, VerifyInferenceData } from '@/types'

interface VerifyResponse {
  success: boolean
  data: {
    inference: Inference
  }
}

interface UnverifiedResponse {
  success: boolean
  data: {
    inferences: Array<Inference & { topic?: string; context?: string }>
  }
}

interface StatsResponse {
  success: boolean
  data: {
    stats: {
      total: number
      verified: number
      correct: number
      accuracy: number
    }
  }
}

export const inferenceService = {
  async verifyInference(id: string, data: VerifyInferenceData) {
    const response = await api.patch<VerifyResponse>(`/inferences/${id}/verify`, data)
    return response.data.data.inference
  },

  async getUnverified(limit: number = 10) {
    const response = await api.get<UnverifiedResponse>('/inferences/unverified', {
      params: { limit },
    })
    return response.data.data.inferences
  },

  async getStats() {
    const response = await api.get<StatsResponse>('/inferences/stats')
    return response.data.data.stats
  },
}