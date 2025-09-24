import OpenAI from 'openai';

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export interface StoryElement {
  type: 'setting' | 'prop' | 'action' | 'dialogue_style' | 'mood' | 'character_trait';
  value: string;
  frequency: number;
  scenes: number[];
  importance: 'critical' | 'high' | 'medium' | 'low';
}

export interface ConsistencyRules {
  storyTitle: string;
  elements: StoryElement[];
  characterProfile: {
    appearance: string[];
    personality: string[];
    speakingStyle: string;
  };
  settingProfile: {
    location: string;
    atmosphere: string;
    timeOfDay: string;
  };
  narrativeStyle: {
    tone: string;
    pacing: string;
    visualStyle: string;
  };
}

export interface StoryScene {
  sceneNumber: number;
  description: string;
  prompt: string;
  duration: number;
}

/**
 * Analyzes a story to extract consistency rules and key elements
 */
export const analyzeStoryConsistency = async (storyTitle: string, scenes: StoryScene[]): Promise<ConsistencyRules> => {
  try {
    // Prepare story content for analysis
    const storyContent = scenes.map(scene => 
      `Scene ${scene.sceneNumber}: ${scene.description}\nPrompt: ${scene.prompt}`
    ).join('\n\n');

    const analysisPrompt = `Analyze this story and extract consistency rules for video generation. Focus on elements that should remain consistent across scene regenerations.

**Story Title:** ${storyTitle}
**Story Content:**
${storyContent}

**Extract and categorize the following:**

1. **Character Elements** (appearance, props, traits that appear multiple times)
2. **Setting Elements** (location, atmosphere, time of day)
3. **Action Patterns** (recurring actions, movement styles)
4. **Dialogue Style** (speaking patterns, catchphrases, tone)
5. **Visual Style** (mood, lighting, camera angles)
6. **Narrative Flow** (how scenes connect, story progression)

**For each element, determine:**
- How critical it is for story consistency (critical/high/medium/low)
- Which scenes it appears in
- How frequently it appears

**Output as JSON with this structure:**
{
  "elements": [
    {
      "type": "setting|prop|action|dialogue_style|mood|character_trait",
      "value": "specific element description",
      "frequency": number,
      "scenes": [scene numbers],
      "importance": "critical|high|medium|low"
    }
  ],
  "characterProfile": {
    "appearance": ["list of appearance elements"],
    "personality": ["list of personality traits"],
    "speakingStyle": "description of how character speaks"
  },
  "settingProfile": {
    "location": "main setting description",
    "atmosphere": "mood and feeling of the setting",
    "timeOfDay": "time period if consistent"
  },
  "narrativeStyle": {
    "tone": "overall story tone",
    "pacing": "story pacing description",
    "visualStyle": "visual style description"
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a story analysis expert. Analyze stories to extract consistency rules for video generation. Always respond with valid JSON."
        },
        {
          role: "user",
          content: analysisPrompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from AI analysis');
    }

    // Parse and validate the response
    const parsedRules = JSON.parse(response);
    
    // Validate and enhance the rules
    const consistencyRules: ConsistencyRules = {
      storyTitle,
      elements: parsedRules.elements || [],
      characterProfile: {
        appearance: parsedRules.characterProfile?.appearance || [],
        personality: parsedRules.characterProfile?.personality || [],
        speakingStyle: parsedRules.characterProfile?.speakingStyle || "natural"
      },
      settingProfile: {
        location: parsedRules.settingProfile?.location || "unspecified",
        atmosphere: parsedRules.settingProfile?.atmosphere || "neutral",
        timeOfDay: parsedRules.settingProfile?.timeOfDay || "unspecified"
      },
      narrativeStyle: {
        tone: parsedRules.narrativeStyle?.tone || "neutral",
        pacing: parsedRules.narrativeStyle?.pacing || "moderate",
        visualStyle: parsedRules.narrativeStyle?.visualStyle || "standard"
      }
    };

    return consistencyRules;

  } catch (error) {
    console.error('Story consistency analysis failed:', error);
    
    // Fallback: create basic consistency rules from simple analysis
    return createFallbackConsistencyRules(storyTitle, scenes);
  }
};

/**
 * Creates fallback consistency rules when AI analysis fails
 */
const createFallbackConsistencyRules = (storyTitle: string, scenes: StoryScene[]): ConsistencyRules => {
  const elements: StoryElement[] = [];
  
  // Simple keyword extraction
  const allText = scenes.map(s => `${s.description} ${s.prompt}`).join(' ').toLowerCase();
  
  // Extract common words and phrases
  const words = allText.split(/\s+/);
  const wordCount = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Find frequently mentioned elements
  Object.entries(wordCount).forEach(([word, count]) => {
    if (count > 1 && word.length > 3) {
      elements.push({
        type: 'character_trait',
        value: word,
        frequency: count,
        scenes: scenes.map(s => s.sceneNumber),
        importance: count > 2 ? 'high' : 'medium'
      });
    }
  });

  return {
    storyTitle,
    elements,
    characterProfile: {
      appearance: [],
      personality: [],
      speakingStyle: "natural"
    },
    settingProfile: {
      location: "unspecified",
      atmosphere: "neutral",
      timeOfDay: "unspecified"
    },
    narrativeStyle: {
      tone: "neutral",
      pacing: "moderate",
      visualStyle: "standard"
    }
  };
};

/**
 * Generates consistency enforcement prompt for AI regeneration
 */
export const generateConsistencyPrompt = (rules: ConsistencyRules): string => {
  const criticalElements = rules.elements.filter(e => e.importance === 'critical');
  const highElements = rules.elements.filter(e => e.importance === 'high');
  
  let consistencyInstructions = '';

  if (criticalElements.length > 0) {
    consistencyInstructions += `\n**CRITICAL ELEMENTS (MUST preserve):**\n${criticalElements.map(e => `- ${e.value}`).join('\n')}`;
  }

  if (highElements.length > 0) {
    consistencyInstructions += `\n**IMPORTANT ELEMENTS (should preserve):**\n${highElements.map(e => `- ${e.value}`).join('\n')}`;
  }

  if (rules.characterProfile.appearance.length > 0) {
    consistencyInstructions += `\n**CHARACTER APPEARANCE:** ${rules.characterProfile.appearance.join(', ')}`;
  }

  if (rules.settingProfile.location !== 'unspecified') {
    consistencyInstructions += `\n**SETTING:** ${rules.settingProfile.location} (${rules.settingProfile.atmosphere})`;
  }

  if (rules.characterProfile.speakingStyle !== 'natural') {
    consistencyInstructions += `\n**DIALOGUE STYLE:** ${rules.characterProfile.speakingStyle}`;
  }

  return consistencyInstructions;
};

/**
 * Validates if a regenerated scene maintains consistency
 */
export const validateSceneConsistency = (originalScene: StoryScene, regeneratedPrompt: string, rules: ConsistencyRules): {
  isConsistent: boolean;
  missingElements: string[];
  preservedElements: string[];
} => {
  const missingElements: string[] = [];
  const preservedElements: string[] = [];
  
  const regeneratedText = regeneratedPrompt.toLowerCase();
  
  // Check critical elements
  rules.elements.forEach(element => {
    if (element.importance === 'critical' || element.importance === 'high') {
      const elementValue = element.value.toLowerCase();
      if (regeneratedText.includes(elementValue)) {
        preservedElements.push(element.value);
      } else {
        missingElements.push(element.value);
      }
    }
  });

  const isConsistent = missingElements.length === 0 || 
    (missingElements.length <= 2 && preservedElements.length > missingElements.length);

  return {
    isConsistent,
    missingElements,
    preservedElements
  };
};
