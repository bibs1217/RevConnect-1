'use client'

import { useEffect, useState } from 'react'

/* ────────────────────────────────────────────────────────────────────────
   Inline result cards + SlideOverPanel for RevConnect-1 AI.
   Everything stays in the conversation — primary actions open the
   slide-over panel (bottom sheet on mobile); nothing navigates away.
   ──────────────────────────────────────────────────────────────────────── */

export interface RCCard {
  type: 'part' | 'vehicle' | 'auction' | 'vendor' | 'event' | 'insurance' | 'carwash'
  id: string
  title: string
  subtitle?: string
  image?: string | null
  icon?: string
  priceLabel?: string
  meta?: string[]
  url?: string | null
  mapsUrl?: string | null
  description?: string
  badge?: string
  brand?: string | null
  price?: number | null
  source?: string
  fullPage: { label: string; href: string }
  detail?: Record<string, string>
}

const TYPE_META: Record<RCCard['type'], { label: string; color: string; action: string; fallbackIcon: string }> = {
  part:      { label: 'Part',     color: '#CC0000', action: 'Buy Now',        fallbackIcon: '🔩' },
  vehicle:   { label: 'For Sale', color: '#3399FF', action: 'View Listing',   fallbackIcon: '🚗' },
  auction:   { label: 'Auction',  color: '#FFD700', action: 'Watch Auction',  fallbackIcon: '🏁' },
  vendor:    { label: 'Vendor',   color: '#CC0000', action: 'View Vendor',    fallbackIcon: '🏪' },
  event:     { label: 'Event',    color: '#1539CC', action: 'RSVP / Details', fallbackIcon: '📍' },
  insurance: { label: 'Insurance',color: '#a855f7', action: 'Get Full Quote', fallbackIcon: '🛡️' },
  carwash:   { label: 'Car Wash', color: '#22c55e', action: 'Details',        fallbackIcon: '🚿' },
}

export const TOOL_LABELS: Record<string, string> = {
  search_parts: 'Searching parts…',
  search_cars: 'Searching cars for sale…',
  search_auctions: 'Searching auctions…',
  search_vendors: 'Searching vendors…',
  search_events: 'Finding events…',
  get_insurance_quotes: 'Getting insurance quotes…',
  search_car_washes: 'Finding car washes…',
}

