import OpenAI from 'openai';
import { generateConsistencyPrompt, type ConsistencyRules } from './story-consistency-analyzer';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface PromptRegenerationOptions {
  originalPrompt: string;
  sceneNumber: number;
  totalFrames: number;
  storyTitle: string;
  variationType?: 'creative' | 'dramatic' | 'cinematic' | 'emotional' | 'action';
  previousScene?: {
    sceneNumber: number;
    prompt: string;
    description: string;
  };
  nextScene?: {
    sceneNumber: number;
    prompt: string;
    description: string;
  };
  consistencyRules?: ConsistencyRules;
}

export const generateAIPromptRegeneration = async (options: PromptRegenerationOptions): Promise<string> => {
  const { originalPrompt, sceneNumber, totalFrames, storyTitle, variationType = 'creative', previousScene, nextScene, consistencyRules } = options;

  try {
    // Extract core content from JSON if present
    let coreContent = originalPrompt;
    if (originalPrompt.includes('"visual"') && originalPrompt.includes('"description"')) {
      try {
        const jsonMatch = originalPrompt.match(/"description":\s*"([^"]+)"/);
        if (jsonMatch) {
          coreContent = jsonMatch[1];
        }
      } catch (e) {
        // If JSON parsing fails, use the original prompt
      }
    }

    // Create variation-specific system prompts
    const variationPrompts = {
      creative: "You are a creative story writer. Rewrite the given scene prompt with fresh, imaginative details while maintaining the core story elements. Add creative visual descriptions, unique character actions, and engaging dialogue.",
      dramatic: "You are a dramatic storyteller. Rewrite the given scene prompt with heightened drama, emotional intensity, and powerful visual moments. Make it more compelling and impactful.",
      cinematic: "You are a cinematic director. Rewrite the given scene prompt with film-like visual descriptions, dynamic camera angles, lighting effects, and cinematic storytelling techniques.",
      emotional: "You are an emotional storyteller. Rewrite the given scene prompt with deeper emotional resonance, character feelings, and meaningful moments that connect with the audience.",
      action: "You are an action sequence writer. Rewrite the given scene prompt with more dynamic movement, exciting actions, and energetic visual elements while keeping the story flow."
    };

    const systemPrompt = variationPrompts[variationType] || variationPrompts.creative;

    // Build context information for adjacent scenes
    let contextInfo = '';
    if (previousScene) {
      contextInfo += `\n**Previous Scene (${previousScene.sceneNumber}):** ${previousScene.description}\n**Previous Scene Prompt:** ${previousScene.prompt}`;
    }
    if (nextScene) {
      contextInfo += `\n**Next Scene (${nextScene.sceneNumber}):** ${nextScene.description}\n**Next Scene Prompt:** ${nextScene.prompt}`;
    }

    // Add consistency enforcement instructions
    let consistencyInstructions = '';
    if (consistencyRules) {
      consistencyInstructions = generateConsistencyPrompt(consistencyRules, sceneNumber);
    }

    const userPrompt = `Please regenerate this story scene prompt with a fresh perspective while maintaining the core story elements and ensuring smooth continuity:

**Story Title:** ${storyTitle}
**Scene:** ${sceneNumber} of ${totalFrames}
**Original Prompt:** ${coreContent}${contextInfo}${consistencyInstructions}

**Requirements:**
- Keep the same story context and character
- Maintain the same duration (8 seconds)
- Add fresh visual details and actions
- Make it more engaging and varied
- Preserve any dialogue or key story elements
- Ensure smooth transition from previous scene (if applicable)
- Set up proper context for the next scene (if applicable)
- Maintain narrative flow and continuity throughout the story
- CRITICAL: Preserve all critical elements listed above
- IMPORTANT: Maintain consistency with the story's established elements

**Output:** Return only the regenerated prompt text, no additional formatting or explanations.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Using a more capable model for better results
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userPrompt
        }
      ],
      max_tokens: 500,
      temperature: 0.8, // Higher temperature for more creative variations
      top_p: 0.9
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error('No response generated from AI');
    }

    // Clean up the response
    let regeneratedPrompt = aiResponse.trim();
    
    // Remove any quotes if the AI wrapped the response in them
    if (regeneratedPrompt.startsWith('"') && regeneratedPrompt.endsWith('"')) {
      regeneratedPrompt = regeneratedPrompt.slice(1, -1);
    }

    // If the original was JSON format, recreate the JSON structure
    if (originalPrompt.includes('"visual"') && originalPrompt.includes('"description"')) {
      // This would need to be handled by the calling function to maintain JSON structure
      return regeneratedPrompt;
    }

    return regeneratedPrompt;

  } catch (error) {
    console.error('AI Prompt Regeneration Error:', error);
    
    // Fallback to a simple variation if AI fails
    return createFallbackVariation(originalPrompt, sceneNumber);
  }
};

// Fallback function for when AI fails
const createFallbackVariation = (originalPrompt: string, sceneNumber: number): string => {
  const variations = [
    originalPrompt.replace(/looks around/g, 'gazes around with wide eyes').replace(/talks:/g, 'exclaims with excitement:'),
    originalPrompt.replace(/satisfaction/g, 'overwhelming joy and pride').replace(/talks:/g, 'shouts with enthusiasm:'),
    originalPrompt.replace(/looks around/g, 'slowly turns their head, taking in the magnificent view').replace(/talks:/g, 'whispers with awe:'),
    originalPrompt.replace(/looks around/g, 'raises their arms triumphantly and spins around').replace(/talks:/g, 'calls out loudly:'),
    originalPrompt.replace(/looks around/g, 'pauses to admire the breathtaking scenery around them').replace(/talks:/g, 'says with a wide smile:')
  ];

  const selectedVariation = variations[sceneNumber % variations.length];
  const randomElements = [
    ' with a sense of accomplishment',
    ' while the wind gently blows',
    ' as birds chirp in the distance',
    ' with a confident smile',
    ' as the light dances around them'
  ];
  
  const randomElement = randomElements[Math.floor(Math.random() * randomElements.length)];
  return selectedVariation + randomElement;
};

// Generate multiple variations at once
export const generateMultipleAIVariations = async (options: PromptRegenerationOptions, count: number = 3): Promise<string[]> => {
  const variations = [];
  
  for (let i = 0; i < count; i++) {
    const variationType = ['creative', 'dramatic', 'cinematic', 'emotional', 'action'][i % 5] as any;
    try {
      const variation = await generateAIPromptRegeneration({
        ...options,
        variationType
      });
      variations.push(variation);
    } catch (error) {
      console.error(`Failed to generate variation ${i + 1}:`, error);
      // Add fallback variation
      variations.push(createFallbackVariation(options.originalPrompt, options.sceneNumber + i));
    }
  }
  
  return variations;
};
