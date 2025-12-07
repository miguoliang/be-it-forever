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

  // Ensure currentIndex is within bounds
  const safeIndex = cards.length > 0 ? Math.min(currentIndex, cards.length - 1) : 0;

  // Reset index when cards list changes (using useEffect with proper pattern)
  useEffect(() => {
    if (cards.length > 0 && currentIndex >= cards.length) {
      // Use setTimeout to avoid synchronous setState in effect
      const timeoutId = setTimeout(() => {
        setCurrentIndex(Math.max(0, cards.length - 1));
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [cards.length, currentIndex]);

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

  const current = cards[currentIndex];

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
      <ProgressIndicator current={safeIndex + 1} total={cards.length} />

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
