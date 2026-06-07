'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const SUPABASE_URL  = 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjYyMzQsImV4cCI6MjA2MDg0MjIzNH0.TZOjsdXpRSjcupX0GYGcaEqrpgp0F5djVl6h78dBf5M'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const STATE_NAMES: Record<string,string> = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' }

const WASH_TYPES: Record<string,string> = {
  all:'All Types', tunnel_touchless:'Touchless Tunnel', tunnel_soft:'Soft Touch Tunnel',
  tunnel_hybrid:'Hybrid Tunnel', self_service:'Self Serve', hand_wash:'Hand Wash',
  mobile_detailer:'Mobile Detailer', full_detail:'Full Detail', waterless:'Waterless', rinseless:'Rinseless',
}
// Wash types that are NOT safe for ceramic/ppf/vinyl
const UNSAFE_TYPES = new Set(['tunnel_soft','tunnel_hybrid'])

const PRICE_COLOR: Record<string,string> = { '$':'#22c55e','$$':'#FFD700','$$$':'#f97316','$$$$':'#CC0000' }

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8, dLat=(lat2-lat1)*Math.PI/180, dLon=(lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

const inp: React.CSSProperties = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'0.5rem', color:'white', padding:'0.6rem 0.8rem', fontSize:'0.875rem', outline:'none', width:'100%', boxSizing:'border-box' }
const lbl: React.CSSProperties = { fontSize:'0.65rem', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.5px' }

/* ── Badge ───────────────────────────────────────────────────────────────── */
function Badge({ color, label }: { color: string; label: string }) {
  return <span style={{ background:`${color}18`, color, border:`1px solid ${color}30`, padding:'0.15rem 0.55rem', borderRadius:'9999px', fontSize:'0.68rem', fontWeight:600, whiteSpace:'nowrap' }}>{label}</span>
}

/* ── Wash Card ───────────────────────────────────────────────────────────── */
function WashCard({ w, dist, hasProtection, onFlag }: { w: any; dist: number|null; hasProtection: boolean; onFlag: (w: any) => void }) {
  const [expanded, setExpanded] = useState(false)
  const isUnsafe  = UNSAFE_TYPES.has(w.wash_type)
  const showWarn  = hasProtection && isUnsafe
  const typeLabel = WASH_TYPES[w.wash_type] ?? w.wash_type

  return (
    <div style={{ background:'#243547', borderRadius:'1rem', border:`1px solid ${showWarn ? 'rgba(255,165,0,0.35)' : 'rgba(255,255,255,0.07)'}`, overflow:'hidden' }}>
      {showWarn && (
        <div style={{ background:'rgba(255,165,0,0.08)', borderBottom:'1px solid rgba(255,165,0,0.2)', padding:'0.5rem 1rem', fontSize:'0.72rem', color:'#FFA500' }}>
          ⚠️ Not recommended — this wash type may damage your ceramic/PPF coating
        </div>
      )}
      <div style={{ padding:'1.1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem', gap:'0.5rem' }}>
          <div style={{ flex:1 }}>
            <h3 style={{ fontWeight:800, fontSize:'0.95rem', color:'white', margin:0 }}>{w.name}</h3>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', margin:'0.2rem 0 0' }}>{typeLabel}</p>
          </div>
          {w.price_range && <span style={{ fontWeight:800, color: PRICE_COLOR[w.price_range] ?? '#aaa', fontSize:'0.9rem', flexShrink:0 }}>{w.price_range}</span>}
        </div>

        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginBottom:'0.25rem' }}>📍 {w.address ?? ''}{w.address && w.city ? ', ' : ''}{w.city}, {w.state}{dist !== null ? ` · ${dist} mi` : ''}</p>
        {w.phone && <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginBottom:'0.25rem' }}>📞 {w.phone}</p>}
        {w.rating && <p style={{ color:'#FFD700', fontSize:'0.78rem', marginBottom:'0.5rem' }}>⭐ {w.rating}{w.review_count ? ` (${w.review_count})` : ''}</p>}

        <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', marginBottom:'0.65rem' }}>
          {w.is_ceramic_safe  && <Badge color="#3b82f6"  label="🔵 Ceramic Safe" />}
          {w.is_ppf_safe      && <Badge color="#a855f7"  label="🟣 PPF Safe" />}
          {w.is_touchless     && <Badge color="#22c55e"  label="✓ Touchless" />}
          {w.has_membership   && <Badge color="#CC0000"  label="💳 Membership" />}
          {w.is_lowered_safe  && <Badge color="#FFD700"  label="🚗 Lowered Safe" />}
          {w.community_verified && <Badge color="#14b8a6" label="✓ Verified" />}
          {(w.damage_reports ?? 0) > 0 && <Badge color="#f97316" label={`⚠️ ${w.damage_reports} damage report${w.damage_reports > 1 ? 's' : ''}`} />}
        </div>

        {expanded && (
          <div style={{ marginBottom:'0.75rem' }}>
            {w.description && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', lineHeight:1.5, marginBottom:'0.5rem' }}>{w.description}</p>}
            {w.has_spot_free_rinse && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.75rem' }}>✓ Spot-free rinse</p>}
            {w.has_undercarriage   && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.75rem' }}>✓ Undercarriage wash</p>}
          </div>
        )}

        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
          {w.website && <a href={w.website} target="_blank" rel="noopener noreferrer" style={{ flex:1, background:'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', padding:'0.55rem 0.75rem', borderRadius:'0.5rem', textDecoration:'none', textAlign:'center', fontWeight:700, fontSize:'0.8rem' }}>Website →</a>}
          {w.phone   && <a href={`tel:${w.phone}`} style={{ flex:1, background:'rgba(51,153,255,0.12)', color:'#3399FF', border:'1px solid rgba(51,153,255,0.2)', padding:'0.55rem 0.75rem', borderRadius:'0.5rem', textDecoration:'none', textAlign:'center', fontWeight:600, fontSize:'0.8rem' }}>Call</a>}
          <button onClick={() => setExpanded(v => !v)} style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.5)', border:'none', borderRadius:'0.5rem', padding:'0.55rem 0.75rem', cursor:'pointer', fontSize:'0.8rem' }}>{expanded ? 'Less' : 'More'}</button>
          <button onClick={() => onFlag(w)} style={{ background:'rgba(249,115,22,0.1)', color:'#f97316', border:'1px solid rgba(249,115,22,0.2)', borderRadius:'0.5rem', padding:'0.55rem 0.75rem', cursor:'pointer', fontSize:'0.75rem' }}>🚩 Flag</button>
        </div>
      </div>
    </div>
  )
}

