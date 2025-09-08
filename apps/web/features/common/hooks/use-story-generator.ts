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
  characterReferenceImage?: string
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
      const frameCount = Math.floor(customDuration / frameDuration)
      
      console.log('Story generation debug:', {
        customDuration,
        frameDuration,
        frameCount,
        title
      })

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
      
      console.log('Generated story scenes:', {
        requestedFrames: frameCount,
        actualScenes: storyScenes.length,
        scenes: storyScenes.map(s => ({ description: s.description, prompt: s.prompt.substring(0, 100) + '...' }))
      })
      
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
        story: "A lone character in a black fur cloak stands atop a snowy mountain peak, surveying the vast landscape below. The wind howls through the mountains as the character spots a massive dragon emerging from the clouds. The dragon's scales shimmer with ancient power as it circles the mountain, its eyes glowing with primal intelligence. The character draws their legendary sword, the blade humming with magical energy. The dragon swoops down, breathing fire that melts the snow around the character. The character dodges the flames and leaps onto the dragon's back, gripping its scales tightly. They engage in an epic aerial battle, the character striking with precision while the dragon twists and turns through the sky. Finally, the character finds the dragon's weak spot and delivers the decisive blow, causing the dragon to land gracefully on the mountain. Instead of continuing the fight, the dragon bows its head in respect, recognizing the character's courage and skill. The character sheathes their sword and places a hand on the dragon's snout, forming an unexpected alliance. Together, they watch the sunset over the mountains, the beginning of a legendary partnership.",
        theme: "epic fantasy, character vs dragon, respect and alliance"
      },
      'panda': {
        story: "A character wearing stylish black sunglasses stands confidently on a snowy mountain peak, the crisp mountain air creating a magical atmosphere. The character adjusts their sunglasses and begins to dance, their movements surprisingly graceful and fluid. Snowflakes swirl around the character as they twirl and spin, creating a magical winter dance. The character's dance becomes more energetic, incorporating martial arts moves and playful gestures. Other mountain animals gather to watch the performance, including curious mountain goats and a wise old eagle perched on a nearby rock. The character's dance reaches a crescendo, and they strike a dramatic pose as the sun sets behind the mountains. The animals applaud with various sounds, and the character takes a bow, removing their sunglasses to reveal twinkling eyes. The character then invites the other animals to join in the dance, creating a joyful mountain celebration. As night falls, the character leads a procession of dancing animals down the mountain, their silhouettes dancing against the starry sky.",
        theme: "playful character, mountain dance, animal friendship, winter magic"
      },
      'gentleman': {
        story: "A distinguished character in a tailored suit stands in a futuristic laboratory, surrounded by holographic displays and advanced technology. The character carefully examines a small axolotl swimming in a glowing tank, its gills pulsing with bioluminescent light. The axolotl seems to recognize the character and swims to the glass, pressing its tiny face against it. The character smiles warmly and begins to explain the axolotl's unique regenerative abilities to an audience of scientists. As they speak, the axolotl's tank transforms into a miniature ecosystem with floating plants and gentle currents. The character demonstrates how the axolotl can regrow lost limbs, showing holographic projections of the process. The axolotl becomes excited and starts performing graceful underwater acrobatics, its movements synchronized with the character's explanations. The audience is captivated by both the character's knowledge and the axolotl's charm. The character concludes their presentation by gently releasing the axolotl into a larger, more natural habitat. The axolotl swims around joyfully, and the character watches with pride, having successfully shared the wonder of this remarkable creature with the world.",
        theme: "scientific character, axolotl discovery, futuristic lab, knowledge sharing"
      },
      'bunny': {
        story: "A character sits on a wooden stage, holding a miniature guitar. The character strums the guitar strings tentatively at first, creating soft, melodic notes that echo through a magical forest clearing. As the character gains confidence, they begin to play a cheerful tune, their movements swaying to the rhythm. The music attracts other forest animals - squirrels, birds, and even a wise old owl - who gather around to listen. The character's playing becomes more skilled, incorporating fingerpicking and strumming patterns. The forest animals start to dance and sway to the music, creating a joyful woodland concert. The character closes their eyes in concentration, lost in the music, and the guitar begins to glow with magical energy. Sparkles and musical notes float through the air, and the entire forest seems to come alive with the character's melody. The performance reaches a beautiful crescendo, and the character opens their eyes to see the enchanted forest celebrating their music. The character takes a bow, and the forest animals cheer, making the character blush with happiness.",
        theme: "musical character, forest concert, magical music, animal audience"
      },
      'generic': {
        story: "A character begins their journey in a mysterious setting, filled with wonder and possibility. The character moves through the environment with purpose, their actions creating a sense of adventure and discovery. As the story unfolds, the character encounters various challenges and opportunities that test their resolve. The character's determination and creativity help them navigate through each situation with grace and skill. The character's journey reaches a pivotal moment where they must make an important decision that will shape their destiny. The character's choice leads to a climactic scene filled with emotion and significance. The character's actions inspire others around them, creating a ripple effect of positive change. The character's journey concludes with a moment of reflection and growth, having learned valuable lessons along the way. The character stands proud, having completed their adventure and ready for whatever comes next.",
        theme: "adventure, character journey, growth and discovery"
      }
    }

    // Try to match the title with a story template
    const titleLower = title.toLowerCase()
    let selectedStory = storyTemplates['generic'] // default to generic

    if (titleLower.includes('warrior') || titleLower.includes('dragon') || titleLower.includes('sword')) {
      selectedStory = storyTemplates['warrior']
    } else if (titleLower.includes('panda') || titleLower.includes('fluffy') || titleLower.includes('dance')) {
      selectedStory = storyTemplates['panda']
    } else if (titleLower.includes('gentleman') || titleLower.includes('axolotl') || titleLower.includes('scientist')) {
      selectedStory = storyTemplates['gentleman']
    } else if (titleLower.includes('bunny') || titleLower.includes('guitar') || titleLower.includes('music')) {
      selectedStory = storyTemplates['bunny']
    }

    return selectedStory
  }

  // Divide the complete story into flowing frames
  const divideStoryIntoFrames = (storyData: any, frameCount: number) => {
    const { story, theme } = storyData
    
    console.log('Dividing story into frames:', {
      requestedFrames: frameCount,
      storyLength: story.length,
      theme
    })
    
    // For better story flow, we'll create connected frames that build on each other
    const frames = []
    
    if (frameCount === 1) {
      // Single frame - use the entire story
      frames.push({
        description: `Complete story - ${theme}`,
        prompt: `${story} - complete story, cinematic quality, professional lighting, 8 seconds`
      })
    } else if (frameCount === 2) {
      // Two frames - beginning and end with proper story flow
      const sentences = story.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
      const midPoint = Math.ceil(sentences.length / 2)
      
      const beginning = sentences.slice(0, midPoint).join('. ').trim()
      const ending = sentences.slice(midPoint).join('. ').trim()
      
      console.log('🎭 Two-frame story division:')
      console.log('  Beginning:', beginning)
      console.log('  Ending:', ending)
      
      frames.push({
        description: `Opening scene - ${theme}`,
        prompt: `${beginning} - opening scene, establishing shot, cinematic quality, professional lighting, 8 seconds`
      })
      
      frames.push({
        description: `Story conclusion - ${theme}`,
        prompt: `${ending} - story ending, dramatic lighting, emotional closure, 8 seconds`
      })
    } else {
      // Multiple frames - create flowing progression
      const sentences = story.split(/[.!?]+/).filter((s: string) => s.trim().length > 0)
      const sentencesPerFrame = Math.ceil(sentences.length / frameCount)
      
      console.log('🎬 Multi-frame story division:', { sentencesPerFrame, totalSentences: sentences.length })
      
      for (let i = 0; i < frameCount; i++) {
        const startIndex = i * sentencesPerFrame
        const endIndex = Math.min(startIndex + sentencesPerFrame, sentences.length)
        
        const frameText = sentences.slice(startIndex, endIndex).join('. ').trim()
        
        let frameDescription = ''
        let framePrompt = ''
        
        if (i === 0) {
          frameDescription = `Opening scene - ${theme}`
          framePrompt = `${frameText} - opening scene, establishing shot, cinematic quality, professional lighting, 8 seconds`
        } else if (i === frameCount - 1) {
          frameDescription = `Story conclusion - ${theme}`
          framePrompt = `${frameText} - story ending, dramatic lighting, emotional closure, 8 seconds`
        } else {
          frameDescription = `Story continues - ${theme}`
          framePrompt = `${frameText} - story continuation, flowing narrative, dynamic movement, cinematic quality, 8 seconds`
        }
        
        console.log(`  Frame ${i + 1}:`, frameText)
        
        frames.push({
          description: frameDescription,
          prompt: framePrompt
        })
      }
    }
    
    console.log('Final frame count:', {
      requested: frameCount,
      created: frames.length,
      frames: frames.map((f, i) => `Frame ${i + 1}: ${f.description}`)
    })
    
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

  const setCharacterReferenceImage = useCallback((imageUrl: string) => {
    if (story) {
      setStory(prev => prev ? { ...prev, characterReferenceImage: imageUrl } : null)
    }
  }, [story])

  const clearCharacterReferenceImage = useCallback(() => {
    if (story) {
      setStory(prev => prev ? { ...prev, characterReferenceImage: undefined } : null)
    }
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
    setCharacterReferenceImage,
    clearCharacterReferenceImage,
    clearStory,
    clearError,
    canGenerateVideo,
    updateSceneVideoUrl,
  }
}
