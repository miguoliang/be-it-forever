import type { Card } from "../types";
import { DynamicCard } from "./DynamicCard";
import { Card as ShadcnCard, CardContent } from "@/components/ui/card";
import { DEFAULT_CARD_TEMPLATES } from "@/lib/constants/templates";

interface StudyCardProps {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
   
  onSpeak: (text: string, lang: "en-US" | "en-GB") => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export const StudyCard = ({
  card,
  flipped,
  onFlip,
  onTouchStart,
  onTouchEnd,
}: StudyCardProps) => {
  return (
    <div
      className="relative w-full max-w-2xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <ShadcnCard
        className="rounded-3xl shadow-2xl p-0 min-h-96 flex flex-col justify-center items-center cursor-pointer select-none transition-all duration-500 preserve-3d relative bg-card overflow-hidden"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
          backgroundColor: 'hsl(var(--card))',
        }}
        onClick={onFlip}
      >
        {/* Front Side */}
        <div 
          className="absolute inset-0 bg-card rounded-3xl"
          style={{ 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            zIndex: flipped ? 0 : 1, // Front is on top when NOT flipped
          }}
        >
          <CardContent className="h-full p-12">
            <DynamicCard 
              template={card.templates?.front || DEFAULT_CARD_TEMPLATES.front} 
              knowledge={card.knowledge} 
              className="h-full"
            />
          </CardContent>
        </div>

        {/* Back Side */}
        <div 
          className="absolute inset-0 bg-card rounded-3xl"
          style={{ 
            transform: "rotateY(180deg)", 
            backfaceVisibility: 'hidden', 
            WebkitBackfaceVisibility: 'hidden',
            zIndex: flipped ? 1 : 0, // Back is on top when flipped
          }}
        >
          <CardContent className="h-full p-12">
            <DynamicCard 
              template={card.templates?.back || DEFAULT_CARD_TEMPLATES.back} 
              knowledge={card.knowledge}
              className="h-full"
            />
          </CardContent>
        </div>
      </ShadcnCard>
    </div>
  );
};

