import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewCard as reviewCardAPI, fetchDueCards } from "@/lib/api/cards";
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
  const queryClient = useQueryClient();

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
        }

        return updatedCards;
      });

      return { previousCards };
    },
    // After successful review, refetch due cards to get updated list
    onSuccess: async () => {
      // Refetch due cards to get the updated list (reviewed card will be excluded)
      // Use fetchQuery to get fresh data
      const updatedCards = await queryClient.fetchQuery({
        queryKey: ["cards", "due"],
        queryFn: fetchDueCards,
      });

      // Update local cards state with the refetched data
      // This ensures we get any new cards that are now due
      if (updatedCards && updatedCards.length > 0) {
        setCards(updatedCards);
        // Reset to first card if current index is out of bounds
        if (currentIndex >= updatedCards.length) {
          setCurrentIndex(() => 0);
        }
        resetFlip();
      } else {
        // No more cards due
        setCards([]);
        setCurrentIndex(() => 0);
        resetFlip();
      }
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
