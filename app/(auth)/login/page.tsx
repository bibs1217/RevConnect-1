'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/garage')
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    })
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0D0D0D', border:'1px solid #2a2a3e', borderRadius:'0.75rem', padding:'0.75rem 1rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.5rem' }

  return (
    <div style={{ minHeight:'100vh', background:'#0D0D0D', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <Link href="/" style={{ fontSize:'2rem', fontWeight:900 }}>
            <span style={{ color:'white' }}>Rev</span><span style={{ color:'#E63946' }}>Connect</span><span style={{ color:'#F4A261' }}>-1</span>
          </Link>
          <p style={{ color:'#777', marginTop:'0.5rem' }}>Sign in to your account</p>
        </div>
        <div style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'1rem', padding:'2rem' }}>
          {/* Google OAuth */}
          <button onClick={handleGoogle} style={{ width:'100%', background:'#fff', color:'#222', border:'none', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:600, fontSize:'0.9rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.75rem', marginBottom:'1.5rem' }}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <div style={{ display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1.5rem' }}>
            <div style={{ flex:1, height:'1px', background:'#2a2a3e' }} />
            <span style={{ color:'#555', fontSize:'0.75rem' }}>or email</span>
            <div style={{ flex:1, height:'1px', background:'#2a2a3e' }} />
          </div>
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <label style={lbl}>Password</label>
                <Link href="/forgot-password" style={{ fontSize:'0.75rem', color:'#E63946' }}>Forgot?</Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" style={inp} />
            </div>
            {error && <div style={{ background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.3)', borderRadius:'0.5rem', padding:'0.75rem', fontSize:'0.875rem', color:'#E63946' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ background:'#E63946', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'1rem', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
        <p style={{ textAlign:'center', color:'#666', marginTop:'1.5rem', fontSize:'0.875rem' }}>
          No account? <Link href="/register" style={{ color:'#E63946', fontWeight:600 }}>Join RevConnect-1</Link>
        </p>
      </div>
    </div>
  )
}
