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

  const generateStory = useCallback(async (title: string, customDuration: number = 8): Promise<Story | null> => {
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
      // Simulate AI story generation with proper narrative flow
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Calculate frame count (each frame is exactly 8 seconds)
      const frameDuration = 8
      const frameCount = customDuration / frameDuration

      const generatedStory: Story = {
        title: title.trim(),
        customDuration,
        frameDuration,
        scenes: [],
        totalDuration: customDuration,
        isApproved: false
      }

      // Generate a single flowing story divided into frames
      const storyScenes = generateFlowingStory(title, frameCount)
      
      generatedStory.scenes = storyScenes.map((scene, index) => ({
        sceneNumber: index + 1,
        description: scene.description,
        prompt: scene.prompt,
        duration: frameDuration, // Always 8 seconds
        isApproved: false
      }))

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

  // Generate a complete flowing story
  const generateFlowingStory = (title: string, frameCount: number) => {
    // First, generate the complete story narrative
    const completeStory = generateCompleteStory(title)
    
    // Then divide it into flowing frames
    return divideStoryIntoFrames(completeStory, frameCount)
  }

  // Generate a complete flowing story
  const generateCompleteStory = (title: string) => {
    const storyTemplates = {
      'warrior': {
        story: "A lone warrior in a black fur cloak stands atop a snowy mountain peak, surveying the vast landscape below. The wind howls through the mountains as the warrior spots a massive dragon emerging from the clouds. The dragon's scales shimmer with ancient power as it circles the mountain, its eyes glowing with primal intelligence. The warrior draws their legendary sword, the blade humming with magical energy. The dragon swoops down, breathing fire that melts the snow around the warrior. The warrior dodges the flames and leaps onto the dragon's back, gripping its scales tightly. They engage in an epic aerial battle, the warrior striking with precision while the dragon twists and turns through the sky. Finally, the warrior finds the dragon's weak spot and delivers the decisive blow, causing the dragon to land gracefully on the mountain. Instead of continuing the fight, the dragon bows its head in respect, recognizing the warrior's courage and skill. The warrior sheathes their sword and places a hand on the dragon's snout, forming an unexpected alliance. Together, they watch the sunset over the mountains, the beginning of a legendary partnership.",
        theme: "epic fantasy, warrior vs dragon, respect and alliance"
      },
      'panda': {
        story: "A fluffy panda wearing stylish black sunglasses stands confidently on a snowy mountain peak, the crisp mountain air ruffling its fur. The panda adjusts its sunglasses and begins to dance, its movements surprisingly graceful for such a large creature. Snowflakes swirl around the panda as it twirls and spins, creating a magical winter dance. The panda's dance becomes more energetic, incorporating martial arts moves and playful gestures. Other mountain animals gather to watch the performance, including curious mountain goats and a wise old eagle perched on a nearby rock. The panda's dance reaches a crescendo, and it strikes a dramatic pose as the sun sets behind the mountains. The animals applaud with various sounds, and the panda takes a bow, removing its sunglasses to reveal twinkling eyes. The panda then invites the other animals to join in the dance, creating a joyful mountain celebration. As night falls, the panda leads a procession of dancing animals down the mountain, their silhouettes dancing against the starry sky.",
        theme: "playful panda, mountain dance, animal friendship, winter magic"
      },
      'gentleman': {
        story: "A distinguished gentleman in a tailored suit stands in a futuristic laboratory, surrounded by holographic displays and advanced technology. The gentleman carefully examines a small axolotl swimming in a glowing tank, its gills pulsing with bioluminescent light. The axolotl seems to recognize the gentleman and swims to the glass, pressing its tiny face against it. The gentleman smiles warmly and begins to explain the axolotl's unique regenerative abilities to an audience of scientists. As he speaks, the axolotl's tank transforms into a miniature ecosystem with floating plants and gentle currents. The gentleman demonstrates how the axolotl can regrow lost limbs, showing holographic projections of the process. The axolotl becomes excited and starts performing graceful underwater acrobatics, its movements synchronized with the gentleman's explanations. The audience is captivated by both the gentleman's knowledge and the axolotl's charm. The gentleman concludes his presentation by gently releasing the axolotl into a larger, more natural habitat. The axolotl swims around joyfully, and the gentleman watches with pride, having successfully shared the wonder of this remarkable creature with the world.",
        theme: "scientific gentleman, axolotl discovery, futuristic lab, knowledge sharing"
      },
      'bunny': {
        story: "A cute 3D cartoon bunny with floppy ears and big expressive eyes sits on a wooden stage, holding a miniature guitar. The bunny strums the guitar strings tentatively at first, creating soft, melodic notes that echo through a magical forest clearing. As the bunny gains confidence, it begins to play a cheerful tune, its ears swaying to the rhythm. The music attracts other forest animals - squirrels, birds, and even a wise old owl - who gather around to listen. The bunny's playing becomes more skilled, incorporating fingerpicking and strumming patterns. The forest animals start to dance and sway to the music, creating a joyful woodland concert. The bunny closes its eyes in concentration, lost in the music, and the guitar begins to glow with magical energy. Sparkles and musical notes float through the air, and the entire forest seems to come alive with the bunny's melody. The performance reaches a beautiful crescendo, and the bunny opens its eyes to see the enchanted forest celebrating its music. The bunny takes a bow, and the forest animals cheer, making the bunny blush with happiness.",
        theme: "musical bunny, forest concert, magical music, animal audience"
      }
    }

    // Try to match the title with a story template
    const titleLower = title.toLowerCase()
    let selectedStory = storyTemplates['warrior'] // default

    if (titleLower.includes('panda') || titleLower.includes('fluffy')) {
      selectedStory = storyTemplates['panda']
    } else if (titleLower.includes('gentleman') || titleLower.includes('axolotl')) {
      selectedStory = storyTemplates['gentleman']
    } else if (titleLower.includes('bunny') || titleLower.includes('guitar')) {
      selectedStory = storyTemplates['bunny']
    } else if (titleLower.includes('warrior') || titleLower.includes('dragon')) {
      selectedStory = storyTemplates['warrior']
    }

    return selectedStory
  }

  // Divide the complete story into flowing frames
  const divideStoryIntoFrames = (storyData: any, frameCount: number) => {
    const { story, theme } = storyData
    
    // Split the story into sentences for better flow
    const sentences = story.split('. ').filter((s: string) => s.trim().length > 0)
    
    // Calculate how many sentences per frame
    const sentencesPerFrame = Math.ceil(sentences.length / frameCount)
    
    const frames = []
    
    for (let i = 0; i < frameCount; i++) {
      const startIndex = i * sentencesPerFrame
      const endIndex = Math.min(startIndex + sentencesPerFrame, sentences.length)
      
      // Get the sentences for this frame
      const frameSentences = sentences.slice(startIndex, endIndex)
      const frameText = frameSentences.join('. ') + (endIndex < sentences.length ? '.' : '')
      
      // Create a flowing prompt that continues from the previous frame
      let framePrompt = ''
      let frameDescription = ''
      
      if (i === 0) {
        // Opening frame
        frameDescription = `Opening scene - ${theme}`
        framePrompt = `${frameText} - opening scene, establishing shot, cinematic quality, professional lighting, 8 seconds`
      } else if (i === frameCount - 1) {
        // Final frame
        frameDescription = `Conclusion - ${theme}`
        framePrompt = `${frameText} - story ending, dramatic lighting, emotional closure, 8 seconds`
      } else {
        // Middle frames - continue the story
        frameDescription = `Story continues - ${theme}`
        framePrompt = `${frameText} - story continuation, flowing narrative, dynamic movement, cinematic quality, 8 seconds`
      }
      
      frames.push({
        description: frameDescription,
        prompt: framePrompt
      })
    }
    
    return frames
  }

  const regenerateStory = useCallback(async (title: string, customDuration?: number): Promise<Story | null> => {
    // Clear current story and generate a new one
    setStory(null)
    const duration = customDuration || story?.customDuration || 8
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
  }, [])

  const approveScene = useCallback((sceneNumber: number): void => {
    setStory(prev => {
      if (!prev) return prev
      const updatedScenes = prev.scenes.map(scene => 
        scene.sceneNumber === sceneNumber 
          ? { ...scene, isApproved: true }
          : scene
      )
      
      const allApproved = updatedScenes.every(scene => scene.isApproved)
      
      return {
        ...prev,
        scenes: updatedScenes,
        isApproved: allApproved
      }
    })
  }, [])

  const approveAllScenes = useCallback((): void => {
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
  }, [])

  const clearStory = useCallback((): void => {
    setStory(null)
    setError(null)
  }, [])

  const clearError = useCallback((): void => {
    setError(null)
  }, [])

  const canGenerateVideo = useCallback((): boolean => {
    return story !== null && story.scenes.some(scene => scene.isApproved)
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
    canGenerateVideo,
    updateSceneVideoUrl,
  }
}
