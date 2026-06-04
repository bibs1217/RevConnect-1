import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 })

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KE ?? ''
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vthpgqhlhihnoeawjdyc.supabase.co'

  if (!serviceKey) return NextResponse.json({ skipped: true, reason: 'no service key' })

  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
    },
    body: JSON.stringify({ email_confirm: true })
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: data.message ?? 'Failed' }, { status: 500 })
  return NextResponse.json({ success: true })
}
