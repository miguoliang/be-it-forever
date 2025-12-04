import type { Card } from "../types";
import { CardFront } from "./CardFront";
import { CardBack } from "./CardBack";

interface StudyCardProps {
  card: Card;
  flipped: boolean;
  onFlip: () => void;
  onSpeak: (text: string, lang: "en-US" | "en-GB") => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

export function StudyCard({
  card,
  flipped,
  onFlip,
  onSpeak,
  onTouchStart,
  onTouchEnd,
}: StudyCardProps) {
  return (
    <div
      className="relative w-full max-w-2xl"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 min-h-96 flex flex-col justify-center items-center cursor-pointer select-none transition-all duration-500 preserve-3d relative"
        style={{
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          transformStyle: "preserve-3d",
        }}
        onClick={onFlip}
      >
        <CardFront knowledge={card.knowledge} onSpeak={onSpeak} />
        <CardBack knowledge={card.knowledge} />
      </div>
    </div>
  );
}

