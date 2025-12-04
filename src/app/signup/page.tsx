// src/app/signup/page.tsx - Sign Up Page
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignUp() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSignup = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      alert(error.message)
    } else {
      alert('注册成功！请查收邮件激活（开发环境会直接登录）')
      router.push('/learn')
    }
    setLoading(false)
  }

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', textAlign: 'center' }}>
      <h1>英语学习工具</h1>
      <h2 style={{ marginBottom: '30px', color: '#666' }}>注册</h2>
      <input
        type="email"
        placeholder="邮箱"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={{ width: '100%', padding: 12, margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={e => setPassword(e.target.value)}
        style={{ width: '100%', padding: 12, margin: '10px 0', borderRadius: '4px', border: '1px solid #ddd' }}
      />
      <div style={{ margin: '20px 0' }}>
        <button 
          onClick={handleSignup} 
          disabled={loading} 
          style={{ 
            width: '100%',
            padding: '12px 24px', 
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {loading ? '注册中...' : '注册'}
        </button>
      </div>
      <div style={{ marginTop: '20px', color: '#666' }}>
        已有账号？{' '}
        <Link href="/" style={{ color: '#0070f3', textDecoration: 'none' }}>
          立即登录
        </Link>
      </div>
    </div>
  )
}

