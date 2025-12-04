// src/app/learn/page.tsx
'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface KnowledgeMetadata {
  phonetic?: string
  [key: string]: unknown
}

interface Knowledge {
  code: string
  name: string
  description: string
  metadata: KnowledgeMetadata
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
  const router = useRouter()

  useEffect(() => {
    let isMounted = true

    const loadCards = async () => {
      const res = await fetch('/api/cards/due')
      if (!res.ok) {
        if (res.status === 401 && isMounted) {
          router.push('/')
        }
        return
      }
      const data = await res.json()
      if (isMounted) {
        setCards(data)
        setLoading(false)
      }
    }

    loadCards()

    return () => {
      isMounted = false
    }
  }, [router])

  // 发音
  const speak = (text: string, lang: 'en-US' | 'en-GB' = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = lang
      utter.rate = 0.8
      window.speechSynthesis.speak(utter)
    }
  }

  // 评分
  const handleRate = async (quality: number) => {
    const card = cards[currentIndex]
    await fetch(`/api/cards/${card.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quality }),
    })

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(i => i + 1)
      setFlipped(false)
    } else {
      setCards([])
      alert('今日复习完成！明天再来！')
    }
  }

  // 触摸滑动翻牌
  const touchStartX = useRef(0)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }
  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX
    if (Math.abs(touchEndX - touchStartX.current) > 50) {
      setFlipped(f => !f)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center text-3xl text-gray-900 dark:text-white">加载中…</div>
  if (cards.length === 0)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-4xl font-bold">
        今日复习完成！
        <p className="text-xl mt-4 text-gray-600 dark:text-gray-400">明天再来哦</p>
      </div>
    )

  const current = cards[currentIndex]

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      {/* 进度 */}
      <div className="w-full max-w-2xl text-center mb-8">
        <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
          {currentIndex + 1} / {cards.length}
        </p>
      </div>

      {/* 卡片 */}
      <div
        className="relative w-full max-w-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-12 min-h-96 flex flex-col justify-center items-center cursor-pointer select-none transition-all duration-500 preserve-3d"
          style={{ transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)', transformStyle: 'preserve-3d' }}
          onClick={() => setFlipped(f => !f)}
        >
          {/* 正面 */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center backface-hidden ${flipped ? 'opacity-0' : ''}`}>
            <h2 className="text-8xl font-bold text-gray-800 dark:text-white mb-8">{current.knowledge.name}</h2>

            {current.knowledge.metadata?.phonetic && (
              <p className="text-4xl text-indigo-600 dark:text-indigo-400 font-medium mb-8">
                {current.knowledge.metadata.phonetic}
              </p>
            )}

            {/* Speaker buttons under the English vocabulary */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={(e) => { e.stopPropagation(); speak(current.knowledge.name, 'en-US') }}
                className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-800 dark:text-indigo-200 hover:scale-110 transition text-sm md:text-base font-medium"
              >
                US Speaker
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); speak(current.knowledge.name, 'en-GB') }}
                className="px-4 md:px-6 py-2 md:py-3 rounded-lg bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:scale-110 transition text-sm md:text-base font-medium"
              >
                UK Speaker
              </button>
            </div>

            <p className="text-2xl text-gray-500 dark:text-gray-400">点击或滑动显示答案</p>
          </div>

          {/* 背面 */}
          <div className={`absolute inset-0 flex flex-col items-center justify-center backface-hidden rotate-y-180 ${!flipped ? 'opacity-0' : ''}`}>
            <div className="flex items-center gap-6 mb-8">
              <p className="text-7xl font-bold text-indigo-600 dark:text-indigo-400 text-center">
                {current.knowledge.description}
              </p>
            </div>

            {current.knowledge.metadata?.phonetic && (
              <p className="text-4xl text-indigo-600 dark:text-indigo-400 font-medium mb-8">
                {current.knowledge.metadata.phonetic}
              </p>
            )}

            <p className="text-xl text-gray-500 dark:text-gray-400">请为这张卡片评分</p>
          </div>
        </div>
      </div>

      {/* 评分按钮（只在翻牌后显示） */}
      {flipped && (
        <div className="mt-12 grid grid-cols-3 gap-4 w-full max-w-2xl">
          {[0, 1, 2, 3, 4, 5].map(q => (
            <button
              key={q}
              onClick={() => handleRate(q)}
              className={`py-8 text-4xl font-bold rounded-2xl transition transform hover:scale-110 ${
                q < 3 ? 'bg-red-500 hover:bg-red-600' :
                q < 5 ? 'bg-yellow-500 hover:bg-yellow-600' :
                'bg-green-500 hover:bg-green-600'
              } text-white shadow-xl`}
            >
              {q === 0 ? '完全忘记' : q === 5 ? '完美' : q}
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  )
}