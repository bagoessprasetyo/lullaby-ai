// app/api/analyze-images/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Simple image analysis function that doesn't require external API
async function analyzeImageWithDeepSeek(imageUrl: string) {
  try {
    // Get image filename and try to extract information from it
    const urlParts = imageUrl.split('/');
    const filename = urlParts[urlParts.length - 1].toLowerCase();
    
    console.log(`Analyzing image: ${filename}`);
    
    // Check if Hugging Face API is available and configured
    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (hfApiKey && process.env.USE_HUGGINGFACE === 'true') {
      try {
        return await analyzeWithHuggingFace(imageUrl, hfApiKey);
      } catch (hfError) {
        console.warn('Hugging Face analysis failed, using fallback:', hfError);
        // Continue with fallback analysis
      }
    }
    
    // If we reach here, either HF is not configured or failed, so use basic analysis
    return generateBasicAnalysis(imageUrl);
  } catch (error) {
    console.error('Image analysis error:', error);
    // Return a basic structure if analysis fails
    return { 
      raw: "This image shows a scene that could inspire a children's story.",
      subjects: ["child", "adventure"],
      setting: "magical forest",
      themes: ["adventure", "discovery", "friendship"],
      mood: "exciting",
      details: ["tall trees", "sparkling stream", "hidden path"]
    };
  }
}

// Basic analysis function that doesn't require external API
async function generateBasicAnalysis(imageUrl: string) {
  // Extract potential themes from image URL or filename
  const urlLower = imageUrl.toLowerCase();
  
  // Detect likely content based on filename or URL patterns
  const possibleThemes = [
    { keywords: ['forest', 'tree', 'nature', 'park'], theme: 'nature' },
    { keywords: ['beach', 'ocean', 'sea', 'water'], theme: 'ocean' },
    { keywords: ['sky', 'star', 'space', 'moon'], theme: 'space' },
    { keywords: ['dog', 'cat', 'pet', 'animal'], theme: 'animals' },
    { keywords: ['castle', 'knight', 'princess', 'dragon'], theme: 'fantasy' },
    { keywords: ['farm', 'barn', 'cow', 'horse'], theme: 'farm' },
    { keywords: ['family', 'home', 'house', 'room'], theme: 'family' },
    { keywords: ['school', 'learn', 'book', 'read'], theme: 'education' },
    { keywords: ['sleep', 'bed', 'night', 'dream'], theme: 'bedtime' },
  ];
  
  // Find matching themes
  const matchedThemes = possibleThemes
    .filter(t => t.keywords.some(k => urlLower.includes(k)))
    .map(t => t.theme);
  
  // Default themes if nothing matched
  const themes = matchedThemes.length > 0 
    ? matchedThemes 
    : ['adventure', 'discovery', 'friendship'];
  
  // Try to detect if image might have people/characters
  const hasCharacters = urlLower.includes('person') || 
                       urlLower.includes('people') || 
                       urlLower.includes('child') || 
                       urlLower.includes('family');
  
  // Create basic subjects list based on detected themes and character presence
  let subjects = [];
  if (hasCharacters) {
    subjects = ['child', 'family'];
  } else if (themes.includes('animals')) {
    subjects = ['animal', 'pet'];
  } else if (themes.includes('fantasy')) {
    subjects = ['wizard', 'dragon'];
  } else {
    subjects = ['explorer', 'adventurer'];
  }
  
  // Select a setting based on themes
  let setting = '';
  if (themes.includes('nature') || themes.includes('adventure')) {
    setting = 'magical forest';
  } else if (themes.includes('space')) {
    setting = 'starry night sky';
  } else if (themes.includes('ocean')) {
    setting = 'beautiful beach';
  } else if (themes.includes('farm')) {
    setting = 'peaceful countryside';
  } else if (themes.includes('family')) {
    setting = 'cozy home';
  } else {
    setting = 'enchanted world';
  }
  
  // Select a mood based on themes
  let mood = '';
  if (themes.includes('adventure')) {
    mood = 'exciting';
  } else if (themes.includes('fantasy')) {
    mood = 'magical';
  } else if (themes.includes('bedtime')) {
    mood = 'peaceful';
  } else if (themes.includes('education')) {
    mood = 'curious';
  } else {
    mood = 'cheerful';
  }
  
  // Create some details based on setting
  let details = [];
  if (setting === 'magical forest') {
    details = ['tall trees', 'sparkling stream', 'hidden path'];
  } else if (setting === 'starry night sky') {
    details = ['twinkling stars', 'glowing moon', 'passing comet'];
  } else if (setting === 'beautiful beach') {
    details = ['golden sand', 'gentle waves', 'colorful seashells'];
  } else if (setting === 'peaceful countryside') {
    details = ['green fields', 'old barn', 'grazing animals'];
  } else if (setting === 'cozy home') {
    details = ['warm fireplace', 'soft blanket', 'family photos'];
  } else {
    details = ['magical elements', 'colorful scenery', 'interesting objects'];
  }
  
  return {
    raw: `The image appears to show a scene with ${subjects.join(', ')} in a ${setting}. The mood is ${mood} and it contains elements like ${details.join(', ')}. This would make a great ${themes[0]} story for children.`,
    subjects,
    setting,
    themes,
    mood,
    details
  };
}

