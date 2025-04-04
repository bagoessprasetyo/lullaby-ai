import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
export const configureCloudinary = () => {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
    api_key: process.env.CLOUDINARY_API_KEY || '',
    api_secret: process.env.CLOUDINARY_API_SECRET || '',
    secure: true
  });
};

// Upload base64 image to Cloudinary
export async function uploadBase64Image(base64Image: string) {
  // Configure Cloudinary if not already configured
  configureCloudinary();
  
  try {
    // Upload the image
    const result = await cloudinary.uploader.upload(base64Image, {
      resource_type: 'image',
      folder: 'story-app-images',
      format: 'jpg',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height
    };
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

// Upload audio to Cloudinary
export async function uploadAudioToCloudinary(audioDataUrl: string, storyId: string) {
  configureCloudinary();
  
  try {
    // Validate the audio data URL
    if (!audioDataUrl) {
      throw new Error('No audio data provided');
    }
    
    if (!audioDataUrl.startsWith('data:audio/')) {
      console.error('Invalid audio data URL format');
      throw new Error('Invalid audio data URL format');
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(audioDataUrl, {
      resource_type: 'auto',
      folder: 'story-app-audio',
      public_id: `${storyId}-audio`,
      overwrite: true,
      format: 'mp3',
      audio: {
        codec: 'mp3'
      }
    });
    
    return {
      secure_url: result.secure_url,
      duration: result.duration || 30,
      format: result.format || 'mp3',
      bytes: result.bytes || 0
    };
  } catch (error) {
    console.error('Error uploading audio to Cloudinary:', error);
    throw error;
  }
}

// Generate audio with ElevenLabs
export async function generateStoryAudio(text: string, voiceId = 'default') {
  // This is a placeholder - you should implement this in your elevenlabs.ts file
  // This is just here to satisfy the import in your webhook file
  throw new Error('Not implemented - use the actual implementation from elevenlabs.ts');
}