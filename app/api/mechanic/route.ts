import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const { messages, vehicleContext } = await req.json()

  const systemPrompt = `You are RevConnect-1's AI Mechanic — a master ASE-certified technician with 30+ years of experience. You have deep knowledge of every vehicle make and model, performance modifications, car audio, diagnostics, and all automotive systems.

${vehicleContext ? `The user's current vehicle: ${vehicleContext}` : 'No vehicle selected yet — ask what they\'re working on.'}

Your approach:
- Always confirm the specific vehicle before giving advice
- Provide step-by-step numbered instructions with torque specs where relevant  
- Rate job difficulty 1-10 and list required tools upfront
- Warn about safety hazards clearly
- Include wiring diagrams / wire colors for electrical work
- Know when to recommend a professional shop
- Be conversational but precise — like a knowledgeable friend in the garage

Format installation guides with: Difficulty rating, Tools needed, Safety notes, numbered steps, and a verification checklist.`

  if (!process.env.OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: 'OpenAI API key not configured. Add OPENAI_API_KEY to Vercel environment variables.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    })
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      stream: true,
      max_tokens: 2048,
      temperature: 0.7,
    })
  })

  if (!response.ok) {
    const error = await response.text()
    return new Response(JSON.stringify({ error }), { status: response.status, headers: { 'Content-Type': 'application/json' } })
  }

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
}
