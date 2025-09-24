import { useState, useCallback } from 'react'
import { generateAIPromptRegeneration, type PromptRegenerationOptions } from '#lib/ai/story-prompt-regenerator'
import { analyzeStoryConsistency, validateSceneConsistency, type ConsistencyRules } from '#lib/ai/story-consistency-analyzer'
import { generateAIStory, analyzeStoryTitle, type GeneratedStoryData } from '#lib/ai/story-generator'

export interface StoryScene {
  sceneNumber: number
  description: string
  prompt: string
  duration: number
  isApproved: boolean
  videoUrl?: string
  isGeneratingVideo?: boolean
  dialogues?: string[]
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
  const [isRegeneratingScene, setIsRegeneratingScene] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [consistencyRules, setConsistencyRules] = useState<ConsistencyRules | null>(null)

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
      const frameCount = Math.max(1, Math.floor(customDuration / frameDuration))
      
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
      const storyScenes = await generateFlowingStory(title, frameCount, customDuration)
      
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
        isApproved: false,
        dialogues: scene.dialogues || []
      }))

      setStory(generatedStory)
      
      // Analyze story consistency after generation
      try {
        const rules = await analyzeStoryConsistency(title, generatedStory.scenes)
        setConsistencyRules(rules)
        console.log('Story consistency rules generated:', rules)
      } catch (error) {
        console.error('Failed to analyze story consistency:', error)
      }
      
      return generatedStory
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate story'
      setError(errorMessage)
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [])

  // Generate a complete flowing story using AI
  const generateCompleteStory = useCallback(async (title: string, frameCount: number, customDuration: number): Promise<GeneratedStoryData> => {
    try {
      // Analyze the title to determine style, character, and setting
      const { style, characterType, setting } = analyzeStoryTitle(title);
      
      console.log('🎬 Generating AI story with:', { title, style, characterType, setting, frameCount, customDuration });

      // Generate story using AI
      const storyData = await generateAIStory({
        title,
        duration: customDuration,
        frameCount,
        style: style as any,
        characterType,
        setting
      });

      console.log('✅ AI story generated successfully:', { theme: storyData.theme, length: storyData.story.length });
      return storyData;

    } catch (error) {
      console.error('❌ AI story generation failed, using fallback:', error);
      
      // Fallback to a simple story if AI fails
      return {
        story: `A character begins their journey in a mysterious setting, filled with wonder and possibility. The character moves through the environment with purpose, their actions creating a sense of adventure and discovery. As the story unfolds, the character encounters various challenges and opportunities that test their resolve. The character's determination and creativity help them navigate through each situation with grace and skill. The character's journey reaches a pivotal moment where they must make an important decision that will shape their destiny. The character's choice leads to a climactic scene filled with emotion and significance. The character's actions inspire others around them, creating a ripple effect of positive change. The character's journey concludes with a moment of reflection and growth, having learned valuable lessons along the way. The character stands proud, having completed their adventure and ready for whatever comes next.`,
        theme: "adventure, character journey, growth and discovery"
      };
    }
  }, [])

  // Generate a complete flowing story
  const generateFlowingStory = useCallback(async (title: string, frameCount: number, customDuration: number) => {
    console.log('🎬 generateFlowingStory called with:', { title, frameCount, customDuration })
    
    // First, generate the complete story narrative using AI
    const completeStory = await generateCompleteStory(title, frameCount, customDuration)
    console.log('📖 Complete story generated:', completeStory)
    
    // Then divide it into flowing frames
    const frames = divideStoryIntoFrames(completeStory, frameCount)
    console.log('🎞️ Frames created:', { requested: frameCount, actual: frames.length, frames })
    
    return frames
  }, [generateCompleteStory])

  // Extract dialogue from prompts for potential audio addition
  const extractDialogue = (prompt: string): string[] => {
    const dialogueMatches = prompt.match(/"([^"]+)"/g)
    return dialogueMatches ? dialogueMatches.map(d => d.replace(/"/g, '')) : []
  }


  // Create JSON-formatted prompt for VEO3 API with enhanced consistency
  const optimizePromptForVEO3 = (prompt: string, frameIndex: number = 0, totalFrames: number = 1, theme: string = ''): string => {
    // Extract dialogues from the prompt
    const dialogues = extractDialogue(prompt)
    
    // Clean the prompt for visual description and make it action-oriented
    let visualPrompt = prompt
      // Remove audio references
      .replace(/Audio:.*$/gm, '')
      .replace(/\(implied\).*$/gm, '')
      .replace(/He says:.*$/gm, (match) => {
        // Convert dialogue to visual description
        const dialogue = match.replace('He says:', '').trim()
        return `He looks directly at the camera with animated facial expressions, his mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
      })
      .replace(/She says:.*$/gm, (match) => {
        const dialogue = match.replace('She says:', '').trim()
        return `She looks directly at the camera with animated facial expressions, her mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
      })
      .replace(/The Yeti says:.*$/gm, (match) => {
        const dialogue = match.replace('The Yeti says:', '').trim()
        return `The Yeti looks directly at the camera with animated facial expressions, his mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
      })
      // Keep visual elements
      .replace(/Subtitles: Off/g, 'Visual storytelling focus')
      .trim()

    // Make the prompt more action-oriented for better video generation
    if (!visualPrompt.includes('walks') && !visualPrompt.includes('moves') && !visualPrompt.includes('runs') && !visualPrompt.includes('jumps')) {
      // Add dynamic actions based on story theme and frame
      const actions = getDynamicActions(theme, frameIndex, totalFrames)
      visualPrompt = `${actions.opening} ${visualPrompt} ${actions.closing}`
    }

    // Add consistency enhancements
    visualPrompt = addConsistencyEnhancements(visualPrompt)
    
    // Truncate if too long - reduce to fit 2000 char limit
    visualPrompt = truncatePrompt(visualPrompt, 300)

    // Determine character type and specific details
    const isYeti = theme.includes('yeti') || visualPrompt.toLowerCase().includes('yeti')
    const isVlog = theme.includes('vlog') || visualPrompt.toLowerCase().includes('vlog')
    
    // Create specific camera and technical details based on theme
    let cameraDetails = {
      angle: frameIndex === 0 ? 'establishing shot' : 'continuation shot',
      movement: frameIndex === totalFrames - 1 ? 'dramatic close-up' : 'smooth transition',
      lighting: 'consistent cinematic lighting'
    }
    
    let technicalDetails = {
      timeOfDay: 'consistent lighting and time of day across all frames',
      lens: 'maintain consistent camera lens and focal length',
      filmStock: 'consistent cinematic grading and color treatment',
      audio: 'ambient sound consistent with setting and character',
      background: 'maintain same background elements and environment',
      subtitles: 'Off'
    }
    
    // Customize for Yeti vlog style
    if (isYeti && isVlog) {
      cameraDetails = {
        angle: frameIndex === 0 ? 'selfie-style handheld vlog' : 'slightly low tripod-like angle, vlog continuation shot',
        movement: frameIndex === totalFrames - 1 ? 'dramatic close-up' : 'slightly shaky handheld, natural vlog movement',
        lighting: 'cinematic cool blue with frosty highlights on steam and icicles'
      }
      
      technicalDetails = {
        timeOfDay: frameIndex === 0 ? 'early morning, pale mountain light streaming in' : 'early morning continuing, steady pale light through cave opening',
        lens: frameIndex === 0 ? 'ultra-wide selfie lens, shallow depth of field' : 'wide lens capturing Yeti and cooking pot in frame',
        filmStock: 'crisp digital cinematic vlog style, cool-toned grading',
        audio: frameIndex === 0 ? 'ambient cave echoes, sizzling ice in pan, faint crunching snow underfoot' : 'faint bubbling crackle from icy pot, exaggerated crunching sound as he eats',
        background: 'icy cave kitchen with icicle utensils, frozen salmon, and snow piles visible',
        subtitles: 'Off'
      }
    }

    // Create concise JSON structure for VEO3 API
    const jsonPrompt = {
      scene: {
        frame: frameIndex + 1,
        totalFrames: totalFrames,
        type: frameIndex === 0 ? 'opening' : frameIndex === totalFrames - 1 ? 'closing' : 'continuation',
        theme: theme
      },
      visual: {
        description: visualPrompt,
        camera: cameraDetails.angle,
        duration: 8
      },
      dialogue: dialogues.length > 0 ? {
        line: dialogues[0] || dialogues.join(' ')
      } : {
        line: getDynamicDialogue(theme, frameIndex, totalFrames)
      },
      consistency: {
        character: isYeti ? 'fluffy white Yeti with icy blue eyes' : 'same character design throughout',
        setting: isYeti ? 'icy cave kitchen' : 'same environment across frames'
      },
      technical: {
        timeOfDay: technicalDetails.timeOfDay,
        lens: technicalDetails.lens,
        audio: technicalDetails.audio,
        background: technicalDetails.background
      }
    }

    // Convert to JSON string for VEO3 API
    return JSON.stringify(jsonPrompt, null, 2)
  }

  // Truncate prompt if it exceeds reasonable length limits
  const truncatePrompt = useCallback((prompt: string, maxLength = 800): string => {
    if (prompt.length <= maxLength) return prompt
    
    // Find the last complete sentence within the limit
    const truncated = prompt.substring(0, maxLength)
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    )
    
    if (lastSentenceEnd > maxLength * 0.7) {
      return truncated.substring(0, lastSentenceEnd + 1)
    }
    
    return truncated + '...'
  }, [])

  // Generate dynamic dialogue based on theme and frame
  const getDynamicDialogue = useCallback((theme: string, frameIndex: number, totalFrames: number) => {
    const isAdventure = theme.includes('adventure') || theme.includes('journey') || theme.includes('delivery')
    const isCooking = theme.includes('cooking') || theme.includes('vlog') || theme.includes('kitchen')
    const isForest = theme.includes('forest') || theme.includes('jungle') || theme.includes('nature')
    const isDelivery = theme.includes('delivery') || theme.includes('package') || theme.includes('special')
    
    if (frameIndex === 0) {
      // Opening dialogue
      if (isAdventure && isDelivery) {
        return "Alright, let's see what we've got here! This delivery is going to be epic!"
      } else if (isCooking) {
        return "Welcome to my kitchen! Today we're making something absolutely delicious!"
      } else if (isForest) {
        return "This place is amazing! Look at all these beautiful trees and wildlife!"
      } else {
        return "Let's see what this adventure brings! I'm ready for anything!"
      }
    } else if (frameIndex === totalFrames - 1) {
      // Closing dialogue
      if (isAdventure && isDelivery) {
        return "Mission accomplished! That was one successful delivery!"
      } else if (isCooking) {
        return "That was delicious! Five stars, highly recommend this recipe!"
      } else if (isForest) {
        return "What an amazing adventure! This forest is absolutely beautiful!"
      } else {
        return "We did it! That was an incredible journey!"
      }
    } else {
      // Middle dialogue
      if (isAdventure && isDelivery) {
        return "Keep moving forward! We're making great progress on this delivery!"
      } else if (isCooking) {
        return "This is looking amazing! The flavors are coming together perfectly!"
      } else if (isForest) {
        return "This forest is incredible! I can't believe how peaceful it is here!"
      } else {
        return "Keep moving forward! This adventure is getting better and better!"
      }
    }
  }, [])

  // Generate dynamic actions based on theme and frame
  const getDynamicActions = useCallback((theme: string, frameIndex: number, totalFrames: number) => {
    const isAdventure = theme.includes('adventure') || theme.includes('journey') || theme.includes('delivery')
    const isCooking = theme.includes('cooking') || theme.includes('vlog') || theme.includes('kitchen')
    const isForest = theme.includes('forest') || theme.includes('jungle') || theme.includes('nature')
    const isDelivery = theme.includes('delivery') || theme.includes('package') || theme.includes('special')
    
    const actions = {
      opening: '',
      closing: ''
    }
    
    if (frameIndex === 0) {
      // Opening frame actions
      if (isAdventure && isDelivery) {
        actions.opening = `The protagonist approaches a delivery vehicle, opens the door, and climbs in while talking: "Alright, let's see what we've got here!" Starts the engine and begins driving.`
        actions.closing = `The protagonist continues driving, looking at the camera, making hand gestures.`
      } else if (isCooking) {
        actions.opening = `The protagonist walks into the kitchen, puts on an apron, and starts cooking while talking: "Welcome to my kitchen! Today we're making something special."`
        actions.closing = `The protagonist continues cooking, tasting the food, and making comments.`
      } else if (isForest) {
        actions.opening = `The protagonist walks through the forest, stepping over logs, and looking around curiously while talking: "This place is amazing! Look at all these trees."`
        actions.closing = `The protagonist continues exploring, stopping to examine plants, and using hand gestures.`
      } else {
        actions.opening = `The protagonist confidently walks forward, looking around with curiosity while talking: "Let's see what this adventure brings!"`
        actions.closing = `The protagonist continues moving forward, engaging with their environment.`
      }
    } else if (frameIndex === totalFrames - 1) {
      // Closing frame actions
      if (isAdventure && isDelivery) {
        actions.opening = `The protagonist parks the vehicle, gets out, and walks toward the destination while talking: "We made it! Let's deliver this package."`
        actions.closing = `The protagonist rings the doorbell, hands over the package, and celebrates: "Mission accomplished!"`
      } else if (isCooking) {
        actions.opening = `The protagonist finishes cooking, plates the food, and presents it: "And here's our masterpiece!"`
        actions.closing = `The protagonist stands tall and proud, looking at the camera, and says: "That was delicious! Five stars!"`
      } else if (isForest) {
        actions.opening = `The protagonist reaches a clearing, looks around in amazement, and talks: "Wow, this is incredible!"`
        actions.closing = `The protagonist stands up, stretches, looks at the camera, and says: "What an amazing adventure!"`
      } else {
        actions.opening = `The protagonist reaches their destination, looks around with satisfaction, and talks: "We did it!"`
        actions.closing = `The protagonist stands tall and proud, looking at the camera, and raises their arms in celebration.`
      }
    } else {
      // Middle frame actions
      if (isAdventure && isDelivery) {
        actions.opening = `The protagonist continues driving, looking at the camera, making hand gestures.`
        actions.closing = `The protagonist adjusts the radio and continues the conversation while driving.`
      } else if (isCooking) {
        actions.opening = `The protagonist continues cooking, tasting the food, and making comments.`
        actions.closing = `The protagonist uses kitchen tools and maintains animated facial expressions.`
      } else if (isForest) {
        actions.opening = `The protagonist continues exploring, stopping to examine plants, and using hand gestures.`
        actions.closing = `The protagonist continues moving through the forest.`
      } else {
        actions.opening = `The protagonist continues moving forward, engaging with their environment.`
        actions.closing = `The protagonist uses hand gestures while continuing their journey.`
      }
    }
    
    return actions
  }, [])

  // Add consistency enhancements to prompts (with deduplication)
  const addConsistencyEnhancements = useCallback((prompt: string): string => {
    let enhanced = prompt
    const enhancements = new Set<string>()

    // Determine character name for natural references
    let characterName = 'The protagonist'
    let characterPronoun = 'the protagonist'
    let characterPossessive = 'the protagonist\'s'
    
    if (enhanced.toLowerCase().includes('yeti')) {
      characterName = 'The Yeti'
      characterPronoun = 'the yeti'
      characterPossessive = 'the yeti\'s'
    } else if (enhanced.toLowerCase().includes('warrior')) {
      characterName = 'The warrior'
      characterPronoun = 'the warrior'
      characterPossessive = 'the warrior\'s'
    } else if (enhanced.toLowerCase().includes('panda')) {
      characterName = 'The panda'
      characterPronoun = 'the panda'
      characterPossessive = 'the panda\'s'
    } else if (enhanced.toLowerCase().includes('gentleman')) {
      characterName = 'The gentleman'
      characterPronoun = 'the gentleman'
      characterPossessive = 'the gentleman\'s'
    } else if (enhanced.toLowerCase().includes('bunny')) {
      characterName = 'The bunny'
      characterPronoun = 'the bunny'
      characterPossessive = 'the bunny\'s'
    }
    
    // Replace character references with natural character name
    if (enhanced.includes('character')) {
      // Replace "A character" with character name
      enhanced = enhanced.replace(/A character/g, characterName)
      // Replace "The character" with character name
      enhanced = enhanced.replace(/The character/g, characterName)
      // Replace "character's" with character possessive
      enhanced = enhanced.replace(/\bcharacter's\b/g, characterPossessive)
      // Replace "character" with character pronoun
      enhanced = enhanced.replace(/\bcharacter\b/g, characterPronoun)
      
      // Clean up any "the the" duplications
      enhanced = enhanced.replace(/the the /g, 'the ')
      enhanced = enhanced.replace(/The the /g, 'The ')
    }

    // Collect enhancements without duplicates
    if (enhanced.includes('snowy mountain') || enhanced.includes('winter')) {
      enhancements.add('consistent snowy mountain setting, winter atmosphere, snow-covered peaks, cold environment')
    }

    if (enhanced.includes('dance') || enhanced.includes('dancing')) {
      enhancements.add('continuous dancing movement, fluid motion, choreographed steps')
    }

    if (enhanced.includes('mountain animals') || enhanced.includes('goats') || enhanced.includes('eagle')) {
      enhancements.add('consistent mountain animals: mountain goats, wise eagle, alpine creatures')
    }

    // Add base cinematic consistency
    enhancements.add('consistent lighting, same camera angle, continuous scene flow')

    // Append unique enhancements
    if (enhancements.size > 0) {
      enhanced += ' - ' + Array.from(enhancements).join(', ')
    }

    return enhanced
  }, [])

  // Distribute dialogues based on sentence ranges for better alignment
  const distributeDialoguesByRange = useCallback((allDialogues: string[], frameIndex: number, totalFrames: number, storyParts: string[]): string[] => {
    if (allDialogues.length === 0) return []
    
    const sentencesPerFrame = Math.ceil(storyParts.length / totalFrames)
    const startIndex = frameIndex * sentencesPerFrame
    const endIndex = Math.min(startIndex + sentencesPerFrame, storyParts.length)
    
    // Get the text range for this frame
    const frameText = storyParts.slice(startIndex, endIndex).join(' ').toLowerCase()
    
    // Find dialogues that appear in this frame's text
    const frameDialogues = allDialogues.filter(dialogue => {
      const dialogueLower = dialogue.toLowerCase()
      return frameText.includes(dialogueLower) || 
             dialogueLower.includes(frameText.substring(0, 50)) ||
             frameText.includes(dialogueLower.substring(0, 20))
    })
    
    // If no dialogues found in this range, distribute evenly as fallback
    if (frameDialogues.length === 0 && allDialogues.length > 0) {
      const dialoguesPerFrame = Math.ceil(allDialogues.length / totalFrames)
      const startDialogue = frameIndex * dialoguesPerFrame
      const endDialogue = Math.min(startDialogue + dialoguesPerFrame, allDialogues.length)
      return allDialogues.slice(startDialogue, endDialogue)
    }
    
    return frameDialogues
  }, [])

  // Robust sentence splitting that handles dialogues properly
  const splitStoryIntoSentences = useCallback((story: string): string[] => {
    // Use a more sophisticated approach to split sentences
    // This handles dialogues with periods inside quotes
    const sentences: string[] = []
    let currentSentence = ''
    let insideQuotes = false
    let i = 0

    while (i < story.length) {
      const char = story[i]

      if (char === '"') {
        insideQuotes = !insideQuotes
        currentSentence += char
      } else if ((char === '.' || char === '!' || char === '?') && !insideQuotes) {
        // End of sentence outside quotes
        currentSentence += char
        if (currentSentence.trim().length > 0) {
          sentences.push(currentSentence.trim())
        }
        currentSentence = ''
      } else {
        currentSentence += char
      }
      i++
    }

    // Add the last sentence if it exists
    if (currentSentence.trim().length > 0) {
      sentences.push(currentSentence.trim())
    }

    return sentences.filter(s => s.length > 0)
  }, [])

  // Ensure CONTINUITY between frames - same story, same character, same setting
  const addFrameConsistency = useCallback((prompt: string, frameIndex: number, totalFrames: number): string => {
    let enhanced = prompt

    // Determine character name for natural references
    let characterName = 'The protagonist'
    let characterPronoun = 'the protagonist'
    let characterPossessive = 'the protagonist\'s'
    
    if (enhanced.toLowerCase().includes('yeti')) {
      characterName = 'The Yeti'
      characterPronoun = 'the yeti'
      characterPossessive = 'the yeti\'s'
    } else if (enhanced.toLowerCase().includes('warrior')) {
      characterName = 'The warrior'
      characterPronoun = 'the warrior'
      characterPossessive = 'the warrior\'s'
    } else if (enhanced.toLowerCase().includes('panda')) {
      characterName = 'The panda'
      characterPronoun = 'the panda'
      characterPossessive = 'the panda\'s'
    } else if (enhanced.toLowerCase().includes('gentleman')) {
      characterName = 'The gentleman'
      characterPronoun = 'the gentleman'
      characterPossessive = 'the gentleman\'s'
    } else if (enhanced.toLowerCase().includes('bunny')) {
      characterName = 'The bunny'
      characterPronoun = 'the bunny'
      characterPossessive = 'the bunny\'s'
    }
    
    // Replace character references with natural character name
    if (enhanced.includes('character')) {
      // Replace "A character" with character name
      enhanced = enhanced.replace(/A character/g, characterName)
      // Replace "The character" with character name
      enhanced = enhanced.replace(/The character/g, characterName)
      // Replace "character's" with character possessive
      enhanced = enhanced.replace(/\bcharacter's\b/g, characterPossessive)
      // Replace "character" with character pronoun
      enhanced = enhanced.replace(/\bcharacter\b/g, characterPronoun)
      
      // Clean up any "the the" duplications
      enhanced = enhanced.replace(/the the /g, 'the ')
      enhanced = enhanced.replace(/The the /g, 'The ')
    }
    
    // Add continuity markers
    if (frameIndex === 0) {
      enhanced += ' - the same character, same setting, story beginning'
    } else if (frameIndex === totalFrames - 1) {
      enhanced += ' - the same character, same setting, story ending'
    } else {
      enhanced += ' - the same character, same setting, story continuation'
    }

    // Add character reference consistency
    enhanced += ' - use character reference image for consistency, the same character appearance, same clothing, same style'

    return enhanced
  }, [])

  // Divide the complete story into flowing frames with proper story continuity
  const divideStoryIntoFrames = (storyData: GeneratedStoryData, frameCount: number) => {
    const { story, theme } = storyData
    
    console.log('Dividing story into frames:', {
      requestedFrames: frameCount,
      storyLength: story.length,
      theme
    })
    
    // Extract all dialogues from the story for continuity
    const allDialogues = story.match(/"([^"]+)"/g) || []
    console.log('📝 All dialogues found:', allDialogues)
    
    // For better story flow, we'll create connected frames that build on each other
    const frames = []
    
    if (frameCount === 1) {
      // Single frame - use the entire story
      frames.push({
        description: `Complete story - ${theme}`,
        prompt: optimizePromptForVEO3(`${story} - complete story, cinematic quality, professional lighting, 8 seconds`, 0, 1, theme),
        dialogues: allDialogues
      })
    } else {
      // Multiple frames - create flowing story progression
      const storyParts = splitStoryIntoSentences(story)
      
      console.log('🎬 Multi-frame story division:', { 
        totalSentences: storyParts.length,
        totalDialogues: allDialogues.length,
        frameCount
      })
      
      for (let i = 0; i < frameCount; i++) {
        let frameText = ''
        let frameDescription = ''
        let framePrompt = ''
        
        if (frameCount === 2) {
          // Two frames - beginning and end with CONTINUOUS story flow
          const midPoint = Math.ceil(storyParts.length / 2)
          
          if (i === 0) {
            // Beginning frame - setup and introduction
            frameText = storyParts.slice(0, midPoint).join(' ').trim()
            frameDescription = `Story beginning - ${theme}`
            framePrompt = `${frameText} - opening scene, establishing shot, character introduction, cinematic quality, professional lighting, 8 seconds`
          } else {
            // Ending frame - CONTINUATION of the same story
            const secondPart = storyParts.slice(midPoint).join(' ').trim()
            frameText = `Continuing the same story: ${secondPart}`
            frameDescription = `Story conclusion - ${theme}`
            framePrompt = `${frameText} - story ending, climax and resolution, dramatic lighting, emotional closure, 8 seconds`
          }
        } else {
          // Multiple frames - create CONTINUOUS story progression
          const sentencesPerFrame = Math.ceil(storyParts.length / frameCount)
          const startIndex = i * sentencesPerFrame
          const endIndex = Math.min(startIndex + sentencesPerFrame, storyParts.length)
          
          // Get the story part for this frame
          const frameStoryPart = storyParts.slice(startIndex, endIndex).join(' ').trim()
          
          // Make it CONTINUOUS by referencing the same story
          if (i === 0) {
            frameText = frameStoryPart
            frameDescription = `Story beginning - ${theme}`
            framePrompt = `${frameText} - opening scene, establishing shot, character introduction, cinematic quality, professional lighting, 8 seconds`
          } else if (i === frameCount - 1) {
            frameText = `Continuing the same story: ${frameStoryPart}`
            frameDescription = `Story conclusion - ${theme}`
            framePrompt = `${frameText} - story ending, climax and resolution, dramatic lighting, emotional closure, 8 seconds`
          } else {
            frameText = `Continuing the same story: ${frameStoryPart}`
            frameDescription = `Story development - ${theme}`
            framePrompt = `${frameText} - story continuation, character development, flowing narrative, dynamic movement, cinematic quality, 8 seconds`
          }
        }

        // Add frame-specific consistency enhancements
        framePrompt = addFrameConsistency(framePrompt, i, frameCount)
        
        // Get dialogues for this frame using range-based distribution
        const frameDialogues = distributeDialoguesByRange(allDialogues, i, frameCount, storyParts)
        
        console.log(`  Frame ${i + 1}:`, frameText)
        console.log(`  Frame ${i + 1} dialogues:`, frameDialogues)
        
        frames.push({
          description: frameDescription,
          prompt: optimizePromptForVEO3(framePrompt, i, frameCount, theme),
          dialogues: frameDialogues
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

  // Create AI-powered regenerations of prompts
  const createAIVariedRegeneration = useCallback(async (originalPrompt: string, sceneNumber: number, totalFrames: number, title: string, story?: Story): Promise<string> => {
    try {
      // Determine variation type based on scene number for variety
      const variationTypes = ['creative', 'dramatic', 'cinematic', 'emotional', 'action'] as const;
      const variationType = variationTypes[sceneNumber % variationTypes.length];

      // Get adjacent scenes for context
      let previousScene: { sceneNumber: number; prompt: string; description: string } | undefined;
      let nextScene: { sceneNumber: number; prompt: string; description: string } | undefined;

      if (story) {
        const currentIndex = story.scenes.findIndex(s => s.sceneNumber === sceneNumber);
        
        // Get previous scene
        if (currentIndex > 0) {
          const prev = story.scenes[currentIndex - 1];
          previousScene = {
            sceneNumber: prev.sceneNumber,
            prompt: prev.prompt,
            description: prev.description
          };
        }
        
        // Get next scene
        if (currentIndex < story.scenes.length - 1) {
          const next = story.scenes[currentIndex + 1];
          nextScene = {
            sceneNumber: next.sceneNumber,
            prompt: next.prompt,
            description: next.description
          };
        }
      }

      const options: PromptRegenerationOptions = {
        originalPrompt,
        sceneNumber,
        totalFrames,
        storyTitle: title,
        variationType,
        previousScene,
        nextScene,
        consistencyRules: story && consistencyRules ? consistencyRules : undefined
      };

      // Generate AI-powered regeneration
      const aiRegeneratedPrompt = await generateAIPromptRegeneration(options);

      // Validate consistency if rules are available
      if (story && consistencyRules) {
        const originalScene = story.scenes.find(s => s.sceneNumber === sceneNumber);
        if (originalScene) {
          const validation = validateSceneConsistency(originalScene, aiRegeneratedPrompt, consistencyRules);
          
          if (!validation.isConsistent) {
            console.warn(`Scene ${sceneNumber} regeneration may have consistency issues:`, {
              missingElements: validation.missingElements,
              preservedElements: validation.preservedElements
            });
            
            // If critical elements are missing, we could potentially retry or warn the user
            if (validation.missingElements.length > 0) {
              console.warn(`Missing critical elements: ${validation.missingElements.join(', ')}`);
            }
          } else {
            console.log(`Scene ${sceneNumber} regeneration maintains consistency`);
          }
        }
      }

      // If the original was JSON format, recreate the JSON structure
      if (originalPrompt.includes('"visual"') && originalPrompt.includes('"description"')) {
        return optimizePromptForVEO3(aiRegeneratedPrompt, sceneNumber - 1, totalFrames, title);
      } else {
        return aiRegeneratedPrompt;
      }
    } catch (error) {
      console.error('AI regeneration failed, falling back to simple variation:', error);
      
      // Fallback to simple variation if AI fails
      return createFallbackVariation(originalPrompt, sceneNumber, totalFrames, title);
    }
  }, [optimizePromptForVEO3])

  // Fallback function for when AI fails
  const createFallbackVariation = useCallback((originalPrompt: string, sceneNumber: number, totalFrames: number, title: string): string => {
    // Extract the core content from the original prompt (remove JSON structure if present)
    let coreContent = originalPrompt
    
    // If it's a JSON prompt, extract the visual description
    if (originalPrompt.includes('"visual"') && originalPrompt.includes('"description"')) {
      try {
        const jsonMatch = originalPrompt.match(/"description":\s*"([^"]+)"/)
        if (jsonMatch) {
          coreContent = jsonMatch[1]
        }
      } catch {
        // If JSON parsing fails, use the original prompt
      }
    }

    // Create simple variations based on scene number and content
    const variations = [
      // Variation 1: Add more dynamic movement
      coreContent.replace(/looks around/g, 'gazes around with wide eyes').replace(/talks:/g, 'exclaims with excitement:'),
      
      // Variation 2: Add more emotional depth
      coreContent.replace(/satisfaction/g, 'overwhelming joy and pride').replace(/talks:/g, 'shouts with enthusiasm:'),
      
      // Variation 3: Add more cinematic elements
      coreContent.replace(/looks around/g, 'slowly turns their head, taking in the magnificent view').replace(/talks:/g, 'whispers with awe:'),
      
      // Variation 4: Add more action
      coreContent.replace(/looks around/g, 'raises their arms triumphantly and spins around').replace(/talks:/g, 'calls out loudly:'),
      
      // Variation 5: Add more detail
      coreContent.replace(/looks around/g, 'pauses to admire the breathtaking scenery around them').replace(/talks:/g, 'says with a wide smile:')
    ]

    // Select variation based on scene number to ensure different results
    const selectedVariation = variations[sceneNumber % variations.length]
    
    // Add some randomization to make it even more varied
    const randomElements = [
      ' with a sense of accomplishment',
      ' while the wind gently blows',
      ' as birds chirp in the distance',
      ' with a confident smile',
      ' as the light dances around them'
    ]
    
    const randomElement = randomElements[Math.floor(Math.random() * randomElements.length)]
    const variedContent = selectedVariation + randomElement

    // Recreate the JSON structure if the original was JSON
    if (originalPrompt.includes('"visual"') && originalPrompt.includes('"description"')) {
      return optimizePromptForVEO3(variedContent, sceneNumber - 1, totalFrames, title)
    } else {
      return variedContent
    }
  }, [optimizePromptForVEO3])

  const regenerateScene = useCallback(async (sceneNumber: number, title: string, resetAllApprovals = true): Promise<void> => {
    if (!story) return

    setIsRegeneratingScene(sceneNumber)
    try {
      const scene = story.scenes.find(s => s.sceneNumber === sceneNumber)
      if (!scene) return

      // Use AI-powered regeneration
      const originalPrompt = scene.prompt
      const regeneratedPrompt = await createAIVariedRegeneration(originalPrompt, sceneNumber, story.scenes.length, title, story)

      const newScene: StoryScene = {
        sceneNumber,
        description: `AI Regenerated scene ${sceneNumber} for ${title}`,
        prompt: regeneratedPrompt,
        duration: scene.duration,
        isApproved: false
      }

      setStory(prev => {
        if (!prev) return prev
        const updatedScenes = prev.scenes.map(scene => 
          scene.sceneNumber === sceneNumber ? newScene : scene
        )
        
        // Conditionally reset all approvals based on parameter
        const finalScenes = resetAllApprovals 
          ? updatedScenes.map(scene => ({ ...scene, isApproved: false }))
          : updatedScenes

        return {
          ...prev,
          scenes: finalScenes,
          isApproved: resetAllApprovals ? false : prev.isApproved // Conditionally preserve global approval
        }
      })
    } catch (err) {
      console.error('AI Scene regeneration error:', err)
    } finally {
      setIsRegeneratingScene(null)
    }
  }, [createAIVariedRegeneration])

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

  // Manually analyze consistency for existing stories
  const analyzeStoryConsistencyManually = useCallback(async (): Promise<void> => {
    if (!story) return
    
    try {
      const rules = await analyzeStoryConsistency(story.title, story.scenes)
      setConsistencyRules(rules)
      console.log('Story consistency rules updated:', rules)
    } catch (error) {
      console.error('Failed to analyze story consistency:', error)
    }
  }, [story])

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

  const editScenePrompt = useCallback((sceneNumber: number, newPrompt: string): void => {
    setStory(prev => {
      if (!prev) return prev
      const updatedScenes = prev.scenes.map(scene => 
        scene.sceneNumber === sceneNumber 
          ? { ...scene, prompt: newPrompt, isApproved: false } // Reset approval when editing
          : scene
      )
      
      return {
        ...prev,
        scenes: updatedScenes,
        isApproved: false // Reset global approval when any scene is edited
      }
    })
  }, [])

  const editStoryTitle = useCallback((newTitle: string): void => {
    setStory(prev => {
      if (!prev) return prev
      return {
        ...prev,
        title: newTitle
      }
    })
  }, [])

  return {
    story,
    isGenerating,
    isRegeneratingScene,
    error,
    consistencyRules,
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
    editScenePrompt,
    editStoryTitle,
    analyzeStoryConsistencyManually,
  }
}
