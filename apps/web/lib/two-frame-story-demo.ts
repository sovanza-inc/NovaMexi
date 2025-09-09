// Demo showing how 2-frame stories work with JSON prompts
// This demonstrates the complete connected story flow

export function demonstrateTwoFrameStory() {
  console.log('=== 2-FRAME COMPLETE STORY DEMONSTRATION ===\n')
  
  const theme = "epic fantasy, character vs dragon, respect and alliance"
  
  // Complete story that will be split into 2 frames
  const completeStory = `A lone character in a black fur cloak stands atop a snowy mountain peak, surveying the vast landscape below. The character says: 'I sense danger approaching!' as the wind howls through the mountains. The character spots a massive dragon emerging from the clouds, its scales shimmering with ancient power. The character draws their legendary sword, the blade humming with magical energy, and shouts: 'I will not back down!' The dragon swoops down, breathing fire that melts the snow around the character. The character dodges the flames and leaps onto the dragon's back, gripping its scales tightly. They engage in an epic aerial battle, the character striking with precision while the dragon twists and turns through the sky. The character yells: 'This ends now!' as they find the dragon's weak spot and deliver the decisive blow. Instead of continuing the fight, the dragon bows its head in respect, recognizing the character's courage and skill. The character sheathes their sword and places a hand on the dragon's snout, saying: 'We are allies now, not enemies.' Together, they watch the sunset over the mountains, the beginning of a legendary partnership.`
  
  // Split story into 2 parts
  const storyParts = completeStory.split('. ')
  const midPoint = Math.ceil(storyParts.length / 2)
  
  const frame1Story = storyParts.slice(0, midPoint).join('. ') + '.'
  const frame2Story = storyParts.slice(midPoint).join('. ') + '.'
  
  console.log('📖 COMPLETE STORY:')
  console.log(completeStory)
  console.log('\n' + '='.repeat(80) + '\n')
  
  // Frame 1: Opening (Setup + Conflict)
  const frame1 = {
    scene: {
      frame: 1,
      totalFrames: 2,
      type: 'opening',
      theme: theme,
      continuity: {
        sameCharacter: true,
        sameSetting: true,
        sameStyle: true,
        referenceImage: true
      }
    },
    visual: {
      description: frame1Story.replace(/He says:.*$/gm, (match) => {
        const dialogue = match.replace('He says:', '').trim()
        return `He looks directly at the camera with animated facial expressions, his mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
      }),
      camera: {
        angle: 'establishing shot',
        movement: 'smooth transition',
        lighting: 'consistent cinematic lighting'
      },
      duration: 8,
      quality: 'cinematic, professional'
    },
    dialogue: {
      lines: ['I sense danger approaching!', 'I will not back down!'],
      visualCues: [
        'Character mouth moving in sync with: "I sense danger approaching!"',
        'Character mouth moving in sync with: "I will not back down!"'
      ]
    },
    consistency: {
      characterAppearance: 'maintain same character design, clothing, and style',
      settingContinuity: 'maintain same environment and atmosphere',
      colorPalette: 'consistent color scheme throughout',
      style: 'cinematic, professional video quality'
    }
  }
  
  // Frame 2: Closing (Resolution + Conclusion)
  const frame2 = {
    scene: {
      frame: 2,
      totalFrames: 2,
      type: 'closing',
      theme: theme,
      continuity: {
        sameCharacter: true,
        sameSetting: true,
        sameStyle: true,
        referenceImage: true
      }
    },
    visual: {
      description: `Continuing the same story: ${frame2Story}`.replace(/He says:.*$/gm, (match) => {
        const dialogue = match.replace('He says:', '').trim()
        return `He looks directly at the camera with animated facial expressions, his mouth moving in sync with words, eyebrows raised with engagement, head nodding slightly as if speaking: "${dialogue}"`
      }),
      camera: {
        angle: 'continuation shot',
        movement: 'dramatic close-up',
        lighting: 'consistent cinematic lighting'
      },
      duration: 8,
      quality: 'cinematic, professional'
    },
    dialogue: {
      lines: ['This ends now!', 'We are allies now, not enemies.'],
      visualCues: [
        'Character mouth moving in sync with: "This ends now!"',
        'Character mouth moving in sync with: "We are allies now, not enemies."'
      ]
    },
    consistency: {
      characterAppearance: 'maintain same character design, clothing, and style',
      settingContinuity: 'maintain same environment and atmosphere',
      colorPalette: 'consistent color scheme throughout',
      style: 'cinematic, professional video quality'
    }
  }
  
  console.log('🎬 FRAME 1 (OPENING - Setup & Conflict):')
  console.log('Story Part:', frame1Story)
  console.log('JSON Prompt:', JSON.stringify(frame1, null, 2))
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  console.log('🎬 FRAME 2 (CLOSING - Resolution & Conclusion):')
  console.log('Story Part:', frame2Story)
  console.log('JSON Prompt:', JSON.stringify(frame2, null, 2))
  
  console.log('\n' + '='.repeat(80) + '\n')
  
  console.log('✅ 2-FRAME STORY BENEFITS:')
  console.log('• Complete narrative arc: Setup → Conflict → Resolution')
  console.log('• Character consistency across both frames')
  console.log('• Setting continuity (same mountain, same character)')
  console.log('• Dialogue flows naturally between frames')
  console.log('• Camera progression: establishing shot → dramatic close-up')
  console.log('• Total duration: 16 seconds (8 seconds per frame)')
  console.log('• Perfect for social media (Instagram Reels, TikTok)')
  
  return { frame1, frame2, completeStory }
}

// Test with different story types
export function testTwoFrameVariations() {
  console.log('\n=== TESTING 2-FRAME STORY VARIATIONS ===\n')
  
  const stories = [
    {
      title: "Panda Dance Adventure",
      theme: "playful character, mountain dance, animal friendship",
      frames: [
        "A character wearing stylish black sunglasses stands confidently on a snowy mountain peak, the crisp mountain air creating a magical atmosphere. The character adjusts their sunglasses and begins to dance, their movements surprisingly graceful and fluid. The character says: 'Watch this amazing dance!' as they twirl and spin, creating a magical winter dance.",
        "The character's dance becomes more energetic, incorporating martial arts moves and playful gestures. Other mountain animals gather to watch the performance, including curious mountain goats and a wise old eagle perched on a nearby rock. The character calls out: 'Come join me, friends!' as they continue dancing. The character's dance reaches a crescendo, and they strike a dramatic pose as the sun sets behind the mountains."
      ]
    },
    {
      title: "Gentleman Scientist",
      theme: "scientific character, axolotl discovery, futuristic lab",
      frames: [
        "A distinguished character in a tailored suit stands in a futuristic laboratory, surrounded by holographic displays and advanced technology. The character carefully examines a small axolotl swimming in a glowing tank, its gills pulsing with bioluminescent light. The axolotl seems to recognize the character and swims to the glass, pressing its tiny face against it.",
        "The character smiles warmly and begins to explain the axolotl's unique regenerative abilities to an audience of scientists. As they speak, the axolotl's tank transforms into a miniature ecosystem with floating plants and gentle currents. The character demonstrates how the axolotl can regrow lost limbs, showing holographic projections of the process. The axolotl becomes excited and starts performing graceful underwater acrobatics, its movements synchronized with the character's explanations."
      ]
    }
  ]
  
  stories.forEach((story, index) => {
    console.log(`\n--- STORY ${index + 1}: ${story.title} ---`)
    console.log(`Theme: ${story.theme}`)
    console.log(`Frame 1: ${story.frames[0]}`)
    console.log(`Frame 2: ${story.frames[1]}`)
    console.log('✅ Complete connected narrative in 2 frames')
  })
}
