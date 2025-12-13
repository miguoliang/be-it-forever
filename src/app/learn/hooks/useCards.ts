import { useState, useMemo } from "react";
import type { Card } from "../types";
import { useDueCardsQuery } from "./useDueCardsQuery";

export function useCards() {
  const [localCards, setLocalCards] = useState<Card[] | null>(null);

  const { 
    data: { cards: fetchedCards, reviewedCount: apiReviewedCount } = { cards: [], reviewedCount: 0 }, 
    isLoading: loading 
  } = useDueCardsQuery();

  // Initialize cards with reviewed status
  // Due cards from API are not reviewed (they haven't been reviewed today)
  const initializedCards = useMemo(() => {
    if (localCards !== null) {
      return localCards;
    }
    
    // All cards from API are due cards (unreviewed), so reviewed: false
    return fetchedCards.map((card) => ({
      ...card,
      reviewed: false,
    }));
  }, [fetchedCards, localCards]);

  // Calculate reviewed count directly instead of using an effect
  const reviewedCount = localCards !== null
    ? localCards.filter((card) => card.reviewed).length
    : apiReviewedCount;

  return { 
    cards: initializedCards, 
    setCards: setLocalCards, 
    reviewedCount,
    loading 
  };
}

