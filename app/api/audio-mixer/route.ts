import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth.config';
import { getBackgroundMusicById } from '@/lib/services/background-music-service';
import { v4 as uuidv4 } from 'uuid';

// Import required Node.js libraries
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pipeline } from 'stream/promises';

// Helper function to download a file from a URL
async function downloadFile(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
  }
  
  const fileStream = fs.createWriteStream(outputPath);
  await pipeline(response.body as any, fileStream);
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Unauthorized' }), 
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get request body
    const body = await req.json();
    const { storyAudioUrl, backgroundMusicId, volumeRatio = 0.3 } = body;

    if (!storyAudioUrl) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Story audio URL is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!backgroundMusicId) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Background music ID is required' }), 
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get background music details from database
    const backgroundMusic = await getBackgroundMusicById(backgroundMusicId);
    if (!backgroundMusic) {
      return new NextResponse(
        JSON.stringify({ success: false, error: 'Background music not found' }), 
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build background music URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
    }
    
    const backgroundMusicUrl = `${supabaseUrl}/storage/v1/object/public/background-music/${backgroundMusic.storage_path}`;

    // Create temporary directory for processing
    const tempDir = path.join(os.tmpdir(), `audio-mix-${uuidv4()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Define file paths
    const storyAudioPath = path.join(tempDir, 'story.mp3');
    const backgroundMusicPath = path.join(tempDir, 'background.mp3');
    const outputPath = path.join(tempDir, 'mixed.mp3');

    // Download audio files
    await downloadFile(storyAudioUrl, storyAudioPath);
    await downloadFile(backgroundMusicUrl, backgroundMusicPath);

    // Use ffmpeg to mix audio files
    // This mixes the audio with background music at a lower volume and loops it if needed
    return new Promise<Response>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i', storyAudioPath,
        '-i', backgroundMusicPath,
        '-filter_complex', `[1:a]volume=${volumeRatio}[bgm];[0:a][bgm]amix=inputs=2:duration=longest[out]`,
        '-map', '[out]',
        '-c:a', 'libmp3lame', 
        '-q:a', '4',
        outputPath
      ]);

      let stderr = '';
      
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', async (code) => {
        if (code !== 0) {
          console.error('FFmpeg stderr:', stderr);
          fs.rmSync(tempDir, { recursive: true, force: true });
          resolve(new NextResponse(
            JSON.stringify({ success: false, error: 'Failed to mix audio' }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ));
          return;
        }

        try {
          // Read the mixed audio file
          const mixedAudio = fs.readFileSync(outputPath);
          
          // Clean up temporary files
          fs.rmSync(tempDir, { recursive: true, force: true });

          // Upload mixed audio to Cloudinary
          const cloudinary = require('cloudinary').v2;
          
          // Configure Cloudinary
          cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
          });

          // Convert buffer to data URI for Cloudinary upload
          const mixedAudioBase64 = mixedAudio.toString('base64');
          const dataURI = `data:audio/mp3;base64,${mixedAudioBase64}`;

          // Upload to Cloudinary
          const result = await new Promise((resolveUpload, rejectUpload) => {
            cloudinary.uploader.upload(
              dataURI, 
              { 
                resource_type: 'auto',
                folder: 'stories/mixed-audio',
                format: 'mp3'
              },
              (error: any, result: any) => {
                if (error) rejectUpload(error);
                else resolveUpload(result);
              }
            );
          });

          // Return success response with the mixed audio URL
          resolve(new NextResponse(
            JSON.stringify({ 
              success: true, 
              mixedAudioUrl: (result as { secure_url: string }).secure_url,
              duration: (result as { duration: number }).duration // Duration in seconds
            }), 
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          ));
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          return resolve(new NextResponse(
            JSON.stringify({ 
              success: false, 
              error: 'Failed to upload mixed audio',
              details: uploadError instanceof Error ? uploadError.message : 'Unknown error' 
            }), 
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          ));
        }
      });
    });
  } catch (error) {
    console.error('Error mixing audio:', error);
    return new NextResponse(
      JSON.stringify({ 
        success: false, 
        error: 'Failed to mix audio', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
