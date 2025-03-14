// lib/utils/story-pagination.ts

/**
 * Smart pagination utility for breaking long stories into readable pages
 */

interface PaginationOptions {
    maxWordsPerPage?: number;       // Maximum number of words per page
    maxParagraphsPerPage?: number;  // Maximum number of paragraphs per page
    preserveParagraphs?: boolean;   // Whether to keep paragraphs intact (recommended)
    firstPageWithImage?: boolean;   // Whether to ensure the first page has an image
  }
  
  interface StoryPage {
    id: string;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
  }
  
  /**
   * Divides a story into multiple pages based on content length
   * 
   * @param storyText The full story text content
   * @param images Array of image URLs available for the story
   * @param audioUrl Audio URL for the story
   * @param options Pagination options
   * @returns Array of story pages
   */
  export function paginateStory(
    storyText: string,
    images: string[] = [],
    audioUrl?: string,
    options: PaginationOptions = {}
  ): StoryPage[] {
    // Set default options
    const {
      maxWordsPerPage = 50,
      maxParagraphsPerPage = 2,
      preserveParagraphs = true,
      firstPageWithImage = true
    } = options;
  
    // Handle empty content
    if (!storyText || storyText.trim() === '') {
      return [{
        id: 'page-1',
        text: '',
        imageUrl: images.length > 0 ? images[0] : undefined,
        audioUrl
      }];
    }
  
    // Split text into paragraphs
    const paragraphs = storyText
      .split(/\n\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  
    // If content is short enough, return as a single page
    const wordCount = countWords(storyText);
    if (paragraphs.length <= maxParagraphsPerPage && wordCount <= maxWordsPerPage) {
      return [{
        id: 'page-1',
        text: storyText,
        imageUrl: images.length > 0 ? images[0] : undefined,
        audioUrl
      }];
    }
  
    // Initialize for pagination
    const pages: StoryPage[] = [];
    let currentPage: string[] = [];
    let currentWordCount = 0;
    let currentParagraphCount = 0;
    let pageIndex = 1;
    let imageIndex = 0;
    
    // Smart pagination - special handling for very long stories
    const isVeryLongStory = paragraphs.length > 20 || wordCount > 5000;
    
    // For very long stories, adjust paragraph distribution
    // to ensure the first and last pages aren't too imbalanced
    const targetParagraphsForFirstPage = isVeryLongStory ? 
      Math.min(3, Math.floor(maxParagraphsPerPage * 0.75)) : 
      maxParagraphsPerPage;
    
    // For very long stories, make sure we don't have too many pages
    // with just a single paragraph
    const minParagraphsPerPage = isVeryLongStory ? 2 : 1;
  
    // Process each paragraph for pagination
    paragraphs.forEach((paragraph, index) => {
      const paragraphWordCount = countWords(paragraph);
      const isFirstPage = pages.length === 0 && currentPage.length === 0;
      
      // Target for paragraphs based on which page we're on
      const targetMaxParagraphs = isFirstPage ? 
        targetParagraphsForFirstPage : maxParagraphsPerPage;
      
      // Check if adding this paragraph would exceed limits
      const willExceedWordLimit = currentWordCount + paragraphWordCount > maxWordsPerPage;
      const willExceedParagraphLimit = currentParagraphCount + 1 > targetMaxParagraphs;
      
      // Are we at the end of a section (indicated by a paragraph that starts with "Chapter", "Part", etc.)
      const isPossibleSectionBreak = 
        /^(Chapter|Part|Section|\*\*\*|\*\s\*\s\*|---)/i.test(paragraph) ||
        (paragraph.length < 20 && /^[IVX]+\.|^\d+\./.test(paragraph)); // Roman numerals or numbers
      
      // Create a new page if needed (but only if we've added some content to the current page)
      if (((willExceedWordLimit || willExceedParagraphLimit || isPossibleSectionBreak) && currentPage.length >= minParagraphsPerPage) ||
          (index === paragraphs.length - 1 && currentParagraphCount >= maxParagraphsPerPage)) {
        
        // Create the page
        pages.push({
          id: `page-${pageIndex}`,
          text: currentPage.join('\n\n'),
          imageUrl: getImageForPage(pageIndex, imageIndex, images, firstPageWithImage),
          audioUrl
        });
        
        // Update image index - distribute images intelligently
        if (images.length > 0) {
          // Calculate how often we should include images based on total pages
          const estimatedTotalPages = Math.ceil(wordCount / maxWordsPerPage);
          const imageFrequency = Math.max(1, Math.floor(estimatedTotalPages / images.length));
          
          // Only increment image index every few pages to spread images throughout the story
          if (pageIndex % imageFrequency === 0 && imageIndex < images.length - 1) {
            imageIndex++;
          }
        }
        
        // Reset for next page
        pageIndex++;
        currentPage = [];
        currentWordCount = 0;
        currentParagraphCount = 0;
      }
      
      // Add paragraph to current page
      currentPage.push(paragraph);
      currentWordCount += paragraphWordCount;
      currentParagraphCount++;
      
      // If this is the very last paragraph, make sure to add the page
      if (index === paragraphs.length - 1 && currentPage.length > 0) {
        pages.push({
          id: `page-${pageIndex}`,
          text: currentPage.join('\n\n'),
          imageUrl: getImageForPage(pageIndex, imageIndex, images, firstPageWithImage),
          audioUrl
        });
      }
    });
    
    // Ensure we have at least one page
    if (pages.length === 0) {
      pages.push({
        id: 'page-1',
        text: storyText,
        imageUrl: images.length > 0 ? images[0] : undefined,
        audioUrl
      });
    }
    
    console.log(`[Pagination] Split story into ${pages.length} pages (${wordCount} words, ${paragraphs.length} paragraphs)`);
    
    return pages;
  }
  
  /**
   * Count words in a text string
   */
  function countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }
  
  /**
   * Intelligently assign images to pages
   */
  function getImageForPage(
    pageIndex: number, 
    imageIndex: number, 
    images: string[],
    firstPageWithImage: boolean
  ): string | undefined {
    // No images available
    if (!images || images.length === 0) {
      return undefined;
    }
    
    // First page should have an image if specified
    if (pageIndex === 1 && firstPageWithImage) {
      return images[0];
    }
    
    // Distribute remaining images
    if (imageIndex < images.length) {
      return images[imageIndex];
    }
    
    return undefined;
  }
  
  /**
   * Convert an existing story object to a paginated format
   * 
   * @param story The story object
   * @param options Pagination options
   * @returns The story with properly paginated content
   */
  export function convertStoryToPaginatedFormat(story: any, options: PaginationOptions = {}): any {
    if (!story) return null;
    
    // Extract image URLs from story object
    let imageUrls: string[] = [];
    
    if (story.images && Array.isArray(story.images)) {
      // Sort images by sequence_index if available
      const sortedImages = [...story.images].sort((a, b) => {
        return (a.sequence_index || 0) - (b.sequence_index || 0);
      });
      
      // Extract image URLs
      imageUrls = sortedImages.map(img => img.storage_path || img.url || '').filter(url => url);
    } else if (story.coverImage) {
      imageUrls = [story.coverImage];
    }
    
    // Get story text content
    const storyText = story.text_content || story.textContent || '';
    
    // Get audio URL
    const audioUrl = story.audio_url || story.audioUrl;
    
    // Create paginated content
    const pages = paginateStory(storyText, imageUrls, audioUrl, options);
    
    // Return a copy of the story with added pages
    return {
      ...story,
      pages
    };
  }
  
  /**
   * Utility to estimate reading time for a page or entire story
   * 
   * @param text The text to estimate reading time for
   * @returns Estimated reading time in seconds
   */
  export function estimateReadingTime(text: string): number {
    // Average reading speed (words per minute)
    const wordsPerMinute = 200;
    
    // Count words
    const words = countWords(text);
    
    // Calculate reading time in minutes, then convert to seconds
    const minutes = words / wordsPerMinute;
    return Math.ceil(minutes * 60);
  }