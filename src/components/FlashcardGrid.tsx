import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

interface FlashcardGridProps {
  flashcards: Flashcard[];
}

const FlashcardItem = ({ flashcard }: { flashcard: Flashcard }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div
      className="flip-card h-64 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`flip-card-inner relative w-full h-full transition-transform duration-500 ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`} style={{ transformStyle: 'preserve-3d' }}>
        {/* Front */}
        <Card className="flip-card-front absolute inset-0 bg-card text-card-foreground p-6 flex flex-col justify-between rounded-2xl shadow-md border-2 border-border" style={{ backfaceVisibility: 'hidden' }}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg font-medium text-center">{flashcard.question}</p>
          </div>
          {flashcard.category && (
            <Badge variant="secondary" className="self-start">
              {flashcard.category}
            </Badge>
          )}
          <p className="text-xs text-muted-foreground text-center mt-2">Click to reveal answer</p>
        </Card>

        {/* Back */}
        <Card className="flip-card-back absolute inset-0 bg-card-back text-card-back-foreground p-6 flex flex-col justify-between rounded-2xl shadow-md border-2 border-primary" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-lg font-medium text-center">{flashcard.answer}</p>
          </div>
          <p className="text-xs opacity-80 text-center mt-2">Click to see question</p>
        </Card>
      </div>
    </div>
  );
};

const FlashcardGrid = ({ flashcards }: FlashcardGridProps) => {
  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Your Flashcards</h2>
        <Badge variant="outline" className="text-base px-4 py-1">
          {flashcards.length} cards
        </Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flashcards.map((flashcard) => (
          <FlashcardItem key={flashcard.id} flashcard={flashcard} />
        ))}
      </div>
    </div>
  );
};

export default FlashcardGrid;
