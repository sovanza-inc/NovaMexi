import { useState } from 'react'

interface UseShotstackReturn {
  mergeVideos: (videoUrls: string[], frameDuration?: number) => Promise<string>
  isMerging: boolean
  progress: number
  error: string | null
}

export function useShotstack(): UseShotstackReturn {
  const [isMerging, setIsMerging] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const mergeVideos = async (videoUrls: string[], frameDuration: number = 8): Promise<string> => {
    setIsMerging(true)
    setProgress(0)
    setError(null)

    try {
      // Simulate progress updates during the merge process
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev
          return prev + Math.random() * 10
        })
      }, 2000)

      const response = await fetch('/api/shotstack/merge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoUrls,
          frameDuration,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to merge videos')
      }

      const result = await response.json()
      
      clearInterval(progressInterval)
      setProgress(100)
      
      return result.mergedVideoUrl
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsMerging(false)
    }
  }

  return {
    mergeVideos,
    isMerging,
    progress,
    error,
  }
}
