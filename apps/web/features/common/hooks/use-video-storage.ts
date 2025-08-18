import { useState, useEffect, useCallback } from 'react'

export interface SavedVideo {
  id: string
  videoUrl: string
  prompt: string
  model: string
  resolution: string
  duration: number
  hasAudio: boolean
  createdAt: string
  taskId: string
}

const STORAGE_KEY = 'veo3_generated_videos'

export function useVideoStorage() {
  const [videos, setVideos] = useState<SavedVideo[]>([])

  // Load videos from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      console.log('Loading videos from localStorage:', stored)
      if (stored) {
        const parsedVideos = JSON.parse(stored)
        console.log('Parsed videos:', parsedVideos)
        setVideos(Array.isArray(parsedVideos) ? parsedVideos : [])
      }
    } catch (error) {
      console.error('Error loading videos from storage:', error)
    }
  }, [])

  // Save videos to localStorage whenever videos change
  useEffect(() => {
    try {
      console.log('Saving videos to localStorage:', videos)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(videos))
    } catch (error) {
      console.error('Error saving videos to storage:', error)
    }
  }, [videos])

  const saveVideo = useCallback((video: Omit<SavedVideo, 'id' | 'createdAt'>) => {
    console.log('saveVideo called with:', video)
    const newVideo: SavedVideo = {
      ...video,
      id: `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
    }

    console.log('Created new video object:', newVideo)
    setVideos(prev => {
      const updatedVideos = [newVideo, ...prev]
      console.log('Updated videos array:', updatedVideos)
      return updatedVideos
    })
    return newVideo
  }, [])

  const deleteVideo = useCallback((videoId: string) => {
    setVideos(prev => prev.filter(video => video.id !== videoId))
  }, [])

  const clearAllVideos = useCallback(() => {
    setVideos([])
  }, [])

  const getVideoById = useCallback((videoId: string) => {
    return videos.find(video => video.id === videoId)
  }, [videos])

  const refreshVideos = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      console.log('Manual refresh - Loading videos from localStorage:', stored)
      if (stored) {
        const parsedVideos = JSON.parse(stored)
        console.log('Manual refresh - Parsed videos:', parsedVideos)
        setVideos(Array.isArray(parsedVideos) ? parsedVideos : [])
      }
    } catch (error) {
      console.error('Error refreshing videos from storage:', error)
    }
  }, [])

  return {
    videos,
    saveVideo,
    deleteVideo,
    clearAllVideos,
    getVideoById,
    refreshVideos,
  }
}
