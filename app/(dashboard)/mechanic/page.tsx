'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { ResultCards, SlideOverPanel, type RCCard } from './cards'

interface Message { role: 'user' | 'assistant'; content: string; cards?: RCCard[] }
interface Vehicle { id: string; year: number; make: string; model: string; trim: string | null; nickname: string | null; mileage: number | null; status: string }

const QUICK_PROMPTS = [
  'Find brake pads for my 2019 Mustang GT with prices',
  'What clean Fox Bodies are selling for at auction right now',
  'Find a turbo shop near me and parts for a turbo kit',
  'Show me upcoming car meets this weekend',
  'Get me insurance quotes for a 2003 Cobra SVT',
  'Find a touchless car wash near Palm Harbor FL',
  'Diagnose a check engine light on a 2015 Mustang',
  'Search live listings for a Shelby GT500 under $60k',
]

const TOOL_STATUS: Record<string, string> = {
  parts_search:    '🔩 Searching parts…',
  vendor_lookup:   '🏪 Finding vendors…',
  car_search:      '🚗 Searching listings…',
  auction_search:  '🏷️ Searching auctions…',
  car_wash_lookup: '🚿 Finding car washes…',
  insurance_lookup:'🛡️ Getting quotes…',
  events_lookup:   '📍 Finding events…',
  web_search:      '🌐 Searching the web…',
}

function buildVehicleContext(v: Vehicle): string {
  const parts = [`${v.year} ${v.make} ${v.model}`]
  if (v.trim) parts.push(v.trim)
  if (v.nickname) parts[0] = `${parts[0]} ("${v.nickname}")`
  if (v.mileage) parts.push(`${v.mileage.toLocaleString()} mi`)
  return parts.join(' · ')
}

function formatMessage(text: string) {
  return text.split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} style={{ fontWeight:700, color:'#FFD700', marginBottom:'0.5rem' }}>{line.slice(2, -2)}</p>
    if (/^\d+\./.test(line)) return <p key={i} style={{ paddingLeft:'1rem', marginBottom:'0.375rem', color:'#e0e0e0' }}>{line}</p>
    if (line.startsWith('- ') || line.startsWith('• ')) return <p key={i} style={{ paddingLeft:'1rem', marginBottom:'0.25rem', color:'#aaa' }}>{line}</p>
    if (line.startsWith('#')) return <p key={i} style={{ fontWeight:700, fontSize:'1rem', marginBottom:'0.5rem', marginTop:'0.75rem' }}>{line.replace(/^#+\s/, '')}</p>
    return line ? <p key={i} style={{ marginBottom:'0.375rem', lineHeight:1.6 }}>{line}</p> : <div key={i} style={{ height:'0.5rem' }} />
  })
}

