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
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const loadCards = async () => {
    const res = await fetch('/api/cards/due')
    if (res.ok) {
      const data = await res.json()
      setCards(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadCards()
  }, [])

  const handleRate = async (quality: number) => {
    const card = cards[currentIndex]
    await fetch(`/api/cards/${card.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality }),
    })

    // 自动下一张
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1)
      setFlipped(false)
    } else {
      setCards([])
      alert('今日复习完成！明天再来！')
    }
  }

  if (loading) return <div className="p-10 text-center">加载中...</div>
  if (cards.length === 0) return <div className="p-10 text-center text-3xl">今日复习完成！明天再来！</div>

  const current = cards[currentIndex]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">今日复习</h1>
          <p className="text-xl text-gray-600 mt-2">
            {currentIndex + 1} / {cards.length} 张
          </p>
        </div>

        <div
          className="bg-white rounded-3xl shadow-2xl p-16 min-h-96 flex flex-col justify-center items-center cursor-pointer transition-all hover:scale-105"
          onClick={() => setFlipped(true)}
        >
          {flipped ? (
            <div className="text-center animate-fadeIn">
              <p className="text-7xl font-bold text-indigo-600 mb-8">{current.knowledge.description}</p>
              <p className="text-gray-500">请为这张卡片评分</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-7xl font-bold text-gray-800 mb-8">{current.knowledge.name}</p>
              <p className="text-2xl text-gray-500">点击显示答案</p>
            </div>
          )}
        </div>

        {flipped && (
          <div className="mt-12 grid grid-cols-3 gap-4">
            {[0,1,2,3,4,5].map(q => (
              <button
                key={q}
                onClick={() => handleRate(q)}
                className={`py-6 text-2xl font-bold rounded-xl transition-all transform hover:scale-110 ${
                  q < 3 ? 'bg-red-500 hover:bg-red-600' : q < 5 ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-green-500 hover:bg-green-600'
                } text-white shadow-lg`}
              >
                {q === 0 ? '完全忘记' : q === 5 ? '完美记住' : q}
              </button>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-gray-500">
          {current.knowledge.code}
        </div>
      </div>
    </div>
  )
}