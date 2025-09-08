interface VEO3GenerateRequest {
  prompt: string
  imageUrls?: string[]
  model: 'veo3'
  watermark?: string
  callBackUrl?: string
  aspectRatio?: '9:16' | '16:9' | '1:1'
  seeds?: number
  enableFallback?: boolean
  enableTranslation?: boolean
}

interface VEO3GenerateResponse {
  code: number
  msg: string
  data: {
    taskId: string
  }
}

interface VEO3StatusResponse {
  code: number
  msg: string
  data: {
    taskId: string
    paramJson: string
    completeTime?: number
    createTime?: number
    errorCode?: string | null
    errorMessage?: string | null
    fallbackFlag: boolean
    response?: {
      taskId: string
      resultUrls?: string[]
      originUrls?: string[]
      seeds?: number[]
    }
    successFlag: number
  }
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

  constructor(apiKey: string, baseURL: string = 'https://api.veo3api.ai') {
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
      prompt,
      model: 'veo3',
      aspectRatio: options.aspectRatio || '9:16',
      enableFallback: options.enableFallback || false,
      enableTranslation: options.enableTranslation || true,
      ...options,
    }

    console.log('VEO3 API Request:', {
      url: `${this.baseURL}/api/v1/veo/generate`,
      body: body
    })

    const response = await this.makeRequest<VEO3GenerateResponse>('/api/v1/veo/generate', {
      method: 'POST',
      body: JSON.stringify(body),
    })

    console.log('VEO3 API Response:', response)
    return response
  }

  async checkStatus(taskId: string): Promise<VEO3StatusResponse> {
    const response = await this.makeRequest<VEO3StatusResponse>(`/api/v1/veo/record-info?taskId=${taskId}`)
    console.log('VEO3 checkStatus response:', JSON.stringify(response, null, 2))
    return response
  }

  // Get video URL from the correct response structure
  async getVideoUrl(taskId: string): Promise<string | null> {
    try {
      const statusResponse = await this.checkStatus(taskId)
      
      // Check if video generation is complete
      if (statusResponse.data.successFlag === 1 && statusResponse.data.response) {
        // Try to get watermarked video first, then original
        const watermarkedUrl = statusResponse.data.response.resultUrls?.[0]
        const originalUrl = statusResponse.data.response.originUrls?.[0]
        
        const videoUrl = watermarkedUrl || originalUrl
        
        if (videoUrl) {
          console.log('Video URL found:', videoUrl)
          console.log('Watermarked URL:', watermarkedUrl)
          console.log('Original URL:', originalUrl)
          return videoUrl
        }
      }
      
      console.log('No video URL found in response')
      return null
    } catch (error) {
      console.error('Error getting video URL:', error)
      return null
    }
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
      
      // Check if video generation is complete
      if (status.data.successFlag === 1 && status.data.completeTime) {
        return status
      }
      
      // Check if video generation failed
      if (status.data.errorCode || status.data.errorMessage) {
        throw new Error(status.data.errorMessage || 'Video generation failed')
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
    return this.pollStatus(generateResponse.data.taskId, maxWaitTime)
  }

  // Helper method to generate video with character consistency using image reference
  async generateVideoWithCharacterConsistency(
    prompt: string,
    characterImageUrl: string,
    options: Partial<VEO3GenerateRequest> & { maxWaitTime?: number } = {}
  ): Promise<VEO3StatusResponse> {
    const generateOptions = {
      ...options,
      imageUrls: [characterImageUrl],
      aspectRatio: options.aspectRatio || '9:16',
      enableFallback: options.enableFallback || false,
      enableTranslation: options.enableTranslation || true,
    }

    return this.generateAndWait(prompt, generateOptions)
  }
}

// Create a singleton instance
let veo3Instance: VEO3API | null = null

export function getVEO3API(): VEO3API {
  if (!veo3Instance) {
    const apiKey = process.env.VEO3_API_KEY
    console.log('VEO3_API_KEY exists:', !!apiKey)
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
