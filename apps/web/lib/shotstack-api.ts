export interface ShotstackVideoClip {
  asset: {
    type: 'video'
    src: string
  }
  start: number
  length: number
}

export interface ShotstackTimeline {
  background: string
  tracks: Array<{
    clips: ShotstackVideoClip[]
  }>
}

export interface ShotstackRenderRequest {
  timeline: ShotstackTimeline
  output: {
    format: 'mp4'
    resolution: 'preview' | 'mobile' | 'sd' | 'hd' | '1080' | '4k'
    fps?: number
    quality?: 'low' | 'medium' | 'high'
    repeat?: boolean
  }
}

export interface ShotstackRenderResponse {
  success: boolean
  message: string
  response: {
    id: string
    status: 'queued' | 'rendering' | 'saving' | 'done' | 'failed'
    url?: string
    error?: string
  }
}

export interface ShotstackStatusResponse {
  success: boolean
  response: {
    id: string
    status: 'queued' | 'rendering' | 'saving' | 'done' | 'failed'
    url?: string
    error?: string
    progress?: number
  }
}

export class ShotstackAPI {
  private apiKey: string
  private baseUrl = 'https://api.shotstack.io/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async renderVideo(request: ShotstackRenderRequest): Promise<ShotstackRenderResponse> {
    console.log('Sending request to Shotstack:', this.baseUrl + '/render')
    console.log('Request headers:', { 'X-Api-Key': this.apiKey.substring(0, 10) + '...', 'Content-Type': 'application/json' })
    
    const response = await fetch(`${this.baseUrl}/render`, {
      method: 'POST',
      headers: {
        'X-Api-Key': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Shotstack API error response:', errorText)
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const result = await response.json()
    console.log('Shotstack API response:', result)
    return result
  }

  async checkStatus(renderId: string): Promise<ShotstackStatusResponse> {
    const response = await fetch(`${this.baseUrl}/render/${renderId}`, {
      headers: {
        'X-Api-Key': this.apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Shotstack API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  async pollStatus(renderId: string, maxAttempts = 60, intervalMs = 5000): Promise<ShotstackStatusResponse> {
    let attempts = 0
    
    while (attempts < maxAttempts) {
      const status = await this.checkStatus(renderId)
      
      if (status.response.status === 'done') {
        return status
      }
      
      if (status.response.status === 'failed') {
        throw new Error(`Video rendering failed: ${status.response.error}`)
      }
      
      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, intervalMs))
      attempts++
    }
    
    throw new Error('Video rendering timed out')
  }

  async mergeVideos(videoUrls: string[], frameDuration: number = 8): Promise<string> {
    // Create timeline with all video clips
    const clips: ShotstackVideoClip[] = videoUrls.map((url, index) => ({
      asset: {
        type: 'video',
        src: url,
      },
      start: index * frameDuration,
      length: frameDuration,
    }))

    const timeline: ShotstackTimeline = {
      background: '#000000',
      tracks: [{ clips }],
    }

    const request: ShotstackRenderRequest = {
      timeline,
      output: {
        format: 'mp4',
        resolution: 'hd', // Use 'hd' for 720p equivalent in Shotstack API
        fps: 30,
        quality: 'medium', // Add quality setting
      },
    }

    console.log('Shotstack request:', JSON.stringify(request, null, 2))

    // Start rendering
    const renderResponse = await this.renderVideo(request)
    
    if (!renderResponse.success) {
      throw new Error(`Failed to start video rendering: ${renderResponse.message}`)
    }

    // Poll until completion
    const finalStatus = await this.pollStatus(renderResponse.response.id)
    
    if (!finalStatus.response.url) {
      throw new Error('Video rendering completed but no URL returned')
    }

    return finalStatus.response.url
  }
}
