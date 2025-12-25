import { useState, useEffect } from "react";
import { Card } from "../types";

export function useCardNavigation(cards: Card[]) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance logic: Ensure we point to a valid, unreviewed card if possible
  useEffect(() => {
    if (cards.length === 0) return;

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
        // Use timeout to avoid render-cycle conflicts if this effect runs during render
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
    
    // If currentIndex != validIndex but card is not reviewed, we might want to sync them?
    // But for now, let's just respect the manual bounds check implicitly
  }, [cards, currentIndex]);

  return {
    currentIndex,
    setCurrentIndex,
    currentCard: cards.length > 0 ? cards[Math.min(currentIndex, cards.length - 1)] : undefined,
  };
}
