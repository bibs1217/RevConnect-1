'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ username:'', email:'', password:'' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (form.username.length < 3) { setError('Username must be at least 3 characters'); return }
    setLoading(true); setError('')
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username } }
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }
    if (data.user && !data.session) {
      setLoading(false)
      setError('✅ Account created! Check your email and click the confirmation link to sign in.')
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: form.username.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        membership_tier: 'cruiser',
        rev_points: 0,
      })
      router.push('/garage')
    }
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0E1825', border:'1px solid #1E3A6E', borderRadius:'0.75rem', padding:'0.75rem 1rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.5rem' }

  return (
    <div style={{ minHeight:'100vh', background:'#0E1825', display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }}>
      <div style={{ width:'100%', maxWidth:'420px' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <Link href="/" style={{ fontSize:'2rem', fontWeight:900 }}>
            <span style={{ color:'white' }}>Rev</span><span style={{ color:'#CC0000' }}>Connect</span><span style={{ color:'#FFD700' }}>-1</span>
          </Link>
          <p style={{ color:'#777', marginTop:'0.5rem' }}>Create your free account</p>
        </div>
        <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'2rem' }}>
          <form onSubmit={handleRegister} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            <div>
              <label style={lbl}>Username</label>
              <input value={form.username} onChange={e => set('username', e.target.value)} required minLength={3} maxLength={30} placeholder="your_handle" style={inp} />
              <p style={{ fontSize:'0.7rem', color:'#555', marginTop:'0.25rem' }}>Letters, numbers, underscores only</p>
            </div>
            <div>
              <label style={lbl}>Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="you@example.com" style={inp} />
            </div>
            <div>
              <label style={lbl}>Password</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} required minLength={8} placeholder="Min. 8 characters" style={inp} />
            </div>
            {error && <div style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.3)', borderRadius:'0.5rem', padding:'0.75rem', fontSize:'0.875rem', color:'#CC0000' }}>{error}</div>}
            <button type="submit" disabled={loading} style={{ background:'#CC0000', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'1rem', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating account…' : 'Join RevConnect-1'}
            </button>
            <p style={{ fontSize:'0.7rem', color:'#555', textAlign:'center' }}>
              By joining you agree to our <Link href="/terms" style={{ color:'#CC0000' }}>Terms</Link> and <Link href="/privacy" style={{ color:'#CC0000' }}>Privacy Policy</Link>
            </p>
          </form>
        </div>
        <p style={{ textAlign:'center', color:'#666', marginTop:'1.5rem', fontSize:'0.875rem' }}>
          Already have an account? <Link href="/login" style={{ color:'#CC0000', fontWeight:600 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
