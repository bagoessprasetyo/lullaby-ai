// lib/api/apiService.ts
import { StoryFormData } from "@/app/dashboard/create/page";
import { Session } from "next-auth";

// Use relative URLs for API endpoints since we're hosting them in the same app
const API_URL = '';

/**
 * Base API client with common functionality
 */
class ApiClient {
  public token: string;

  constructor(session: Session | null) {
    this.token = session?.user?.id || '';
  }

  /**
   * Make an authenticated API request
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_URL}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`,
      ...options.headers
    };

    const config = {
      ...options,
      headers
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || 'API request failed');
    }

    return await response.json();
  }

  /**
   * Convert a file to base64
   */
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  }
}

/**
 * Story API Service
 */
export class StoryService extends ApiClient {
  private pendingRequests = new Map<string, AbortController>();
  /**
   * Generate a story based on form data
   */
  async generateStory(formData: StoryFormData): Promise<any> {
    try {
      // Convert images to base64
      const imagePromises = formData.images.map(file => this.fileToBase64(file));
      const images = await Promise.all(imagePromises);

      // Convert characters to API format
      const characters = formData.characters.map(character => ({
        name: character.name,
        description: character.description,
      }));

      // Prepare request payload
      const payload = {
        images,
        characters,
        theme: formData.theme,
        duration: formData.duration,
        language: formData.language,
        backgroundMusic: formData.backgroundMusic,
        voice: formData.voice,
        userId: this.token,
      };

      // Make API request
      return await this.request('/api/stories/generate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.error('Error generating story:', error);
      throw error;
    }
  }

  /**
   * Generate a story asynchronously with webhook notification
   */
  async generateStoryAsync(formData: StoryFormData, callbackUrl?: string) {
    const userId = this.token || 'anonymous';

    if (this.pendingRequests.has(userId)) {
      this.pendingRequests.get(userId)?.abort();
    }

    const controller = new AbortController();
    this.pendingRequests.set(userId, controller);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Convert images to base64
      const imagePromises = formData.images.map(file => this.fileToBase64(file));
      const images = await Promise.all(imagePromises);

      // Convert characters to API format
      const characters = formData.characters.map(character => ({
        name: character.name,
        description: character.description,
      }));

      // Prepare request payload
      const payload = {
        images,
        characters,
        theme: formData.theme,
        duration: formData.duration,
        language: formData.language,
        backgroundMusic: formData.backgroundMusic,
        voice: formData.voice,
        callback_url: callbackUrl,
      };
      console.log('payload ', JSON.stringify(payload))
      // Make API request
      return await this.request('/api/stories/generate/webhook', {
        method: 'POST',
        body: JSON.stringify(payload),
        signal: controller.signal
      });
    } finally {
      this.pendingRequests.delete(userId);
    }
  }

  /**
   * Get the status of an asynchronous story generation
   */
  async getGenerationStatus(requestId: string): Promise<any> {
    try {
      return await this.request(`/api/stories/status/${requestId}`);
    } catch (error) {
      console.error('Error getting generation status:', error);
      throw error;
    }
  }

  /**
   * Get a story by ID
   */
  async getStory(storyId: string): Promise<any> {
    try {
      return await this.request(`/api/stories/${storyId}`);
    } catch (error) {
      console.error('Error getting story:', error);
      throw error;
    }
  }

  /**
   * Get all stories for the current user
   */
  async getStories(options: {
    limit?: number;
    offset?: number;
    theme?: string;
    language?: string;
    isFavorite?: boolean;
    search?: string;
    orderBy?: string;
  } = {}): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.offset) queryParams.append('offset', options.offset.toString());
      if (options.theme) queryParams.append('theme', options.theme);
      if (options.language) queryParams.append('language', options.language);
      if (options.isFavorite !== undefined) queryParams.append('is_favorite', options.isFavorite.toString());
      if (options.search) queryParams.append('search', options.search);
      if (options.orderBy) queryParams.append('order_by', options.orderBy);
      
      const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
      
      return await this.request(`/api/stories${query}`);
    } catch (error) {
      console.error('Error getting stories:', error);
      throw error;
    }
  }

  /**
   * Toggle favorite status for a story
   */
  async toggleFavorite(storyId: string, isFavorite: boolean): Promise<any> {
    try {
      return await this.request(`/api/stories/${storyId}/favorite`, {
        method: 'POST',
        body: JSON.stringify({ isFavorite }),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  /**
   * Record play history for a story
   */
  async recordPlay(storyId: string, completed: boolean = false, progressPercentage: number = 0): Promise<any> {
    try {
      return await this.request(`/api/stories/${storyId}/played`, {
        method: 'POST',
        body: JSON.stringify({ completed, progressPercentage }),
      });
    } catch (error) {
      console.error('Error recording play:', error);
      throw error;
    }
  }

  /**
   * Delete a story
   */
  async deleteStory(storyId: string): Promise<any> {
    try {
      return await this.request(`/api/stories/${storyId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

/**
 * User API Service
 */
export class UserService extends ApiClient {
  /**
   * Get subscription features for the current user
   */
  async getSubscriptionFeatures(): Promise<any> {
    try {
      return await this.request('/api/user/subscription');
    } catch (error) {
      console.error('Error getting subscription features:', error);
      throw error;
    }
  }

  /**
   * Get credits for the current user
   */
  async getCredits(): Promise<any> {
    try {
      return await this.request('/api/user/credits');
    } catch (error) {
      console.error('Error getting user credits:', error);
      throw error;
    }
  }
}

/**
 * Create API services with the current session
 */
export function createApiServices(session: Session | null) {
    
  return {
    story: new StoryService(session),
    user: new UserService(session),
  };
}