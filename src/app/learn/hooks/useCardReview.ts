import { useMutation, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient();

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
      // Invalidate cards query to refresh the list
      queryClient.invalidateQueries({ queryKey: ["cards", "due"] });

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((i) => i + 1);
        resetFlip();
      } else {
        // All cards reviewed, clear the list
        setCards([]);
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

