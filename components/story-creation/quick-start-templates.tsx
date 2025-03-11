// components/story-creation/quick-start-templates.tsx
"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Rocket, 
  Moon, 
  Mountain, 
  Users, 
  Award, 
  Sparkles,
  ArrowRight
} from "lucide-react";
import { StoryFormData } from "@/app/dashboard/create/page";
import { cn } from "@/lib/utils";

interface QuickStartTemplatesProps {
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  setFormData: (formData: StoryFormData) => void;
  initialFormData: StoryFormData;
  onClose?: () => void;
}

// Define our templates
type StoryTemplate = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  formValues: Partial<StoryFormData>;
};

export function QuickStartTemplates({ 
  updateFormData, 
  setFormData, 
  initialFormData,
  onClose 
}: QuickStartTemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const templates: StoryTemplate[] = [
    {
      id: "bedtime-adventure",
      name: "Bedtime Adventure",
      description: "A soothing story perfect for bedtime with gentle adventures and a calming conclusion.",
      icon: <Moon className="h-5 w-5" />,
      color: "indigo",
      formValues: {
        theme: "bedtime",
        duration: "medium",
        backgroundMusic: "calming",
        characters: [
          { name: "Child", description: "The main character ready for sleep" },
          { name: "Sleepy Bear", description: "A magical teddy bear that comes to life at night" }
        ]
      }
    },
    {
      id: "family-vacation",
      name: "Family Vacation",
      description: "Relive special vacation memories with your family as the main characters.",
      icon: <Mountain className="h-5 w-5" />,
      color: "blue",
      formValues: {
        theme: "adventure",
        duration: "medium",
        backgroundMusic: "peaceful",
        characters: [
          { name: "Family Member 1", description: "Parent or child on vacation" },
          { name: "Family Member 2", description: "Another family member" }
        ]
      }
    },
    {
      id: "magical-quest",
      name: "Magical Quest",
      description: "An epic fantasy adventure with magical elements and exciting discoveries.",
      icon: <Sparkles className="h-5 w-5" />,
      color: "purple",
      formValues: {
        theme: "fantasy",
        duration: "long",
        backgroundMusic: "magical",
        characters: [
          { name: "Hero", description: "The brave main character" },
          { name: "Magical Friend", description: "A fantastical companion with special powers" }
        ]
      }
    },
    {
      id: "learning-adventure",
      name: "Learning Adventure",
      description: "An educational journey that makes learning fun and exciting.",
      icon: <Award className="h-5 w-5" />,
      color: "green",
      formValues: {
        theme: "educational",
        duration: "medium",
        backgroundMusic: "soft",
        characters: [
          { name: "Curious Child", description: "Eager to learn and discover" },
          { name: "Wise Guide", description: "A knowledgeable character who helps explain things" }
        ]
      }
    },
    {
      id: "friendship-tale",
      name: "Friendship Tale",
      description: "A heartwarming story about friendship, sharing, and working together.",
      icon: <Users className="h-5 w-5" />,
      color: "amber",
      formValues: {
        theme: "customized",
        duration: "medium",
        backgroundMusic: "peaceful",
        characters: [
          { name: "Friend 1", description: "The first friend with unique qualities" },
          { name: "Friend 2", description: "The second friend with complementary traits" }
        ]
      }
    }
  ];

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplate(templateId);
  };

  const handleApplyTemplate = () => {
    if (!selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    // Create a new form data object by merging the initial form data with the template values
    const newFormData = {
      ...initialFormData,
      ...template.formValues
    };
    
    // Update the form data
    setFormData(newFormData);
    
    // Close the dialog
    setOpen(false);
    if (onClose) onClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-indigo-900/20 border-indigo-800 text-indigo-300 hover:bg-indigo-900/30"
        >
          <Rocket className="h-4 w-4 mr-2" />
          Quick Start Templates
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl bg-gray-900 border-gray-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Quick Start Templates</DialogTitle>
          <DialogDescription className="text-gray-400">
            Choose a template to quickly create a story with pre-filled settings.
            You can always customize everything after selecting a template.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
          {templates.map(template => (
            <Card
              key={template.id}
              className={cn(
                "p-4 bg-gray-800 border-gray-700 cursor-pointer transition-all hover:border-indigo-600",
                selectedTemplate === template.id && "border-indigo-500 bg-indigo-900/20"
              )}
              onClick={() => handleSelectTemplate(template.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`rounded-full p-2 bg-${template.color}-900/30 text-${template.color}-400`}>
                  {template.icon}
                </div>
                <div>
                  <h3 className="font-medium text-white">{template.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{template.description}</p>
                  
                  <div className="mt-3 text-xs text-gray-500">
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        Theme: {template.formValues.theme}
                      </span>
                      <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        {template.formValues.duration} duration
                      </span>
                      <span className="px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                        {template.formValues.characters?.length || 0} characters
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
        <DialogFooter>
          <Button 
            variant="ghost" 
            onClick={() => setOpen(false)}
            className="border border-gray-700"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleApplyTemplate} 
            disabled={!selectedTemplate}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Use Template
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}