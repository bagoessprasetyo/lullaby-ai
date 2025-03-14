// components/story-creation/image-analyzer.tsx
"use client";

import { useState, useEffect } from "react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  AlertCircle, 
  Brain, 
  Check, 
  X,
  Users, 
  Clock, 
  Zap,
  Lightbulb 
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageAnalyzerProps {
  images: File[];
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  isSubscriber: boolean;
  className?: string;
}

type AnalysisState = 'idle' | 'analyzing' | 'complete' | 'error';
type SuggestionType = 'theme' | 'duration' | 'characters';

interface Suggestion {
  type: SuggestionType;
  value: string;
  description?: string;
  confidence: number;
  accepted?: boolean;
  rejected?: boolean;
}

export function ImageAnalyzer({ 
  images, 
  formData, 
  updateFormData,
  isSubscriber,
  className 
}: ImageAnalyzerProps) {
  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [rawAnalysis, setRawAnalysis] = useState<any[]>([]);
  const [showRawAnalysis, setShowRawAnalysis] = useState(false);
  
  // Automatically start analysis when images change
  useEffect(() => {
    if (images.length > 0) {
      analyzeImages();
    } else {
      setSuggestions([]);
      setAnalysisState('idle');
    }
  }, [images]);
  
  // Function to analyze images using the Vision API endpoint
  const analyzeImages = async () => {
    if (images.length === 0 || analysisState === 'analyzing') {
      return;
    }
    
    try {
      setAnalysisState('analyzing');
      setAnalysisProgress(0);
      setError(null);
      
      // Progress simulation
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);
      
      // Create form data with images
      const formData = new FormData();
      images.forEach(image => {
        formData.append('images', image);
      });
      
      // Call API endpoint
      const response = await fetch('/api/analyze-images', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze images');
      }
      
      // Process results
      const data = await response.json();
      setAnalysisProgress(100);
      
      // Save raw analysis for advanced view
      if (data.results) {
        const deepseekAnalyses = data.results
          .map((result: any) => result.analysis.deepseek)
          .filter(Boolean);
        setRawAnalysis(deepseekAnalyses);
      }
      
      // Convert API suggestions to our format
      const newSuggestions: Suggestion[] = [];
      
      // Theme suggestion
      if (data.suggestions.theme?.suggestion) {
        // Get detailed analysis for better description
        const themeDetails = data.results.map(result => 
          result.analysis.deepseek?.themes || []
        ).flat().filter(Boolean);
        
        const themeDescription = themeDetails.length > 0
          ? `AI detected themes: ${themeDetails.slice(0, 3).join(', ')}`
          : `AI detected elements suggesting a ${data.suggestions.theme.suggestion} theme`;
        
        newSuggestions.push({
          type: 'theme',
          value: data.suggestions.theme.suggestion,
          description: themeDescription,
          confidence: data.suggestions.theme.confidence
        });
      }
      
      // Duration suggestion
      if (data.suggestions.duration?.suggestion) {
        // Get subject counts for better duration explanation
        const subjectCounts = data.results.map(result => 
          (result.analysis.deepseek?.subjects || []).length
        );
        
        const avgSubjects = subjectCounts.length > 0 
          ? subjectCounts.reduce((sum, count) => sum + count, 0) / subjectCounts.length 
          : 0;
        
        let durationReason = `Based on image content, a ${data.suggestions.duration.suggestion} story is recommended`;
        
        if (avgSubjects > 3) {
          durationReason = `Rich content with multiple elements suggests a ${data.suggestions.duration.suggestion} story`;
        } else if (avgSubjects <= 1) {
          durationReason = `Simple scene suggests a ${data.suggestions.duration.suggestion} story`;
        }
        
        newSuggestions.push({
          type: 'duration',
          value: data.suggestions.duration.suggestion,
          description: durationReason,
          confidence: data.suggestions.duration.confidence
        });
      }
      
      // Character suggestions
      data.suggestions.characters?.forEach((char: any) => {
        newSuggestions.push({
          type: 'characters',
          value: char.name,
          description: char.description,
          confidence: char.confidence
        });
      });
      
      setSuggestions(newSuggestions);
      setAnalysisState('complete');
      
    } catch (error) {
      console.error('Error analyzing images:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setAnalysisState('error');
    }
  };
  
  // Accept a suggestion
  const acceptSuggestion = (index: number) => {
    const suggestion = suggestions[index];
    if (!suggestion) return;
    
    // Update form data based on suggestion type
    if (suggestion.type === 'theme') {
      updateFormData('theme', suggestion.value);
    } else if (suggestion.type === 'duration') {
      updateFormData('duration', suggestion.value as 'short' | 'medium' | 'long');
    } else if (suggestion.type === 'characters') {
      // Find an empty character slot or add a new one
      const characters = [...formData.characters];
      const emptyIndex = characters.findIndex(c => !c.name);
      
      if (emptyIndex >= 0) {
        characters[emptyIndex] = {
          name: suggestion.value,
          description: suggestion.description || ''
        };
      } else {
        characters.push({
          name: suggestion.value,
          description: suggestion.description || ''
        });
      }
      
      updateFormData('characters', characters);
    }
    
    // Mark suggestion as accepted
    const updatedSuggestions = [...suggestions];
    updatedSuggestions[index] = { ...suggestion, accepted: true };
    setSuggestions(updatedSuggestions);
  };
  
  // Reject a suggestion
  const rejectSuggestion = (index: number) => {
    const updatedSuggestions = [...suggestions];
    updatedSuggestions[index] = { ...updatedSuggestions[index], rejected: true };
    setSuggestions(updatedSuggestions);
  };
  
  // Get confidence label
  const getConfidenceLabel = (confidence: number) => {
    if (confidence > 0.8) return 'High';
    if (confidence > 0.5) return 'Medium';
    return 'Low';
  };
  
  // Format confidence as percentage
  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };
  
  // If no images, don't render
  if (images.length === 0) {
    return null;
  }
  
  // For non-subscribers, show upgrade prompt
  if (!isSubscriber) {
    return (
      <Card className={cn("p-4 bg-amber-900/20 border-amber-800/50", className)}>
        <div className="flex items-start gap-3">
          <div className="bg-amber-900/40 rounded-full p-2 text-amber-300 shrink-0">
            <Brain className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium text-amber-300 mb-1">Smart Image Analysis</h3>
            <p className="text-amber-200/90 text-sm mb-2">
              Upgrade to Premium to unlock AI-powered suggestions based on your photos:
            </p>
            <ul className="text-xs text-amber-200/80 space-y-1 mb-3">
              <li className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Auto-detection of characters and scenes
              </li>
              <li className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Theme suggestions based on photo content
              </li>
              <li className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Smart story structure recommendations
              </li>
            </ul>
            <Button 
              className="w-full bg-amber-600 hover:bg-amber-700 text-white border-none"
              size="sm"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </Card>
    );
  }
  
  return (
    <div className={cn("space-y-4", className)}>
      {/* Analysis state indicator */}
      {analysisState === 'analyzing' && (
        <Card className="p-4 bg-indigo-900/20 border-indigo-800/50">
          <div className="flex items-center gap-3 mb-3">
            <div className="animate-pulse bg-indigo-900/40 rounded-full p-2 text-indigo-300">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-indigo-300">Analyzing your photos...</h3>
              <p className="text-indigo-200/80 text-sm">
                Our AI is looking for characters, scenes, and story elements
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="w-full h-2 bg-indigo-900/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-indigo-300/70">
              <span>Detecting elements</span>
              <span>{analysisProgress}%</span>
            </div>
          </div>
        </Card>
      )}
      
      {/* Error state */}
      {analysisState === 'error' && error && (
        <Alert variant="destructive" className="bg-red-900/20 border-red-800">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {error}
            <Button 
              variant="link" 
              className="text-red-300 hover:text-red-200 p-0 h-auto ml-2"
              onClick={() => analyzeImages()}
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Suggestions */}
      {analysisState === 'complete' && suggestions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-indigo-300" />
              AI Suggestions
            </h3>
            <Badge className="bg-indigo-900/50 text-indigo-300">
              {suggestions.length} suggestions
            </Badge>
          </div>
          
          {suggestions.map((suggestion, index) => {
            // Skip rejected suggestions
            if (suggestion.rejected) return null;
            
            // Different card styles for different suggestion types
            let icon;
            let color: string;
            
            switch (suggestion.type) {
              case 'theme':
                icon = <Sparkles className="h-4 w-4" />;
                color = 'indigo';
                break;
              case 'duration':
                icon = <Clock className="h-4 w-4" />;
                color = 'blue';
                break;
              case 'characters':
                icon = <Users className="h-4 w-4" />;
                color = 'violet';
                break;
              default:
                icon = <Lightbulb className="h-4 w-4" />;
                color = 'amber';
            }
            
            return (
              <Card 
                key={`${suggestion.type}-${index}`}
                className={cn(
                  "p-3 flex items-start gap-3",
                  suggestion.accepted ? "bg-green-900/20 border-green-800/50" : `bg-${color}-900/20 border-${color}-800/50`
                )}
              >
                <div className={`bg-${color}-900/30 rounded-full p-1.5 text-${color}-400 shrink-0`}>
                  {icon}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="font-medium text-white text-sm">
                      {suggestion.accepted ? 'Applied: ' : ''}
                      {suggestion.value}
                    </div>
                    <Badge 
                      className={`text-xs ${
                        suggestion.confidence > 0.7 
                          ? "bg-green-900/60 text-green-300" 
                          : "bg-amber-900/60 text-amber-300"
                      }`}
                    >
                      {getConfidenceLabel(suggestion.confidence)} ({formatConfidence(suggestion.confidence)})
                    </Badge>
                  </div>
                  
                  {suggestion.description && (
                    <p className="text-gray-400 text-xs truncate">
                      {suggestion.description}
                    </p>
                  )}
                </div>
                
                {!suggestion.accepted && (
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-green-900/30 text-green-300 hover:bg-green-900/50 hover:text-green-200"
                      onClick={() => acceptSuggestion(index)}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-gray-800 text-gray-400 hover:bg-gray-700"
                      onClick={() => rejectSuggestion(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Raw Analysis Display */}
      {analysisState === 'complete' && rawAnalysis.length > 0 && (
        <div className="mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRawAnalysis(!showRawAnalysis)}
            className="text-xs mb-2"
          >
            <Brain className="h-3.5 w-3.5 mr-1.5" />
            {showRawAnalysis ? 'Hide Detailed AI Analysis' : 'Show Detailed AI Analysis'}
          </Button>
          
          {showRawAnalysis && (
            <Card className="p-3 bg-indigo-900/10 border-indigo-800/40 text-sm overflow-auto max-h-80">
              {rawAnalysis.map((analysis, index) => (
                <div key={index} className="mb-3 last:mb-0">
                  <h4 className="text-indigo-300 text-xs uppercase font-medium mb-1">Image {index + 1} Analysis</h4>
                  
                  {/* Setting */}
                  {analysis.setting && (
                    <div className="mb-2">
                      <span className="text-gray-400 text-xs">Setting: </span>
                      <span className="text-white text-xs">{analysis.setting}</span>
                    </div>
                  )}
                  
                  {/* Subjects */}
                  {analysis.subjects && analysis.subjects.length > 0 && (
                    <div className="mb-2">
                      <span className="text-gray-400 text-xs">Subjects: </span>
                      <span className="text-white text-xs">{analysis.subjects.join(', ')}</span>
                    </div>
                  )}
                  
                  {/* Mood */}
                  {analysis.mood && (
                    <div className="mb-2">
                      <span className="text-gray-400 text-xs">Mood: </span>
                      <span className="text-white text-xs">{analysis.mood}</span>
                    </div>
                  )}
                  
                  {/* Details */}
                  {analysis.details && analysis.details.length > 0 && (
                    <div className="mb-2">
                      <span className="text-gray-400 text-xs">Details: </span>
                      <span className="text-white text-xs">{analysis.details.join('; ')}</span>
                    </div>
                  )}
                  
                  {/* Raw Content if not processed correctly */}
                  {analysis.raw && !analysis.themes && (
                    <div className="text-xs text-gray-300 mt-2 whitespace-pre-wrap">
                      {analysis.raw}
                    </div>
                  )}
                </div>
              ))}
            </Card>
          )}
        </div>
      )}
      
      {/* Retry button */}
      {analysisState !== 'analyzing' && analysisState !== 'idle' && (
        <Button
          variant="outline"
          size="sm"
          onClick={analyzeImages}
          className="text-xs"
        >
          <Brain className="h-3.5 w-3.5 mr-1.5" />
          Analyze Images Again
        </Button>
      )}
    </div>
  );
}