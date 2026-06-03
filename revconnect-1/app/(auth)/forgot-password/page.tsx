'use client'
import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    })
    if (error) { setError(error.message); setLoading(false) }
    else setSent(true)
  }

  return (
    <div className="min-h-screen bg-rev-dark flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-black">
            <span className="text-white">Rev</span><span className="text-rev-red">Connect</span><span className="text-rev-orange">-1</span>
          </Link>
          <p className="text-gray-400 text-sm mt-2">Reset your password</p>
        </div>
        <div className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-8">
          {sent ? (
            <div className="text-center">
              <p className="text-2xl mb-3">📬</p>
              <h3 className="text-lg font-bold text-white mb-2">Check your email</h3>
              <p className="text-gray-400 text-sm">We sent a reset link to <strong className="text-white">{email}</strong></p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Email address</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                  className="w-full bg-rev-dark border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/50 transition-colors"
                  placeholder="you@example.com" />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">{error}</div>}
              <button type="submit" disabled={loading}
                className="w-full bg-rev-red hover:bg-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-colors">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          )}
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/login" className="text-rev-red hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  )
}
