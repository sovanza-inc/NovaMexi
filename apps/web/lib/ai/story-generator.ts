import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface GeneratedStoryData {
  story: string;
  theme: string;
}

export interface StoryGenerationOptions {
  title: string;
  duration: number;
  frameCount: number;
  style?: 'creative' | 'dramatic' | 'cinematic' | 'emotional' | 'action' | 'comedy' | 'horror' | 'romance' | 'adventure';
  characterType?: string;
  setting?: string;
}

/**
 * Generates a complete story using AI based on the title and requirements
 */
export const generateAIStory = async (options: StoryGenerationOptions): Promise<GeneratedStoryData> => {
  const { title, duration, frameCount, style = 'creative', characterType, setting } = options;

  try {
    const systemPrompt = `You are a professional story writer and video content creator. Create engaging, cinematic stories that work perfectly for video generation.

**Your expertise:**
- Writing compelling narratives with clear character development
- Creating visual, action-oriented scenes perfect for video
- Balancing dialogue with descriptive action
- Ensuring smooth story flow and pacing
- Writing for different genres and styles

**Story Requirements:**
- Duration: ${duration} seconds (${frameCount} scenes of 8 seconds each)
- Style: ${style}
- Character: ${characterType || 'engaging protagonist'}
- Setting: ${setting || 'dynamic and visually interesting'}

**Guidelines:**
- Write in present tense for video clarity
- Include specific visual details and actions
- Add natural dialogue that advances the story
- Create clear scene transitions
- Make each scene visually distinct and engaging
- Ensure the story has a clear beginning, middle, and end
- Include character emotions and reactions
- Write for a general audience (family-friendly unless specified otherwise)`;

    const userPrompt = `Create a complete story for video generation with the title "${title}".

**Story Structure:**
- Write a flowing narrative that can be divided into ${frameCount} scenes
- Each scene should be approximately 8 seconds of content
- Include clear character actions, dialogue, and visual descriptions
- Ensure smooth transitions between scenes
- Create a satisfying conclusion

**Style Guidelines:**
- Use ${style} tone and pacing
- Include vivid visual descriptions
- Add natural dialogue with quotation marks
- Focus on actions and movements suitable for video
- Create engaging character interactions

**Output Format:**
Return a complete story narrative that flows from beginning to end, with clear scene breaks that can be divided into ${frameCount} parts. Include dialogue in quotation marks and descriptive action sequences.

**Example Structure:**
"[Opening scene description with character introduction and initial action. Character says: 'First dialogue line.']

[Second scene description with character development and new action. Character says: 'Second dialogue line.']

[Continue with remaining scenes...]

[Final scene with resolution and character growth. Character says: 'Final dialogue line.']"

Write the complete story now:`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
      max_tokens: 2000,
      temperature: 0.8
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No story generated from AI');
    }

    // Extract theme from the generated story
    const theme = extractThemeFromStory(response, style);

    return {
      story: response.trim(),
      theme
    };

  } catch (error) {
    console.error('AI Story Generation Error:', error);
    
    // Fallback to a simple AI-generated story
    return generateFallbackStory(options);
  }
};

/**
 * Extracts theme information from the generated story
 */
const extractThemeFromStory = (story: string, style: string): string => {
  const storyLower = story.toLowerCase();
  
  // Extract key themes based on content
  const themes = [];
  
  if (storyLower.includes('adventure') || storyLower.includes('journey') || storyLower.includes('quest')) {
    themes.push('adventure');
  }
  if (storyLower.includes('friendship') || storyLower.includes('together') || storyLower.includes('team')) {
    themes.push('friendship');
  }
  if (storyLower.includes('discovery') || storyLower.includes('learn') || storyLower.includes('find')) {
    themes.push('discovery');
  }
  if (storyLower.includes('courage') || storyLower.includes('brave') || storyLower.includes('fear')) {
    themes.push('courage');
  }
  if (storyLower.includes('magic') || storyLower.includes('magical') || storyLower.includes('enchanted')) {
    themes.push('magic');
  }
  if (storyLower.includes('nature') || storyLower.includes('forest') || storyLower.includes('mountain')) {
    themes.push('nature');
  }
  if (storyLower.includes('city') || storyLower.includes('urban') || storyLower.includes('street')) {
    themes.push('urban');
  }
  
  const baseTheme = `${style} story`;
  const additionalThemes = themes.length > 0 ? `, ${themes.join(', ')}` : '';
  
  return baseTheme + additionalThemes;
};

/**
 * Generates a fallback story when AI fails
 */