// Advanced analysis using Hugging Face API (when available)
async function analyzeWithHuggingFace(imageUrl: string, hfApiKey: string) {
  // First, get the image content from the URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
  }
  
  // Convert the image to base64
  const imageBuffer = await imageResponse.arrayBuffer();
  const base64Image = Buffer.from(imageBuffer).toString('base64');
  
  // Call BLIP-2 for image description
  const descriptionResponse = await fetch(
    'https://api-inference.huggingface.co/models/Salesforce/blip2-opt-2.7b', 
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        inputs: {
          image: base64Image,
          text: "Provide a detailed description of this image for a children's bedtime story. Describe characters, setting, mood, and any interesting details."
        },
        parameters: {
          max_new_tokens: 250
        }
      })
    }
  );

  if (!descriptionResponse.ok) {
    throw new Error(`Hugging Face API error: ${descriptionResponse.status} ${descriptionResponse.statusText}`);
  }

  const descriptionData = await descriptionResponse.json();
  const description = descriptionData[0].generated_text || "";
  
  // Use a simpler approach to extract information from the description
  const descriptionLower = description.toLowerCase();
  
  // Extract subjects/characters
  let subjects: string[] = [];
  const characterTerms = ['person', 'people', 'child', 'boy', 'girl', 'man', 'woman', 
                         'dog', 'cat', 'animal', 'bear', 'rabbit'];
                         
  characterTerms.forEach(term => {
    if (descriptionLower.includes(term)) {
      subjects.push(term);
    }
  });
  
  if (subjects.length === 0) {
    subjects = ['child', 'character'];
  }
  
  // Extract setting
  let setting = '';
  const settingPatterns = [
    /in a ([\w\s]+)/, 
    /at the ([\w\s]+)/, 
    /on a ([\w\s]+)/
  ];
  
  for (const pattern of settingPatterns) {
    const match = descriptionLower.match(pattern);
    if (match && match[1]) {
      setting = match[1].trim();
      break;
    }
  }
  
  if (!setting) {
    // Try to detect common settings
    const settingTerms = {
      'forest': ['forest', 'tree', 'wood'],
      'beach': ['beach', 'ocean', 'sea', 'shore'],
      'mountain': ['mountain', 'hill', 'cliff'],
      'city': ['city', 'town', 'street'],
      'home': ['house', 'home', 'room', 'bedroom'],
      'magical world': ['magic', 'fantasy', 'enchant']
    };
    
    for (const [key, terms] of Object.entries(settingTerms)) {
      if (terms.some(term => descriptionLower.includes(term))) {
        setting = key;
        break;
      }
    }
    
    if (!setting) {
      setting = 'beautiful landscape';
    }
  }
  
  // Detect themes
  const themeMapping = {
    adventure: ['adventure', 'explore', 'journey', 'travel'],
    friendship: ['friend', 'together', 'help', 'share'],
    discovery: ['discover', 'find', 'learn', 'curious'],
    fantasy: ['magic', 'fantasy', 'fairy', 'enchant', 'mythical'],
    family: ['family', 'parent', 'mother', 'father', 'sibling'],
    nature: ['nature', 'animal', 'plant', 'forest', 'outdoor'],
    courage: ['brave', 'courage', 'hero', 'challenge']
  };
  
  let themes = [];
  for (const [theme, keywords] of Object.entries(themeMapping)) {
    if (keywords.some(word => descriptionLower.includes(word))) {
      themes.push(theme);
    }
  }
  
  if (themes.length === 0) {
    themes = ['adventure', 'discovery', 'friendship'];
  } else if (themes.length > 3) {
    themes = themes.slice(0, 3);
  }
  
  // Detect mood
  const moodMapping = {
    happy: ['happy', 'joy', 'cheerful', 'smile'],
    peaceful: ['peaceful', 'calm', 'quiet', 'serene', 'tranquil'],
    exciting: ['exciting', 'adventure', 'action', 'thrill'],
    mysterious: ['mysterious', 'wonder', 'curious', 'unknown'],
    playful: ['playful', 'fun', 'play', 'game', 'laugh']
  };
  
  let mood = '';
  for (const [m, keywords] of Object.entries(moodMapping)) {
    if (keywords.some(word => descriptionLower.includes(word))) {
      mood = m;
      break;
    }
  }
  
  if (!mood) {
    mood = 'cheerful';
  }
  
  // Extract details by finding nouns that aren't subjects or setting
  let details: string[] = [];
  const detailTerms = ['tree', 'flower', 'sun', 'moon', 'star', 'water', 'river', 'book',
                       'toy', 'ball', 'cloud', 'rainbow', 'door', 'window', 'light'];
                       
  detailTerms.forEach(term => {
    if (descriptionLower.includes(term) && !subjects.includes(term) && setting !== term) {
      details.push(term);
    }
  });
  
  if (details.length === 0) {
    if (setting === 'forest') {
      details = ['tall trees', 'sparkling stream', 'colorful flowers'];
    } else if (setting === 'beach') {
      details = ['golden sand', 'gentle waves', 'seashells'];
    } else if (setting === 'home') {
      details = ['cozy blanket', 'warm light', 'favorite toys'];
    } else {
      details = ['interesting objects', 'beautiful scenery', 'special elements'];
    }
  }
  
  return {
    raw: description,
    subjects,
    setting,
    themes,
    mood,
    details
  };
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const formData = await req.formData();
    const images = formData.getAll('images') as File[];

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' }, 
        { status: 400 }
      );
    }

    // Process each image (max 5 to limit API usage)
    const imagePromises = images.slice(0, 5).map(async (image, index) => {
      // Convert file to base64
      const buffer = Buffer.from(await image.arrayBuffer());
      const base64Image = `data:${image.type};base64,${buffer.toString('base64')}`;
      
      // Upload to Cloudinary for storage
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: 'story-app-analysis',
        // Still use auto_tagging as fallback
        auto_tagging: 0.6,
      });
      
      // Get the uploaded image URL and tags from Cloudinary
      const imageUrl = uploadResult.secure_url;
      const cloudinaryTags = uploadResult.tags || [];
      
      // Use DeepSeek Vision API to analyze the image
      const deepseekAnalysis = await analyzeImageWithDeepSeek(imageUrl);
      
      // Return combined analysis results
      return {
        filename: image.name,
        publicId: uploadResult.public_id,
        url: imageUrl,
        analysis: {
          // Include both Cloudinary tags and DeepSeek analysis
          tags: cloudinaryTags,
          deepseek: deepseekAnalysis,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          resource_type: uploadResult.resource_type
        }
      };
    });

    // Wait for all image uploads and analysis to complete
    const analysisResults = await Promise.all(imagePromises);

    // Generate suggestions based on enhanced analysis (now using DeepSeek data)
    const suggestions = generateSuggestionsFromDeepSeek(analysisResults);

    // Return analysis results and suggestions
    return NextResponse.json({
      success: true,
      results: analysisResults,
      suggestions
    });
  } catch (error) {
    console.error('Error analyzing images:', error);
    return NextResponse.json(
      { error: 'Failed to analyze images' }, 
      { status: 500 }
    );
  }
}

