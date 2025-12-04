"use client";

import { useState } from "react";
import { useCards } from "./hooks/useCards";
import { useCardFlip } from "./hooks/useCardFlip";
import { useSpeech } from "./hooks/useSpeech";
import { useTouchSwipe } from "./hooks/useTouchSwipe";
import { useCardReview } from "./hooks/useCardReview";
import { LoadingState } from "./components/LoadingState";
import { EmptyState } from "./components/EmptyState";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { StudyCard } from "./components/StudyCard";
import { RatingButtons } from "./components/RatingButtons";
import { CardStyles } from "./components/CardStyles";

export default function Learn() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { cards, setCards, loading } = useCards();
  const { flipped, toggleFlip, resetFlip } = useCardFlip();
  const { speak } = useSpeech();
  const { handleTouchStart, handleTouchEnd } = useTouchSwipe(toggleFlip);

  const { handleRate } = useCardReview({
    cards,
    currentIndex,
    setCurrentIndex,
    setCards,
    resetFlip,
  });

  if (loading) return <LoadingState />;
  if (cards.length === 0) return <EmptyState />;

  const current = cards[currentIndex];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <ProgressIndicator current={currentIndex + 1} total={cards.length} />

      <StudyCard
        card={current}
        flipped={flipped}
        onFlip={toggleFlip}
        onSpeak={speak}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      />

      {flipped && <RatingButtons onRate={handleRate} />}

      <CardStyles />
    </div>
  );
}
