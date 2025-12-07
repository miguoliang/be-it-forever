// src/app/stats/page.tsx
'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabaseClient'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'

export default function Stats() {
  const [stats, setStats] = useState({
    total: 0,
    mastered: 0,
    learning: 0,
    dueToday: 0,
    streak: 0,
    heatMap: [] as { date: string; count: number }[]
  })
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    const fetchStats = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 基础统计
      const { data: cards } = await supabase
        .from('account_cards')
        .select('repetitions, interval_days')
        .eq('account_id', user.id)

      const total = cards?.length || 0
      const mastered = cards?.filter(c => c.repetitions >= 7 && c.interval_days >= 30).length || 0
      const learning = cards?.filter(c => c.repetitions > 0 && c.interval_days < 30).length || 0

      // 今日待复习
      const { count: dueToday } = await supabase
        .from('account_cards')
        .select('*', { count: 'exact', head: true })
        .eq('account_id', user.id)
        .lte('next_review_date', new Date().toISOString())

      // 最近30天热力图
      const { data: history } = await supabase
        .from('review_history')
        .select('reviewed_at')
        .eq('account_card_id', user.id)
        .gte('reviewed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

      const heatMap = Array(30).fill(0).map((_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (29 - i))
        const dateStr = date.toISOString().split('T')[0]
        const count = history?.filter(h => h.reviewed_at.startsWith(dateStr)).length || 0
        return { date: dateStr, count }
      })

      setStats({ total, mastered, learning, dueToday: dueToday || 0, streak: 18, heatMap })
    }
    fetchStats()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">我的学习统计</h1>
          <Button
            onClick={handleSignOut}
            variant="ghost"
            size="sm"
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">退出登录</span>
          </Button>
        </div>

        {/* 四宫格 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {[
            { label: '总词量', value: stats.total, color: 'bg-blue-500' },
            { label: '已掌握', value: stats.mastered, color: 'bg-green-500' },
            { label: '学习中', value: stats.learning, color: 'bg-yellow-500' },
            { label: '今日待复习', value: stats.dueToday, color: 'bg-red-500' },
          ].map(s => (
            <div key={s.label} className={`${s.color} text-white rounded-2xl p-6 text-center`}>
              <p className="text-5xl font-bold">{s.value}</p>
              <p className="text-xl mt-2">{s.label}</p>
            </div>
          ))}
        </div>

        {/* 热力图 */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">过去 30 天学习热力</h2>
          <div className="grid grid-cols-15 gap-2">
            {stats.heatMap.map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg transition-all ${
                  day.count === 0 ? 'bg-gray-200 dark:bg-gray-700' :
                  day.count < 5 ? 'bg-green-300 dark:bg-green-800' :
                  day.count < 10 ? 'bg-green-500 dark:bg-green-600' :
                  'bg-green-700 dark:bg-green-500'
                }`}
                title={`${day.date}: ${day.count} 次`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}