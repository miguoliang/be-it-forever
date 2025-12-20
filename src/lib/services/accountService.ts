import { SupabaseClient } from '@supabase/supabase-js';
import { nowISO } from '@/lib/utils/dateUtils';

export interface Account {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  updated_at: string;
  last_sign_in_at: string | null;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    perPage: number;
    hasMore: boolean;
  };
}

export interface DistributeCardsResult {
  success: boolean;
  count: number;
  message: string;
}

export const accountService = {
  /**
   * List users with pagination using Admin API
   */
  async listUsers(
    adminClient: SupabaseClient,
    page: number = 1,
    perPage: number = 10
  ): Promise<PaginationResult<Account>> {
    const { data: usersResponse, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) {
      throw error;
    }

    if (!usersResponse || !usersResponse.users) {
      throw new Error("无法获取用户列表");
    }

    const accounts = usersResponse.users.map((u) => ({
      id: u.id,
      username: u.user_metadata?.username || u.email?.split("@")[0] || u.id.substring(0, 8),
      email: u.email || "",
      role: (u.user_metadata?.role as string)?.trim() || "learner",
      created_at: u.created_at,
      updated_at: u.updated_at || u.created_at,
      last_sign_in_at: u.last_sign_in_at || null,
    }));

    const hasMore = usersResponse.users.length === perPage;

    return {
      data: accounts,
      pagination: {
        page,
        perPage,
        hasMore,
      },
    };
  },

  /**
   * Distribute all available knowledge cards to a specific user
   */
  async distributeCards(
    adminClient: SupabaseClient,
    targetUserId: string
  ): Promise<DistributeCardsResult> {
    // 1. Validate target user
    const { data: targetUser, error: userError } = await adminClient.auth.admin.getUserById(targetUserId);
    
    if (userError) {
      throw new Error(`获取目标账户信息失败: ${userError.message}`);
    }

    if (!targetUser || !targetUser.user) {
      throw new Error("目标账户不存在");
    }

    const targetRole = (targetUser.user.user_metadata?.role as string)?.trim() || "learner";
    if (targetRole === "operator") {
      throw new Error("不能给 operator 分配卡片");
    }

    // 2. Get all knowledge items
    // Using adminClient is fine here, it has access to everything
    const { data: knowledges, error: knowledgesError } = await adminClient
      .from("knowledge")
      .select("code");

    if (knowledgesError) {
      throw new Error(`获取知识列表失败: ${knowledgesError.message}`);
    }

    if (!knowledges || knowledges.length === 0) {
      throw new Error("知识库中没有可分配的卡片");
    }

    // 3. Get default card type
    const { data: cardTypes, error: cardTypesError } = await adminClient
      .from("card_types")
      .select("code")
      .limit(1);

    let finalCardTypeCode = "ST-0000001"; // Default fallback
    if (!cardTypesError && cardTypes && cardTypes.length > 0) {
      finalCardTypeCode = cardTypes[0].code;
    }

    // 4. Prepare account cards data
    const now = nowISO();
    const accountCards = knowledges.map((knowledge: { code: string }) => ({
      account_id: targetUserId,
      knowledge_code: knowledge.code,
      card_type_code: finalCardTypeCode,
      ease_factor: 2.5,
      interval_days: 0,
      repetitions: 0,
      next_review_date: now,
      created_at: now,
      updated_at: now,
    }));

    // 5. Batch insert
    const { data: insertedData, error: insertError } = await adminClient
      .from("account_cards")
      .upsert(accountCards, {
        onConflict: "account_id,knowledge_code,card_type_code",
        ignoreDuplicates: true,
      })
      .select();

    if (insertError) {
      throw new Error(`分配卡片失败: ${insertError.message}`);
    }

    const insertedCount = insertedData?.length || 0;
    const skippedCount = accountCards.length - insertedCount;

    return {
      success: true,
      count: insertedCount,
      message: `成功分配 ${insertedCount} 张卡片${skippedCount > 0 ? `（${skippedCount} 张已存在）` : ""}`,
    };
  }
};
