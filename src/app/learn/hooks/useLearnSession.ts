import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import { useCards } from "./useCards";
import { useCardFlip } from "./useCardFlip";
import { useSpeech } from "./useSpeech";
import { useTouchSwipe } from "./useTouchSwipe";
import { useCardReview } from "./useCardReview";

export function useLearnSession() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  
  // 1. Data & State
  const { cards, setCards, reviewedCount: apiReviewedCount, loading } = useCards();
  const { flipped, toggleFlip, resetFlip } = useCardFlip();
  const { speak } = useSpeech();
  const { handleTouchStart, handleTouchEnd } = useTouchSwipe(toggleFlip);

  // 2. Progress Calculation
  const locallyReviewedCount = cards.filter((card) => card.reviewed).length;
  
  // Logic: If apiReviewedCount is 10 and cards is empty, limit reached (10/10)
  // Otherwise, calculate from API count + local cards
  const reviewedCount = apiReviewedCount >= 10 && cards.length === 0 
    ? 10 
    : apiReviewedCount + locallyReviewedCount;
  
  const totalCount = apiReviewedCount >= 10 && cards.length === 0 
    ? 10 
    : apiReviewedCount + cards.length;

  // 3. Navigation Logic (Find next unreviewed card)
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
  }, [cards, currentIndex]);

  // 4. Review Handler
  const { handleRate } = useCardReview({
    cards,
    currentIndex,
    setCurrentIndex,
    setCards,
    resetFlip,
  });

  // 5. Auth Handler
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // 6. Current Card Resolution
  const safeIndex = cards.length > 0 ? Math.min(currentIndex, cards.length - 1) : 0;
  const currentCard = cards[safeIndex];

  return {
    loading,
    cards, // Needed for empty check
    currentCard,
    progress: {
      reviewed: reviewedCount,
      total: totalCount,
    },
    flip: {
      isFlipped: flipped,
      toggle: toggleFlip,
      reset: resetFlip,
    },
    speech: {
      speak,
    },
    touch: {
      handleTouchStart,
      handleTouchEnd,
    },
    review: {
      handleRate,
    },
    auth: {
      handleSignOut,
    },
  };
}
