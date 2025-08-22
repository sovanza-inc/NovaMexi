import { useState, useCallback } from 'react'

export interface StoryScene {
  sceneNumber: number
  description: string
  prompt: string
  duration: number
  isApproved: boolean
  videoUrl?: string
  isGeneratingVideo?: boolean
}

export interface Story {
  title: string
  scenes: StoryScene[]
  totalDuration: number
  customDuration: number
  frameDuration: number
  isApproved: boolean
}

export function useStoryGenerator() {
  const [story, setStory] = useState<Story | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStory = useCallback(async (title: string, customDuration: number = 60): Promise<Story | null> => {
    if (!title.trim()) {
      setError('Story title is required')
      return null
    }

    if (customDuration < 8) {
      setError('Video duration must be at least 8 seconds')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Simulate AI story generation with a realistic story structure
      // In a real implementation, this would call an AI API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay

      // Calculate optimal frame count and duration
      const frameDuration = 8 // Each frame is 8 seconds
      const frameCount = Math.ceil(customDuration / frameDuration)
      const lastFrameDuration = customDuration % frameDuration || frameDuration

      const generatedStory: Story = {
        title: title.trim(),
        customDuration,
        frameDuration,
        scenes: [],
        totalDuration: customDuration,
        isApproved: false
      }

      // Generate scenes based on calculated frame count
      for (let i = 1; i <= frameCount; i++) {
        const isLastFrame = i === frameCount
        const sceneDuration = isLastFrame && lastFrameDuration !== frameDuration ? lastFrameDuration : frameDuration
        
        let sceneDescription = ""
        let scenePrompt = ""
        
        if (frameCount === 1) {
          // Single frame story
          sceneDescription = "Complete story in a single scene"
          scenePrompt = `${title} - complete narrative, full story arc, cinematic quality, ${sceneDuration} seconds`
        } else if (frameCount === 2) {
          // Two frame story
          if (i === 1) {
            sceneDescription = "Opening and setup - beginning of the story"
            scenePrompt = `Opening scene: ${title} - establishing shot, story setup, introduction, ${sceneDuration} seconds`
          } else {
            sceneDescription = "Climax and resolution - conclusion of the story"
            scenePrompt = `Conclusion: ${title} - story climax, resolution, ending, ${sceneDuration} seconds`
          }
        } else if (frameCount === 3) {
          // Three frame story
          if (i === 1) {
            sceneDescription = "Opening and introduction"
            scenePrompt = `Opening: ${title} - establishing shot, character introduction, ${sceneDuration} seconds`
          } else if (i === 2) {
            sceneDescription = "Development and conflict"
            scenePrompt = `Development: ${title} - rising action, conflict building, ${sceneDuration} seconds`
          } else {
            sceneDescription = "Climax and resolution"
            scenePrompt = `Resolution: ${title} - climax, story conclusion, ${sceneDuration} seconds`
          }
        } else {
          // Four or more frame story (classic structure)
          if (i === 1) {
            sceneDescription = "Opening scene establishing the setting and main character"
            scenePrompt = `Opening scene: ${title} - establishing shot, cinematic lighting, professional quality, ${sceneDuration} seconds`
          } else if (i === 2) {
            sceneDescription = "Character introduction and initial conflict setup"
            scenePrompt = `Character introduction: ${title} - close-up shot, emotional expression, dramatic lighting, ${sceneDuration} seconds`
          } else if (i === 3) {
            sceneDescription = "Rising action and development of the story"
            scenePrompt = `Rising action: ${title} - dynamic movement, tension building, cinematic composition, ${sceneDuration} seconds`
          } else if (i === 4) {
            if (frameCount === 4) {
              sceneDescription = "Climax and resolution"
              scenePrompt = `Climax and resolution: ${title} - intense action, dramatic lighting, story conclusion, ${sceneDuration} seconds`
            } else {
              sceneDescription = "Midpoint revelation or turning point"
              scenePrompt = `Midpoint revelation: ${title} - dramatic moment, intense lighting, emotional impact, ${sceneDuration} seconds`
            }
          } else if (i === 5) {
            if (frameCount === 5) {
              sceneDescription = "Climax and resolution"
              scenePrompt = `Climax and resolution: ${title} - intense action, dramatic lighting, story conclusion, ${sceneDuration} seconds`
            } else {
              sceneDescription = "Escalation of conflict and challenges"
              scenePrompt = `Conflict escalation: ${title} - action sequence, fast-paced movement, dramatic angles, ${sceneDuration} seconds`
            }
          } else if (i === 6) {
            if (frameCount === 6) {
              sceneDescription = "Climax and resolution"
              scenePrompt = `Climax and resolution: ${title} - intense action, dramatic lighting, story conclusion, ${sceneDuration} seconds`
            } else {
              sceneDescription = "Climax and peak of the story"
              scenePrompt = `Climax: ${title} - intense action, dramatic lighting, emotional peak, ${sceneDuration} seconds`
            }
          } else if (i === 7) {
            if (frameCount === 7) {
              sceneDescription = "Climax and resolution"
              scenePrompt = `Climax and resolution: ${title} - intense action, dramatic lighting, story conclusion, ${sceneDuration} seconds`
            } else {
              sceneDescription = "Resolution and falling action"
              scenePrompt = `Resolution: ${title} - calming atmosphere, resolution of tension, peaceful setting, ${sceneDuration} seconds`
            }
          } else {
            // Last frame (8 or more)
            sceneDescription = "Conclusion and final moments"
            scenePrompt = `Conclusion: ${title} - final shot, emotional closure, cinematic ending, ${sceneDuration} seconds`
          }
        }

        generatedStory.scenes.push({
          sceneNumber: i,
          description: sceneDescription,
          prompt: scenePrompt,
          duration: sceneDuration,
          isApproved: false
        })
      }

      setStory(generatedStory)
      return generatedStory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate story'
      setError(errorMessage)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const regenerateStory = useCallback(async (title: string, customDuration?: number): Promise<Story | null> => {
    // Clear current story and generate a new one
    setStory(null)
    const duration = customDuration || story?.customDuration || 60
    return generateStory(title, duration)
  }, [generateStory, story?.customDuration])

  const regenerateScene = useCallback(async (sceneNumber: number, title: string): Promise<void> => {
    if (!story) return

    try {
      // Simulate AI scene regeneration
      await new Promise(resolve => setTimeout(resolve, 1000))

      const scene = story.scenes.find(s => s.sceneNumber === sceneNumber)
      if (!scene) return

      const newScene: StoryScene = {
        sceneNumber,
        description: `Regenerated scene ${sceneNumber} for ${title}`,
        prompt: `Regenerated scene ${sceneNumber}: ${title} - fresh perspective, creative angle, enhanced quality, ${scene.duration} seconds`,
        duration: scene.duration,
        isApproved: false
      }

      setStory(prev => {
        if (!prev) return prev
        const updatedScenes = prev.scenes.map(scene => 
          scene.sceneNumber === sceneNumber ? newScene : scene
        )
        return {
          ...prev,
          scenes: updatedScenes,
          isApproved: false // Reset approval when any scene changes
        }
      })
    } catch (err) {
      console.error('Scene regeneration error:', err)
    }
  }, [story])

  const approveScene = useCallback((sceneNumber: number): void => {
    if (!story) return

    setStory(prev => {
      if (!prev) return prev
      const updatedScenes = prev.scenes.map(scene => 
        scene.sceneNumber === sceneNumber 
          ? { ...scene, isApproved: true }
          : scene
      )
      
      // Check if all scenes are approved
      const allApproved = updatedScenes.every(scene => scene.isApproved)
      
      return {
        ...prev,
        scenes: updatedScenes,
        isApproved: allApproved
      }
    })
  }, [story])

  const approveAllScenes = useCallback((): void => {
    if (!story) return

    setStory(prev => {
      if (!prev) return prev
      const updatedScenes = prev.scenes.map(scene => ({
        ...scene,
        isApproved: true
      }))
      
      return {
        ...prev,
        scenes: updatedScenes,
        isApproved: true
      }
    })
  }, [story])

  const clearStory = useCallback(() => {
    setStory(null)
    setError(null)
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getScenePrompt = useCallback((sceneNumber: number): string => {
    if (!story) return ''
    const scene = story.scenes.find(s => s.sceneNumber === sceneNumber)
    return scene?.prompt || ''
  }, [story])

  const getApprovedScenes = useCallback((): StoryScene[] => {
    if (!story) return []
    return story.scenes.filter(scene => scene.isApproved)
  }, [story])

  const canGenerateVideo = useCallback((): boolean => {
    if (!story) return false
    return story.isApproved && story.scenes.every(scene => scene.isApproved)
  }, [story])

  const getFrameCount = useCallback((): number => {
    if (!story) return 0
    return story.scenes.length
  }, [story])

  const getTotalDuration = useCallback((): number => {
    if (!story) return 0
    return story.scenes.reduce((total, scene) => total + scene.duration, 0)
  }, [story])

  const updateSceneVideoUrl = useCallback((sceneNumber: number, videoUrl: string): void => {
    setStory(prev => {
      if (!prev) return prev
      const updatedScenes = prev.scenes.map(scene => 
        scene.sceneNumber === sceneNumber 
          ? { ...scene, videoUrl }
          : scene
      )
      return {
        ...prev,
        scenes: updatedScenes
      }
    })
  }, [])

  return {
    story,
    isGenerating,
    error,
    generateStory,
    regenerateStory,
    regenerateScene,
    approveScene,
    approveAllScenes,
    clearStory,
    clearError,
    getScenePrompt,
    getApprovedScenes,
    canGenerateVideo,
    getFrameCount,
    getTotalDuration,
    updateSceneVideoUrl,
  }
}
