// lib/api/storyGeneration.ts
import { StoryFormData } from "@/app/dashboard/create/page";
import { Session } from "next-auth";

export interface GenerateStoryResponse {
  success: boolean;
  storyId?: string;
  title?: string;
  textContent?: string;
  audioUrl?: string;
  duration?: number;
  error?: string;
}

/**
 * Generate a story based on the form data
 */
export async function generateStory(
  formData: StoryFormData,
  session: Session
): Promise<GenerateStoryResponse> {
  try {
    // Convert images to base64 or get URLs
    const imagePromises = formData.images.map((file) =>
      fileToBase64(file)
    );
    const images = await Promise.all(imagePromises);

    // Convert characters to the format expected by the API
    const characters = formData.characters.map((character) => ({
      name: character.name,
      description: character.description,
    }));

    // Prepare the request payload
    const payload = {
      images,
      characters,
      theme: formData.theme,
      duration: formData.duration,
      language: formData.language,
      backgroundMusic: formData.backgroundMusic,
      voice: formData.voice,
      userId: session.user.id,
    };

    // Call the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stories/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.user.id}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to generate story");
    }

    return await response.json();
  } catch (error) {
    console.error("Error generating story:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Convert a file to base64
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}