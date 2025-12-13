import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { getDaysAgoISO, nowISO, toDateString } from '@/lib/utils/dateUtils'

export interface StatsData {
  total: number;
  mastered: number;
  learning: number;
  dueToday: number;
  streak: number;
  heatMap: { date: string; count: number }[];
}

export function useStats() {
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    mastered: 0,
    learning: 0,
    dueToday: 0,
    streak: 0,
    heatMap: []
  })
  
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 基础统计
      const { data: cardsData } = await supabase
        .from('account_cards')
        .select('repetitions, interval_days')
        .eq('account_id', user.id)

      const cards = cardsData || []
      const total = cards.length
      const mastered = cards.filter(c => c.repetitions >= 7 && c.interval_days >= 30).length
      const learning = cards.filter(c => c.repetitions > 0 && c.interval_days < 30).length

      // 今日待复习
      const { count: dueToday } = await supabase
        .from('account_cards')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', user.id)
        .lte('next_review_date', nowISO())

      // 最近30天热力图
      // Join account_cards to filter by user.id
      const { data: historyData } = await supabase
        .from('review_history')
        .select('reviewed_at, account_cards!inner(account_id)')
        .eq('account_cards.account_id', user.id)
        .gte('reviewed_at', getDaysAgoISO(30))
      
      const history = historyData || []

      const heatMap = Array(30).fill(0).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        const dateStr = toDateString(date)
        const count = history.filter((h: { reviewed_at: string }) => h.reviewed_at.startsWith(dateStr)).length
        return { date: dateStr, count }
      })

      setStats({ total, mastered, learning, dueToday: dueToday || 0, streak: 0, heatMap })
    }
    fetchStats()
  }, [supabase])

  return stats;
}
