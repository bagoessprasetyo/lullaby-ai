// lib/openai.ts
// import { createParser } from 'eventsource-parser';

/**
 * Configuration for OpenAI API calls
 */
const OPENAI_CONFIG = {
  apiUrl: 'https://api.deepseek.com/chat/completions',
  model: 'deepseek-chat', // You can use gpt-4-1106-preview or gpt-4-turbo
  systemPrompt: "You are a professional children's author specializing in bedtime stories that help children fall asleep. You write engaging, warm, and calming stories with gentle pacing that gradually become more soothing toward the end."
};

/**
 * Call OpenAI API to generate a story based on a prompt
 */
export async function generateStoryWithOpenAI(prompt: string): Promise<{ title: string, content: string }> {
  try {
    console.log('[OpenAI] Generating story with prompt length:', prompt.length);
    
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }
    
    const response = await fetch(OPENAI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.model,
        messages: [
          { 
            role: "system", 
            content: OPENAI_CONFIG.systemPrompt
          },
          { 
            role: "user", 
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      let errorMessage = `OpenAI API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `OpenAI API error: ${errorData.error?.message || errorData.error || errorMessage}`;
      } catch (e) {
        // If we can't parse error as JSON, use status code
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from OpenAI API");
    }

    const contentText = data.choices[0].message.content;
    
    // Extract title and content from the story
    let title = "Bedtime Adventure";
    let content = contentText;
    
    // Attempt to extract title
    const titleMatch = contentText.match(/Title:\s*(.*?)(?:\n|$)/);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
      // Remove the title line from content
      content = contentText.replace(/Title:\s*(.*?)(?:\n|$)/, '').trim();
    } else {
      // Try another common format
      const titleMatch2 = contentText.match(/^#\s*(.*?)(?:\n|$)/);
      if (titleMatch2 && titleMatch2[1]) {
        title = titleMatch2[1].trim();
        // Remove the title line from content
        content = contentText.replace(/^#\s*(.*?)(?:\n|$)/, '').trim();
      }
    }
    
    // If we couldn't extract a title, we'll need to generate one in a separate call
    // This will be handled in the generateTitleForStory function
    
    console.log('[OpenAI] Successfully generated story:', { 
      title,
      contentLength: content.length,
      tokenUsage: data.usage
    });
    
    return { title, content };
  } catch (error) {
    console.error('[OpenAI] Error generating story:', error);
    
    // Provide a fallback story in case of API failure
    return {
      title: "The Magical Bedtime Journey",
      content: `Once upon a time, in a land of sweet dreams, a child was ready for sleep.

The stars twinkled in the night sky, and the moon cast a gentle glow through the window.

"Time for bed," whispered the night breeze, as eyelids grew heavy and the world grew quiet.

Sweet dreams awaited, just around the corner of imagination.

The End.`
    };
  }
}

/**
 * Analyze an image with OpenAI Vision API
 */
export async function analyzeImageWithOpenAI(imageUrl: string): Promise<any> {
  try {
    console.log('[OpenAI Vision] Analyzing image:', imageUrl);
    
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not configured in environment variables');
    }
    
    // First, get the image content from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    
    // Call OpenAI Vision API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Describe this image for a children's bedtime story. Identify main subjects, setting, mood, and notable details. Format response as JSON with these fields: subjects (array of strings), setting (string), themes (array of strings), mood (string), details (array of strings), raw (string with full description)."
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 500
      })
    });

    if (!response.ok) {
      let errorMessage = `OpenAI Vision API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `OpenAI Vision API error: ${errorData.error?.message || errorData.error || errorMessage}`;
      } catch (e) {
        // If we can't parse error as JSON, use status code
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from OpenAI Vision API");
    }

    const contentText = data.choices[0].message.content;
    
    // Try to parse the response as JSON
    try {
      // Look for JSON in the response
      const jsonMatch = contentText.match(/```json\n([\s\S]*?)\n```/) || 
                       contentText.match(/```\n([\s\S]*?)\n```/) || 
                       contentText.match(/({[\s\S]*})/);
                       
      const jsonText = jsonMatch ? jsonMatch[1] : contentText;
      
      const analysisData = JSON.parse(jsonText);
      console.log('[OpenAI Vision] Successfully parsed image analysis:', {
        subjects: analysisData.subjects?.length,
        setting: analysisData.setting,
        themes: analysisData.themes?.length
      });
      
      return analysisData;
    } catch (parseError) {
      console.error('[OpenAI Vision] Failed to parse response as JSON:', parseError);
      console.log('[OpenAI Vision] Raw response:', contentText);
      
      // Create a basic structure from the raw text
      return {
        subjects: ["child", "character"],
        setting: "magical scene",
        themes: ["adventure", "friendship", "bedtime"],
        mood: "peaceful",
        details: ["colorful imagery", "gentle surroundings"],
        raw: contentText
      };
    }
  } catch (error) {
    console.error('[OpenAI Vision] Error analyzing image:', error);
    
    // Provide fallback analysis in case of API failure
    return {
      subjects: ["child", "character"],
      setting: "magical scene",
      themes: ["adventure", "friendship", "bedtime"],
      mood: "peaceful",
      details: ["colorful imagery", "gentle surroundings"],
      raw: "An image showing a magical scene perfect for a bedtime story."
    };
  }
}

/**
 * Process multiple images and combine their analyses
 */
export async function analyzeImagesWithOpenAI(imageUrls: string[]): Promise<any[]> {
  if (!imageUrls || imageUrls.length === 0) {
    return [{
      subjects: ["child"],
      setting: "bedroom",
      themes: ["bedtime", "dreams"],
      mood: "peaceful",
      details: ["night sky", "soft bed", "stuffed animals"],
      raw: "A cozy bedroom ready for bedtime stories."
    }];
  }
  
  // Analyze up to 5 images (to limit API usage)
  const imagesToAnalyze = imageUrls.slice(0, 5);
  
  try {
    // Process images in parallel
    const analysisPromises = imagesToAnalyze.map(url => analyzeImageWithOpenAI(url));
    const analyses = await Promise.all(analysisPromises);
    
    console.log('[OpenAI Vision] Completed analysis for', analyses.length, 'images');
    return analyses;
  } catch (error) {
    console.error('[OpenAI Vision] Error in batch image analysis:', error);
    
    // Return fallback analyses
    return imageUrls.map((_, i) => ({
      subjects: ["child", `character ${i+1}`],
      setting: i === 0 ? "magical forest" : i === 1 ? "cozy bedroom" : "enchanted meadow",
      themes: ["adventure", "friendship", "dreams"],
      mood: "peaceful",
      details: ["twinkling stars", "soft light", "gentle creatures"],
      raw: `Image ${i+1} showing a scene perfect for a bedtime story.`
    }));
  }
}

/**
 * Generate an appropriate title for a story in the specified language
 * @param content The story content
 * @param language The language code (e.g., 'en', 'fr', 'ja')
 * @returns Promise with the generated title
 */
export async function generateTitleForStory(content: string, language: string): Promise<string> {
  try {
    console.log('[OpenAI] Generating title for story in language:', language);
    
    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('API key is not configured in environment variables');
    }
    
    // Only use a short excerpt from the beginning of the story for context
    // to save tokens and focus on the main theme
    const contentExcerpt = content.slice(0, 500) + (content.length > 500 ? '...' : '');
    
    // Create language-specific instructions
    const languageInstructions: Record<string, string> = {
      'en': 'Create a short, catchy title for this children\'s bedtime story in English. The title should be 2-6 words.',
      'fr': 'Créez un titre court et accrocheur pour cette histoire pour enfants en français. Le titre doit comporter 2 à 6 mots.',
      'ja': 'この子供向けのお話に日本語で短くて魅力的なタイトルをつけてください。タイトルは2〜6語程度にしてください。',
      'zh': '为这个儿童睡前故事创建一个简短、吸引人的中文标题。标题应为2-6个词。',
      'de': 'Erstellen Sie einen kurzen, einprägsamen Titel für diese Kindergeschichte auf Deutsch. Der Titel sollte 2-6 Wörter umfassen.',
      'es': 'Crea un título corto y atractivo para este cuento infantil en español. El título debe tener entre 2 y 6 palabras.',
      'it': 'Crea un titolo breve e accattivante per questa storia per bambini in italiano. Il titolo dovrebbe essere di 2-6 parole.',
      'pt': 'Crie um título curto e cativante para esta história infantil em português. O título deve ter entre 2 e 6 palavras.',
      'ru': 'Создайте короткое, запоминающееся название для этой детской сказки на русском языке. Название должно состоять из 2-6 слов.',
      'id': 'Buatlah judul pendek dan menarik untuk cerita anak ini dalam bahasa Indonesia. Judul sebaiknya terdiri dari 2-6 kata.'
    };
    
    // Default to English if language not found
    const titlePrompt = languageInstructions[language.toLowerCase()] || languageInstructions['en'];
    
    const response = await fetch(OPENAI_CONFIG.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OPENAI_CONFIG.model,
        messages: [
          { 
            role: "system", 
            content: "You are a professional children's book title creator. Create short, engaging titles that capture the essence of a story."
          },
          { 
            role: "user", 
            content: `${titlePrompt}\n\nHere is the beginning of the story:\n\n${contentExcerpt}`
          }
        ],
        temperature: 0.7,
        max_tokens: 30 // Titles are short, so we don't need many tokens
      })
    });

    if (!response.ok) {
      let errorMessage = `API error: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = `API error: ${errorData.error?.message || errorData.error || errorMessage}`;
      } catch (e) {
        // If we can't parse error as JSON, use status code
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error("Invalid response structure from API");
    }

    // Extract the title, removing any quotes or extra formatting
    const rawTitle = data.choices[0].message.content.trim();
    const cleanTitle = rawTitle
      .replace(/^["'](.*)["']$/, '$1') // Remove surrounding quotes if present
      .replace(/^Title:\s*/, '')       // Remove "Title:" prefix if present
      .trim();
    
    console.log('[OpenAI] Generated title:', cleanTitle);
    
    return cleanTitle;
  } catch (error) {
    console.error('[OpenAI] Error generating title:', error);
    
    // Return a default title based on language
    const defaultTitles: Record<string, string> = {
      'en': 'Magical Bedtime Story',
      'fr': 'Histoire Magique du Soir',
      'ja': '魔法のおやすみ話',
      'zh': '神奇的睡前故事',
      'de': 'Magische Gute-Nacht-Geschichte',
      'es': 'Cuento Mágico para Dormir',
      'it': 'Storia Magica della Buonanotte',
      'pt': 'História Mágica de Ninar',
      'ru': 'Волшебная Сказка на Ночь',
      'id': 'Dongeng Pengantar Tidur'
    };
    
    return defaultTitles[language.toLowerCase()] || defaultTitles['en'];
  }
}