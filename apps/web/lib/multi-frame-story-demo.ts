// Demo showing how the JSON prompt format works with ANY number of frames
// From 1 frame to 10+ frames - all create complete connected stories

export function demonstrateMultiFrameStories() {
  console.log('=== MULTI-FRAME STORY DEMONSTRATION ===\n')
  
  const baseStory = "A character begins their epic journey across a vast, mystical landscape, determined to reach the legendary Crystal Mountain. The character says: 'This is it, the adventure of a lifetime!' as they take their first steps into the unknown. The character encounters various challenges along the way - crossing treacherous rivers, climbing steep cliffs, and navigating through dark forests. The character says: 'I won't give up!' as they push through each obstacle with determination. The character meets wise mentors and helpful companions who guide them on their quest. The character says: 'Thank you for your wisdom!' as they learn valuable lessons about courage and perseverance. The character finally reaches the base of the Crystal Mountain, where they must face their greatest challenge yet. The character says: 'I'm ready for whatever comes next!' as they begin the final ascent. The character reaches the summit and discovers the legendary crystal, which grants them incredible power and wisdom. The character says: 'I've done it! I've completed my journey!' as they stand victorious at the peak, looking out over the beautiful landscape they've traversed."
  
  const frameCounts = [1, 2, 3, 4, 5, 6, 8, 10]
  
  frameCounts.forEach(frameCount => {
    console.log(`\n🎬 ${frameCount}-FRAME STORY:`)
    console.log('='.repeat(50))
    
    const frames = generateFramesForCount(baseStory, frameCount)
    
    frames.forEach((frame, index) => {
      console.log(`\nFrame ${index + 1}/${frameCount} (${frame.scene.type}):`)
      console.log(`Story Part: ${frame.storyPart.substring(0, 100)}...`)
      console.log(`Camera: ${frame.visual.camera.angle} → ${frame.visual.camera.movement}`)
      console.log(`Duration: ${frame.visual.duration}s`)
      console.log(`Dialogues: ${frame.dialogue?.lines.length || 0} lines`)
    })
    
    console.log(`\n✅ Total Duration: ${frameCount * 8} seconds`)
    console.log(`✅ Complete connected story in ${frameCount} frames`)
  })
}

