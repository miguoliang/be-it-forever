// src/app/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) alert(error.message)
    else router.push('/learn')
    setLoading(false)
  }

  const handleSignup = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) alert(error.message)
    else alert('注册成功！请查收邮件激活（开发环境会直接登录）')
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <h1>英语学习工具</h1>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', padding: 12, margin: '10px 0' }}
      />
      <input
        type="password"
        placeholder="密码（随便填）"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: 12, margin: '10px 0' }}
      />
      <div style={{ margin: '20px 0' }}>
        <button onClick={handleLogin} disabled={loading} style={{ padding: '12px 24px', margin: '0 10px' }}>
          {loading ? '登录中...' : '登录'}
        </button>
        <button onClick={handleSignup} disabled={loading} style={{ padding: '12px 24px', margin: '0 10px' }}>
          {loading ? '注册中...' : '注册'}
        </button>
      </div>
    </div>
  )
}