// Function for generating suggestions using DeepSeek analysis
function generateSuggestionsFromDeepSeek(analysisResults: any[]) {
  // Extract all DeepSeek analysis data
  const deepseekAnalyses = analysisResults
    .map(result => result.analysis.deepseek)
    .filter(Boolean);
  
  // If no DeepSeek analysis available, fall back to the original method
  if (deepseekAnalyses.length === 0) {
    return generateSuggestions(analysisResults);
  }
  
  // Extract all themes from DeepSeek analyses and count frequencies
  const allThemes: string[] = [];
  deepseekAnalyses.forEach(analysis => {
    if (analysis.themes && Array.isArray(analysis.themes)) {
      allThemes.push(...analysis.themes);
    }
  });
  
  // Theme mapping to our supported themes
  const themeMapping = {
    adventure: ['adventure', 'exploration', 'journey', 'discovery', 'travel', 'quest'],
    fantasy: ['fantasy', 'magic', 'fairy tale', 'mythical', 'enchanted', 'mystical', 'wonderland'],
    bedtime: ['bedtime', 'night', 'sleep', 'dreams', 'relaxing', 'calming', 'twilight', 'evening'],
    educational: ['educational', 'learning', 'science', 'nature', 'animals', 'facts', 'school', 'knowledge'],
  };
  
  // Score each theme based on DeepSeek analysis
  const themeScores: Record<string, number> = {
    adventure: 0,
    fantasy: 0,
    bedtime: 0,
    educational: 0,
  };
  
  // Process themes and subjects from DeepSeek analyses
  allThemes.forEach(theme => {
    const themeLower = theme.toLowerCase();
    
    Object.entries(themeMapping).forEach(([mappedTheme, keywords]) => {
      if (keywords.some(keyword => themeLower.includes(keyword))) {
        themeScores[mappedTheme] += 1;
      }
    });
  });
  
  // Extract and process moods to influence theme
  deepseekAnalyses.forEach(analysis => {
    if (analysis.mood) {
      const mood = analysis.mood.toLowerCase();
      
      if (mood.includes('adventure') || mood.includes('exciting') || mood.includes('dynamic')) {
        themeScores.adventure += 0.5;
      }
      
      if (mood.includes('magical') || mood.includes('wonder') || mood.includes('fantasy')) {
        themeScores.fantasy += 0.5;
      }
      
      if (mood.includes('calm') || mood.includes('peaceful') || mood.includes('serene') || mood.includes('cozy')) {
        themeScores.bedtime += 0.5;
      }
      
      if (mood.includes('curious') || mood.includes('informative') || mood.includes('learning')) {
        themeScores.educational += 0.5;
      }
    }
  });
  
  // Find best matching theme
  const bestTheme = Object.entries(themeScores)
    .sort((a, b) => b[1] - a[1])[0];
  
  const suggestedTheme = bestTheme[0];
  const themeConfidence = Math.min(0.9, (bestTheme[1] / 
    (Object.values(themeScores).reduce((sum, score) => sum + score, 0) || 1)) + 0.2);
  
  // Duration suggestion based on complexity of content
  let suggestedDuration = 'medium';
  let durationConfidence = 0.7;
  
  // If multiple images with rich content, suggest longer duration
  if (analysisResults.length >= 4 || 
      deepseekAnalyses.some(analysis => 
        (analysis.details && analysis.details.length > 3) || 
        (analysis.subjects && analysis.subjects.length > 3))) {
    suggestedDuration = 'long';
    durationConfidence = 0.8;
  } 
  // For simple content, suggest shorter duration
  else if (analysisResults.length <= 2 && 
           deepseekAnalyses.every(analysis => 
             (!analysis.details || analysis.details.length <= 2) && 
             (!analysis.subjects || analysis.subjects.length <= 2))) {
    suggestedDuration = 'short';
    durationConfidence = 0.8;
  }
  
  // Extract character suggestions from DeepSeek subjects
  const potentialCharacters: { name: string, description: string }[] = [];
  
  deepseekAnalyses.forEach(analysis => {
    if (analysis.subjects && Array.isArray(analysis.subjects)) {
      analysis.subjects.forEach((subject: any) => {
        if (typeof subject === 'string') {
          // Filter out common non-character objects
          const nonCharacterKeywords = ['sky', 'sun', 'building', 'tree', 'house', 'car', 'road', 'wall'];
          if (!nonCharacterKeywords.some(keyword => subject.toLowerCase().includes(keyword))) {
            // Format the character name and description
            let name = subject.split(' ')[0]; // Take first word
            name = name.charAt(0).toUpperCase() + name.slice(1);
            
            // Create a more detailed description
            let description = `A ${subject.toLowerCase()} from the image`;
            
            // Check if this character already exists
            if (!potentialCharacters.some(char => char.name.toLowerCase() === name.toLowerCase())) {
              potentialCharacters.push({ name, description });
            }
          }
        }
      });
    }
  });
  
  // Generate character suggestions with confidence
  const characterSuggestions = potentialCharacters
    .slice(0, 3) // Limit to 3 characters
    .map(char => ({
      name: char.name,
      description: char.description,
      confidence: 0.8
    }));
  
  // If no characters detected, suggest a default
  if (characterSuggestions.length === 0) {
    // Extract setting to create a potential character
    const settings = deepseekAnalyses
      .map(analysis => analysis.setting)
      .filter(Boolean);
    
    if (settings.length > 0 && settings[0]) {
      const setting = settings[0];
      characterSuggestions.push({
        name: 'Explorer',
        description: `A character exploring ${setting}`,
        confidence: 0.6
      });
    } else {
      characterSuggestions.push({
        name: 'Main Character',
        description: 'The protagonist of your story',
        confidence: 0.5
      });
    }
  }
  
  return {
    theme: {
      suggestion: suggestedTheme,
      confidence: themeConfidence,
      alternatives: Object.entries(themeScores)
        .filter(([theme]) => theme !== suggestedTheme)
        .map(([theme, score]) => ({ 
          theme, 
          confidence: Math.min(0.9, score / (Object.values(themeScores).reduce((sum, score) => sum + score, 0) || 1) + 0.1) 
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 2)
    },
    duration: {
      suggestion: suggestedDuration,
      confidence: durationConfidence
    },
    characters: characterSuggestions
  };
}

// Original function as fallback
function generateSuggestions(analysisResults: any[]) {
  // Extract all tags from the images
  const allTags = analysisResults.flatMap(result => result.analysis.tags || []);
  
  // Frequency map for tags
  const tagFrequency: Record<string, number> = {};
  allTags.forEach(tag => {
    tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
  });
  
  // Sort tags by frequency
  const sortedTags = Object.entries(tagFrequency)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
  
  // Theme suggestion based on tags and categories
  const themeKeywords = {
    adventure: ['outdoors', 'travel', 'nature', 'mountain', 'forest', 'explore', 'hiking', 'adventure'],
    fantasy: ['fantasy', 'magic', 'fairy tale', 'castle', 'dragon', 'unicorn', 'mythical'],
    bedtime: ['night', 'sleep', 'bed', 'dream', 'moon', 'stars', 'evening', 'bedroom'],
    educational: ['school', 'learn', 'book', 'study', 'classroom', 'education', 'science', 'math'],
  };

  // Score each theme
  const themeScores: Record<string, number> = {
    adventure: 0,
    fantasy: 0,
    bedtime: 0,
    educational: 0,
  };

  // Check tags against theme keywords
  sortedTags.forEach(item => {
    const itemLower = item.toLowerCase();
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => itemLower.includes(keyword))) {
        themeScores[theme] += 1;
      }
    });
  });

  // Find best matching theme
  const bestTheme = Object.entries(themeScores)
    .sort((a, b) => b[1] - a[1])[0];
  
  const suggestedTheme = bestTheme[0];
  const themeConfidence = bestTheme[1] / 
    (Object.values(themeScores).reduce((sum, score) => sum + score, 0) || 1);

  // Duration suggestion based on number of images and content
  const hasComplexContent = sortedTags.some(tag => 
    ['landscape', 'history', 'adventure', 'journey', 'story'].includes(tag)
  );
  
  let suggestedDuration = 'medium';
  if (analysisResults.length >= 4 || hasComplexContent) {
    suggestedDuration = 'long';
  } else if (analysisResults.length <= 2 && !hasComplexContent) {
    suggestedDuration = 'short';
  }

  // Character suggestions based on tags
  const characterTags = ['person', 'people', 'child', 'boy', 'girl', 'man', 'woman',
    'pet', 'dog', 'cat', 'animal', 'family', 'friend', 'baby'];
  
  const potentialCharacters = sortedTags
    .filter(tag => characterTags.some(charTag => tag.toLowerCase().includes(charTag)))
    .slice(0, 3);
  
  // Generate character suggestions
  const characterSuggestions = potentialCharacters.map(tag => {
    let name = tag.charAt(0).toUpperCase() + tag.slice(1);
    let description = `A ${tag.toLowerCase()} in your story`;
    
    // Make more specific character descriptions
    if (tag.toLowerCase().includes('child') || 
        tag.toLowerCase().includes('boy') || 
        tag.toLowerCase().includes('girl')) {
      name = `Child`;
      description = `A young character in your story`;
    } else if (tag.toLowerCase().includes('pet') || 
               tag.toLowerCase().includes('dog') || 
               tag.toLowerCase().includes('cat')) {
      name = tag.charAt(0).toUpperCase() + tag.slice(1);
      description = `A pet companion in your story`;
    }
    
    return {
      name,
      description,
      confidence: 0.7
    };
  });
  
  // If no characters detected, suggest a default
  if (characterSuggestions.length === 0) {
    characterSuggestions.push({
      name: 'Main Character',
      description: 'The protagonist of your story',
      confidence: 0.5
    });
  }

  return {
    theme: {
      suggestion: suggestedTheme,
      confidence: themeConfidence,
      alternatives: Object.entries(themeScores)
        .filter(([theme]) => theme !== suggestedTheme)
        .map(([theme, score]) => ({ 
          theme, 
          confidence: score / (Object.values(themeScores).reduce((sum, score) => sum + score, 0) || 1) 
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 2)
    },
    duration: {
      suggestion: suggestedDuration,
      confidence: 0.7
    },
    characters: characterSuggestions
  };
}