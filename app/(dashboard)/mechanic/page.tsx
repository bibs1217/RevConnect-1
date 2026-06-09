'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { ResultCards, SlideOverPanel, TOOL_LABELS, type RCCard } from './cards'

interface Message {
  role: 'user' | 'assistant'
  content: string
  cards?: RCCard[]
  searching?: string[]
}

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
  nickname: string | null
  mileage: number | null
  status: string
}

const QUICK_PROMPTS = [
  '🔩 Find brake pads for my car',
  '🏁 Show me Supra auctions ending soon',
  '🚗 Find a manual WRX under $30k',
  '🔧 Walk me through a coilover installation',
  '🛡️ What would insurance cost on my car?',
  '📍 Find car meets near Orlando, FL',
  '🏪 Which vendors have member discounts?',
  '🚿 Find a coating-safe car wash near me',
]

function buildVehicleContext(v: Vehicle): string {
  const parts = [`${v.year} ${v.make} ${v.model}`]
  if (v.trim) parts.push(v.trim)
  if (v.nickname) parts[0] = `${parts[0]} (aka "${v.nickname}")`
  if (v.mileage) parts.push(`${v.mileage.toLocaleString()} miles`)
  if (v.status) parts.push(`Status: ${v.status}`)
  return parts.join(' — ')
}

