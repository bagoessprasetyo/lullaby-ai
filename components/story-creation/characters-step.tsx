"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Plus, 
  Trash2,
  AlertCircle,
  UserIcon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StoryFormData } from "@/app/dashboard/create/page";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CharactersStepProps {
  formData: StoryFormData;
  updateFormData: (field: keyof StoryFormData, value: any) => void;
  errors: { [key: string]: string };
}

export function CharactersStep({ formData, updateFormData, errors }: CharactersStepProps) {
  const addCharacter = () => {
    if (formData.characters.length < 5) {
      const updatedCharacters = [
        ...formData.characters,
        { name: "", description: "" }
      ];
      updateFormData("characters", updatedCharacters);
    }
  };

  const removeCharacter = (index: number) => {
    if (formData.characters.length > 1) {
      const updatedCharacters = [...formData.characters];
      updatedCharacters.splice(index, 1);
      updateFormData("characters", updatedCharacters);
    }
  };

  const updateCharacter = (index: number, field: "name" | "description", value: string) => {
    const updatedCharacters = [...formData.characters];
    updatedCharacters[index][field] = value;
    updateFormData("characters", updatedCharacters);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold text-white mb-2">Story Characters</h3>
        <p className="text-gray-400">
          Tell us about the characters in your story. Add up to 5 characters.
        </p>
      </div>
      
      {/* Characters Form */}
      <div className="space-y-4">
        <AnimatePresence initial={false}>
          {formData.characters.map((character, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, overflow: "hidden" }}
              transition={{ duration: 0.2 }}
              className="bg-gray-800/50 rounded-lg border border-gray-700 p-4"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-900/40 rounded-full p-1">
                    <UserIcon className="h-4 w-4 text-indigo-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    Character {index + 1}
                  </span>
                </div>
                
                {formData.characters.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-gray-500 hover:text-red-400 hover:bg-red-900/20"
                    onClick={() => removeCharacter(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor={`name-${index}`} className="text-gray-300">
                    Character Name
                  </Label>
                  <Input
                    id={`name-${index}`}
                    value={character.name}
                    onChange={(e) => updateCharacter(index, "name", e.target.value)}
                    placeholder="Enter character name"
                    className="bg-gray-900 border-gray-700"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor={`description-${index}`} className="text-gray-300">
                    Character Description (Optional)
                  </Label>
                  <Textarea
                    id={`description-${index}`}
                    value={character.description}
                    onChange={(e) => updateCharacter(index, "description", e.target.value)}
                    placeholder="Describe the character (age, personality, etc.)"
                    className="bg-gray-900 border-gray-700 min-h-[80px]"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {formData.characters.length < 5 && (
          <Button
            variant="outline"
            onClick={addCharacter}
            className="w-full border-dashed border-gray-700 hover:border-indigo-500 hover:bg-indigo-900/20 hover:text-indigo-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Another Character
          </Button>
        )}
        
        {/* Error Message */}
        {errors.characters && (
          <Alert variant="destructive" className="bg-red-900/20 border-red-800">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-300">
              {errors.characters}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Tips */}
        <div className="bg-gray-800/50 rounded-lg p-4 text-sm">
          <h4 className="font-medium text-gray-300 mb-2">Character Tips:</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Add details to make characters more vivid</li>
            <li>Include age ranges for more relatable stories</li>
            <li>Consider adding personality traits</li>
            <li>For children's stories, keep descriptions simple and clear</li>
          </ul>
        </div>
      </div>
    </div>
  );
}