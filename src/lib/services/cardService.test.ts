import { cardService } from './cardService';
import { createClient } from '@supabase/supabase-js';
import { ApiError } from '../utils/apiErrorClasses';

// Mock Supabase client
const mockRpc = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockEq = jest.fn();
const mockGte = jest.fn();
const mockLte = jest.fn();
const mockSingle = jest.fn();
const mockOrder = jest.fn();
const mockLimit = jest.fn();

const mockSupabase = {
  rpc: mockRpc,
  from: mockFrom,
} as unknown as ReturnType<typeof createClient>;

describe('cardService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup chainable mocks
    mockFrom.mockReturnValue({
      select: mockSelect,
      update: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
    });

    mockSelect.mockReturnValue({
      eq: mockEq,
      gte: mockGte,
      lte: mockLte,
    });

    mockEq.mockReturnValue({
      eq: mockEq, // recursive for multiple .eq()
      gte: mockGte,
      lte: mockLte,
      single: mockSingle,
      order: mockOrder,
    });
    
    mockGte.mockReturnValue({
        lte: mockLte
    });

    mockLte.mockReturnValue({
        order: mockOrder
    });

    mockOrder.mockReturnValue({
      limit: mockLimit,
    });
  });

  describe('getReviewedTodayCount', () => {
    it('should return the count of cards reviewed today', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      mockEq.mockReturnValue({
        gte: mockGte
      });
      mockGte.mockReturnValue({
        lte: mockLte
      });
      mockLte.mockResolvedValue({ count: 5, error: null });

      const count = await cardService.getReviewedTodayCount(mockSupabase, 'user-123');

      expect(count).toBe(5);
      expect(mockFrom).toHaveBeenCalledWith('account_cards');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    });

    it('should throw ApiError on failure', async () => {
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      mockEq.mockReturnValue({
        gte: mockGte
      });
      mockGte.mockReturnValue({
        lte: mockLte
      });
      mockLte.mockResolvedValue({ count: null, error: { message: 'DB Error' } });

      await expect(
        cardService.getReviewedTodayCount(mockSupabase, 'user-123')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('reviewCard', () => {
    const mockCard = {
      id: 1,
      account_id: 'user-123',
      ease_factor: 2.5,
      repetitions: 0,
      interval_days: 0,
      last_reviewed_at: '2023-01-01T00:00:00Z', // Old date
    };

    it('should successfully review a card via RPC', async () => {
      // Mock fetch card
      mockSelect.mockReturnValue({
        eq: mockEq
      });
      mockEq.mockReturnValue({
         eq: mockEq,
      });
      // Second eq calls single
      mockEq.mockReturnValueOnce({ // First eq (id)
         eq: mockEq
      }).mockReturnValueOnce({ // Second eq (account_id)
         single: mockSingle
      });
      
      mockSingle.mockResolvedValue({ data: mockCard, error: null });

      // Mock reviewed count check (return 0 so we are under limit)
      // Since reviewCard calls getReviewedTodayCount internally, we need to ensure 
      // the mocks for that chain are set up if we don't mock the function itself.
      // Ideally, we might want to spyOn cardService.getReviewedTodayCount, 
      // but since it's an object method, we can just let it run with mocks.
      
      // However, getReviewedTodayCount uses a different chain: from -> select -> eq -> gte -> lte
      // We need to support that flow.
      
      // Let's rely on the fact that we can mock the return values specifically.
      // But standard jest mocks on the same 'mockSelect' object might conflict if we are not careful.
      // Simpler approach: Spy on the internal call if possible, or just accept the complexity.
      
      // Actually, let's spy on getReviewedTodayCount to isolate reviewCard logic
      jest.spyOn(cardService, 'getReviewedTodayCount').mockResolvedValue(0);

      // Mock RPC success
      mockRpc.mockResolvedValue({ error: null });

      const result = await cardService.reviewCard(mockSupabase, 'user-123', 1, 5); // Quality 5

      expect(result.success).toBe(true);
      expect(mockRpc).toHaveBeenCalledWith('review_card', expect.objectContaining({
        p_card_id: 1,
        p_user_id: 'user-123',
        p_quality: 5,
        // SM-2 checks: 
        // Reps: 0 -> 1
        // Interval: 0 -> 1 (for first successful review)
        // Ease: 2.5 + ... (Quality 5 increases ease slightly)
        p_repetitions: 1,
        p_interval_days: 1
      }));
    });

    it('should throw ApiError if daily limit is exceeded', async () => {
       // Mock fetch card
       mockSelect.mockReturnValue({ eq: mockEq });
       mockEq.mockReturnValue({ eq: mockEq });
       mockEq.mockReturnValueOnce({ eq: mockEq }).mockReturnValueOnce({ single: mockSingle });
       mockSingle.mockResolvedValue({ data: mockCard, error: null });

       // Mock limit exceeded
       jest.spyOn(cardService, 'getReviewedTodayCount').mockResolvedValue(10);

       await expect(
         cardService.reviewCard(mockSupabase, 'user-123', 1, 5)
       ).rejects.toThrow(/今日已复习/);
    });

    it('should NOT check daily limit if card was already reviewed today', async () => {
        const todayCard = {
            ...mockCard,
            last_reviewed_at: new Date().toISOString() // Reviewed just now
        };
        
        mockSelect.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValue({ eq: mockEq });
        mockEq.mockReturnValueOnce({ eq: mockEq }).mockReturnValueOnce({ single: mockSingle });
        mockSingle.mockResolvedValue({ data: todayCard, error: null });

        mockRpc.mockResolvedValue({ error: null });
        
        // Even if limit is 'technically' full, it shouldn't block re-reviews
        const spyCount = jest.spyOn(cardService, 'getReviewedTodayCount').mockResolvedValue(10);

        await cardService.reviewCard(mockSupabase, 'user-123', 1, 4);

        // Should NOT have called count check because it's a re-review
        expect(spyCount).not.toHaveBeenCalled(); 
        expect(mockRpc).toHaveBeenCalled();
    });
  });
});
