import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { fetchDueCards } from "@/lib/api/cards";
import { hasErrorMessage } from "@/lib/utils/errorUtils";

export function useDueCardsQuery() {
  const router = useRouter();

  const queryResult = useQuery({
    queryKey: ["cards", "due"],
    queryFn: fetchDueCards,
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const { error } = queryResult;

  useEffect(() => {
    if (error && hasErrorMessage(error, "未登录")) {
      router.push("/");
    }
  }, [error, router]);

  return queryResult;
}
