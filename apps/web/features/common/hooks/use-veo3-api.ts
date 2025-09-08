import { useState, useCallback } from 'react'

interface VEO3GenerateOptions {
  imageUrls?: string[]
  model?: 'veo3'
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

export function useVEO3API() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateVideo = useCallback(async (
    prompt: string,
    options: VEO3GenerateOptions = {}
  ): Promise<VEO3GenerateResponse | null> => {
    if (!prompt.trim()) {
      setError('Prompt is required')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/veo3/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VEO3_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          ...options,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate video')
      }

      // The API returns the VEO3 response directly, which has the structure:
      // { code: 200, msg: "success", data: { taskId: "..." } }
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const checkStatus = useCallback(async (taskId: string): Promise<VEO3StatusResponse | null> => {
    try {
      const response = await fetch(`/api/veo3/record-info?taskId=${taskId}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to check status')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    }
  }, [])

  const pollStatus = useCallback(async (
    taskId: string,
    maxWaitTime: number = 300000, // 5 minutes
    pollInterval: number = 10000 // 10 seconds
  ): Promise<VEO3StatusResponse | null> => {
    setIsPolling(true)
    setError(null)

    const start = Date.now()

    try {
      while (Date.now() - start < maxWaitTime) {
        const status = await checkStatus(taskId)
        
        if (!status) {
          throw new Error('Failed to check status')
        }

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
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setIsPolling(false)
    }
  }, [checkStatus])

  const getLogs = useCallback(async (params: {
    page?: number
    limit?: number
    status?: string
    model?: string
  } = {}): Promise<VEO3LogsResponse | null> => {
    try {
      const searchParams = new URLSearchParams()
      
      if (params.page) searchParams.append('page', params.page.toString())
      if (params.limit) searchParams.append('limit', params.limit.toString())
      if (params.status) searchParams.append('status', params.status)
      if (params.model) searchParams.append('model', params.model)

      const queryString = searchParams.toString()
      const url = `/api/veo3/logs${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch logs')
      }

      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    }
  }, [])

  const generateAndWait = useCallback(async (
    prompt: string,
    options: VEO3GenerateOptions & { maxWaitTime?: number } = {}
  ): Promise<VEO3StatusResponse | null> => {
    const { maxWaitTime, ...generateOptions } = options
    
    const generateResponse = await generateVideo(prompt, generateOptions)
    
    if (!generateResponse) {
      return null
    }

    return pollStatus(generateResponse.data.taskId, maxWaitTime)
  }, [generateVideo, pollStatus])

  const generateVideoWithCharacterConsistency = useCallback(async (
    prompt: string,
    characterImageUrl: string,
    options: VEO3GenerateOptions & { maxWaitTime?: number } = {}
  ): Promise<VEO3StatusResponse | null> => {
    const generateOptions = {
      ...options,
      imageUrls: [characterImageUrl],
      aspectRatio: options.aspectRatio || '9:16',
      enableFallback: options.enableFallback || false,
      enableTranslation: options.enableTranslation || true,
    }

    return generateAndWait(prompt, generateOptions)
  }, [generateAndWait])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    generateVideo,
    checkStatus,
    pollStatus,
    getLogs,
    generateAndWait,
    generateVideoWithCharacterConsistency,
    isGenerating,
    isPolling,
    error,
    clearError,
  }
}