/* ── Submit Modal ────────────────────────────────────────────────────────── */
function SubmitModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name:'', wash_type:'hand_wash', address:'', city:'', state:'FL', zip:'', phone:'', website:'', price_range:'$$', is_ceramic_safe:false, is_ppf_safe:false, is_touchless:false, has_membership:false, is_lowered_safe:true })
  const [saving, setSaving] = useState(false)
  const [done,   setDone]   = useState(false)
  const [err,    setErr]    = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setErr('')
    try {
      let lat = 0, lng = 0
      if (form.zip.length === 5) {
        const r = await fetch(`https://api.zippopotam.us/us/${form.zip}`)
        if (r.ok) { const d = await r.json(); lat = parseFloat(d.places[0].latitude); lng = parseFloat(d.places[0].longitude) }
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/car_washes`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ ...form, lat, lng, price_range: form.price_range || null }),
      })
      if (!res.ok) { setErr((await res.text()).slice(0, 200)) } else { setDone(true) }
    } catch (e: any) { setErr(String(e)) }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', overflowY:'auto' }}>
      <div style={{ background:'#1C2E40', borderRadius:'1.25rem', padding:'2rem', width:'100%', maxWidth:'520px', border:'1px solid rgba(255,255,255,0.1)', margin:'auto' }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'2rem 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
            <h2 style={{ fontWeight:800, marginBottom:'0.5rem' }}>Car Wash Submitted!</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:'1.5rem' }}>Thanks for contributing to the community database.</p>
            <button onClick={onClose} style={{ background:'#CC0000', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 2rem', fontWeight:700, cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontWeight:800, fontSize:'1.2rem', margin:0 }}>Submit a Car Wash</h2>
              <button onClick={onClose} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display:'grid', gap:'0.8rem' }}>
                <div><label style={lbl}>Business Name *</label><input required style={inp} value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Mister Car Wash - Clearwater" /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div><label style={lbl}>Wash Type *</label>
                    <select required style={inp} value={form.wash_type} onChange={e=>setForm(f=>({...f,wash_type:e.target.value}))}>
                      {Object.entries(WASH_TYPES).filter(([k])=>k!=='all').map(([k,v])=><option key={k} value={k} style={{background:'#1C2E40'}}>{v}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Price Range</label>
                    <select style={inp} value={form.price_range} onChange={e=>setForm(f=>({...f,price_range:e.target.value}))}>
                      {['$','$$','$$$','$$$$'].map(p=><option key={p} value={p} style={{background:'#1C2E40'}}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={lbl}>Street Address *</label><input required style={inp} value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} placeholder="1234 Gulf to Bay Blvd" /></div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'0.6rem' }}>
                  <div><label style={lbl}>City *</label><input required style={inp} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Clearwater" /></div>
                  <div><label style={lbl}>State *</label>
                    <select required style={inp} value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))}>
                      {US_STATES.map(s=><option key={s} value={s} style={{background:'#1C2E40'}}>{s}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>ZIP *</label><input required style={inp} value={form.zip} maxLength={5} onChange={e=>setForm(f=>({...f,zip:e.target.value.replace(/\D/g,'')}))} placeholder="34698" /></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div><label style={lbl}>Phone</label><input style={inp} value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="(727) 555-0100" /></div>
                  <div><label style={lbl}>Website</label><input style={inp} value={form.website} onChange={e=>setForm(f=>({...f,website:e.target.value}))} placeholder="https://..." /></div>
                </div>
                <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap', paddingTop:'0.25rem' }}>
                  {[
                    ['is_ceramic_safe','🔵 Ceramic Safe'],['is_ppf_safe','🟣 PPF Safe'],
                    ['is_touchless','✓ Touchless'],['has_membership','💳 Has Membership'],['is_lowered_safe','🚗 Lowered Safe'],
                  ].map(([field, label]) => (
                    <label key={field} style={{ display:'flex', alignItems:'center', gap:'0.35rem', cursor:'pointer', fontSize:'0.8rem', color:(form as any)[field] ? 'white' : 'rgba(255,255,255,0.4)' }}>
                      <input type="checkbox" checked={(form as any)[field]} onChange={e=>setForm(f=>({...f,[field]:e.target.checked}))} style={{ accentColor:'#CC0000' }} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              {err && <p style={{ color:'#f87171', fontSize:'0.8rem', marginTop:'0.75rem' }}>{err}</p>}
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem' }}>
                <button type="submit" disabled={saving} style={{ flex:1, background:'#CC0000', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem', fontWeight:700, cursor:saving?'not-allowed':'pointer' }}>{saving ? 'Submitting...' : 'Submit Car Wash'}</button>
                <button type="button" onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 1rem', cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Section Header ──────────────────────────────────────────────────────── */
function SectionHead({ emoji, title, count, sub }: { emoji: string; title: string; count?: number; sub?: string }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
        <span style={{ fontSize:'1.25rem' }}>{emoji}</span>
        <h2 style={{ fontWeight:800, fontSize:'1.1rem', margin:0 }}>{title}</h2>
        {count !== undefined && <span style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)', padding:'0.15rem 0.6rem', borderRadius:'9999px', fontSize:'0.72rem', fontWeight:600 }}>{count}</span>}
      </div>
      {sub && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', marginTop:'0.25rem', marginLeft:'1.9rem' }}>{sub}</p>}
    </div>
  )
}

/* ═════════════════════════════════════════════════════════════════════════ */
export default function CarWashPage() {
  /* search form */
  const [city,         setCity]         = useState('')
  const [stateVal,     setStateVal]     = useState('FL')
  const [zip,          setZip]          = useState('')
  const [radius,       setRadius]       = useState(25)
  const [washType,     setWashType]     = useState('all')
  const [ceramicOnly,  setCeramicOnly]  = useState(false)
  const [ppfOnly,      setPpfOnly]      = useState(false)
  const [touchlessOnly,setTouchlessOnly]= useState(false)

  /* results */
  const [dbWashes,     setDbWashes]     = useState<any[]>([])
  const [aiWashes,     setAiWashes]     = useState<any[]>([])
  const [googleWashes, setGoogleWashes] = useState<any[]>([])
  const [chainLinks,   setChainLinks]   = useState<any[]>([])

  /* ui */
  const [dbLoading,    setDbLoading]    = useState(true)
  const [searching,    setSearching]    = useState(false)
  const [searched,     setSearched]     = useState(false)
  const [anchor,       setAnchor]       = useState<{lat:number;lon:number}|null>(null)
  const [searchLabel,  setSearchLabel]  = useState('')
  const [showSubmit,   setShowSubmit]   = useState(false)
  const [flagTarget,   setFlagTarget]   = useState<any|null>(null)

  /* coating protection check */
  const [protectedVehicles, setProtectedVehicles] = useState<any[]>([])

  /* load community db washes + user vehicles on mount */
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/car_washes?select=*&order=rating.desc.nullslast`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    })
    .then(r => r.json())
    .then(data => { setDbWashes(Array.isArray(data) ? data : []); setDbLoading(false) })
    .catch(() => setDbLoading(false))

    /* check if user has ceramic/ppf/vinyl protected vehicles */
    createClient().auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/vehicles?select=id,year,make,model,paint_protection&owner_id=eq.${uid}&paint_protection=in.(ceramic,ppf,vinyl)`,
        { headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` } }
      )
      if (res.ok) { const d = await res.json(); if (Array.isArray(d)) setProtectedVehicles(d) }
    })
  }, [])

  const hasProtection = protectedVehicles.length > 0

  /* filter community washes */
  const filteredDb = dbWashes.filter(w => {
    if (washType !== 'all' && w.wash_type !== washType) return false
    if (ceramicOnly  && !w.is_ceramic_safe) return false
    if (ppfOnly      && !w.is_ppf_safe)     return false
    if (touchlessOnly && !w.is_touchless)   return false
    if (anchor && w.lat != null && w.lng != null) {
      if (haversine(anchor.lat, anchor.lon, Number(w.lat), Number(w.lng)) > radius) return false
    } else if (searched && stateVal) {
      if ((w.state ?? '').toUpperCase() !== stateVal.toUpperCase()) return false
    }
    return true
  })

  const distFor = (w: any) =>
    anchor && w.lat != null && w.lng != null
      ? Math.round(haversine(anchor.lat, anchor.lon, Number(w.lat), Number(w.lng)))
      : null

  async function handleSearch() {
    if (!city || !stateVal) { alert('Please enter a city and state.'); return }
    setSearching(true)

    let lat: number|undefined, lng: number|undefined
    let newAnchor: typeof anchor = null
    if (zip.length === 5) {
      try {
        const r = await fetch(`https://api.zippopotam.us/us/${zip}`)
        if (r.ok) {
          const d = await r.json()
          lat = parseFloat(d.places[0].latitude); lng = parseFloat(d.places[0].longitude)
          newAnchor = { lat, lon: lng }
        }
      } catch {}
    }
    setAnchor(newAnchor)
    setSearchLabel(`${city}, ${stateVal}${zip ? ` (${zip})` : ''}`)

    try {
      const params = new URLSearchParams({ city, state: stateVal, zip, type: washType })
      if (lat !== undefined && lng !== undefined) { params.set('lat', String(lat)); params.set('lng', String(lng)) }
      const res = await fetch(`/api/car-wash-search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAiWashes(data.aiWashes ?? [])
        setGoogleWashes(data.googleResults ?? [])
        setChainLinks(data.chainLinks ?? [])
      }
    } catch {}

    setSearched(true); setSearching(false)
  }

  function clearSearch() {
    setSearched(false); setAnchor(null); setSearchLabel('')
    setAiWashes([]); setGoogleWashes([]); setChainLinks([])
  }

  /* flag report */
  async function submitFlag(w: any) {
    if (!w?.id) return
    await fetch(`${SUPABASE_URL}/rest/v1/car_washes?id=eq.${w.id}`, {
      method: 'PATCH',
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
      body: JSON.stringify({ damage_reports: (w.damage_reports ?? 0) + 1 }),
    })
    setFlagTarget(null)
    alert('Report submitted. Thank you for keeping the community safe.')
  }

  /* filter AI washes for display */
  const filteredAi = aiWashes.filter(w => {
    if (washType !== 'all' && w.wash_type !== washType) return false
    if (ceramicOnly  && !w.is_ceramic_safe) return false
    if (ppfOnly      && !w.is_ppf_safe)     return false
    if (touchlessOnly && !w.is_touchless)   return false
    return true
  })

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ background:'#1B2A3E', minHeight:'100vh', color:'white', padding:'1.5rem', fontFamily:'system-ui,sans-serif' }}>
      {showSubmit  && <SubmitModal onClose={() => setShowSubmit(false)} />}
      {flagTarget  && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
          <div style={{ background:'#1C2E40', borderRadius:'1.25rem', padding:'2rem', maxWidth:'400px', width:'100%', border:'1px solid rgba(249,115,22,0.3)' }}>
            <h2 style={{ fontWeight:800, marginBottom:'0.5rem' }}>🚩 Flag This Location</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.875rem', marginBottom:'1.5rem' }}>Report <strong style={{color:'white'}}>{flagTarget.name}</strong> for damage, inaccurate info, or coating safety issues. Your report increments the community damage counter.</p>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button onClick={() => submitFlag(flagTarget)} style={{ flex:1, background:'#f97316', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem', fontWeight:700, cursor:'pointer' }}>Submit Report</button>
              <button onClick={() => setFlagTarget(null)} style={{ background:'rgba(255,255,255,0.08)', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 1rem', cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'2rem', fontWeight:900, margin:0 }}>🚿 Car Wash Locator</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', margin:'0.3rem 0 0', fontSize:'0.85rem' }}>Find coating-safe washes — ceramic, PPF & vinyl wrap rated by community</p>
        </div>
        <button onClick={() => setShowSubmit(true)} style={{ background:'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', border:'none', borderRadius:'0.875rem', padding:'0.7rem 1.4rem', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', whiteSpace:'nowrap' }}>
          + Submit a Car Wash
        </button>
      </div>

      {/* Coating Protection Warning */}
      {hasProtection && (
        <div style={{ background:'rgba(255,165,0,0.07)', border:'1px solid rgba(255,165,0,0.25)', borderRadius:'1rem', padding:'1rem 1.25rem', marginBottom:'1.5rem', display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
          <span style={{ fontSize:'1.3rem', flexShrink:0 }}>⚠️</span>
          <div>
            <p style={{ fontWeight:700, color:'#FFA500', marginBottom:'0.25rem' }}>
              You have a ceramic/PPF/vinyl coated vehicle — avoid brush tunnel washes
            </p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.8rem', margin:0 }}>
              {protectedVehicles.map(v => `${v.year} ${v.make} ${v.model}`).join(', ')} — soft-touch and hybrid tunnels can scratch coatings and lift PPF edges. Stick to <strong style={{color:'white'}}>Touchless, Hand Wash, Waterless, or Mobile Detailer</strong>.
            </p>
          </div>
        </div>
      )}

      {/* General Safety Tip */}
      {!hasProtection && (
        <div style={{ background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.12)', borderRadius:'0.875rem', padding:'0.8rem 1rem', marginBottom:'1.5rem', display:'flex', gap:'0.625rem' }}>
          <span style={{ color:'#FFD700', flexShrink:0 }}>💡</span>
          <p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.45)', margin:0 }}>
            <strong style={{ color:'#FFD700' }}>Soft-touch and brush tunnels can damage ceramic coatings and PPF.</strong> Add vehicles to your garage to get personalized coating safety warnings.
          </p>
        </div>
      )}

      {/* ── Search Form ── */}
      <div style={{ background:'#243547', borderRadius:'1.25rem', padding:'1.5rem', marginBottom:'1.75rem', border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px,1fr))', gap:'0.875rem', marginBottom:'1rem' }}>
          <div style={{ gridColumn:'span 2', minWidth:'150px' }}>
            <label style={lbl}>City *</label>
            <input style={inp} placeholder="Clearwater" value={city} onChange={e=>setCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
          </div>
          <div>
            <label style={lbl}>State *</label>
            <select style={inp} value={stateVal} onChange={e=>setStateVal(e.target.value)}>
              {US_STATES.map(s=><option key={s} value={s} style={{background:'#243547'}}>{s} — {STATE_NAMES[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>ZIP Code</label>
            <input style={inp} placeholder="34698" value={zip} maxLength={5} onChange={e=>setZip(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
          </div>
          <div>
            <label style={lbl}>Radius</label>
            <select style={inp} value={radius} onChange={e=>setRadius(Number(e.target.value))}>
              {[5,10,25,50].map(r=><option key={r} value={r} style={{background:'#243547'}}>{r} miles</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Wash Type</label>
            <select style={inp} value={washType} onChange={e=>setWashType(e.target.value)}>
              {Object.entries(WASH_TYPES).map(([k,v])=><option key={k} value={k} style={{background:'#243547'}}>{v}</option>)}
            </select>
          </div>
        </div>

        {/* Special filter toggles */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem' }}>
          {[
            [ceramicOnly,   setCeramicOnly,   '🔵 Ceramic Safe'],
            [ppfOnly,       setPpfOnly,        '🟣 PPF Safe'],
            [touchlessOnly, setTouchlessOnly,  '✓ Touchless Only'],
          ].map(([val, setter, label]) => (
            <button key={label as string} onClick={() => (setter as Function)(!(val as boolean))}
              style={{ background: (val as boolean) ? 'rgba(204,0,0,0.15)' : 'rgba(255,255,255,0.06)', color: (val as boolean) ? '#CC0000' : 'rgba(255,255,255,0.5)', border:`1px solid ${(val as boolean) ? 'rgba(204,0,0,0.4)' : 'rgba(255,255,255,0.12)'}`, borderRadius:'9999px', padding:'0.4rem 1rem', fontSize:'0.8rem', fontWeight:(val as boolean)?700:400, cursor:'pointer' }}>
              {label as string}
            </button>
          ))}
          {hasProtection && (
            <button onClick={() => { setCeramicOnly(true); setTouchlessOnly(false) }}
              style={{ background:'rgba(255,165,0,0.1)', color:'#FFA500', border:'1px solid rgba(255,165,0,0.25)', borderRadius:'9999px', padding:'0.4rem 1rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer' }}>
              ⚠️ Safe for My Coated Car
            </button>
          )}
        </div>

        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <button onClick={handleSearch} disabled={searching} style={{ background:searching?'rgba(204,0,0,0.5)':'#CC0000', color:'white', border:'none', borderRadius:'0.875rem', padding:'0.75rem 2.5rem', fontWeight:700, fontSize:'1rem', cursor:searching?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
            {searching ? '🔍 Searching...' : '🔍 Find Car Washes'}
          </button>
          {searched && (
            <button onClick={clearSearch} style={{ background:'rgba(255,255,255,0.07)', color:'rgba(255,255,255,0.55)', border:'none', borderRadius:'0.875rem', padding:'0.75rem 1rem', cursor:'pointer', fontSize:'0.85rem' }}>
              Clear Search
            </button>
          )}
          {searchLabel && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.82rem' }}>Near <strong style={{color:'white'}}>{searchLabel}</strong></span>}
        </div>
      </div>

      {/* ── Community DB Washes ── */}
      <div style={{ marginBottom:'2.5rem' }}>
        <SectionHead emoji="🗂️" title="Community Verified Washes" count={searched ? filteredDb.length : dbWashes.length}
          sub={searched ? `Matching washes from our community database near ${searchLabel}` : `${dbWashes.length} washes in our community database — search above to filter by location`} />
        {dbLoading ? (
          <p style={{ color:'rgba(255,255,255,0.35)', padding:'2rem', textAlign:'center' }}>Loading...</p>
        ) : (searched ? filteredDb : dbWashes).length === 0 ? (
          <div style={{ background:'#243547', borderRadius:'1rem', padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.35)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ marginBottom:'0.5rem' }}>No community washes found for this search.</p>
            <button onClick={() => setShowSubmit(true)} style={{ background:'transparent', border:'none', color:'#CC0000', cursor:'pointer', fontWeight:700, fontSize:'0.85rem', padding:0 }}>Add the first one →</button>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:'1rem' }}>
            {(searched ? filteredDb : dbWashes).map(w => <WashCard key={w.id} w={w} dist={distFor(w)} hasProtection={hasProtection} onFlag={setFlagTarget} />)}
          </div>
        )}
      </div>

      {/* ── AI Discovered Washes ── */}
      {searched && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead emoji="🤖" title="AI-Discovered Car Washes" count={filteredAi.length}
            sub={`Known car washes near ${searchLabel} from AI knowledge${filteredAi.length < aiWashes.length ? ` (${aiWashes.length - filteredAi.length} filtered out)` : ''}`} />
          {searching ? (
            <p style={{ color:'rgba(255,255,255,0.35)', padding:'2rem', textAlign:'center' }}>Searching...</p>
          ) : filteredAi.length === 0 ? (
            <div style={{ background:'#243547', borderRadius:'1rem', padding:'1.5rem', textAlign:'center', color:'rgba(255,255,255,0.35)' }}>No AI results match your filters.</div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:'1rem' }}>
              {filteredAi.map((w, i) => {
                const isUnsafe = UNSAFE_TYPES.has(w.wash_type)
                const showWarn = hasProtection && isUnsafe
                return (
                  <div key={i} style={{ background:'#243547', borderRadius:'1rem', border:`1px solid ${showWarn ? 'rgba(255,165,0,0.3)' : 'rgba(255,255,255,0.07)'}`, overflow:'hidden' }}>
                    {showWarn && <div style={{ background:'rgba(255,165,0,0.08)', borderBottom:'1px solid rgba(255,165,0,0.2)', padding:'0.5rem 1rem', fontSize:'0.72rem', color:'#FFA500' }}>⚠️ May not be safe for your coating</div>}
                    <div style={{ padding:'1.1rem' }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.4rem', gap:'0.5rem' }}>
                        <div style={{ flex:1 }}>
                          <h3 style={{ fontWeight:800, fontSize:'0.95rem', margin:0, color:'white' }}>{w.name}</h3>
                          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem', margin:'0.2rem 0 0' }}>{WASH_TYPES[w.wash_type] ?? w.wash_type}</p>
                        </div>
                        <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
                          {w.price_range && <span style={{ fontWeight:800, color: PRICE_COLOR[w.price_range] ?? '#aaa', fontSize:'0.85rem' }}>{w.price_range}</span>}
                          <span style={{ background:'rgba(99,102,241,0.15)', color:'#818cf8', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:600 }}>AI</span>
                        </div>
                      </div>
                      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', marginBottom:'0.25rem' }}>📍 {w.address}, {w.city}, {w.state}</p>
                      {w.phone   && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', marginBottom:'0.25rem' }}>📞 {w.phone}</p>}
                      {w.rating  && <p style={{ color:'#FFD700', fontSize:'0.78rem', marginBottom:'0.5rem' }}>⭐ {w.rating}</p>}
                      <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', marginBottom:'0.65rem' }}>
                        {w.is_ceramic_safe && <Badge color="#3b82f6" label="🔵 Ceramic Safe" />}
                        {w.is_ppf_safe     && <Badge color="#a855f7" label="🟣 PPF Safe" />}
                        {w.is_touchless    && <Badge color="#22c55e" label="✓ Touchless" />}
                        {w.has_membership  && <Badge color="#CC0000" label="💳 Membership" />}
                      </div>
                      {w.description && <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', lineHeight:1.5, marginBottom:'0.65rem' }}>{w.description}</p>}
                      {w.website && <a href={w.website} target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', color:'#3399FF', fontSize:'0.78rem', textDecoration:'none' }}>🔗 Website →</a>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Google Places ── */}
      {searched && googleWashes.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead emoji="📍" title="Google Places Results" count={googleWashes.length} sub={`Live Google Maps results for car washes near ${searchLabel}`} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px,1fr))', gap:'1rem' }}>
            {googleWashes.map((w, i) => (
              <div key={i} style={{ background:'#243547', borderRadius:'1rem', border:'1px solid rgba(255,255,255,0.07)', padding:'1.1rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.4rem', gap:'0.5rem' }}>
                  <h3 style={{ fontWeight:800, fontSize:'0.95rem', margin:0, color:'white', flex:1 }}>{w.name}</h3>
                  <span style={{ background:'rgba(66,133,244,0.15)', color:'#4285f4', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:600, flexShrink:0 }}>Google</span>
                </div>
                <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', marginBottom:'0.25rem' }}>📍 {w.address}</p>
                {w.rating && <p style={{ color:'#FFD700', fontSize:'0.78rem', marginBottom:'0.5rem' }}>⭐ {w.rating} ({w.review_count?.toLocaleString()} reviews)</p>}
                {w.open_now !== null && <p style={{ color: w.open_now ? '#22c55e' : '#f87171', fontSize:'0.78rem', marginBottom:'0.5rem' }}>{w.open_now ? '✓ Open now' : '✕ Closed now'}</p>}
                <a href={`https://www.google.com/maps/place/?q=place_id:${w.place_id}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'block', textAlign:'center', background:'rgba(66,133,244,0.12)', color:'#4285f4', border:'1px solid rgba(66,133,244,0.2)', padding:'0.55rem', borderRadius:'0.5rem', textDecoration:'none', fontWeight:600, fontSize:'0.8rem', marginTop:'0.75rem' }}>
                  View on Google Maps →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Chain Locators ── */}
      {searched && chainLinks.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead emoji="🔗" title="Chain Locators" sub={`Find major chain locations near ${searchLabel} — opens with your search pre-filled`} />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px,1fr))', gap:'0.875rem' }}>
            {chainLinks.map((c, i) => (
              <a key={i} href={c.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'#243547', borderRadius:'1rem', padding:'1.25rem', border:`1px solid ${c.safe === true ? 'rgba(34,197,94,0.15)' : c.safe === false ? 'rgba(255,165,0,0.1)' : 'rgba(255,255,255,0.07)'}`, cursor:'pointer', display:'flex', flexDirection:'column', gap:'0.35rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ fontSize:'1.6rem' }}>{c.emoji}</span>
                    {c.safe === true  && <span style={{ color:'#22c55e', fontSize:'0.68rem', fontWeight:600 }}>✓ Coating Safe</span>}
                    {c.safe === false && <span style={{ color:'#FFA500', fontSize:'0.68rem', fontWeight:600 }}>⚠️ Check Before Use</span>}
                  </div>
                  <p style={{ fontWeight:700, color:'white', fontSize:'0.9rem', margin:0 }}>{c.name}</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem', margin:0, lineHeight:1.4 }}>{c.desc}</p>
                  <span style={{ color:'#3399FF', fontSize:'0.72rem', marginTop:'0.2rem' }}>Find Locations →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Pre-search CTA */}
      {!searched && (
        <div style={{ background:'linear-gradient(135deg,rgba(0,180,216,0.08),rgba(204,0,0,0.06))', borderRadius:'1.25rem', padding:'2.5rem', textAlign:'center', border:'1px solid rgba(255,255,255,0.06)', marginTop:'1rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚿</div>
          <h2 style={{ fontWeight:800, fontSize:'1.3rem', marginBottom:'0.5rem' }}>Find the Right Wash for Your Car</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem', maxWidth:'480px', margin:'0 auto 1.5rem' }}>
            Enter your city and state to find AI-discovered car washes, Google Places results, chain locators, and community-submitted washes — all rated for ceramic coating and PPF safety.
          </p>
          <button onClick={() => setShowSubmit(true)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.18)', color:'rgba(255,255,255,0.55)', borderRadius:'0.75rem', padding:'0.6rem 1.5rem', cursor:'pointer', fontSize:'0.85rem' }}>
            Or submit a car wash you know →
          </button>
        </div>
      )}
    </div>
  )
}
