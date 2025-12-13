import { useMutation } from "@tanstack/react-query";
import { reviewCard as reviewCardAPI } from "@/lib/api/cards";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/utils/errorUtils";
import { nowISO } from "@/lib/utils/dateUtils";
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
    // Optimistic update: mark card as reviewed today
    onMutate: async ({ cardId }) => {
      // Snapshot the previous value for rollback
      const previousCards = cards;
      // Capture currentIndex from closure to use in the update
      const currentIdx = currentIndex;

      // Mark the card as reviewed and set last_reviewed_at to now (today)
      const now = nowISO();
      const updatedCards = cards.map((card) =>
        card.id === cardId
          ? { ...card, reviewed: true, last_reviewed_at: now }
          : card
      );

      // Find the next unreviewed card
      const nextUnreviewedIndex = updatedCards.findIndex(
        (card, index) => index > currentIdx && !card.reviewed
      );

      // Update index to next unreviewed card, or stay at current if no more unreviewed cards
      if (nextUnreviewedIndex !== -1) {
        setCurrentIndex(() => nextUnreviewedIndex);
        resetFlip();
      } else {
        // No more unreviewed cards, stay at current or move to last card
        if (currentIdx < updatedCards.length - 1) {
          setCurrentIndex(() => updatedCards.length - 1);
        }
        resetFlip();
      }

      // Update cards array
      setCards(updatedCards);

      return { previousCards };
    },
    // After successful review, no refetch needed
    // The card is marked as reviewed (today), and its next_review_date
    // is set to the future, so it won't appear in future due queries.
    // The API also updates last_reviewed_at in the database.
    onSuccess: () => {
      // Card already marked as reviewed (today) in onMutate
      // No additional action needed
    },
    // If mutation fails, rollback to previous state
    onError: (error, variables, context) => {
      if (context?.previousCards) {
        setCards(context.previousCards);
      }
      toast.error(getErrorMessage(error) || "复习失败");
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
