interface VEO3GenerateRequest {
  model: 'veo3-fast' | 'veo3-quality'
  prompt: string
  audio?: boolean
  options?: {
    resolution?: '720p' | '1080p'
    aspectRatio?: '16:9'
    seed?: number
    negativePrompt?: string
    enhancePrompt?: boolean
  }
}

interface VEO3GenerateResponse {
  success: boolean
  taskId: string
  status: 'pending' | 'completed' | 'failed'
  model: string
  creditsRequired: number
  estimatedTime: string
  error?: string
  errorType?: string
  details?: any
}

interface VEO3StatusResponse {
  success: boolean
  taskId: string
  status: 'pending' | 'completed' | 'failed'
  result?: {
    videoUrl: string
    duration: number
    resolution: string
    aspectRatio: string
    hasAudio: boolean
    processingTimeSeconds: number
  }
  credits?: {
    required: number
    charged: number
    refunded: number
  }
  error?: string
  errorType?: string
}

interface VEO3LogsResponse {
  success: boolean
  logs: Array<{
    taskId: string
    status: string
    model: string
    prompt: string
    createdAt: string
    result?: {
      videoUrl: string
      duration: number
    }
  }>
  pagination?: {
    page: number
    limit: number
    total: number
  }
}

class VEO3API {
  private baseURL: string
  private apiKey: string

  constructor(apiKey: string, baseURL: string = 'https://api.veo3gen.app') {
    this.baseURL = baseURL
    this.apiKey = apiKey
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const headers = {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    }

    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.error || `HTTP error! status: ${response.status}`
      )
    }

    return response.json()
  }

  async generateVideo(
    prompt: string,
    options: Partial<VEO3GenerateRequest> = {}
  ): Promise<VEO3GenerateResponse> {
    const body: VEO3GenerateRequest = {
      model: options.model || 'veo3-fast',
      prompt,
      audio: options.audio !== false,
      options: {
        resolution: options.options?.resolution || '720p',
        aspectRatio: '16:9',
        enhancePrompt: options.options?.enhancePrompt !== false,
        ...options.options,
      },
    }

    return this.makeRequest<VEO3GenerateResponse>('/api/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })
  }

  async checkStatus(taskId: string): Promise<VEO3StatusResponse> {
    return this.makeRequest<VEO3StatusResponse>(`/api/status/${taskId}`)
  }

  async getLogs(params: {
    page?: number
    limit?: number
    status?: string
    model?: string
  } = {}): Promise<VEO3LogsResponse> {
    const searchParams = new URLSearchParams()
    
    if (params.page) searchParams.append('page', params.page.toString())
    if (params.limit) searchParams.append('limit', params.limit.toString())
    if (params.status) searchParams.append('status', params.status)
    if (params.model) searchParams.append('model', params.model)

    const queryString = searchParams.toString()
    const endpoint = `/api/logs${queryString ? `?${queryString}` : ''}`

    return this.makeRequest<VEO3LogsResponse>(endpoint)
  }

  async pollStatus(
    taskId: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 10000 // 10 seconds
  ): Promise<VEO3StatusResponse> {
    const start = Date.now()
    
    while (Date.now() - start < maxWaitTime) {
      const status = await this.checkStatus(taskId)
      
      if (status.status === 'completed') {
        return status
      }
      
      if (status.status === 'failed') {
        throw new Error(status.error || 'Video generation failed')
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval))
    }
    
    throw new Error('Video generation timed out')
  }

  async generateAndWait(
    prompt: string,
    options: Partial<VEO3GenerateRequest> & { maxWaitTime?: number } = {}
  ): Promise<VEO3StatusResponse> {
    const { maxWaitTime, ...generateOptions } = options
    const generateResponse = await this.generateVideo(prompt, generateOptions)
    return this.pollStatus(generateResponse.taskId, maxWaitTime)
  }
}

// Create a singleton instance
let veo3Instance: VEO3API | null = null

export function getVEO3API(): VEO3API {
  if (!veo3Instance) {
    const apiKey = process.env.VEO3_API_KEY
    if (!apiKey) {
      throw new Error('VEO3_API_KEY environment variable is not set')
    }
    veo3Instance = new VEO3API(apiKey)
  }
  return veo3Instance
}

export { VEO3API }
export type {
  VEO3GenerateRequest,
  VEO3GenerateResponse,
  VEO3StatusResponse,
  VEO3LogsResponse,
}
