import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.SETUP_SECRET && secret !== 'revconnect2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectRef = 'likxahlegjguyowcfvzr'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    return NextResponse.json({ error: 'Missing service role key' }, { status: 400 })
  }

  // Update Supabase auth config via Admin API
  const res = await fetch(`https://${projectRef}.supabase.co/auth/v1/admin/config`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      'apikey': serviceKey,
    },
    body: JSON.stringify({
      site_url: 'https://rev-connect-1.vercel.app',
      uri_allow_list: 'https://rev-connect-1.vercel.app/**,https://rev-connect-1.vercel.app/auth/callback,http://localhost:3000/**',
      mailer_autoconfirm: false,
      sms_autoconfirm: true,
    })
  })

  const data = await res.json()
  return NextResponse.json({ status: res.status, result: data })
}
