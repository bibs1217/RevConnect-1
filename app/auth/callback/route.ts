import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/garage'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Ensure profile exists
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (!existing) {
        const username = data.user.email?.split('@')[0]?.replace(/[^a-z0-9_]/gi, '_').toLowerCase() ?? `user_${Date.now()}`
        await supabase.from('profiles').insert({
          id: data.user.id,
          username,
          display_name: data.user.user_metadata?.full_name ?? null,
          avatar_url: data.user.user_metadata?.avatar_url ?? null,
          membership_tier: 'cruiser',
        })
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
