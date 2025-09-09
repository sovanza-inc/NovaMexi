import { useState, useCallback } from 'react'

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
        isApproved: false,
        dialogues: scene.dialogues || []
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
    console.log('🎬 generateFlowingStory called with:', { title, frameCount })
    
    // First, generate the complete story narrative
    const completeStory = generateCompleteStory(title)
    console.log('📖 Complete story generated:', completeStory)
    
    // Then divide it into flowing frames
    const frames = divideStoryIntoFrames(completeStory, frameCount)
    console.log('🎞️ Frames created:', { requested: frameCount, actual: frames.length, frames })
    
    return frames
  }

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
        actions.opening = `The protagonist approaches a delivery truck, opens the door, and climbs in while talking: "Alright, let's see what we've got here!" Starts the engine, puts on a seatbelt, and begins driving down the road.`
        actions.closing = `The protagonist continues driving, occasionally looking at the camera, making hand gestures, and taking sips from a coffee cup while steering.`
      } else if (isCooking) {
        actions.opening = `The protagonist walks into the kitchen, puts on an apron, and starts cooking while talking: "Welcome to my kitchen! Today we're making something special." Begins chopping vegetables with a knife and stirring a pot.`
        actions.closing = `The protagonist continues cooking, tasting the food with a spoon, making comments, and using various kitchen utensils.`
      } else if (isForest) {
        actions.opening = `The protagonist walks through the forest, stepping over logs, and looking around curiously while talking: "This place is amazing! Look at all these trees." Touches tree bark and examines leaves.`
        actions.closing = `The protagonist continues exploring, stopping to examine plants, picking up a leaf, and using hand gestures while walking.`
      } else {
        actions.opening = `The protagonist confidently walks forward, looking around with curiosity while talking: "Let's see what this adventure brings!"`
        actions.closing = `The protagonist continues moving forward, engaging with their environment.`
      }
    } else if (frameIndex === totalFrames - 1) {
      // Closing frame actions
      if (isAdventure && isDelivery) {
        actions.opening = `The protagonist parks the delivery truck, gets out, and walks toward the destination while talking: "We made it! Let's deliver this package." Carries a package and approaches the door.`
        actions.closing = `The protagonist rings the doorbell, hands over the package to a person, and celebrates with a high-five: "Mission accomplished!"`
      } else if (isCooking) {
        actions.opening = `The protagonist finishes cooking, plates the food beautifully, and presents it: "And here's our masterpiece!" Takes a bite with a fork and gives a thumbs up.`
        actions.closing = `The protagonist stands tall and proud, looking at the camera, and says: "That was delicious! Five stars!" while holding the plate.`
      } else if (isForest) {
        actions.opening = `The protagonist reaches a clearing, looks around in amazement, and talks: "Wow, this is incredible!" Sits down on a log and takes out a snack.`
        actions.closing = `The protagonist stands up, stretches, looks at the camera, and says: "What an amazing adventure!" while holding a leaf.`
      } else {
        actions.opening = `The protagonist reaches their destination, looks around with satisfaction, and talks: "We did it!"`
        actions.closing = `The protagonist stands tall and proud, looking at the camera, and raises their arms in celebration.`
      }
    } else {
      // Middle frame actions
      if (isAdventure && isDelivery) {
        actions.opening = `The protagonist continues driving the delivery truck, looking at the camera, making hand gestures, and taking sips from a water bottle.`
        actions.closing = `The protagonist adjusts the radio, changes lanes, and continues the conversation while steering the wheel.`
      } else if (isCooking) {
        actions.opening = `The protagonist continues cooking, tasting the food with a spoon, and making comments while stirring a pot.`
        actions.closing = `The protagonist uses a knife to chop vegetables, tastes ingredients, and maintains animated facial expressions.`
      } else if (isForest) {
        actions.opening = `The protagonist continues exploring, stopping to examine plants, picking up a leaf, and using hand gestures while walking.`
        actions.closing = `The protagonist continues moving through the forest, stepping over rocks and branches.`
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

  // Generate a complete flowing story
  const generateCompleteStory = (title: string) => {
    const storyTemplates = {
      'warrior': {
        story: "A lone character in a black fur cloak stands atop a snowy mountain peak, surveying the vast landscape below. The character says: 'I sense danger approaching!' as the wind howls through the mountains. The character spots a massive dragon emerging from the clouds, its scales shimmering with ancient power. The character draws their legendary sword, the blade humming with magical energy, and shouts: 'I will not back down!' The dragon swoops down, breathing fire that melts the snow around the character. The character dodges the flames and leaps onto the dragon's back, gripping its scales tightly. They engage in an epic aerial battle, the character striking with precision while the dragon twists and turns through the sky. The character yells: 'This ends now!' as they find the dragon's weak spot and deliver the decisive blow. Instead of continuing the fight, the dragon bows its head in respect, recognizing the character's courage and skill. The character sheathes their sword and places a hand on the dragon's snout, saying: 'We are allies now, not enemies.' Together, they watch the sunset over the mountains, the beginning of a legendary partnership.",
        theme: "epic fantasy, character vs dragon, respect and alliance"
      },
      'panda': {
        story: "A character wearing stylish black sunglasses stands confidently on a snowy mountain peak, the crisp mountain air creating a magical atmosphere. The character adjusts their sunglasses and begins to dance, their movements surprisingly graceful and fluid. The character says: 'Watch this amazing dance!' as they twirl and spin, creating a magical winter dance. Snowflakes swirl around the character as they perform, and the character exclaims: 'This is so much fun!' The character's dance becomes more energetic, incorporating martial arts moves and playful gestures. Other mountain animals gather to watch the performance, including curious mountain goats and a wise old eagle perched on a nearby rock. The character calls out: 'Come join me, friends!' as they continue dancing. The character's dance reaches a crescendo, and they strike a dramatic pose as the sun sets behind the mountains. The animals applaud with various sounds, and the character takes a bow, removing their sunglasses to reveal twinkling eyes. The character says: 'Thank you for watching!' and then invites the other animals to join in the dance, creating a joyful mountain celebration. As night falls, the character leads a procession of dancing animals down the mountain, their silhouettes dancing against the starry sky. The character whispers: 'What a perfect day!' as they dance into the night.",
        theme: "playful character, mountain dance, animal friendship, winter magic"
      },
      'epic_journey': {
        story: "A character begins their epic journey across a vast, mystical landscape, determined to reach the legendary Crystal Mountain. The character says: 'This is it, the adventure of a lifetime!' as they take their first steps into the unknown. The character encounters various challenges along the way - crossing treacherous rivers, climbing steep cliffs, and navigating through dark forests. The character says: 'I won't give up!' as they push through each obstacle with determination. The character meets wise mentors and helpful companions who guide them on their quest. The character says: 'Thank you for your wisdom!' as they learn valuable lessons about courage and perseverance. The character finally reaches the base of the Crystal Mountain, where they must face their greatest challenge yet. The character says: 'I'm ready for whatever comes next!' as they begin the final ascent. The character reaches the summit and discovers the legendary crystal, which grants them incredible power and wisdom. The character says: 'I've done it! I've completed my journey!' as they stand victorious at the peak, looking out over the beautiful landscape they've traversed.",
        theme: "epic adventure, character journey, determination, growth and discovery"
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
      },
      'cinematic_hero': {
        story: "A mysterious figure in a flowing cloak stands on a windswept rooftop at sunset, the city sprawling below in golden light. The figure's eyes gleam with determination as they survey the urban landscape, their hand resting on the hilt of a gleaming sword. The character says: 'The time has come.' as lightning flashes in the distance, illuminating their silhouette against the stormy sky. They take a deep breath and whisper: 'I will not fail.' With a single bound, they leap from the rooftop, their cloak billowing behind them as they descend into the city below. The character says: 'Justice will be served!' as they land gracefully on the street below. The camera follows their heroic journey through the neon-lit streets, capturing every moment of their determined stride. The character says: 'This ends tonight!' as they approach their final destination, ready to face whatever challenges await.",
        theme: "cinematic hero, urban adventure, dramatic lighting, heroic action"
      },
      'emotional_drama': {
        story: "A young artist sits alone in their dimly lit studio, surrounded by half-finished paintings and scattered brushes. The soft glow of a single lamp casts dramatic shadows across their face as they stare at a blank canvas. The character says: 'I can do this.' as their hand trembles slightly while picking up a brush. Their eyes are filled with both fear and determination as they begin to paint, each stroke more confident than the last. The character says: 'This is my truth.' as their emotions flow onto the canvas in vibrant colors. The camera slowly circles around them, capturing the intensity of their creative process. The character says: 'I am an artist.' as they step back to admire their work. A single tear rolls down their cheek - not of sadness, but of pure artistic fulfillment. The character whispers: 'This is who I am.' as they look at their masterpiece with pride and satisfaction.",
        theme: "emotional drama, artistic journey, personal growth, intimate storytelling"
      },
      'vlogger': {
        story: "A character starts their day in a cozy mountain cabin, looking directly at the camera with an enthusiastic expression. The character says: 'Good morning everyone! Welcome to my daily vlog!' They gesture around their space, showing various items and activities. The character continues: 'Today I'm going to show you what I cook in a day!' They move to the kitchen area, pointing at ingredients and utensils. The character explains: 'First, let's start with breakfast - I'm making my famous mountain pancakes!' They demonstrate cooking techniques with animated movements. The character concludes: 'That's it for today's cooking adventure! Don't forget to like and subscribe!'",
        theme: "vlogging, cooking, mountain life, daily routine"
      },
      'yeti_vlogger': {
        story: "A fluffy white Yeti with icy blue eyes starts their day in a frosty mountain cave kitchen, holding the camera like a vlogger with a goofy, warm personality. The Yeti says: 'Alright guys, welcome to my kitchen… today I'm cooking up my favorite breakfast — Snow Flakes with extra cold milk!' The Yeti dramatically stirs a giant icy pot filled with pinecones, frozen salmon, and icicles, sprinkling snow as if it were seasoning. The Yeti says: 'Mmm… nothing like my famous gourmet Pinecone Soup… crunchy and, uh… kinda painful.' The Yeti takes a big spoonful, makes a disgusted face, then shrugs and keeps eating anyway. The Yeti concludes: 'That's it for today's cooking adventure! Don't forget to like and subscribe!'",
        theme: "funny, relatable, winter cooking vlog parody, yeti character, mountain life"
      },
      'horror': {
        story: "A character cautiously explores a dark, abandoned mansion, their flashlight casting eerie shadows on the walls. The character whispers: 'Is anyone there?' as they step through creaking floorboards. Suddenly, a door slams shut behind them, and they jump in fright. The character says: 'This place gives me the creeps!' as they continue deeper into the house. Mysterious sounds echo through the halls - footsteps, whispers, and the sound of something moving in the darkness. The character's heart races as they discover a hidden room filled with old photographs and strange symbols. The character gasps: 'What happened here?' as they realize they're not alone in the house.",
        theme: "horror, mystery, suspense, supernatural"
      },
      'comedy': {
        story: "A character attempts to cook a simple meal but everything goes hilariously wrong. The character says: 'How hard can it be to make toast?' as they accidentally set off the smoke alarm. They try to fix it by waving a towel, but only make it worse. The character exclaims: 'This is not going as planned!' as flour explodes everywhere, covering them from head to toe. They slip on a banana peel and slide across the kitchen floor, landing in a pile of dishes. The character laughs: 'Well, that was an adventure!' as they finally manage to make a sandwich, only to drop it on the floor. The character shrugs and says: 'At least I tried!'",
        theme: "comedy, cooking fails, slapstick humor, everyday mishaps"
      },
      'sports': {
        story: "A character trains for a big competition, pushing themselves to their limits. The character says: 'I can do this!' as they practice their moves over and over again. They sweat and breathe heavily, but never give up. The character encourages themselves: 'One more rep!' as they complete their training routine. On the day of the competition, the character feels nervous but determined. The character says: 'This is it, my moment!' as they step onto the field. They perform their best, giving it everything they have. The character celebrates: 'I did it!' as they achieve their goal, proving that hard work pays off.",
        theme: "sports, training, competition, determination, achievement"
      },
      'romance': {
        story: "A character prepares for a special date, carefully choosing their outfit and getting ready. The character says: 'I hope they like this!' as they look in the mirror, feeling nervous but excited. They meet their date at a beautiful garden, where flowers bloom and birds sing. The character says: 'You look amazing!' as they share a romantic moment together. They walk hand in hand through the garden, talking and laughing. The character whispers: 'This is perfect!' as they watch the sunset together. The character says: 'I'm so glad we met!' as they share a tender moment, creating memories that will last forever.",
        theme: "romance, love, dating, relationships, emotional connection"
      }
    }

    // Try to match the title with a story template
    const titleLower = title.toLowerCase()
    let selectedStory = storyTemplates['generic'] // default to generic

    if (titleLower.includes('warrior') || titleLower.includes('dragon') || titleLower.includes('sword') || titleLower.includes('fantasy') || titleLower.includes('epic')) {
      selectedStory = storyTemplates['warrior']
    } else if (titleLower.includes('journey') || titleLower.includes('adventure') || titleLower.includes('quest') || titleLower.includes('crystal') || titleLower.includes('mountain')) {
      selectedStory = storyTemplates['epic_journey']
    } else if (titleLower.includes('panda') || titleLower.includes('fluffy') || titleLower.includes('dance') || titleLower.includes('playful') || titleLower.includes('cute')) {
      selectedStory = storyTemplates['panda']
    } else if (titleLower.includes('gentleman') || titleLower.includes('axolotl') || titleLower.includes('scientist') || titleLower.includes('lab') || titleLower.includes('research')) {
      selectedStory = storyTemplates['gentleman']
    } else if (titleLower.includes('bunny') || titleLower.includes('guitar') || titleLower.includes('music') || titleLower.includes('concert') || titleLower.includes('performance')) {
      selectedStory = storyTemplates['bunny']
    } else if (titleLower.includes('yeti') || titleLower.includes('vlog') && titleLower.includes('cooking')) {
      selectedStory = storyTemplates['yeti_vlogger']
    } else if (titleLower.includes('vlog') || titleLower.includes('cooking') || titleLower.includes('daily') || titleLower.includes('lifestyle')) {
      selectedStory = storyTemplates['vlogger']
    } else if (titleLower.includes('horror') || titleLower.includes('scary') || titleLower.includes('ghost') || titleLower.includes('haunted') || titleLower.includes('mystery')) {
      selectedStory = storyTemplates['horror']
    } else if (titleLower.includes('comedy') || titleLower.includes('funny') || titleLower.includes('laugh') || titleLower.includes('joke') || titleLower.includes('humor')) {
      selectedStory = storyTemplates['comedy']
    } else if (titleLower.includes('sports') || titleLower.includes('training') || titleLower.includes('competition') || titleLower.includes('athlete') || titleLower.includes('fitness')) {
      selectedStory = storyTemplates['sports']
    } else if (titleLower.includes('romance') || titleLower.includes('love') || titleLower.includes('date') || titleLower.includes('relationship') || titleLower.includes('romantic')) {
      selectedStory = storyTemplates['romance']
    }

    return selectedStory
  }

  // Define interface for generated story data
  interface GeneratedStoryData {
    story: string
    theme: string
  }

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

  const regenerateScene = useCallback(async (sceneNumber: number, title: string, resetAllApprovals = true): Promise<void> => {
    if (!story) return

    try {
      // Simulate AI scene regeneration
      await new Promise(resolve => setTimeout(resolve, 1000))

      const scene = story.scenes.find(s => s.sceneNumber === sceneNumber)
      if (!scene) return

      const newScene: StoryScene = {
        sceneNumber,
        description: `Regenerated scene ${sceneNumber} for ${title}`,
        prompt: optimizePromptForVEO3(`Regenerated scene ${sceneNumber}: ${title} - fresh perspective, creative angle, enhanced quality, ${scene.duration} seconds`, sceneNumber - 1, story.scenes.length, 'regenerated'),
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