export default function MechanicPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [topSearch, setTopSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey, setHasKey] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [panelCard, setPanelCard] = useState<RCCard | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  // Fetch user's garage vehicles
  useEffect(() => {
    if (!user) return
    supabase
      .from('vehicles')
      .select('id, year, make, model, trim, nickname, mileage, status')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setVehicles(data as Vehicle[])
          setSelectedVehicleId(data[0].id)
        }
      })
  }, [user])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Flag an active conversation so the nav layout asks before leaving
  useEffect(() => {
    ;(window as any).__rcChatActive = messages.length > 0
    return () => { (window as any).__rcChatActive = false }
  }, [messages.length])

  // Speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      const loadVoices = () => { if (window.speechSynthesis.getVoices().length > 0) {} }
      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !text.trim()) return
    synthRef.current.cancel()
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[🔧🚗🏎️🔩⚠️✓•→]/g, '')
      .trim()
    const utterance = new SpeechSynthesisUtterance(clean)
    const voices = synthRef.current.getVoices()
    const preferred = voices.find(v =>
      v.name.includes('Google US English') ||
      v.name.includes('Samantha') ||
      v.name.includes('Alex') ||
      (v.lang === 'en-US' && !v.name.includes('compact'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0]
    if (preferred) utterance.voice = preferred
    utterance.rate = 0.95
    utterance.onstart = () => setSpeaking(true)
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    synthRef.current.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel()
    setSpeaking(false)
  }, [])

  const selectedVehicle = vehicles.find(v => v.id === selectedVehicleId) ?? null
  const vehicleContext = selectedVehicle ? buildVehicleContext(selectedVehicle) : null

  async function addToGarage(card: RCCard) {
    if (!user) { alert('Sign in to save parts to your garage.'); return }
    if (!selectedVehicleId) { alert('Add a vehicle to your garage first, then select it above.'); return }
    const { error } = await supabase.from('vehicle_modifications').insert({
      vehicle_id: selectedVehicleId,
      category: 'Planned',
      part_name: card.title.slice(0, 200),
      brand: card.brand ?? null,
      source: card.source ?? 'RevConnect AI',
      source_url: card.url ?? null,
      cost: card.price ?? null,
      is_diy: true,
      notes: 'Saved from RevConnect-1 AI chat',
    })
    if (error) { alert(`Could not save: ${error.message}`); return }
    setSavedIds(prev => new Set(prev).add(card.id))
  }

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text.trim() }
    const history = [...messages, userMsg]
    setMessages([...history, { role: 'assistant', content: '' }])
    setInput('')
    setTopSearch('')
    setLoading(true)

    const patchLast = (fn: (m: Message) => Message) =>
      setMessages(prev => { const n = [...prev]; n[n.length - 1] = fn(n[n.length - 1]); return n })

    try {
      const res = await fetch('/api/mechanic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.map(m => ({ role: m.role, content: m.content })),
          vehicleContext,
        })
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Something went wrong.' }))
        if (err.error?.includes('API key')) setHasKey(false)
        patchLast(() => ({ role: 'assistant', content: err.error ?? 'Something went wrong.' }))
        setLoading(false); return
      }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let buf = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data || data === '[DONE]') continue
          let j: any
          try { j = JSON.parse(data) } catch { continue }
          if (j.rc_status) {
            patchLast(m => ({ ...m, searching: j.rc_status }))
            continue
          }
          if (j.rc_cards) {
            patchLast(m => ({ ...m, searching: undefined, cards: [...(m.cards ?? []), ...j.rc_cards] }))
            continue
          }
          const delta = j.choices?.[0]?.delta?.content ?? ''
          if (delta) {
            full += delta
            patchLast(m => ({ ...m, content: full, searching: undefined }))
          }
        }
      }
      if (autoSpeak && full) speak(full)
    } catch {
      patchLast(m => ({ ...m, content: m.content || 'Connection error.' }))
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

      {/* Header — RevConnect-1 AI */}
      <div style={{ textAlign:'center', padding:'0.75rem 0' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
          <h1 style={{ fontSize:'1.6rem', fontWeight:900, letterSpacing:'-0.5px' }}>
            <span style={{ color:'white' }}>Rev</span>
            <span className="chrome-text">Connect</span>
            <span style={{ color:'#FFD700' }}>-1</span>
            <span style={{ color:'#CC0000', marginLeft:'0.5rem' }}>AI</span>
          </h1>
          {hasSpeech && (
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <button
                onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) stopSpeaking() }}
                style={{ background: autoSpeak ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${autoSpeak ? 'rgba(204,0,0,0.4)':'rgba(255,255,255,0.12)'}`, color: autoSpeak ? '#CC0000':'rgba(255,255,255,0.5)', padding:'0.375rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight: autoSpeak ? 700:400, cursor:'pointer' }}>
                {autoSpeak ? '🔊 Speaking ON' : '🔇 Auto-Speak OFF'}
              </button>
              {speaking && (
                <button onClick={stopSpeaking} style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.25)', color:'#CC0000', padding:'0.375rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer' }}>⏹ Stop</button>
              )}
            </div>
          )}
        </div>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.85rem', marginTop:'0.2rem', fontWeight:600 }}>
          Your entire platform. One conversation.
        </p>
      </div>

      {/* Persistent search bar — fires a chat message, never navigates */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.75rem' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#0F1C2E', border:'1px solid rgba(255,215,0,0.18)', borderRadius:'0.75rem', padding:'0.55rem 0.875rem' }}>
          <span style={{ color:'rgba(255,255,255,0.35)' }}>🔍</span>
          <input
            value={topSearch}
            onChange={e => setTopSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && topSearch.trim() && sendMessage(topSearch)}
            placeholder="Search parts, cars, vendors, events, auctions, insurance…"
            style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.85rem', outline:'none' }}
            disabled={loading}
          />
        </div>
        <button
          onClick={() => topSearch.trim() && sendMessage(topSearch)}
          disabled={loading || !topSearch.trim()}
          style={{ background: loading || !topSearch.trim() ? '#1E3A5F' : 'rgba(255,215,0,0.9)', color:'#0D1E30', border:'none', padding:'0 1.25rem', borderRadius:'0.75rem', fontSize:'0.85rem', fontWeight:800, cursor: loading || !topSearch.trim() ? 'default':'pointer' }}>
          Search
        </button>
      </div>

      {/* Vehicle selector */}
      {vehicles.length > 0 && (
        <div style={{ marginBottom:'0.75rem' }}>
          <div style={{ display:'flex', gap:'0.5rem', overflowX:'auto', paddingBottom:'0.25rem' }}>
            {vehicles.map(v => {
              const active = v.id === selectedVehicleId
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicleId(v.id)}
                  style={{ background: active ? 'rgba(204,0,0,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${active ? 'rgba(204,0,0,0.4)' : 'rgba(255,255,255,0.1)'}`, color: active ? '#FF4444' : 'rgba(255,255,255,0.55)', padding:'0.375rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight: active ? 700 : 400, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  🚗 {v.nickname ?? `${v.year} ${v.make} ${v.model}`}
                </button>
              )
            })}
            <button
              onClick={() => setSelectedVehicleId(null)}
              style={{ background: selectedVehicleId === null ? 'rgba(21,57,204,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${selectedVehicleId === null ? 'rgba(21,57,204,0.4)' : 'rgba(255,255,255,0.1)'}`, color: selectedVehicleId === null ? '#2255EE' : 'rgba(255,255,255,0.4)', padding:'0.375rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              General Question
            </button>
          </div>
        </div>
      )}

      {!hasKey && (
        <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'0.75rem', fontSize:'0.875rem', color:'#FFD700' }}>
          ⚠️ Add <code style={{ background:'rgba(0,0,0,0.3)', padding:'0.1rem 0.4rem', borderRadius:'0.25rem' }}>OPENAI_API_KEY</code> to Vercel environment variables to enable RevConnect-1 AI.
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex:1, background:'rgba(10,22,40,0.5)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', overflowY:'auto', padding:'1.5rem', marginBottom:'1rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        {messages.length === 0 ? (
          <div>
            <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div style={{ width:'36px', height:'36px', background:'rgba(204,0,0,0.15)', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>⚡</div>
              <div style={{ background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.75rem', borderTopLeftRadius:'0.25rem', padding:'1rem', maxWidth:'80%' }}>
                <p style={{ fontWeight:600, marginBottom:'0.5rem', color:'#CC0000' }}>RevConnect-1 AI</p>
                {vehicleContext
                  ? <p style={{ color:'#ccc', lineHeight:1.6, marginBottom:'0.5rem' }}>Hey! I see you're working on your <strong style={{ color:'white' }}>{vehicleContext.split(' — ')[0]}</strong>. Ask me anything — repairs, parts, cars for sale, auctions, events, insurance, vendors. Results show up right here in the chat.</p>
                  : <p style={{ color:'#ccc', lineHeight:1.6, marginBottom:'0.5rem' }}>Hey! I'm your one conversation for the entire platform — repairs and diagnostics, live parts and car searches, auctions, local events, insurance quotes, vendors, and car washes. What do you need?</p>
                }
                {hasSpeech && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>💡 Tip: Enable <strong>Auto-Speak</strong> above for hands-free audio while you work in the garage.</p>}
              </div>
            </div>
            <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.75rem' }}>Try one:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p.replace(/^\S+\s/, ''))} style={{ background:'rgba(26,26,46,0.8)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', padding:'0.5rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer' }}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:'0.75rem', flexDirection: msg.role === 'user' ? 'row-reverse':'row' }}>
              <div style={{ width:'32px', height:'32px', background: msg.role==='user' ? 'rgba(204,0,0,0.15)':'rgba(255,215,0,0.1)', border:`1px solid ${msg.role==='user' ? 'rgba(204,0,0,0.2)':'rgba(255,215,0,0.15)'}`, borderRadius:'0.625rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                {msg.role === 'user' ? '👤' : '⚡'}
              </div>
              <div style={{ position:'relative', maxWidth:'85%', minWidth: msg.cards?.length ? '60%' : undefined }}>
                <div style={{ background: msg.role==='user' ? 'rgba(204,0,0,0.08)':'#1B2A3E', border:`1px solid ${msg.role==='user' ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.07)'}`, borderRadius:'0.75rem', borderTopRightRadius: msg.role==='user' ? '0.25rem':'0.75rem', borderTopLeftRadius: msg.role==='user' ? '0.75rem':'0.25rem', padding:'0.875rem 1rem', fontSize:'0.9rem' }}>
                  {msg.role === 'assistant' ? formatMessage(msg.content) : <p style={{ lineHeight:1.6 }}>{msg.content}</p>}

                  {/* live tool status */}
                  {msg.searching && (
                    <p style={{ color:'#FFD700', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'0.25rem' }}>
                      <span className="rc-spin" style={{ display:'inline-block' }}>⚙️</span>
                      {msg.searching.map(s => TOOL_LABELS[s] ?? s).join(' ')}
                    </p>
                  )}

                  {/* inline result cards */}
                  {msg.cards && msg.cards.length > 0 && (
                    <ResultCards cards={msg.cards} onOpen={setPanelCard} onAddToGarage={addToGarage} savedIds={savedIds} />
                  )}

                  {msg.role === 'assistant' && loading && i === messages.length - 1 && !msg.content && !msg.searching && (
                    <span style={{ display:'inline-flex', gap:'0.3rem' }}>
                      {[0,1,2].map(n => <span key={n} style={{ width:'6px', height:'6px', background:'#CC0000', borderRadius:'50%' }}>·</span>)}
                    </span>
                  )}
                </div>
                {msg.role === 'assistant' && msg.content && hasSpeech && (
                  <button
                    onClick={() => speaking ? stopSpeaking() : speak(msg.content)}
                    style={{ position:'absolute', bottom:'-1.5rem', right:0, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                    {speaking ? '⏹ Stop' : '🔊 Listen'}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} style={{ height:'2rem' }} />
      </div>

      {/* Active vehicle context indicator */}
      {vehicleContext && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', fontSize:'0.75rem', color:'rgba(255,255,255,0.35)' }}>
          <span style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.2)', color:'#FF4444', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:600 }}>
            🚗 {vehicleContext}
          </span>
          <span>injected into every message</span>
        </div>
      )}

      {/* Input */}
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder={vehicleContext ? `Ask anything — repairs, parts, auctions… (${selectedVehicle?.make} ${selectedVehicle?.model} selected)` : 'Ask anything — repairs, parts for sale, auctions, events, insurance…'}
            style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }}
            disabled={loading}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? '#1E3A5F':'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', width:'48px', height:'48px', borderRadius:'0.875rem', fontSize:'1.25rem', cursor: loading || !input.trim() ? 'default':'pointer', boxShadow: loading || !input.trim() ? 'none':'0 4px 16px rgba(204,0,0,0.4)', flexShrink:0 }}>
          {loading ? '⏳' : '→'}
        </button>
      </div>
      <p style={{ textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', marginTop:'0.5rem' }}>Safety-critical work should always be verified by a professional.</p>

      <style>{`@keyframes rcSpin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } } .rc-spin { animation: rcSpin 1.2s linear infinite }`}</style>

      {/* Slide-over panel — chat stays visible and scrollable behind it */}
      <SlideOverPanel card={panelCard} onClose={() => setPanelCard(null)} />
    </div>
  )
}
