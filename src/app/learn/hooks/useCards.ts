import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchDueCards } from "@/lib/api/cards";
import { hasErrorMessage } from "@/lib/utils/errorUtils";
import type { Card } from "../types";

/**
 * Check if a date string (ISO format) is today (in UTC)
 */
function isToday(dateString: string | null | undefined): boolean {
  if (!dateString) return false;
  
  const date = new Date(dateString);
  const today = new Date();
  
  // Compare year, month, and day in UTC
  return (
    date.getUTCFullYear() === today.getUTCFullYear() &&
    date.getUTCMonth() === today.getUTCMonth() &&
    date.getUTCDate() === today.getUTCDate()
  );
}

export function useCards() {
  const router = useRouter();
  const [localCards, setLocalCards] = useState<Card[] | null>(null);

  const { data: fetchedCards = [], isLoading: loading, error } = useQuery({
    queryKey: ["cards", "due"],
    queryFn: fetchDueCards,
    retry: false,
    // Only fetch once, don't refetch automatically
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Handle 401 error by redirecting - moved to useEffect to avoid side effects during render
  useEffect(() => {
    if (error && hasErrorMessage(error, "未登录")) {
      router.push("/");
    }
  }, [error, router]);

  // Initialize cards with reviewed status based on last_reviewed_at
  // A card is considered reviewed if it was reviewed today
  const initializedCards = useMemo(() => {
    if (localCards !== null) return localCards;
    return fetchedCards.map((card) => ({
      ...card,
      reviewed: isToday(card.last_reviewed_at),
    }));
  }, [fetchedCards, localCards]);

  return { cards: initializedCards, setCards: setLocalCards, loading };
}

