import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { fetchDueCards } from "@/lib/api/cards";
import type { Card } from "../types";

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

  // Handle 401 error by redirecting
  if (error && (error as Error).message === "未登录") {
    router.push("/");
  }

  // Use local cards if set, otherwise use fetched cards
  const cards = localCards !== null ? localCards : fetchedCards;

  return { cards, setCards: setLocalCards, loading };
}

