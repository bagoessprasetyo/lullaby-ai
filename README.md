# Lullaby.ai

Lullaby.ai is an application that generates personalized bedtime stories using AI technology. Upload family photos, customize story settings, and generate engaging narrated stories for your children.

## AI Integrations

The application integrates three powerful AI services to create a complete story generation pipeline:

### 1. BLIP-2 for Image Analysis (via Hugging Face)

- **Image Analysis**: Photos are analyzed to identify subjects, scenes, mood, and story elements
- **Theme Detection**: Automatically suggests appropriate story themes based on image content
- **Character Identification**: Detects potential characters from the uploaded images
- **Detail Extraction**: Identifies interesting details that can be incorporated into stories

### 2. Mistral-7B for Story Generation (via Hugging Face)

- **AI-Powered Storytelling**: Generates creative and engaging children's stories based on user preferences
- **Context-Aware Content**: Incorporates elements from uploaded images into story narratives
- **Customizable Output**: Adjusts story length, theme, and characters based on user input
- **Structured Format**: Returns well-formatted stories with appropriate titles and narrative flow

### 3. ElevenLabs API for Voice Synthesis

- **High-Quality TTS**: Converts generated stories into natural-sounding audio narration
- **Voice Selection**: Offers multiple voice options (male, female, child, storyteller)
- **Custom Voice Parameters**: Configurable settings for stability and similarity boost
- **Audio Storage**: Generated audio is stored in Cloudinary for efficient delivery

### Complete Workflow:
1. **Image Analysis**: 
   - Upload images to Cloudinary for storage
   - Send the Cloudinary URL to DeepSeek Vision API for detailed analysis
   - Process the analysis to create theme, duration, and character suggestions

2. **Story Generation**:
   - When the user finalizes their choices, send the parameters to DeepSeek LLM
   - Generate a customized story incorporating all the elements
   - Store the story in the database

3. **Audio Narration**:
   - Send the story text to ElevenLabs API with selected voice parameters
   - Process the audio response and upload to Cloudinary
   - Update the story record with the audio URL and duration

### Environment Variables Required:
```
# AI Services
HUGGINGFACE_API_KEY=your_huggingface_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key

# Cloudinary for Image and Audio Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Home UI Upgrade Guide

This guide provides instructions for upgrading the Home UI of our Lullaby.ai application. The goal is to enhance the user experience, improve visual appeal, and better showcase our core features.

## Current Structure

Our home page (`app/page.tsx`) currently includes:
- Hero section with a title and highlight
- Feature grid using BentoGrid component
- Pricing section
- Footer

## Planned Improvements

### 1. Enhanced Hero Section

- **Add an animated illustration** of a parent reading to a child or a visual representation of photos transforming into stories
- **Improve the hero text** to better communicate value proposition
- **Add a prominent CTA button** with "Try it now" or "Create your first story"
- **Include a short demo video** showing the app in action

### 2. How It Works Section

Add a new section after the hero that explains the process:
1. Upload family photos
2. Customize your story settings (characters, theme, language)
3. Generate a personalized bedtime story with AI
4. Listen to the narrated story with background music

Each step should have a simple illustration and brief description.

### 3. Feature Showcase Improvements

Enhance the current BentoGrid component:
- Add actual screenshots or illustrations for each feature
- Consider making some cards interactive with hover animations
- Update the feature descriptions to be more benefit-focused

### 4. Testimonials Section

Add a new testimonials section with:
- Quotes from parents about how Lullaby.ai has improved bedtime routines
- Star ratings
- Optional profile images (can be placeholder illustrations if needed)

### 5. Responsive Improvements

- Ensure proper spacing on mobile devices
- Consider a different layout for the feature grid on smaller screens
- Make sure CTAs are easily tappable on mobile

### 6. Visual Design Enhancements

- Add subtle background patterns or gradients
- Consider a "night sky" theme with stars or moon elements
- Add micro-animations for interactive elements
- Ensure consistent dark mode styling

## Implementation Guidelines

### Base Components to Modify

1. `app/page.tsx` - Main page component
2. `components/ui/hero-highlight.tsx` - Hero section
3. `components/ui/bento-grid.tsx` - Feature grid
4. `components/pricing/pricing-section.tsx` - Pricing section

### New Components to Create

1. `components/home/how-it-works.tsx` - Process explanation section
2. `components/home/testimonials.tsx` - User testimonials
3. `components/ui/animated-illustration.tsx` - For the hero section

### Design Assets Needed

- Illustrations for each step of the process
- Icons for feature highlights
- Background patterns/elements
- Demo video of the app in action

## Next Steps

1. Create mockups for the new sections
2. Implement the hero section updates
3. Build the "How It Works" component
4. Update the feature grid
5. Add testimonials section
6. Final responsive testing and adjustments

## Resources

- Use the existing color scheme from our theme configuration
- Utilize Framer Motion for animations (already imported)
- Consider using Lucide icons for consistency with the rest of the UI
- Reference our component library for UI patterns

## Design Inspiration

- [Storybook](https://storybook.js.org/) - For component documentation style
- [Midjourney](https://www.midjourney.com/) - For AI creativity presentation
- [Headspace](https://www.headspace.com/) - For calming, bedtime-appropriate UI

Remember to maintain our brand identity while enhancing the visual appeal and user experience of the home page.