import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import type { Card } from "../types";

export function useCards() {
  const router = useRouter();

  const { data: cards = [], isLoading: loading, refetch } = useQuery({
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
  });

  return { cards, setCards: () => {}, loading, refetch };
}

