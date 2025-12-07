import { useMutation } from "@tanstack/react-query";
import { reviewCard as reviewCardAPI } from "@/lib/api/cards";
import type { Card } from "../types";

interface UseCardReviewParams {
  cards: Card[];
  currentIndex: number;
  setCurrentIndex: (updater: (i: number) => number) => void;
  setCards: (cards: Card[] | ((prev: Card[] | null) => Card[] | null)) => void;
  resetFlip: () => void;
}

export function useCardReview({
  cards,
  currentIndex,
  setCurrentIndex,
  setCards,
  resetFlip,
}: UseCardReviewParams) {
  const { mutate: reviewCard, isPending } = useMutation({
    mutationFn: ({ cardId, quality }: { cardId: number; quality: number }) =>
      reviewCardAPI(cardId, quality),
    // Optimistic update: immediately update UI
    onMutate: async ({ cardId }) => {
      // Snapshot the previous value for rollback
      const previousCards = cards;
      
      // Optimistically update the cards list by removing the reviewed card
      setCards((prevCards) => {
        if (!prevCards) return [];
        const updatedCards = prevCards.filter((card) => card.id !== cardId);
        
        // Update index and flip state
        if (updatedCards.length > 0) {
          if (currentIndex >= updatedCards.length) {
            setCurrentIndex(() => updatedCards.length - 1);
          }
          resetFlip();
        } else {
          setCurrentIndex(() => 0);
          resetFlip();
          alert("今日复习完成！明天再来！");
        }
        
        return updatedCards;
      });

      return { previousCards };
    },
    // If mutation fails, rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousCards) {
        setCards(context.previousCards);
      }
      alert((error as Error).message || "复习失败");
    },
  });

  const handleRate = (quality: number) => {
    const card = cards[currentIndex];
    if (card) {
      reviewCard({ cardId: card.id, quality });
    }
  };

  return { handleRate, isPending };
}

