'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '', displayName: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { username: form.username, display_name: form.displayName } },
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        username: form.username,
        display_name: form.displayName || null,
        membership_tier: 'cruiser',
      })
      router.push('/garage')
    }
  }

  return (
    <div className="min-h-screen bg-rev-dark flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black">
            <span className="text-white">Rev</span>
            <span className="text-rev-red">Connect</span>
            <span className="text-rev-orange">-1</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Create your account — it&apos;s free</p>
        </div>

        <div className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-8">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => update('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  required
                  maxLength={30}
                  className="w-full bg-rev-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/50 transition-colors"
                  placeholder="your_handle"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Display Name</label>
                <input
                  type="text"
                  value={form.displayName}
                  onChange={(e) => update('displayName', e.target.value)}
                  className="w-full bg-rev-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/50 transition-colors"
                  placeholder="Your Name"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-2">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                required
                className="w-full bg-rev-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/50 transition-colors"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-400 block mb-2">Password *</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                required
                minLength={8}
                className="w-full bg-rev-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/50 transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !form.username || !form.email || !form.password}
              className="w-full bg-rev-red hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors"
            >
              {loading ? 'Creating account...' : 'Join RevConnect-1'}
            </button>

            <p className="text-xs text-center text-gray-500">
              By joining you agree to our{' '}
              <Link href="/terms" className="text-rev-red hover:underline">Terms</Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-rev-red hover:underline">Privacy Policy</Link>
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-rev-red hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
