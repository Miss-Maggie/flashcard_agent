import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Loader2, Sparkles } from "lucide-react";

interface TopicInputProps {
  onGenerate: (topic: string, mode: "stem" | "general") => void;
  isLoading: boolean;
}

const TopicInput = ({ onGenerate, isLoading }: TopicInputProps) => {
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"stem" | "general">("general");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onGenerate(topic.trim(), mode);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto space-y-6 p-6 bg-card rounded-2xl shadow-sm border border-border">
      <div className="space-y-2">
        <Label htmlFor="topic" className="text-base font-medium">
          What would you like to learn?
        </Label>
        <Input
          id="topic"
          placeholder="e.g., Photosynthesis, World War II, Calculus..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          disabled={isLoading}
          className="h-12 text-base rounded-xl"
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">Learning Mode</Label>
        <RadioGroup value={mode} onValueChange={(v) => setMode(v as "stem" | "general")} className="flex gap-4">
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="general" id="general" disabled={isLoading} />
            <Label htmlFor="general" className="cursor-pointer font-normal">
              General Knowledge
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="stem" id="stem" disabled={isLoading} />
            <Label htmlFor="stem" className="cursor-pointer font-normal">
              STEM Focus
            </Label>
          </div>
        </RadioGroup>
      </div>

      <Button
        type="submit"
        disabled={!topic.trim() || isLoading}
        className="w-full h-12 text-base rounded-xl font-medium"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating Flashcards...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-5 w-5" />
            Generate Flashcards
          </>
        )}
      </Button>
    </form>
  );
};

export default TopicInput;
