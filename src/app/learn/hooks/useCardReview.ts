import { useMutation } from "@tanstack/react-query";
import { reviewCard as reviewCardAPI } from "@/lib/api/cards";
import { toast } from "sonner";
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
      // Capture currentIndex from closure to use in the update
      const currentIdx = currentIndex;

      // Calculate the updated cards array
      const updatedCards = cards.filter((card) => card.id !== cardId);

      // Update index before updating cards to avoid race conditions
      if (updatedCards.length > 0) {
        // After removing the card at currentIdx, adjust the index:
        // - Stay at the same index (which now points to the next card)
        // - If index is out of bounds, adjust to last valid index
        if (currentIdx >= updatedCards.length) {
          setCurrentIndex(() => updatedCards.length - 1);
        }
        // Otherwise, currentIndex stays the same (no need to change it)
        // The card at currentIdx was removed, so currentIdx now points to the next card
        resetFlip();
      } else {
        // No more cards, reset index
        setCurrentIndex(() => 0);
        resetFlip();
      }

      // Update cards array
      setCards(updatedCards);

      return { previousCards };
    },
    // After successful review, no refetch needed
    // The card was already removed optimistically, and its next_review_date
    // is set to the future, so it won't appear in future due queries
    onSuccess: () => {
      // Card already removed from UI in onMutate
      // No additional action needed
    },
    // If mutation fails, rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousCards) {
        setCards(context.previousCards);
      }
      toast.error((error as Error).message || "复习失败");
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
