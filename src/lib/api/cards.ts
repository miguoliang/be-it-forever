// API functions for cards
import type { Card } from "@/app/learn/types";

export async function fetchDueCards(): Promise<Card[]> {
  const res = await fetch("/api/cards/due");
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("未登录");
    }
    throw new Error("获取卡片失败");
  }
  return res.json();
}

export async function reviewCard(cardId: number, quality: number): Promise<void> {
  const res = await fetch(`/api/cards/${cardId}/review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quality }),
  });

  if (!res.ok) {
    throw new Error("复习失败");
  }
}

