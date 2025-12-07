import { useMutation } from "@tanstack/react-query";
import type { Card } from "../types";

interface UseCardReviewParams {
  cards: Card[];
  currentIndex: number;
  setCurrentIndex: (updater: (i: number) => number) => void;
  setCards: (cards: Card[]) => void;
  resetFlip: () => void;
}

export function useCardReview({
  cards,
  currentIndex,
  setCurrentIndex,
  setCards,
  resetFlip,
}: UseCardReviewParams) {
  const { mutate: reviewCard } = useMutation({
    mutationFn: async ({ cardId, quality }: { cardId: number; quality: number }) => {
      const res = await fetch(`/api/cards/${cardId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quality }),
      });

      if (!res.ok) {
        throw new Error("复习失败");
      }
    },
    onSuccess: () => {
      // Remove the reviewed card from the frontend list
      const updatedCards = cards.filter((_, index) => index !== currentIndex);
      setCards(updatedCards);

      // Move to next card or show completion message
      if (updatedCards.length > 0) {
        // If we're at the end, stay at the last card
        if (currentIndex >= updatedCards.length) {
          setCurrentIndex(() => updatedCards.length - 1);
        }
        // Otherwise, stay at the same index (next card moves up)
        resetFlip();
      } else {
        // All cards reviewed
        setCurrentIndex(() => 0);
        resetFlip();
        alert("今日复习完成！明天再来！");
      }
    },
    onError: (error) => {
      alert((error as Error).message || "复习失败");
    },
  });

  const handleRate = (quality: number) => {
    const card = cards[currentIndex];
    reviewCard({ cardId: card.id, quality });
  };

  return { handleRate };
}

