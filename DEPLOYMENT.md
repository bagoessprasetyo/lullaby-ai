# Deployment Guide for Lullaby.ai

This guide will help you deploy Lullaby.ai on Vercel.

## Prerequisites

1. A [Vercel](https://vercel.com) account
2. A [Supabase](https://supabase.com) project
3. [Google OAuth](https://console.cloud.google.com) credentials
4. [Lemon Squeezy](https://lemonsqueezy.com) account for payments
5. [Cloudinary](https://cloudinary.com) account for image and audio storage
6. AI service accounts:
   - [ElevenLabs](https://elevenlabs.io) for voice synthesis
   - [Hugging Face](https://huggingface.co) for AI image analysis
   - [DeepSeek](https://deepseek.ai) for story generation
   - [OpenAI](https://openai.com) for additional capabilities

## Deployment Steps

### 1. Prepare Environment Variables

All required environment variables are listed in `.env.sample`. Make sure you have values for all of these.

### 2. Deploy to Vercel

1. Push your code to a GitHub repository
2. Log in to your Vercel account
3. Create a new project by importing your GitHub repository
4. Configure the build settings:
   - Framework Preset: Next.js
   - Build Command: `npm run vercel-build` (already set in package.json)
   - Output Directory: .next
5. Add all environment variables from your `.env.sample` file to the project settings
6. Deploy!

### 3. Set Up OAuth Redirect URIs

After deployment:

1. Go to your Google Cloud Console
2. Update the authorized redirect URIs to include your Vercel domain:
   - `https://your-vercel-domain.com/api/auth/callback/google`

### 4. Update Supabase Settings

1. Go to your Supabase project
2. Update allowed URLs in Authentication > URL Configuration:
   - Site URL: `https://your-vercel-domain.com`
   - Redirect URLs: Add `https://your-vercel-domain.com/api/auth/callback/supabase`

### 5. Update LemonSqueezy Webhook Endpoints

1. Go to your LemonSqueezy dashboard
2. Update webhooks to point to: `https://your-vercel-domain.com/api/webhooks/lemonsqueezy`

## Monitoring and Maintenance

### Logs and Debugging

- Use Vercel's log viewer to monitor application logs
- Set up error monitoring with a service like Sentry (optional)

### Database Maintenance

- Regularly check your Supabase database performance
- Set up backups for your database

### SSL and Security

- Vercel handles SSL certificates automatically
- Ensure all environment variables are properly set and secure

## Scaling Considerations

- Upgrade your Supabase plan if you need more database resources
- Upgrade your Vercel plan for more serverless function execution time
- Consider using edge functions for improved global performance

## Troubleshooting

If you encounter issues:

1. Check Vercel build logs for errors
2. Verify all environment variables are correctly set
3. Ensure all third-party services (Supabase, Google OAuth, etc.) are properly configured
4. Verify your Supabase database tables and schema match the expected structure

For additional help, refer to the [Next.js deployment documentation](https://nextjs.org/docs/deployment) or [Vercel documentation](https://vercel.com/docs).