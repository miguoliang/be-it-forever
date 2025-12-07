// API functions for accounts
export interface Account {
  id: string;
  username: string;
  email?: string;
  role?: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at?: string | null;
}

export interface AccountsResponse {
  accounts: Account[];
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

export async function fetchAccounts(
  page: number = 1,
  perPage: number = 10
): Promise<AccountsResponse> {
  const res = await fetch(`/api/accounts?page=${page}&perPage=${perPage}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "获取账户列表失败");
  }
  return res.json();
}

export async function distributeCards(accountId: string): Promise<{ count: number }> {
  const res = await fetch(`/api/accounts/${accountId}/distribute-cards`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "分配卡片失败");
  }

  return res.json();
}

