// Test file to demonstrate the new JSON prompt format
// This shows how the prompts will be structured for better VEO3 API consistency

export function testJSONPromptFormat(frameIndex: number = 1) {
  const sampleStory = `A character begins their journey in a mysterious setting, filled with wonder and possibility. The character says: "I can do this!" as they move through the environment with purpose. The character's determination and creativity help them navigate through each situation with grace and skill.`

  // Simulate the JSON prompt generation
  const totalFrames = 3
  const theme = "adventure, character journey, growth and discovery"
  
  const dialogues = sampleStory.match(/"([^"]+)"/g) || []
  
  const jsonPrompt = {
    scene: {
      frame: frameIndex + 1,
      totalFrames: totalFrames,
      type: frameIndex === 0 ? 'opening' : frameIndex === totalFrames - 1 ? 'closing' : 'continuation',
      theme: theme,
      continuity: {
        sameCharacter: true,
        sameSetting: true,
        sameStyle: true,
        referenceImage: true
      }
    },
    visual: {
      description: sampleStory.replace(/He says:.*$/gm, (match) => {
        const dialogue = match.replace('He says:', '').trim()
        return `He looks directly at the camera with animated facial expressions, his mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
      }),
      camera: {
        angle: frameIndex === 0 ? 'establishing shot' : 'continuation shot',
        movement: frameIndex === totalFrames - 1 ? 'dramatic close-up' : 'smooth transition',
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
    }
  }

  console.log('JSON Prompt Format Example:')
  console.log(JSON.stringify(jsonPrompt, null, 2))
  
  return jsonPrompt
}

// Example of how this will improve consistency:
export function demonstrateConsistencyImprovement() {
  console.log('\n=== CONSISTENCY IMPROVEMENT DEMONSTRATION ===\n')
  
  // Frame 1 (Opening)
  const frame1 = {
    scene: { frame: 1, totalFrames: 3, type: 'opening', continuity: { sameCharacter: true, sameSetting: true } },
    visual: { camera: { angle: 'establishing shot' } },
    consistency: { characterAppearance: 'maintain same character design, clothing, and style' }
  }
  
  // Frame 2 (Continuation) 
  const frame2 = {
    scene: { frame: 2, totalFrames: 3, type: 'continuation', continuity: { sameCharacter: true, sameSetting: true } },
    visual: { camera: { angle: 'continuation shot', movement: 'smooth transition' } },
    consistency: { characterAppearance: 'maintain same character design, clothing, and style' }
  }
  
  // Frame 3 (Closing)
  const frame3 = {
    scene: { frame: 3, totalFrames: 3, type: 'closing', continuity: { sameCharacter: true, sameSetting: true } },
    visual: { camera: { angle: 'continuation shot', movement: 'dramatic close-up' } },
    consistency: { characterAppearance: 'maintain same character design, clothing, and style' }
  }
  
  console.log('Frame 1 (Opening):', JSON.stringify(frame1, null, 2))
  console.log('\nFrame 2 (Continuation):', JSON.stringify(frame2, null, 2))
  console.log('\nFrame 3 (Closing):', JSON.stringify(frame3, null, 2))
  
  console.log('\n=== KEY CONSISTENCY FEATURES ===')
  console.log('✅ Frame numbering (1/3, 2/3, 3/3)')
  console.log('✅ Scene type (opening, continuation, closing)')
  console.log('✅ Continuity flags (sameCharacter, sameSetting)')
  console.log('✅ Camera progression (establishing → continuation → close-up)')
  console.log('✅ Character appearance consistency across all frames')
  console.log('✅ Structured dialogue with visual cues')
}

// Test different frame types
export function testAllFrameTypes() {
  console.log('\n=== TESTING ALL FRAME TYPES ===\n')
  
  // Test opening frame (frameIndex = 0)
  console.log('Opening Frame (frameIndex = 0):')
  console.log(JSON.stringify(testJSONPromptFormat(0), null, 2))
  
  console.log('\nContinuation Frame (frameIndex = 1):')
  console.log(JSON.stringify(testJSONPromptFormat(1), null, 2))
  
  console.log('\nClosing Frame (frameIndex = 2):')
  console.log(JSON.stringify(testJSONPromptFormat(2), null, 2))
}
