// lib/story-generation.ts
import { StoryFormData } from "@/app/dashboard/create/page";

// Language configurations
const LANGUAGE_CONFIG = {
  english: { 
    name: "English", 
    prompt_prefix: "Write a soothing",
    language_code: "en"
  },
  french: { 
    name: "French", 
    prompt_prefix: "Écrivez une apaisante",
    language_code: "fr"
  },
  japanese: { 
    name: "Japanese", 
    prompt_prefix: "子供向けの穏やかな",
    language_code: "ja"
  },
  indonesian: { 
    name: "Indonesian", 
    prompt_prefix: "Tulislah sebuah",
    language_code: "id"
  }
};

// Theme descriptions
const THEME_DESCRIPTIONS = {
  adventure: "an exciting journey of discovery that ends peacefully",
  fantasy: "a magical world with enchanting elements and mystical creatures",
  bedtime: "a calm and peaceful story perfect for transitioning to sleep",
  educational: "a gentle learning experience with interesting facts woven into the narrative",
  customized: "a personalized adventure based on the images provided"
};

// Duration configuration
const DURATION_CONFIG = {
  short: { 
    words: 300, 
    description: "short and sweet (2-3 minutes)",
    paragraphs: 5
  },
  medium: { 
    words: 600, 
    description: "medium length (4-5 minutes)",
    paragraphs: 8
  },
  long: { 
    words: 900, 
    description: "longer and detailed (6-8 minutes)",
    paragraphs: 12
  }
};

/**
 * Generate an enhanced story prompt based on image analysis and form data
 */
export function buildEnhancedStoryPrompt({
  imageAnalysis,
  characters,
  theme,
  duration,
  language
}: {
  imageAnalysis: any;
  characters: { name: string; description: string }[];
  theme: string;
  duration: string;
  language: string;
}): string {
  // Prepare character names and descriptions
  const characterNames = characters
    .filter(char => char.name.trim() !== "")
    .map(char => char.name);
  
  const defaultNames = ["the child", "the little one", "the dreamer"];
  const names = characterNames.length > 0 ? characterNames : defaultNames;
  
  // Create character descriptions for the prompt
  const characterDescriptions = characters
    .filter(char => char.name.trim() !== "")
    .map(char => {
      const description = char.description 
        ? `${char.name}: ${char.description}` 
        : `${char.name}`;
      return description;
    });
  
  // Get scene descriptions from image analysis
  const scenes: string[] = [];
  
  if (imageAnalysis) {
    // Handle if imageAnalysis is a single object or an array
    const analyses = Array.isArray(imageAnalysis) ? imageAnalysis : [imageAnalysis];
    
    analyses.forEach((analysis, index) => {
      // Use different character for each scene if possible
      const charName = names[index % names.length];
      
      // Get details from analysis
      const setting = analysis.setting || "magical place";
      const subjects = Array.isArray(analysis.subjects) 
        ? analysis.subjects.join(", ") 
        : (analysis.subjects || "");
      const mood = analysis.mood || "peaceful";
      const details = Array.isArray(analysis.details) 
        ? analysis.details.join(", ") 
        : (analysis.details || "");
      
      scenes.push(
        `Scene ${index+1} with ${charName}: ${charName} in a ${setting} with ${subjects}. ` +
        `Mood: ${mood}. Details: ${details}.`
      );
    });
  }
  
  // Use placeholder if no scenes were created
  if (scenes.length === 0) {
    scenes.push(`Scene 1 with ${names[0]}: ${names[0]} embarks on a magical journey.`);
  }
  
  // Get configurations
  const languageConfig = LANGUAGE_CONFIG[language] || LANGUAGE_CONFIG.english;
  const themeDesc = THEME_DESCRIPTIONS[theme] || THEME_DESCRIPTIONS.adventure;
  const durationConfig = DURATION_CONFIG[duration] || DURATION_CONFIG.medium;
  
  // Build prompt
  return `${languageConfig.prompt_prefix} bedtime story for children featuring these characters: ${names.join(', ')}

${characterDescriptions.length > 0 ? 'Character Details:\n' + characterDescriptions.join('\n') + '\n\n' : ''}
Scenes to include:
${scenes.join('\n')}

Story Requirements:
- Theme: ${themeDesc}
- Length: ${durationConfig.description} (around ${durationConfig.words} words, approximately ${durationConfig.paragraphs} paragraphs)
- Structure: Create a flowing narrative with gentle transitions between scenes
- Characters: Use the provided character names naturally in the story
- Language: Write in ${languageConfig.name}

Story should:
- Be soothing and calming, perfect for bedtime reading
- Feature the named characters prominently in their scenes
- Create meaningful interactions between characters
- Include peaceful pauses between scene transitions
- Have a peaceful conclusion

Elements to Include:
- Each character's unique personality
- Gentle interactions between characters
- Soft sounds and sensory details
- Calming actions and movements
- Soothing repetitive elements
- Relaxing breathing moments
- Gradual transition to sleepiness

Make the story progressively more calming, leading to a peaceful conclusion.

Return the story with a creative title and engaging content. Format your response as:

Title: [The title of the story]

[The full story content with paragraphs]`;
}