export default function MechanicPage() {
  const { user } = useAuth()
  const supabase = createClient()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchingTool, setSearchingTool] = useState<string | null>(null)
  const [hasKey, setHasKey] = useState(true)
  const [autoSpeak, setAutoSpeak] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [activeCard, setActiveCard] = useState<RCCard | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null)

  const bottomRef = useRef<HTMLDivElement>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (!user) return
    supabase.from('vehicles').select('id,year,make,model,trim,nickname,mileage,status').eq('owner_id', user.id).order('created_at', { ascending:false })
      .then(({ data }) => { if (data?.length) { setVehicles(data as Vehicle[]); setSelectedVehicleId(data[0].id) } })
  }, [user])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
      window.speechSynthesis.onvoiceschanged = () => {}
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !text.trim()) return
    synthRef.current.cancel()
    const clean = text.replace(/\*\*(.*?)\*\*/g, '$1').replace(/#{1,6}\s/g, '').replace(/[🔧🚗🏎️🔩⚠️✓•→]/g, '').trim()
    const utt = new SpeechSynthesisUtterance(clean)
    const voices = synthRef.current.getVoices()
    const pref = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || (v.lang === 'en-US' && !v.name.includes('compact'))) || voices.find(v => v.lang.startsWith('en')) || voices[0]
    if (pref) utt.voice = pref
    utt.rate = 0.95; utt.pitch = 1.0; utt.volume = 1.0
    utt.onstart = () => setSpeaking(true)
    utt.onend = () => setSpeaking(false)
    utt.onerror = () => setSpeaking(false)
    synthRef.current.speak(utt)
  }, [])

  const stopSpeaking = useCallback(() => { synthRef.current?.cancel(); setSpeaking(false) }, [])

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
    const userMsg: Message = { role:'user', content:text }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { role:'assistant', content:'', cards:[] }])

    try {
      const res = await fetch('/api/mechanic', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ messages:[...messages, userMsg], vehicleContext }),
      })

      if (!res.ok) {
        const err = await res.json()
        if (err.error?.includes('API key') || err.error?.includes('ANTHROPIC')) setHasKey(false)
        setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content: err.error ?? 'Something went wrong.' }; return n })
        setLoading(false); return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let full = ''
      let allCards: RCCard[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        for (const line of chunk.split('\n').filter(l => l.startsWith('data: '))) {
          const raw = line.slice(6).trim()
          if (raw === '[DONE]') { setSearchingTool(null); break }
          try {
            const parsed = JSON.parse(raw)
            if (parsed.type === 'tool_use_start') {
              setSearchingTool(parsed.tool)
            } else if (parsed.type === 'rc_cards') {
              setSearchingTool(null)
              allCards = [...allCards, ...(parsed.cards ?? [])]
              setMessages(prev => { const n=[...prev]; n[n.length-1]={ ...n[n.length-1], cards: allCards }; return n })
            } else if (parsed.type === 'text_delta') {
              full += parsed.delta
              setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:full, cards:allCards }; return n })
            } else if (parsed.type === 'error') {
              full += `\n\n⚠️ ${parsed.message}`
              setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:full, cards:allCards }; return n })
            }
          } catch {}
        }
      }

      if (autoSpeak && full) speak(full)
    } catch {
      setMessages(prev => { const n=[...prev]; n[n.length-1]={ role:'assistant', content:'Connection error. Please try again.' }; return n })
    }
    setLoading(false)
  }

  const hasSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window

  return (
    <div style={{ maxWidth:'960px', margin:'0 auto', height:'calc(100vh - 8rem)', display:'flex', flexDirection:'column' }}>

      <SlideOverPanel card={activeCard} onClose={() => setActiveCard(null)} />

      {/* Persistent top search bar */}
      <div style={{ background:'#1B2A3E', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.875rem', padding:'0.625rem 1rem', marginBottom:'0.875rem', display:'flex', gap:'0.625rem', alignItems:'center' }}>
        <span style={{ fontSize:'1.1rem' }}>🔍</span>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
          placeholder="Ask the AI mechanic anything — parts, listings, vendors, events, insurance…"
          style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }}
          disabled={loading}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? 'rgba(204,0,0,0.3)':'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', border:'none', borderRadius:'0.5rem', padding:'0.45rem 1rem', fontWeight:700, fontSize:'0.85rem', cursor: loading || !input.trim() ? 'default':'pointer', whiteSpace:'nowrap' }}>
          {loading ? '…' : 'Search →'}
        </button>
      </div>

      {/* Header */}
      <div style={{ textAlign:'center', padding:'0.5rem 0 0.75rem' }}>
        <div style={{ width:'52px', height:'52px', background:'rgba(204,0,0,0.12)', border:'2px solid rgba(204,0,0,0.25)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', margin:'0 auto 0.5rem' }}>🔧</div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem' }}>
          <h1 style={{ fontSize:'1.4rem', fontWeight:800 }}>AI Mechanic</h1>
          {hasSpeech && (
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <button
                onClick={() => { setAutoSpeak(!autoSpeak); if (autoSpeak) stopSpeaking() }}
                style={{ background: autoSpeak ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.06)', border:`1px solid ${autoSpeak ? 'rgba(204,0,0,0.4)':'rgba(255,255,255,0.12)'}`, color: autoSpeak ? '#CC0000':'rgba(255,255,255,0.5)', padding:'0.35rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight: autoSpeak ? 700:400, cursor:'pointer' }}>
                {autoSpeak ? '🔊 Speaking ON' : '🔇 Auto-Speak OFF'}
              </button>
              {speaking && (
                <button onClick={stopSpeaking} style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.25)', color:'#CC0000', padding:'0.35rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer' }}>
                  ⏹ Stop
                </button>
              )}
            </div>
          )}
        </div>
        <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', marginTop:'0.2rem' }}>
          AI-Powered · ASE Master Tech · Live Platform Search{hasSpeech ? ' · 🔊 Hands-free audio' : ''}
        </p>
        <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'0.72rem', marginTop:'0.1rem' }}>
          Ask anything — I search the whole platform in real time
        </p>
      </div>

      {/* Vehicle selector */}
      {vehicles.length > 0 && (
        <div style={{ marginBottom:'0.625rem' }}>
          <p style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.35rem' }}>Working on:</p>
          <div style={{ display:'flex', gap:'0.5rem', overflowX:'auto', paddingBottom:'0.2rem' }}>
            {vehicles.map(v => {
              const active = v.id === selectedVehicleId
              return (
                <button key={v.id} onClick={() => setSelectedVehicleId(v.id)}
                  style={{ background: active ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${active ? 'rgba(204,0,0,0.4)':'rgba(255,255,255,0.1)'}`, color: active ? '#FF4444':'rgba(255,255,255,0.55)', padding:'0.35rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight: active ? 700:400, cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
                  🚗 {v.nickname ?? `${v.year} ${v.make} ${v.model}`}
                </button>
              )
            })}
            <button onClick={() => setSelectedVehicleId(null)}
              style={{ background: selectedVehicleId === null ? 'rgba(21,57,204,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${selectedVehicleId === null ? 'rgba(21,57,204,0.4)':'rgba(255,255,255,0.1)'}`, color: selectedVehicleId === null ? '#2255EE':'rgba(255,255,255,0.4)', padding:'0.35rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>
              General Question
            </button>
          </div>
        </div>
      )}

      {!hasKey && (
        <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:'0.75rem', padding:'0.75rem 1rem', marginBottom:'0.625rem', fontSize:'0.875rem', color:'#FFD700' }}>
          ⚠️ Add <code style={{ background:'rgba(0,0,0,0.3)', padding:'0.1rem 0.4rem', borderRadius:'0.25rem' }}>ANTHROPIC_API_KEY</code> to Vercel environment variables to enable the AI Mechanic.
        </div>
      )}

      {/* Chat area */}
      <div style={{ flex:1, background:'rgba(10,22,40,0.5)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', overflowY:'auto', padding:'1.25rem', marginBottom:'0.875rem', display:'flex', flexDirection:'column', gap:'1rem' }}>
        {messages.length === 0 ? (
          <div>
            <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem' }}>
              <div style={{ width:'34px', height:'34px', background:'rgba(204,0,0,0.15)', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem', flexShrink:0 }}>🔧</div>
              <div style={{ background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.75rem', borderTopLeftRadius:'0.25rem', padding:'0.875rem', maxWidth:'80%' }}>
                <p style={{ fontWeight:600, marginBottom:'0.4rem', color:'#CC0000' }}>RevConnect-1 AI Mechanic</p>
                <p style={{ color:'#ccc', lineHeight:1.6, marginBottom:'0.4rem', fontSize:'0.9rem' }}>
                  {vehicleContext
                    ? `Hey! Working on your ${vehicleContext.split(' · ')[0]}? Ask me anything — I can search for parts with live prices, find a shop near you, pull insurance quotes, find events, and more.`
                    : `Hey! I'm your AI mechanic with live access to the entire RevConnect-1 platform. I can search parts, listings, auctions, vendors, car washes, insurance, and events in real time. What are you working on?`}
                </p>
                {hasSpeech && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem' }}>💡 Enable <strong>Auto-Speak</strong> for hands-free audio in the garage.</p>}
              </div>
            </div>
            <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.28)', marginBottom:'0.625rem' }}>Try asking:</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.45rem' }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => sendMessage(p)} style={{ background:'rgba(26,26,46,0.8)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.55)', padding:'0.45rem 0.875rem', borderRadius:'9999px', fontSize:'0.78rem', cursor:'pointer' }}>{p}</button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ display:'flex', gap:'0.75rem', flexDirection: msg.role === 'user' ? 'row-reverse':'row' }}>
              <div style={{ width:'30px', height:'30px', background: msg.role === 'user' ? 'rgba(204,0,0,0.15)':'rgba(255,215,0,0.1)', border:`1px solid ${msg.role === 'user' ? 'rgba(204,0,0,0.2)':'rgba(255,215,0,0.15)'}`, borderRadius:'0.625rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', flexShrink:0 }}>
                {msg.role === 'user' ? '👤' : '🔧'}
              </div>
              <div style={{ position:'relative', maxWidth:'82%', minWidth:0 }}>
                <div style={{ background: msg.role === 'user' ? 'rgba(204,0,0,0.08)':'#1B2A3E', border:`1px solid ${msg.role === 'user' ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.07)'}`, borderRadius:'0.75rem', borderTopRightRadius: msg.role === 'user' ? '0.25rem':'0.75rem', borderTopLeftRadius: msg.role === 'user' ? '0.75rem':'0.25rem', padding:'0.875rem', fontSize:'0.9rem' }}>

                  {/* Tool result cards from cards.tsx */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div style={{ marginBottom:'0.875rem' }}>
                      <ResultCards
                        cards={msg.cards}
                        onOpen={setActiveCard}
                        onAddToGarage={addToGarage}
                        savedIds={savedIds}
                      />
                    </div>
                  )}

                  {/* Message text */}
                  {msg.role === 'assistant' ? formatMessage(msg.content) : <p style={{ lineHeight:1.6 }}>{msg.content}</p>}

                  {/* Loading state */}
                  {msg.role === 'assistant' && loading && i === messages.length - 1 && !msg.content && (
                    <div style={{ display:'flex', alignItems:'center', gap:'0.625rem' }}>
                      {searchingTool
                        ? <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.82rem' }}>{TOOL_STATUS[searchingTool] ?? `🔍 Searching ${searchingTool}…`}</span>
                        : <span style={{ display:'inline-flex', gap:'0.3rem' }}>{[0,1,2].map(n => <span key={n} style={{ width:'6px', height:'6px', background:'#CC0000', borderRadius:'50%', opacity:0.7 }}>·</span>)}</span>
                      }
                    </div>
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

      {/* Vehicle context indicator */}
      {vehicleContext && (
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.4rem', fontSize:'0.72rem', color:'rgba(255,255,255,0.3)' }}>
          <span style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.2)', color:'#FF4444', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.68rem', fontWeight:600 }}>
            🚗 {vehicleContext}
          </span>
          <span>context injected</span>
        </div>
      )}

      {/* Bottom chat input */}
      <div style={{ display:'flex', gap:'0.75rem' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage(input))}
            placeholder={vehicleContext ? `Ask about your ${selectedVehicle?.make} ${selectedVehicle?.model}…` : 'Ask about parts, listings, vendors, events, insurance…'}
            style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }}
            disabled={loading}
          />
        </div>
        <button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          style={{ background: loading || !input.trim() ? '#1E3A5F':'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', border:'none', width:'48px', height:'48px', borderRadius:'0.875rem', fontSize:'1.25rem', cursor: loading || !input.trim() ? 'default':'pointer', boxShadow: loading || !input.trim() ? 'none':'0 4px 16px rgba(204,0,0,0.4)', flexShrink:0 }}>
          {loading ? '⏳' : '→'}
        </button>
      </div>
      <p style={{ textAlign:'center', fontSize:'0.68rem', color:'rgba(255,255,255,0.2)', marginTop:'0.4rem' }}>Safety-critical work should always be verified by a professional.</p>
    </div>
  )
}
