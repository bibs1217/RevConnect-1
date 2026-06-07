import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const svc  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  const env = {
    NEXT_PUBLIC_SUPABASE_URL:      url  ? url.slice(0, 30) + '…'  : 'MISSING',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anon ? anon.slice(0, 12) + '…' : 'MISSING',
    SUPABASE_SERVICE_ROLE_KEY:     svc  ? svc.slice(0, 12) + '…'  : 'MISSING',
  }

  if (!url || !anon) {
    return NextResponse.json({ env, error: 'Missing Supabase env vars', count: null, sample: null })
  }

  // Use anon key — same as the browser client on the events page
  const supabase = createClient(url, anon)
  const { data, error } = await supabase
    .from('events')
    .select('id, title, city, state, starts_at, is_published, is_cancelled')
    .limit(5)

  return NextResponse.json({
    env,
    count: data?.length ?? null,
    error: error?.message ?? null,
    sample: data ?? null,
  })
}