function generateFramesForCount(story: string, frameCount: number) {
  const storyParts = story.split('. ')
  const frames = []
  
  for (let i = 0; i < frameCount; i++) {
    const sentencesPerFrame = Math.ceil(storyParts.length / frameCount)
    const startIndex = i * sentencesPerFrame
    const endIndex = Math.min(startIndex + sentencesPerFrame, storyParts.length)
    
    const frameStoryPart = storyParts.slice(startIndex, endIndex).join('. ') + '.'
    
    // Determine frame type
    let frameType: string
    if (frameCount === 1) {
      frameType = 'complete'
    } else if (i === 0) {
      frameType = 'opening'
    } else if (i === frameCount - 1) {
      frameType = 'closing'
    } else {
      frameType = 'continuation'
    }
    
    // Determine camera progression
    let cameraAngle: string
    let cameraMovement: string
    
    if (frameCount === 1) {
      cameraAngle = 'establishing shot'
      cameraMovement = 'complete story'
    } else if (i === 0) {
      cameraAngle = 'establishing shot'
      cameraMovement = 'smooth transition'
    } else if (i === frameCount - 1) {
      cameraAngle = 'continuation shot'
      cameraMovement = 'dramatic close-up'
    } else {
      cameraAngle = 'continuation shot'
      cameraMovement = 'smooth transition'
    }
    
    // Extract dialogues
    const dialogues = frameStoryPart.match(/"([^"]+)"/g) || []
    
    const frame = {
      scene: {
        frame: i + 1,
        totalFrames: frameCount,
        type: frameType,
        theme: "epic adventure, character journey, determination, growth and discovery",
        continuity: {
          sameCharacter: true,
          sameSetting: true,
          sameStyle: true,
          referenceImage: true
        }
      },
      visual: {
        description: frameStoryPart.replace(/He says:.*$/gm, (match) => {
          const dialogue = match.replace('He says:', '').trim()
          return `He looks directly at the camera with animated facial expressions, his mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
        }),
        camera: {
          angle: cameraAngle,
          movement: cameraMovement,
          lighting: 'consistent cinematic lighting'
        },
        duration: 8,
        quality: 'cinematic, professional'
      },
      dialogue: dialogues.length > 0 ? {
        lines: dialogues,
        visualCues: dialogues.map(d => `Character mouth moving in sync with: "${d}"`)
      } : null,
      consistency: {
        characterAppearance: 'maintain same character design, clothing, and style',
        settingContinuity: 'maintain same environment and atmosphere',
        colorPalette: 'consistent color scheme throughout',
        style: 'cinematic, professional video quality'
      },
      storyPart: frameStoryPart
    }
    
    frames.push(frame)
  }
  
  return frames
}

// Show optimal frame counts for different platforms
export function showOptimalFrameCounts() {
  console.log('\n=== OPTIMAL FRAME COUNTS BY PLATFORM ===\n')
  
  const platforms = [
    { name: 'Instagram Reels', optimal: [2, 3, 4], max: 6, reason: '15-30 seconds ideal' },
    { name: 'TikTok', optimal: [2, 3, 4, 5], max: 8, reason: '15-60 seconds ideal' },
    { name: 'YouTube Shorts', optimal: [3, 4, 5, 6], max: 10, reason: '30-60 seconds ideal' },
    { name: 'Twitter/X Video', optimal: [1, 2, 3], max: 4, reason: '2:20 max duration' },
    { name: 'Facebook Reels', optimal: [2, 3, 4, 5], max: 8, reason: '15-60 seconds ideal' },
    { name: 'LinkedIn Video', optimal: [1, 2, 3, 4], max: 6, reason: 'Professional content' }
  ]
  
  platforms.forEach(platform => {
    console.log(`📱 ${platform.name}:`)
    console.log(`   Optimal: ${platform.optimal.join(', ')} frames`)
    console.log(`   Max: ${platform.max} frames`)
    console.log(`   Reason: ${platform.reason}`)
    console.log('')
  })
}

// Test with different story types and frame counts
export function testStoryTypeFrameCombinations() {
  console.log('\n=== STORY TYPE + FRAME COUNT COMBINATIONS ===\n')
  
  const storyTypes = [
    { name: 'Quick Comedy', frames: [1, 2], description: 'Fast-paced humor' },
    { name: 'Epic Adventure', frames: [4, 6, 8], description: 'Heroic journey' },
    { name: 'Romantic Drama', frames: [2, 3, 4], description: 'Emotional storytelling' },
    { name: 'Educational Content', frames: [3, 4, 5], description: 'Step-by-step learning' },
    { name: 'Product Demo', frames: [2, 3, 4], description: 'Feature showcase' },
    { name: 'Tutorial', frames: [4, 5, 6, 8], description: 'Detailed instruction' },
    { name: 'Documentary Style', frames: [6, 8, 10], description: 'In-depth narrative' }
  ]
  
  storyTypes.forEach(storyType => {
    console.log(`🎭 ${storyType.name}:`)
    console.log(`   Recommended frames: ${storyType.frames.join(', ')}`)
    console.log(`   Description: ${storyType.description}`)
    console.log(`   Duration range: ${storyType.frames[0] * 8}-${storyType.frames[storyType.frames.length - 1] * 8} seconds`)
    console.log('')
  })
}

// Show frame progression examples
export function showFrameProgressionExamples() {
  console.log('\n=== FRAME PROGRESSION EXAMPLES ===\n')
  
  const examples = [
    {
      frameCount: 3,
      progression: [
        'Opening: Character introduction, problem setup',
        'Development: Character faces challenges, learns lessons',
        'Resolution: Character overcomes obstacles, achieves goal'
      ]
    },
    {
      frameCount: 5,
      progression: [
        'Opening: Character introduction, initial setting',
        'Rising Action: First challenge encountered',
        'Climax: Major obstacle or conflict',
        'Falling Action: Resolution begins, lessons learned',
        'Resolution: Complete resolution, character growth'
      ]
    },
    {
      frameCount: 8,
      progression: [
        'Opening: Character introduction, world building',
        'Inciting Incident: Problem or opportunity presented',
        'Rising Action 1: First challenge',
        'Rising Action 2: Escalating challenges',
        'Climax: Major confrontation or turning point',
        'Falling Action 1: Consequences and reactions',
        'Falling Action 2: Resolution process',
        'Resolution: Complete resolution, new status quo'
      ]
    }
  ]
  
  examples.forEach(example => {
    console.log(`📚 ${example.frameCount}-Frame Story Structure:`)
    example.progression.forEach((step, index) => {
      console.log(`   ${index + 1}. ${step}`)
    })
    console.log(`   Total Duration: ${example.frameCount * 8} seconds`)
    console.log('')
  })
}
