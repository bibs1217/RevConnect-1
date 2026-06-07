'use client'
import { useState, useEffect } from 'react'

const SUPABASE_URL  = 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjYyMzQsImV4cCI6MjA2MDg0MjIzNH0.TZOjsdXpRSjcupX0GYGcaEqrpgp0F5djVl6h78dBf5M'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']

const STATE_NAMES: Record<string,string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',
  DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',
  MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',
  NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',
  WI:'Wisconsin',WY:'Wyoming',
}

const TYPE_LABELS: Record<string,string> = {
  all:'All Events', street_meet:'Street Meet', car_show:'Car Show', track_day:'Track Day',
  cruise:'Cruise', drag:'Drag Racing', autocross:'Autocross', hpde:'HPDE',
}

const TYPE_COLORS: Record<string,string> = {
  street_meet:'#CC0000', car_show:'#F4A261', track_day:'#22c55e',
  cruise:'#3399FF', drag:'#a855f7', autocross:'#FFD700', hpde:'#14b8a6', all:'#888',
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) }
  catch { return iso }
}

const card: React.CSSProperties = { background:'#243547', borderRadius:'1rem', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }
const inp:  React.CSSProperties = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'0.5rem', color:'white', padding:'0.6rem 0.8rem', fontSize:'0.875rem', outline:'none', width:'100%', boxSizing:'border-box' }
const lbl:  React.CSSProperties = { fontSize:'0.65rem', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.5px' }

/* ── Submit Event Modal ─────────────────────────────────────────────────── */
function SubmitModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title:'', city:'', state:'FL', zip:'', starts_at:'', event_type:'street_meet', description:'', entry_fee:'' })
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setErr('')
    try {
      let lat: number|null = null, lng: number|null = null
      if (form.zip.length === 5) {
        const r = await fetch(`https://api.zippopotam.us/us/${form.zip}`)
        if (r.ok) { const d = await r.json(); lat = parseFloat(d.places[0].latitude); lng = parseFloat(d.places[0].longitude) }
      }
      const res = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method: 'POST',
        headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({
          title: form.title, city: form.city, state: form.state, zip: form.zip || null,
          lat, lng, starts_at: new Date(form.starts_at).toISOString(),
          event_type: form.event_type, description: form.description || null,
          entry_fee: form.entry_fee ? parseInt(form.entry_fee) : null,
          is_published: true, is_cancelled: false, current_attendees: 0,
          registration_required: false, weather_sensitive: false,
        }),
      })
      if (!res.ok) { setErr((await res.text()).slice(0, 200)) } else { setDone(true) }
    } catch(e: any) { setErr(String(e)) }
    setSaving(false)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:'#1C2E40', borderRadius:'1.25rem', padding:'2rem', width:'100%', maxWidth:'500px', border:'1px solid rgba(255,255,255,0.1)' }}>
        {done ? (
          <div style={{ textAlign:'center', padding:'2rem 0' }}>
            <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</div>
            <h2 style={{ fontWeight:800, marginBottom:'0.5rem' }}>Event Submitted!</h2>
            <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:'1.5rem' }}>Your event has been added to the database.</p>
            <button onClick={onClose} style={{ background:'#CC0000', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 2rem', fontWeight:700, cursor:'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
              <h2 style={{ fontWeight:800, fontSize:'1.25rem' }}>Submit Your Event</h2>
              <button onClick={onClose} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <form onSubmit={submit}>
              <div style={{ display:'grid', gap:'0.875rem' }}>
                <div><label style={lbl}>Event Title *</label><input required style={inp} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Cars & Coffee — Clearwater" /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div><label style={lbl}>City *</label><input required style={inp} value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))} placeholder="Clearwater" /></div>
                  <div><label style={lbl}>State *</label>
                    <select required style={inp} value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))}>
                      {US_STATES.map(s => <option key={s} value={s} style={{background:'#1C2E40'}}>{s} — {STATE_NAMES[s]}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                  <div><label style={lbl}>ZIP Code</label><input style={inp} value={form.zip} maxLength={5} onChange={e=>setForm(f=>({...f,zip:e.target.value.replace(/\D/g,'')}))} placeholder="34698" /></div>
                  <div><label style={lbl}>Event Type *</label>
                    <select required style={inp} value={form.event_type} onChange={e=>setForm(f=>({...f,event_type:e.target.value}))}>
                      {Object.entries(TYPE_LABELS).filter(([k])=>k!=='all').map(([k,v])=><option key={k} value={k} style={{background:'#1C2E40'}}>{v}</option>)}
                    </select>
                  </div>
                </div>
                <div><label style={lbl}>Date & Time *</label><input required type="datetime-local" style={inp} value={form.starts_at} onChange={e=>setForm(f=>({...f,starts_at:e.target.value}))} /></div>
                <div><label style={lbl}>Entry Fee ($, leave blank if free)</label><input type="number" min="0" style={inp} value={form.entry_fee} onChange={e=>setForm(f=>({...f,entry_fee:e.target.value}))} placeholder="0" /></div>
                <div><label style={lbl}>Description</label><textarea rows={3} style={{...inp, resize:'vertical'}} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Tell people what to expect..." /></div>
              </div>
              {err && <p style={{ color:'#f87171', fontSize:'0.8rem', marginTop:'0.75rem' }}>{err}</p>}
              <div style={{ display:'flex', gap:'0.75rem', marginTop:'1.25rem' }}>
                <button type="submit" disabled={saving} style={{ flex:1, background:'#CC0000', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem', fontWeight:700, cursor: saving ? 'not-allowed' : 'pointer' }}>{saving ? 'Submitting...' : 'Submit Event'}</button>
                <button type="button" onClick={onClose} style={{ background:'rgba(255,255,255,0.08)', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 1rem', cursor:'pointer' }}>Cancel</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

/* ── EventCard ──────────────────────────────────────────────────────────── */
function EventCard({ ev, dist }: { ev: any, dist: number|null }) {
  const color = TYPE_COLORS[ev.event_type] ?? '#CC0000'
  return (
    <div style={card}>
      {ev.cover_image_url
        ? <img src={ev.cover_image_url} alt={ev.title} style={{ width:'100%', height:'150px', objectFit:'cover' }} />
        : <div style={{ width:'100%', height:'150px', background:`linear-gradient(135deg,${color}22,#0D1E3088)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem' }}>🚗</div>
      }
      <div style={{ padding:'1.1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
          <span style={{ background:color, color:'white', padding:'0.2rem 0.55rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase' }}>
            {(ev.event_type ?? '').replace(/_/g,' ')}
          </span>
          {dist !== null && <span style={{ color:'#FFD700', fontSize:'0.72rem', fontWeight:600 }}>📍 {dist} mi</span>}
        </div>
        <h3 style={{ fontWeight:800, fontSize:'0.95rem', marginBottom:'0.35rem', color:'white' }}>{ev.title}</h3>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginBottom:'0.2rem' }}>📍 {ev.city}, {ev.state}</p>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginBottom:'0.65rem' }}>📅 {fmtDate(ev.starts_at)}</p>
        {ev.description && <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', lineHeight:1.5, marginBottom:'0.65rem' }}>{ev.description.slice(0,90)}{ev.description.length>90?'…':''}</p>}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ color:'#22c55e', fontSize:'0.8rem', fontWeight:600 }}>{ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}</span>
          <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.72rem' }}>👥 {ev.current_attendees || 0} going</span>
        </div>
      </div>
    </div>
  )
}

/* ── Section header ─────────────────────────────────────────────────────── */
function SectionHead({ title, count, sub }: { title: string, count?: number, sub?: string }) {
  return (
    <div style={{ marginBottom:'1rem' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <h2 style={{ fontWeight:800, fontSize:'1.1rem', margin:0 }}>{title}</h2>
        {count !== undefined && <span style={{ background:'rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', padding:'0.15rem 0.6rem', borderRadius:'9999px', fontSize:'0.72rem', fontWeight:600 }}>{count}</span>}
      </div>
      {sub && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', marginTop:'0.2rem' }}>{sub}</p>}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════ */
export default function EventsPage() {
  /* search form */
  const [city,      setCity]      = useState('')
  const [stateVal,  setStateVal]  = useState('FL')
  const [zip,       setZip]       = useState('')
  const [radius,    setRadius]    = useState(100)
  const [eventType, setEventType] = useState('all')
  const [dateRange, setDateRange] = useState('upcoming')

  /* results */
  const [dbEvents,          setDbEvents]          = useState<any[]>([])
  const [aiEvents,          setAiEvents]          = useState<any[]>([])
  const [eventbriteResults, setEventbriteResults] = useState<any[]>([])
  const [googleResults,     setGoogleResults]     = useState<any[]>([])
  const [platformLinks,     setPlatformLinks]     = useState<any[]>([])

  /* ui state */
  const [dbLoading,   setDbLoading]   = useState(true)
  const [searching,   setSearching]   = useState(false)
  const [searched,    setSearched]    = useState(false)
  const [anchor,      setAnchor]      = useState<{lat:number,lon:number}|null>(null)
  const [searchLabel, setSearchLabel] = useState('')
  const [showSubmit,  setShowSubmit]  = useState(false)

  /* load all db events on mount */
  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/events?select=*&is_published=eq.true&is_cancelled=eq.false&order=starts_at.asc`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
    })
    .then(r => r.json())
    .then(data => { setDbEvents(Array.isArray(data) ? data : []); setDbLoading(false) })
    .catch(() => setDbLoading(false))
  }, [])

  /* filtered db events */
  const filteredDb = dbEvents.filter(ev => {
    if (eventType !== 'all' && ev.event_type !== eventType) return false
    if (anchor && ev.lat != null && ev.lng != null) {
      if (haversine(anchor.lat, anchor.lon, Number(ev.lat), Number(ev.lng)) > radius) return false
    } else if (searched && !anchor) {
      /* city/state text match when no ZIP was geocoded */
      const cityMatch  = city  ? (ev.city  ?? '').toLowerCase().includes(city.toLowerCase())  : true
      const stateMatch = stateVal ? (ev.state ?? '').toUpperCase() === stateVal.toUpperCase() : true
      if (!cityMatch && !stateMatch) return false
    }
    if (dateRange !== 'all') {
      const now  = new Date()
      const evDt = new Date(ev.starts_at)
      if (evDt < now) return false
      if (dateRange === 'this_week') {
        const week = new Date(now); week.setDate(now.getDate() + 7)
        if (evDt > week) return false
      } else if (dateRange === 'this_month') {
        const mo = new Date(now); mo.setDate(now.getDate() + 30)
        if (evDt > mo) return false
      } else if (dateRange === '3months') {
        const mo3 = new Date(now); mo3.setDate(now.getDate() + 90)
        if (evDt > mo3) return false
      }
    }
    return true
  })

  async function handleSearch() {
    if (!city || !stateVal) { alert('Please enter a city and state.'); return }
    setSearching(true)

    /* geocode ZIP for haversine if provided */
    let newAnchor: {lat:number,lon:number}|null = null
    if (zip && zip.length === 5) {
      try {
        const r = await fetch(`https://api.zippopotam.us/us/${zip}`)
        if (r.ok) {
          const d = await r.json()
          newAnchor = { lat: parseFloat(d.places[0].latitude), lon: parseFloat(d.places[0].longitude) }
        }
      } catch {}
    }
    setAnchor(newAnchor)
    setSearchLabel(`${city}, ${stateVal}${zip ? ` (${zip})` : ''}`)

    /* call our search API */
    try {
      const params = new URLSearchParams({ city, state: stateVal, type: eventType })
      const res    = await fetch(`/api/events-search?${params}`)
      if (res.ok) {
        const data = await res.json()
        setAiEvents(data.aiEvents ?? [])
        setEventbriteResults(data.eventbriteResults ?? [])
        setGoogleResults(data.googleResults ?? [])
        setPlatformLinks(data.platformLinks ?? [])
      }
    } catch {}

    setSearched(true)
    setSearching(false)
  }

  const distFor = (ev: any) =>
    anchor && ev.lat != null && ev.lng != null
      ? Math.round(haversine(anchor.lat, anchor.lon, Number(ev.lat), Number(ev.lng)))
      : null

  return (
    <div style={{ background:'#1B2A3E', minHeight:'100vh', color:'white', padding:'1.5rem', fontFamily:'system-ui,sans-serif' }}>
      {showSubmit && <SubmitModal onClose={() => setShowSubmit(false)} />}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'2rem', fontWeight:900, margin:0 }}>📍 Car Meets & Events</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', margin:'0.3rem 0 0', fontSize:'0.85rem' }}>
            Search real events from the web + our community database
          </p>
        </div>
        <button onClick={() => setShowSubmit(true)} style={{ background:'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', border:'none', borderRadius:'0.875rem', padding:'0.75rem 1.5rem', fontWeight:700, fontSize:'0.9rem', cursor:'pointer', whiteSpace:'nowrap' }}>
          + Submit Your Event
        </button>
      </div>

      {/* ── Search Form ── */}
      <div style={{ background:'#243547', borderRadius:'1.25rem', padding:'1.5rem', marginBottom:'1.75rem', border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'0.875rem', marginBottom:'1rem' }}>
          <div style={{ gridColumn:'span 2', minWidth:'160px' }}>
            <label style={lbl}>City *</label>
            <input style={inp} placeholder="Clearwater" value={city} onChange={e=>setCity(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
          </div>
          <div>
            <label style={lbl}>State *</label>
            <select style={inp} value={stateVal} onChange={e=>setStateVal(e.target.value)}>
              {US_STATES.map(s => <option key={s} value={s} style={{background:'#243547'}}>{s} — {STATE_NAMES[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>ZIP Code</label>
            <input style={inp} placeholder="34698" value={zip} maxLength={5} onChange={e=>setZip(e.target.value.replace(/\D/g,''))} onKeyDown={e=>e.key==='Enter'&&handleSearch()} />
          </div>
          <div>
            <label style={lbl}>Radius</label>
            <select style={inp} value={radius} onChange={e=>setRadius(Number(e.target.value))}>
              {[25,50,100,200].map(r=><option key={r} value={r} style={{background:'#243547'}}>{r} miles</option>)}
              <option value={99999} style={{background:'#243547'}}>Statewide</option>
              <option value={999999} style={{background:'#243547'}}>Nationwide</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Event Type</label>
            <select style={inp} value={eventType} onChange={e=>setEventType(e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([k,v])=><option key={k} value={k} style={{background:'#243547'}}>{v}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Date Range</label>
            <select style={inp} value={dateRange} onChange={e=>setDateRange(e.target.value)}>
              <option value="upcoming" style={{background:'#243547'}}>All Upcoming</option>
              <option value="this_week" style={{background:'#243547'}}>This Week</option>
              <option value="this_month" style={{background:'#243547'}}>This Month</option>
              <option value="3months" style={{background:'#243547'}}>Next 3 Months</option>
              <option value="all" style={{background:'#243547'}}>All (incl. past)</option>
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
          <button onClick={handleSearch} disabled={searching} style={{ background:searching?'rgba(204,0,0,0.5)':'#CC0000', color:'white', border:'none', borderRadius:'0.875rem', padding:'0.75rem 2.5rem', fontWeight:700, fontSize:'1rem', cursor: searching?'not-allowed':'pointer', whiteSpace:'nowrap' }}>
            {searching ? '🔍 Searching...' : '🔍 Find Events'}
          </button>
          {searched && (
            <button onClick={()=>{setSearched(false);setAnchor(null);setSearchLabel('');setAiEvents([]);setPlatformLinks([]);setGoogleResults([]);setEventbriteResults([])}}
              style={{ background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'none', borderRadius:'0.875rem', padding:'0.75rem 1rem', cursor:'pointer', fontSize:'0.85rem' }}>
              Clear Search
            </button>
          )}
          {searchLabel && <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.82rem' }}>Showing results for <strong style={{color:'white'}}>{searchLabel}</strong></span>}
        </div>
      </div>

      {/* ── Community DB Events ── */}
      <div style={{ marginBottom:'2.5rem' }}>
        <SectionHead
          title="🗓️ Community Events"
          count={searched ? filteredDb.length : dbEvents.length}
          sub={searched ? `Matching events from our database near ${searchLabel}` : `${dbEvents.length} events in our community database — search above to filter by location`}
        />
        {dbLoading ? (
          <p style={{ color:'rgba(255,255,255,0.35)', padding:'2rem', textAlign:'center' }}>Loading...</p>
        ) : (searched ? filteredDb : dbEvents).length === 0 ? (
          <div style={{ background:'#243547', borderRadius:'1rem', padding:'2rem', textAlign:'center', color:'rgba(255,255,255,0.35)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ marginBottom:'0.5rem' }}>No community events found for this search.</p>
            <p style={{ fontSize:'0.8rem' }}>Be the first — <button onClick={()=>setShowSubmit(true)} style={{ background:'transparent', border:'none', color:'#CC0000', cursor:'pointer', fontWeight:700, fontSize:'0.8rem', padding:0 }}>submit yours!</button></p>
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.1rem' }}>
            {(searched ? filteredDb : dbEvents).slice(0,12).map(ev => <EventCard key={ev.id} ev={ev} dist={distFor(ev)} />)}
          </div>
        )}
      </div>

      {/* ── AI Known Events (only after search) ── */}
      {searched && aiEvents.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead
            title="🤖 AI-Discovered Events"
            count={aiEvents.length}
            sub={`Known recurring events near ${searchLabel} sourced from AI knowledge`}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.1rem' }}>
            {aiEvents.map((ev, i) => {
              const color = TYPE_COLORS[ev.type] ?? '#CC0000'
              return (
                <div key={i} style={{ ...card, borderColor:`${color}25` }}>
                  <div style={{ width:'100%', height:'100px', background:`linear-gradient(135deg,${color}22,#0D1E3088)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🚗</div>
                  <div style={{ padding:'1.1rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
                      <span style={{ background:color, color:'white', padding:'0.2rem 0.55rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase' }}>
                        {(ev.type ?? '').replace(/_/g,' ')}
                      </span>
                      <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.65rem' }}>AI Source</span>
                    </div>
                    <h3 style={{ fontWeight:800, fontSize:'0.95rem', marginBottom:'0.3rem', color:'white' }}>{ev.name}</h3>
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginBottom:'0.2rem' }}>📍 {ev.location}</p>
                    <p style={{ color:'#FFD700', fontSize:'0.75rem', marginBottom:'0.5rem' }}>🔁 {ev.schedule}</p>
                    {ev.description && <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.75rem', lineHeight:1.5, marginBottom:'0.65rem' }}>{ev.description}</p>}
                    {ev.website && (
                      <a href={ev.website} target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', color:'#3399FF', fontSize:'0.78rem', textDecoration:'none' }}>
                        🔗 Visit Website →
                      </a>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Eventbrite Results (only after search) ── */}
      {searched && eventbriteResults.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead
            title="🎟️ Eventbrite Events"
            count={eventbriteResults.length}
            sub={`Live events from Eventbrite near ${searchLabel}`}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:'1.1rem' }}>
            {eventbriteResults.map((ev, i) => (
              <a key={i} href={ev.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', color:'white' }}>
                <div style={{ ...card, cursor:'pointer', transition:'transform 0.15s' }}>
                  {ev.image ? <img src={ev.image} alt={ev.title} style={{ width:'100%', height:'150px', objectFit:'cover' }} />
                    : <div style={{ width:'100%', height:'100px', background:'linear-gradient(135deg,#f59e0b22,#0D1E3088)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🎟️</div>}
                  <div style={{ padding:'1.1rem' }}>
                    <span style={{ background:'#f59e0b', color:'white', padding:'0.2rem 0.55rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:700, marginBottom:'0.5rem', display:'inline-block' }}>EVENTBRITE</span>
                    <h3 style={{ fontWeight:800, fontSize:'0.9rem', marginBottom:'0.3rem' }}>{ev.title}</h3>
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem', marginBottom:'0.2rem' }}>📍 {ev.city}, {ev.state}</p>
                    {ev.date && <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.78rem' }}>📅 {fmtDate(ev.date)}</p>}
                    <p style={{ color:'#22c55e', fontSize:'0.8rem', fontWeight:600, marginTop:'0.5rem' }}>{ev.isFree ? 'Free' : 'Ticketed'}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Google Results (only after search, if available) ── */}
      {searched && googleResults.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead
            title="🔍 Web Search Results"
            count={googleResults.length}
            sub={`Google results for car events near ${searchLabel}`}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'0.875rem' }}>
            {googleResults.map((r, i) => (
              <a key={i} href={r.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'#243547', borderRadius:'0.875rem', padding:'1.1rem', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer' }}>
                  <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.68rem', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.3px' }}>{r.source}</p>
                  <h3 style={{ fontWeight:700, fontSize:'0.9rem', color:'#3399FF', marginBottom:'0.4rem', lineHeight:1.3 }}>{r.title}</h3>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', lineHeight:1.5 }}>{r.snippet}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Platform Links — always show after search ── */}
      {searched && platformLinks.length > 0 && (
        <div style={{ marginBottom:'2.5rem' }}>
          <SectionHead
            title="🌐 Find More Events On These Sites"
            sub={`Pre-filled searches for ${searchLabel} — click to open in a new tab`}
          />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px,1fr))', gap:'0.875rem' }}>
            {platformLinks.map((pl, i) => (
              <a key={i} href={pl.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'#243547', borderRadius:'1rem', padding:'1.25rem', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer', display:'flex', flexDirection:'column', gap:'0.4rem', transition:'border-color 0.15s' }}>
                  <div style={{ fontSize:'1.75rem' }}>{pl.emoji}</div>
                  <p style={{ fontWeight:700, color:'white', fontSize:'0.95rem', margin:0 }}>{pl.name}</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.78rem', margin:0, lineHeight:1.4 }}>{pl.desc}</p>
                  <span style={{ color:'#3399FF', fontSize:'0.75rem', marginTop:'0.25rem' }}>Search {pl.name} →</span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Pre-search CTA ── */}
      {!searched && (
        <div style={{ background:'linear-gradient(135deg,rgba(21,57,204,0.15),rgba(204,0,0,0.1))', borderRadius:'1.25rem', padding:'2.5rem', textAlign:'center', border:'1px solid rgba(255,255,255,0.07)', marginTop:'1rem' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</div>
          <h2 style={{ fontWeight:800, fontSize:'1.3rem', marginBottom:'0.5rem' }}>Find Events Near You</h2>
          <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.9rem', maxWidth:'450px', margin:'0 auto 1.5rem' }}>
            Enter your city and state above to search our community database, get AI-discovered events, and find links to Eventbrite, Meetup, Facebook Events, SCCA, and more — all pre-filled for your area.
          </p>
          <button onClick={()=>setShowSubmit(true)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.2)', color:'rgba(255,255,255,0.6)', borderRadius:'0.75rem', padding:'0.6rem 1.5rem', cursor:'pointer', fontSize:'0.85rem' }}>
            Or submit your own event →
          </button>
        </div>
      )}
    </div>
  )
}
