'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
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
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [voicesReady, setVoicesReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      // Load voices
      const loadVoices = () => { if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true) }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !text.trim()) return
    synthRef.current.cancel()
    // Clean text — remove markdown, emojis that TTS reads awkwardly
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[🔧🚗🏎️🔩⚠️✓•→]/g, '')
      .replace(/\d+\./g, (m) => m) // keep numbered steps
      .trim()
    const utterance = new SpeechSynthesisUtterance(clean)
    // Pick a good voice — prefer a natural English voice
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Samantha') ||
      v.name.includes('Alex') ||
      (v.lang === 'en-US' && !v.name.includes('compact'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
    if (preferred) utterance.voice = preferred
    utterance.rate = 0.95
    utterance.pitch = 1.0
    utterance.volume = 1.0
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setSpeaking(false)
  }, [])

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    const assistantMsg: Message = { role: 'assistant', content: '' }
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
        setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content: err.error ?? 'Something went wrong.' }; return n })
        setLoading(false); return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const delta = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
            full += delta
            setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:full }; return n })
          } catch {}
        }
      }
      // Auto-speak the full response if enabled
      if (autoSpeak && full) speak(full)
    } catch {
      setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:'Connection error.' }; return n })
    }
    setLoading(false)
  }

  function formatMessage(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight:700, color:'#FFD700', marginBottom:'0.5rem' }}>{line.slice(2,-2)}</p>
      if (/^\d+\./.test(line)) return <p key={i} style={{ paddingLeft:'1rem', marginBottom:'0.375rem', color:'#e0e0e0' }}>{line}</p>
      if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} style={{ paddingLeft:'1rem', marginBottom:'0.25rem', color:'#aaa' }}>{line}</p>
      if (line.startsWith('#')) return <p key={i} style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.5rem', marginTop:'0.75rem' }}>{line.replace(/^#+\s/, '')}</p>
      return line ? <p key={i} style={{ marginBottom:'0.375rem', lineHeight:1.6 }}>{line}</p> : <div key={i} style={{ height:'0.5rem' }} />
    })
  }

  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window

  return (
    <div style={{ maxWidth:'900px', margin:'0 auto', height:'calc(100vh - 8rem)', display:'flex', flexDirection:'column' }}>

      {/* Header */}
      <div style={{ textAlign:'center', padding:'1rem 0 1.25rem' }}>
        <div style={{ width:'64px', height:'64px', background:'rgba(204,0,0,0.12)', border:'2px solid rgba(204,0,0,0.25)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', margin:'0 auto 0.75rem' }}>🔧</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:800 }}>AI Mechanic</h1>
          {/* Audio toggle */}
          {hasSpeech && (
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <button
                onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) stopSpeaking() }}
                title={autoSpeak ? 'Auto-speak ON — click to turn off' : 'Auto-speak OFF — click to enable'}
                style={{ background: autoSpeak ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${autoSpeak ? 'rgba(204,0,0,0.4)':'rgba(255,255,255,0.12)'}`, color: autoSpeak ? '#CC0000':'rgba(255,255,255,0.5)', padding:'0.375rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight: autoSpeak ? 700:400, cursor:'pointer', display:'flex', alignItems:'center', gap:'0.375rem' }}>
                {autoSpeak ? '🔊 Speaking ON' : '🔇 Auto-Speak OFF'}
              </button>
              {speaking && (
                <button onClick={stopSpeaking} style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.25)', color:'#CC0000', padding:'0.375rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer' }}>
                  ⏹ Stop
                </button>
              )}
            </div>
          )}
        </div>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem', marginTop:'0.25rem' }}>
          Your personal 30-year ASE master tech · 24/7 · {hasSpeech ? 'Hands-free audio available 🔊' : ''}
        </p>
      </div>

      {!hasKey && (
        <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'1rem', fontSize:'0.875rem', color:'#FFD700' }}>
          ⚠️ Add <code style={{ background:'rgba(0,0,0,0.3)', padding:'0.1rem 0.4rem', borderRadius:'0.25rem' }}>OPENAI_API_KEY</code> to Vercel environment variables to enable the AI Mechanic.
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex:1, background:'rgba(10,22,40,0.5)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', overflowY:'auto', padding:'1.5rem', marginBottom:'1rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        {messages.length === 0 ? (
          <div>
            <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div style={{ width:'36px', height:'36px', background:'rgba(204,0,0,0.15)', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>🔧</div>
              <div style={{ background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.75rem', borderTopLeftRadius:'0.25rem', padding:'1rem', maxWidth:'80%' }}>
                <p style={{ fontWeight:600, marginBottom:'0.5rem', color:'#CC0000' }}>RevConnect-1 AI Mechanic</p>
                <p style={{ color:'#ccc', lineHeight:1.6, marginBottom:'0.5rem' }}>Hey! I'm your personal master mechanic. Tell me what vehicle you're working on and what you need help with.</p>
                {hasSpeech && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>💡 Tip: Enable <strong>Auto-Speak</strong> above for hands-free audio while you work in the garage.</p>}
              </div>
            </div>
            <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.75rem' }}>Quick questions:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{ background:'rgba(26,26,46,0.8)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', padding:'0.5rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer' }}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:'0.75rem', flexDirection: msg.role === 'user' ? 'row-reverse':'row' }}>
              <div style={{ width:'32px', height:'32px', background: msg.role==='user' ? 'rgba(204,0,0,0.15)':'rgba(255,215,0,0.1)', border:`1px solid ${msg.role==='user' ? 'rgba(204,0,0,0.2)':'rgba(255,215,0,0.15)'}`, borderRadius:'0.625rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                {msg.role === 'user' ? '👤' : '🔧'}
              </div>
              <div style={{ position:'relative', maxWidth:'80%' }}>
                <div style={{ background: msg.role==='user' ? 'rgba(204,0,0,0.08)':'#1B2A3E', border:`1px solid ${msg.role==='user' ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.07)'}`, borderRadius:'0.75rem', borderTopRightRadius: msg.role==='user' ? '0.25rem':'0.75rem', borderTopLeftRadius: msg.role==='user' ? '0.75rem':'0.25rem', padding:'0.875rem 1rem', fontSize:'0.9rem' }}>
                  {msg.role === 'assistant' ? formatMessage(msg.content) : <p style={{ lineHeight:1.6 }}>{msg.content}</p>}
                  {msg.role === 'assistant' && loading && i === messages.length - 1 && !msg.content && (
                    <span style={{ display:'inline-flex', gap:'0.3rem' }}>
                      {[0,1,2].map(n => <span key={n} style={{ width:'6px', height:'6px', background:'#CC0000', borderRadius:'50%' }}>·</span>)}
                    </span>
                  )}
                </div>
                {/* Speak button on assistant messages */}
                {msg.role === 'assistant' && msg.content && hasSpeech && (
                  <button
                    onClick={() => speaking ? stopSpeaking() : speak(msg.content)}
                    title={speaking ? 'Stop speaking' : 'Read aloud'}
                    style={{ position:'absolute', bottom:'-1.5rem', right:0, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.25rem', whiteSpace:'nowrap' }}>
                    {speaking ? '⏹ Stop' : '🔊 Listen'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} style={{ height:'2rem' }} />
      </div>

      {/* Input */}
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder="Ask about your vehicle… (e.g. 'My 2022 WRX needs new brake pads')"
            style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }}
            disabled={loading}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? '#1E3A5F':'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', width:'48px', height:'48px', borderRadius:'0.875rem', fontSize:'1.25rem', cursor: loading || !input.trim() ? 'default':'pointer', boxShadow: loading || !input.trim() ? 'none':'0 4px 16px rgba(204,0,0,0.4)' }}>
          {loading ? '⏳' : '→'}
        </button>
      </div>
      <p style={{ textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', marginTop:'0.5rem' }}>Safety-critical work should always be verified by a professional.</p>
    </div>
  )
}