/**
 * Generate a bedtime story using the enhanced prompt
 */
export async function generateEnhancedStory({
  imageUrls,
  imageAnalysis,
  characters,
  theme,
  duration,
  language
}: {
  imageUrls: string[];
  imageAnalysis: any;
  characters: { name: string; description: string }[];
  theme: string;
  duration: string;
  language: string;
}): Promise<{ title: string; content: string }> {
  try {
    // Build the enhanced prompt
    const prompt = buildEnhancedStoryPrompt({
      imageAnalysis,
      characters,
      theme,
      duration,
      language
    });
    
    console.log('[Story Generation] Enhanced prompt created:', prompt.substring(0, 200) + '...');
    
    // TODO: Replace with actual API call to OpenAI or another LLM service
    // For now, we'll use a mock response
    
    // Extract character name for the title
    const characterName = characters.length > 0 && characters[0].name.trim() !== ''
      ? characters[0].name
      : 'the Little Dreamer';
    
    // Create a mock title based on the theme
    const themeWord = theme.charAt(0).toUpperCase() + theme.slice(1);
    const title = `The ${themeWord} of ${characterName}`;
    
    // In a real implementation, you would call an LLM API here
    // const response = await callLLMApi(prompt);
    // return response;
    
    // Mock response - in production, replace with actual API call
    const content = `Once upon a time, in a land of dreams, ${characterName} was getting ready for bed. The stars twinkled outside the window, casting a gentle glow across the room.
    
"Time for sleep," whispered ${characterName}'s mother, tucking the soft blanket around the little one.

${characterName} closed their eyes and took a deep breath. With each breath, their body felt heavier and more relaxed, sinking gently into the mattress like a feather floating down to earth.

As sleep began to approach, ${characterName} imagined walking through a magical forest. The trees swayed gently in the breeze, creating a soothing rhythm that matched their breathing.

In the distance, a gentle melody played, carrying ${characterName} deeper into the world of dreams. Each step felt lighter, each breath deeper.

The path led to a peaceful meadow where friendly animals rested beneath the moonlight. They nodded to ${characterName}, their eyes heavy with sleep too.

"Rest now," whispered a tiny owl from its perch. "Tomorrow brings new adventures, but now is the time for dreams."

${characterName} found a soft patch of grass and lay down, watching as the stars above seemed to sing a lullaby all their own.

Slowly, slowly, their eyelids grew heavy. The sounds of the forest grew quieter, the lights dimmer.

And as the moon smiled down, ${characterName} drifted off to sleep, safe and warm in the knowledge that dreams were waiting just around the corner.

The End.`;

    return { title, content };
  } catch (error) {
    console.error('[Story Generation] Error generating enhanced story:', error);
    
    // Fallback response in case of error
    return {
      title: `The ${theme.charAt(0).toUpperCase() + theme.slice(1)} Adventure`,
      content: `Once upon a time, there was a wonderful adventure waiting to happen.
      
A child named ${characters[0]?.name || 'Alex'} discovered something magical in the forest.

It was a day filled with wonder and joy. The sun shined brightly, and birds sang beautiful songs.

After exploring and learning many new things, it was time to go home and rest.

And they all lived happily ever after.`
    };
  }
}

/**
 * Main function to replace the original story generation
 */
export async function generateStoryWithDeepSeek(formData: any): Promise<{ title: string, content: string }> {
  return generateEnhancedStory({
    imageUrls: formData.imageUrls || [],
    imageAnalysis: formData.imageAnalysis,
    characters: formData.characters || [],
    theme: formData.theme || 'adventure',
    duration: formData.duration || 'medium',
    language: formData.language || 'english'
  });
}

// Function to implement with OpenAI API integration
export async function generateStoryWithOpenAI(prompt: string): Promise<{ title: string, content: string }> {
  // TODO: Implement OpenAI API call
  // This will be implemented in the next step
  
  // Placeholder implementation
  return {
    title: "The Magical Adventure",
    content: "Once upon a time in a magical forest..."
  };
}