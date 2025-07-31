import { api } from '@/lib/axios'
import { Query, Inference, CreateQueryData } from '@/types'

interface QueryResponse {
  success: boolean
  data: {
    query: Query
    inference: Inference
  }
}

interface QueriesResponse {
  success: boolean
  data: {
    queries: Query[]
    pagination: {
      total: number
      limit: number
      offset: number
    }
  }
}

interface QueryWithInferencesResponse {
  success: boolean
  data: {
    query: Query
    inferences: Inference[]
  }
}

export const queryService = {
  async createQuery(data: CreateQueryData) {
    const response = await api.post<QueryResponse>('/queries', data)
    return response.data.data
  },

  async getQueries({ limit = 50, offset = 0 }: { limit?: number; offset?: number }) {
    const response = await api.get<QueriesResponse>('/queries', {
      params: { limit, offset },
    })
    return response.data.data
  },

  async getQuery(id: string) {
    const response = await api.get<QueryWithInferencesResponse>(`/queries/${id}`)
    return response.data.data
  },
}