const generateFallbackStory = (options: StoryGenerationOptions): GeneratedStoryData => {
  const { title, frameCount, style } = options;
  
  const fallbackStories: Record<string, string> = {
    creative: `A character begins their creative journey in a world filled with endless possibilities. The character explores new ideas and approaches each challenge with fresh perspective. The character says: 'I see things differently now!' as they discover innovative solutions. Their creativity inspires others around them, spreading joy and wonder. The character concludes: 'Imagination is the key to everything!'`,
    dramatic: `A character faces a significant challenge that tests their resolve and character. The character says: 'I must find the strength within!' as they confront their fears. Through determination and courage, the character overcomes obstacles and grows stronger. The character reflects: 'I've learned so much about myself.' The story concludes with the character's transformation and newfound wisdom.`,
    cinematic: `A character embarks on an epic visual journey through stunning landscapes and dramatic moments. The character says: 'This is my moment!' as they face incredible challenges. Cinematic camera angles capture every emotion and action. The character concludes: 'What a journey this has been!' as they stand victorious against a beautiful backdrop.`,
    emotional: `A character experiences deep personal growth through meaningful connections and self-discovery. The character says: 'I understand now what truly matters.' as they connect with others. Their emotional journey leads to profound insights and personal transformation. The character concludes: 'Love and understanding are everything.'`,
    action: `A character engages in thrilling adventures filled with dynamic movement and exciting challenges. The character says: 'Let's do this!' as they dive into action-packed sequences. Their energy and determination drive the story forward through exciting encounters. The character concludes: 'That was incredible!' as they celebrate their achievements.`,
    comedy: `A character navigates hilarious situations with humor and lightheartedness. The character says: 'Well, that didn't go as planned!' as they encounter comedic mishaps. Their positive attitude and quick wit turn challenges into laughter. The character concludes: 'Life is better when you can laugh at yourself!'`,
    horror: `A character cautiously explores mysterious and suspenseful situations. The character whispers: 'Something doesn't feel right here.' as they encounter eerie circumstances. Tension builds as they uncover secrets and face unknown dangers. The character concludes: 'I need to be more careful.' as they navigate the mysterious world.`,
    romance: `A character experiences the beauty of connection and emotional intimacy. The character says: 'You make everything better.' as they share meaningful moments. Their journey explores love, friendship, and deep emotional bonds. The character concludes: 'This is what happiness feels like.'`,
    adventure: `A character embarks on an exciting journey filled with discovery and new experiences. The character says: 'I'm ready for whatever comes next!' as they explore new territories. Their adventurous spirit leads them through thrilling encounters and personal growth. The character concludes: 'What an amazing adventure!'`
  };

  const story = fallbackStories[style || 'creative'] || fallbackStories['creative'];
  const theme = `${style} story, character journey, personal growth`;

  return {
    story,
    theme
  };
};

/**
 * Analyzes a story title to determine the best style and approach
 */
export const analyzeStoryTitle = (title: string): { style: string; characterType: string; setting: string } => {
  const titleLower = title.toLowerCase();
  
  let style: string = 'creative';
  let characterType = 'engaging protagonist';
  let setting = 'dynamic and visually interesting';

  // Determine style based on keywords
  if (titleLower.includes('horror') || titleLower.includes('scary') || titleLower.includes('ghost') || titleLower.includes('haunted')) {
    style = 'horror';
    setting = 'mysterious and atmospheric';
  } else if (titleLower.includes('comedy') || titleLower.includes('funny') || titleLower.includes('laugh')) {
    style = 'comedy';
    setting = 'lighthearted and humorous';
  } else if (titleLower.includes('romance') || titleLower.includes('love') || titleLower.includes('romantic')) {
    style = 'romance';
    setting = 'romantic and beautiful';
  } else if (titleLower.includes('action') || titleLower.includes('adventure') || titleLower.includes('epic')) {
    style = 'action';
    setting = 'exciting and dynamic';
  } else if (titleLower.includes('drama') || titleLower.includes('emotional') || titleLower.includes('deep')) {
    style = 'emotional';
    setting = 'intimate and meaningful';
  } else if (titleLower.includes('cinematic') || titleLower.includes('movie') || titleLower.includes('film')) {
    style = 'cinematic';
    setting = 'cinematic and visually stunning';
  }

  // Determine character type
  if (titleLower.includes('warrior') || titleLower.includes('hero') || titleLower.includes('knight')) {
    characterType = 'brave warrior';
  } else if (titleLower.includes('wizard') || titleLower.includes('magic') || titleLower.includes('mage')) {
    characterType = 'mystical wizard';
  } else if (titleLower.includes('detective') || titleLower.includes('investigator') || titleLower.includes('sleuth')) {
    characterType = 'clever detective';
  } else if (titleLower.includes('artist') || titleLower.includes('creative') || titleLower.includes('painter')) {
    characterType = 'creative artist';
  } else if (titleLower.includes('scientist') || titleLower.includes('researcher') || titleLower.includes('inventor')) {
    characterType = 'brilliant scientist';
  }

  // Determine setting
  if (titleLower.includes('space') || titleLower.includes('galaxy') || titleLower.includes('planet')) {
    setting = 'futuristic space environment';
  } else if (titleLower.includes('forest') || titleLower.includes('nature') || titleLower.includes('wilderness')) {
    setting = 'beautiful natural environment';
  } else if (titleLower.includes('city') || titleLower.includes('urban') || titleLower.includes('metropolis')) {
    setting = 'vibrant urban landscape';
  } else if (titleLower.includes('mountain') || titleLower.includes('peak') || titleLower.includes('summit')) {
    setting = 'majestic mountain setting';
  } else if (titleLower.includes('ocean') || titleLower.includes('sea') || titleLower.includes('underwater')) {
    setting = 'mysterious underwater world';
  }

  return { style, characterType, setting };
};
