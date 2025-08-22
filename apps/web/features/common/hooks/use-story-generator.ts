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
  isApproved: boolean
}

export function useStoryGenerator() {
  const [story, setStory] = useState<Story | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateStory = useCallback(async (title: string): Promise<Story | null> => {
    if (!title.trim()) {
      setError('Story title is required')
      return null
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Simulate AI story generation with a realistic story structure
      // In a real implementation, this would call an AI API
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API delay

      const generatedStory: Story = {
        title: title.trim(),
        scenes: [
          {
            sceneNumber: 1,
            description: "Opening scene establishing the setting and main character",
            prompt: `Opening scene: ${title} - establishing shot, cinematic lighting, professional quality`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 2,
            description: "Character introduction and initial conflict setup",
            prompt: `Character introduction: ${title} - close-up shot, emotional expression, dramatic lighting`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 3,
            description: "Rising action and development of the story",
            prompt: `Rising action: ${title} - dynamic movement, tension building, cinematic composition`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 4,
            description: "Midpoint revelation or turning point",
            prompt: `Midpoint revelation: ${title} - dramatic moment, intense lighting, emotional impact`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 5,
            description: "Escalation of conflict and challenges",
            prompt: `Conflict escalation: ${title} - action sequence, fast-paced movement, dramatic angles`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 6,
            description: "Climax and peak of the story",
            prompt: `Climax: ${title} - intense action, dramatic lighting, emotional peak`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 7,
            description: "Resolution and falling action",
            prompt: `Resolution: ${title} - calming atmosphere, resolution of tension, peaceful setting`,
            duration: 8,
            isApproved: false
          },
          {
            sceneNumber: 8,
            description: "Conclusion and final moments",
            prompt: `Conclusion: ${title} - final shot, emotional closure, cinematic ending`,
            duration: 8,
            isApproved: false
          }
        ],
        totalDuration: 64,
        isApproved: false
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

  const regenerateStory = useCallback(async (title: string): Promise<Story | null> => {
    // Clear current story and generate a new one
    setStory(null)
    return generateStory(title)
  }, [generateStory])

  const regenerateScene = useCallback(async (sceneNumber: number, title: string): Promise<void> => {
    if (!story) return

    try {
      // Simulate AI scene regeneration
      await new Promise(resolve => setTimeout(resolve, 1000))

      const newScene: StoryScene = {
        sceneNumber,
        description: `Regenerated scene ${sceneNumber} for ${title}`,
        prompt: `Regenerated scene ${sceneNumber}: ${title} - fresh perspective, creative angle, enhanced quality`,
        duration: 8,
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
  }
}
