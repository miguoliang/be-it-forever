// src/app/learn/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabaseClient'

interface Knowledge {
  code: string
  name: string
  description: string
}

interface Card {
  id: number
  knowledge_code: string
  knowledge: Knowledge
  next_review_date: string
}

export default function Learn() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [flipped, setFlipped] = useState<number | null>(null)

  const supabase = createClient()

  useEffect(() => {
    const fetchDueCards = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const res = await fetch('/api/cards/due')
      if (res.ok) {
        const data = await res.json()
        setCards(data)
      }
      setLoading(false)
    }

    fetchDueCards()
  }, [supabase])

  if (loading) return <div className="p-10 text-center">加载中...</div>
  if (cards.length === 0) return <div className="p-10 text-center text-2xl">今天没有待复习的卡片，明天再来</div>

  const current = cards[0]

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">今日复习</h1>
          <p className="text-gray-600">还剩 {cards.length} 张卡片</p>
        </div>

        <div 
          className="bg-white rounded-2xl shadow-xl p-12 min-h-96 flex flex-col justify-center items-center cursor-pointer transition-all hover:shadow-2xl"
          onClick={() => setFlipped(current.id)}
        >
          {flipped === current.id ? (
            <div className="text-center">
              <p className="text-6xl font-bold mb-6">{current.knowledge.description}</p>
              <p className="text-gray-500 text-sm">点击卡片显示问题</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-6xl font-bold mb-6">{current.knowledge.name}</p>
              <p className="text-xl text-gray-500">点击显示答案</p>
            </div>
          )}
        </div>

        <div className="mt-8 text-center text-gray-500">
          第 1 / {cards.length} 张 · {current.knowledge.code}
        </div>
      </div>
    </div>
  )
}