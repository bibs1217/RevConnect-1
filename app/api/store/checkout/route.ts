import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest) {
  return NextResponse.json({ url: null, error: 'Configure Stripe keys to enable checkout' })
}
