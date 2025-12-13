"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
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
import { LogOut } from "lucide-react";

export default function Learn() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { cards, setCards, loading } = useCards();
  const { flipped, toggleFlip, resetFlip } = useCardFlip();
  const { speak } = useSpeech();
  const { handleTouchStart, handleTouchEnd } = useTouchSwipe(toggleFlip);
  const router = useRouter();
  const supabase = createClient();

  // Calculate daily progress: cards reviewed today out of total cards for today
  const reviewedCount = cards.filter((card) => card.reviewed).length;
  const totalCount = cards.length;

  // Ensure currentIndex is within bounds and points to an unreviewed card
  useEffect(() => {
    if (cards.length > 0) {
      const validIndex = Math.min(currentIndex, cards.length - 1);
      const currentCard = cards[validIndex];
      
      // If current card is reviewed, find the next unreviewed card
      if (currentCard?.reviewed) {
        // Look for next unreviewed card from current index
        let nextUnreviewed = cards.findIndex(
          (card, index) => index > validIndex && !card.reviewed
        );
        // If not found after current, look from the beginning
        if (nextUnreviewed === -1) {
          nextUnreviewed = cards.findIndex((card) => !card.reviewed);
        }
        
        if (nextUnreviewed !== -1 && nextUnreviewed !== validIndex) {
          const timeoutId = setTimeout(() => {
            setCurrentIndex(nextUnreviewed);
          }, 0);
          return () => clearTimeout(timeoutId);
        }
      } else if (currentIndex >= cards.length) {
        // Index is out of bounds, adjust to last valid index
        const timeoutId = setTimeout(() => {
          setCurrentIndex(Math.max(0, cards.length - 1));
        }, 0);
        return () => clearTimeout(timeoutId);
      }
    }
  }, [cards, currentIndex, setCurrentIndex]);

  const { handleRate } = useCardReview({
    cards,
    currentIndex,
    setCurrentIndex,
    setCards,
    resetFlip,
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) return <LoadingState />;
  if (cards.length === 0) return <EmptyState />;

  // Get current card, ensuring we have a valid index
  const safeIndex = cards.length > 0 ? Math.min(currentIndex, cards.length - 1) : 0;
  const current = cards[safeIndex];

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">退出登录</span>
        </Button>
      </div>
      <ProgressIndicator reviewed={reviewedCount} total={totalCount} />

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
