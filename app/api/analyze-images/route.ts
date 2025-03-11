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
      
      // Upload to Cloudinary with analysis - using simpler parameters
      const uploadResult = await cloudinary.uploader.upload(base64Image, {
        folder: 'story-app-analysis',
        // These parameters enable different types of AI analysis
        auto_tagging: 0.6, // Confidence threshold for automatic tagging
      });
      
      // Get the tags from auto-tagging
      const tags = uploadResult.tags || [];
      
      // Return analysis results with simpler structure
      return {
        filename: image.name,
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        analysis: {
          tags,
          width: uploadResult.width,
          height: uploadResult.height,
          format: uploadResult.format,
          resource_type: uploadResult.resource_type
        }
      };
    });

    // Wait for all image uploads and analysis to complete
    const analysisResults = await Promise.all(imagePromises);

    // Generate suggestions based on analysis
    const suggestions = generateSuggestions(analysisResults);

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

// Function to generate story suggestions based on image analysis
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