/* ── single card ── */
function Card({ card, onOpen, onAddToGarage, savedIds }: {
  card: RCCard
  onOpen: (c: RCCard) => void
  onAddToGarage?: (c: RCCard) => void
  savedIds?: Set<string>
}) {
  const t = TYPE_META[card.type]
  const saved = savedIds?.has(card.id)
  return (
    <div style={{ background:'#0F1C2E', border:'1px solid rgba(255,255,255,0.09)', borderRadius:'0.75rem', overflow:'hidden', width:'250px', flexShrink:0, display:'flex', flexDirection:'column' }}>
      {/* image / icon area */}
      <div style={{ height:'110px', background:'rgba(255,255,255,0.03)', position:'relative', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        {card.image
          ? <img src={card.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
          : <span style={{ fontSize:'2.5rem' }}>{card.icon ?? t.fallbackIcon}</span>}
        <span style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:'rgba(0,0,0,0.65)', color:t.color, fontSize:'0.6rem', fontWeight:800, padding:'0.15rem 0.5rem', borderRadius:'9999px', letterSpacing:'0.5px', textTransform:'uppercase' }}>{t.label}</span>
        {card.badge && <span style={{ position:'absolute', bottom:'0.5rem', left:'0.5rem', background:'rgba(255,215,0,0.92)', color:'#000', fontSize:'0.65rem', fontWeight:800, padding:'0.15rem 0.5rem', borderRadius:'0.375rem' }}>{card.badge}</span>}
      </div>

      <div style={{ padding:'0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem', flex:1 }}>
        <p style={{ fontSize:'0.82rem', fontWeight:700, lineHeight:1.35, color:'white', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{card.title}</p>
        {card.subtitle && <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.45)' }}>{card.subtitle}</p>}
        {card.priceLabel && <p style={{ fontSize:'1rem', fontWeight:800, color:t.color }}>{card.priceLabel}</p>}
        {card.meta && card.meta.length > 0 && (
          <p style={{ fontSize:'0.68rem', color:'rgba(255,255,255,0.4)', lineHeight:1.5 }}>{card.meta.join(' · ')}</p>
        )}

        <div style={{ marginTop:'auto', display:'flex', gap:'0.4rem', paddingTop:'0.5rem', flexWrap:'wrap' }}>
          {card.type === 'part' && onAddToGarage && (
            <button onClick={() => onAddToGarage(card)} disabled={saved}
              style={{ flex:1, background: saved ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.07)', border:`1px solid ${saved ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.14)'}`, color: saved ? '#22c55e' : 'rgba(255,255,255,0.75)', padding:'0.4rem 0.5rem', borderRadius:'0.5rem', fontSize:'0.7rem', fontWeight:700, cursor: saved ? 'default' : 'pointer', whiteSpace:'nowrap' }}>
              {saved ? '✓ In Garage' : '+ Add to Garage'}
            </button>
          )}
          {card.type === 'event' && card.mapsUrl && (
            <a href={card.mapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ flex:1, background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.75)', padding:'0.4rem 0.5rem', borderRadius:'0.5rem', fontSize:'0.7rem', fontWeight:700, textAlign:'center', whiteSpace:'nowrap' }}>
              📍 Directions
            </a>
          )}
          <button onClick={() => onOpen(card)}
            style={{ flex:1.2, background:`linear-gradient(135deg, ${t.color}, ${t.color}CC)`, border:'none', color: card.type === 'auction' || card.type === 'carwash' ? '#0D1E30' : 'white', padding:'0.4rem 0.5rem', borderRadius:'0.5rem', fontSize:'0.7rem', fontWeight:800, cursor:'pointer', whiteSpace:'nowrap' }}>
            {t.action} →
          </button>
        </div>

        {/* Escape hatch — full feature page in a NEW TAB, conversation preserved */}
        <a href={card.fullPage.href} target="_blank" rel="noopener noreferrer"
          style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.3)', textAlign:'center', marginTop:'0.35rem', textDecoration:'none' }}>
          {card.fullPage.label} ↗
        </a>
      </div>
    </div>
  )
}

/* ── card row inside a chat bubble ── */
export function ResultCards({ cards, onOpen, onAddToGarage, savedIds }: {
  cards: RCCard[]
  onOpen: (c: RCCard) => void
  onAddToGarage?: (c: RCCard) => void
  savedIds?: Set<string>
}) {
  if (!cards.length) return null
  return (
    <div style={{ display:'flex', gap:'0.625rem', overflowX:'auto', padding:'0.625rem 0 0.375rem', WebkitOverflowScrolling:'touch' }}>
      {cards.map(c => <Card key={`${c.type}_${c.id}`} card={c} onOpen={onOpen} onAddToGarage={onAddToGarage} savedIds={savedIds} />)}
    </div>
  )
}

/* ── slide-over panel (desktop) / bottom sheet (mobile) ── */
export function SlideOverPanel({ card, onClose }: { card: RCCard | null; onClose: () => void }) {
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!card) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [card, onClose])

  if (!card) return null
  const t = TYPE_META[card.type]

  const panelStyle: React.CSSProperties = mobile
    ? { position:'fixed', left:0, right:0, bottom:0, top:'auto', height:'78vh', width:'100%', borderRadius:'1.25rem 1.25rem 0 0', animation:'rcSlideUp 0.25s ease' }
    : { position:'fixed', top:0, right:0, bottom:0, width:'460px', maxWidth:'92vw', borderRadius:0, animation:'rcSlideIn 0.25s ease' }

  return (
    <>
      <style>{`
        @keyframes rcSlideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes rcSlideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>

      {/* dimmed overlay — chat stays visible behind */}
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:90 }} />

      <div role="dialog" aria-modal="true" style={{ ...panelStyle, zIndex:95, background:'#0D1E30', borderLeft: mobile ? 'none' : '1px solid rgba(255,255,255,0.1)', borderTop: mobile ? `2px solid ${t.color}` : 'none', boxShadow:'-12px 0 40px rgba(0,0,0,0.5)', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1rem 1.25rem', borderBottom:'1px solid rgba(255,255,255,0.08)', flexShrink:0 }}>
          <span style={{ color:t.color, fontSize:'0.7rem', fontWeight:800, letterSpacing:'1px', textTransform:'uppercase' }}>{t.label} Detail</span>
          <button onClick={onClose} aria-label="Close panel"
            style={{ background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', color:'white', width:'32px', height:'32px', borderRadius:'0.5rem', fontSize:'1rem', cursor:'pointer', lineHeight:1 }}>
            ✕
          </button>
        </div>

        {/* body */}
        <div style={{ flex:1, overflowY:'auto', padding:'1.25rem' }}>
          <div style={{ height:'180px', background:'rgba(255,255,255,0.03)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
            {card.image
              ? <img src={card.image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
              : <span style={{ fontSize:'4rem' }}>{card.icon ?? t.fallbackIcon}</span>}
          </div>

          <h2 style={{ fontSize:'1.1rem', fontWeight:800, lineHeight:1.4, marginBottom:'0.25rem' }}>{card.title}</h2>
          {card.subtitle && <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.45)', marginBottom:'0.5rem' }}>{card.subtitle}</p>}
          {card.priceLabel && <p style={{ fontSize:'1.5rem', fontWeight:900, color:t.color, marginBottom:'0.5rem' }}>{card.priceLabel}</p>}
          {card.badge && <p style={{ display:'inline-block', background:'rgba(255,215,0,0.12)', border:'1px solid rgba(255,215,0,0.3)', color:'#FFD700', fontSize:'0.75rem', fontWeight:700, padding:'0.25rem 0.625rem', borderRadius:'0.5rem', marginBottom:'0.75rem' }}>{card.badge}</p>}
          {card.description && <p style={{ fontSize:'0.85rem', color:'rgba(255,255,255,0.65)', lineHeight:1.6, marginBottom:'1rem' }}>{card.description}</p>}

          {card.detail && (
            <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'0.75rem', overflow:'hidden', marginBottom:'1rem' }}>
              {Object.entries(card.detail).map(([k, v], i) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', gap:'1rem', padding:'0.55rem 0.875rem', borderTop: i ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)' }}>{k}</span>
                  <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.8)', fontWeight:600, textAlign:'right' }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* footer actions */}
        <div style={{ padding:'1rem 1.25rem', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', flexDirection:'column', gap:'0.5rem', flexShrink:0 }}>
          {card.url && (
            <a href={card.url} target="_blank" rel="noopener noreferrer"
              style={{ display:'block', textAlign:'center', background:`linear-gradient(135deg, ${t.color}, ${t.color}CC)`, color: card.type === 'auction' || card.type === 'carwash' ? '#0D1E30' : 'white', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:800, fontSize:'0.85rem', textDecoration:'none' }}>
              {card.type === 'part' ? '🛒 Buy on retailer site' : card.type === 'insurance' ? '🛡️ Get full quote' : card.type === 'vendor' ? '🏪 Visit vendor site' : card.type === 'event' ? '🎟️ Event page / RSVP' : '↗ Open listing'} (new tab)
            </a>
          )}
          {card.mapsUrl && (
            <a href={card.mapsUrl} target="_blank" rel="noopener noreferrer"
              style={{ display:'block', textAlign:'center', background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.85)', padding:'0.7rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'0.8rem', textDecoration:'none' }}>
              📍 Get directions (Google Maps)
            </a>
          )}
          <a href={card.fullPage.href} target="_blank" rel="noopener noreferrer"
            style={{ display:'block', textAlign:'center', color:'rgba(255,255,255,0.35)', padding:'0.4rem', fontSize:'0.72rem', textDecoration:'none' }}>
            {card.fullPage.label} ↗ (new tab — your conversation stays here)
          </a>
        </div>
      </div>
    </>
  )
}
