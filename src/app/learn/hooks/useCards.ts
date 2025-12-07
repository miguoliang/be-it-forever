import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Card } from "../types";

export function useCards() {
  const router = useRouter();
  const [localCards, setLocalCards] = useState<Card[] | null>(null);

  const { data: fetchedCards = [], isLoading: loading } = useQuery({
    queryKey: ["cards", "due"],
    queryFn: async () => {
      const res = await fetch("/api/cards/due");
      if (!res.ok) {
        if (res.status === 401) {
          router.push("/");
          throw new Error("未登录");
        }
        throw new Error("获取卡片失败");
      }
      return res.json() as Promise<Card[]>;
    },
    retry: false,
    // Only fetch once, don't refetch automatically
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  // Use local cards if set, otherwise use fetched cards
  const cards = localCards !== null ? localCards : fetchedCards;

  return { cards, setCards: setLocalCards, loading };
}

