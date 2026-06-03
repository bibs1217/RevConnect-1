'use client'

import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/app/providers/auth-provider'

interface Message { role: 'user' | 'assistant'; content: string }

const QUICK_PROMPTS = [
  'How do I replace brake pads on my car?',
  'Walk me through a coilover installation',
  'How do I install a short throw shifter?',
  'Help me diagnose a check engine light',
  'How do I install an aftermarket head unit?',
  'What tools do I need for a clutch replacement?',
  'How do I do a turbo install?',
  'Walk me through big brake kit installation',
]

export default function MechanicPage() {
  const { profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey, setHasKey] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role:'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    const assistantMsg: Message = { role:'assistant', content:'' }
    setMessages(prev => [...prev, assistantMsg])

    try {
      const res = await fetch('/api/mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], vehicleContext: null })
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error?.includes('API key')) setHasKey(false)
        setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content: err.error ?? 'Something went wrong. Please try again.' }; return n })
        setLoading(false); return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
        for (const line of lines) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices?.[0]?.delta?.content ?? ''
            full += delta
            setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:full }; return n })
          } catch {}
        }
      }
    } catch (err) {
      setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:'Connection error. Please check your internet and try again.' }; return n })
    }
    setLoading(false)
  }

  function formatMessage(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight:700, color:'#FACC15', marginBottom:'0.5rem' }}>{line.slice(2,-2)}</p>
      if (/^\d+\./.test(line)) return <p key={i} style={{ paddingLeft:'1rem', marginBottom:'0.375rem', color:'#e0e0e0' }}>{line}</p>
      if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} style={{ paddingLeft:'1rem', marginBottom:'0.25rem', color:'#aaa' }}>{line}</p>
      if (line.startsWith('#')) return <p key={i} style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.5rem', marginTop:'0.75rem' }}>{line.replace(/^#+\s/, '')}</p>
      return line ? <p key={i} style={{ marginBottom:'0.375rem', lineHeight:1.6 }}>{line}</p> : <div key={i} style={{ height:'0.5rem' }} />
    })
  }

  return (
    <div style={{ maxWidth:'900px', margin:'0 auto', height:'calc(100vh - 8rem)', display:'flex', flexDirection:'column' }}>
      {/* Header */}
      <div style={{ textAlign:'center', padding:'1rem 0 1.5rem' }}>
        <div style={{ width:'64px', height:'64px', background:'rgba(230,57,70,0.1)', border:'2px solid rgba(230,57,70,0.2)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 0.75rem' }}>🔧</div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:800 }}>AI Mechanic</h1>
        <p style={{ color:'#666', fontSize:'0.875rem' }}>Your personal 30-year ASE master tech — available 24/7</p>
      </div>

      {!hasKey && (
        <div style={{ background:'rgba(244,162,97,0.1)', border:'1px solid rgba(244,162,97,0.3)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', fontSize:'0.875rem', color:'#FACC15' }}>
          ⚠️ OpenAI API key not configured. Go to Vercel → Settings → Environment Variables and add <code style={{ background:'rgba(0,0,0,0.3)', padding:'0.1rem 0.4rem', borderRadius:'0.25rem' }}>OPENAI_API_KEY</code> to enable the AI Mechanic.
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex:1, background:'rgba(13,27,42,0.4)', border:'1px solid #1E3A5F', borderRadius:'1rem', overflowY:'auto', padding:'1.5rem', marginBottom:'1rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        {messages.length === 0 ? (
          <div>
            <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div style={{ width:'36px', height:'36px', background:'rgba(230,57,70,0.15)', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>🔧</div>
              <div style={{ background:'#0D1B2A', border:'1px solid #1E3A5F', borderRadius:'0.75rem', borderTopLeftRadius:'0.25rem', padding:'1rem', maxWidth:'80%' }}>
                <p style={{ fontWeight:600, marginBottom:'0.5rem', color:'#E63946' }}>RevConnect-1 AI Mechanic</p>
                <p style={{ color:'#ccc', lineHeight:1.6 }}>Hey! I&apos;m your personal master mechanic. Tell me what vehicle you&apos;re working on and what you need help with — I&apos;ll walk you through every step with torque specs, wiring diagrams, and everything you need.</p>
              </div>
            </div>
            <p style={{ fontSize:'0.75rem', color:'#555', marginBottom:'0.75rem' }}>Try asking:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{ background:'rgba(13,27,42,0.8)', border:'1px solid #1E3A5F', color:'#aaa', padding:'0.5rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer' }}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:'0.75rem', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{ width:'32px', height:'32px', background: msg.role === 'user' ? 'rgba(230,57,70,0.15)' : 'rgba(244,162,97,0.12)', border:`1px solid ${msg.role === 'user' ? 'rgba(230,57,70,0.2)' : 'rgba(244,162,97,0.15)'}`, borderRadius:'0.625rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                {msg.role === 'user' ? '👤' : '🔧'}
              </div>
              <div style={{ background: msg.role === 'user' ? 'rgba(230,57,70,0.08)' : '#0D1B2A', border:`1px solid ${msg.role === 'user' ? 'rgba(230,57,70,0.15)' : '#1E3A5F'}`, borderRadius:'0.75rem', borderTopRightRadius: msg.role === 'user' ? '0.25rem' : '0.75rem', borderTopLeftRadius: msg.role === 'user' ? '0.75rem' : '0.25rem', padding:'0.875rem 1rem', maxWidth:'80%', fontSize:'0.9rem' }}>
                {msg.role === 'assistant' ? formatMessage(msg.content) : <p style={{ lineHeight:1.6 }}>{msg.content}</p>}
                {msg.role === 'assistant' && loading && i === messages.length - 1 && !msg.content && (
                  <span style={{ display:'inline-flex', gap:'0.3rem' }}>
                    {[0,1,2].map(n => <span key={n} style={{ width:'6px', height:'6px', background:'#E63946', borderRadius:'50%', animation:'pulse 1s ease-in-out infinite', animationDelay:`${n*0.15}s` }}>·</span>)}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#0D1B2A', border:'1px solid #1E3A5F', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))} placeholder="Ask about your vehicle… (e.g. 'My 2022 WRX needs new brake pads')" style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }} disabled={loading} />
        </div>
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} style={{ background: loading || !input.trim() ? '#333' : '#E63946', color:'white', border:'none', width:'48px', height:'48px', borderRadius:'0.875rem', fontSize:'1.25rem', cursor: loading || !input.trim() ? 'default' : 'pointer', transition:'background 0.15s' }}>
          {loading ? '⏳' : '→'}
        </button>
      </div>
      <p style={{ textAlign:'center', fontSize:'0.7rem', color:'#444', marginTop:'0.5rem' }}>Always verify safety-critical work with a professional. RevConnect AI is for guidance only.</p>
    </div>
  )
}
