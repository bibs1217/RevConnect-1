'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

/* ─── constants ─────────────────────────────────────────────────────────── */
const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODk5NjMsImV4cCI6MjA5NjA2NTk2M30.SnLIQX-Ntn0ba3Ap1lcfG8RULan15E3qGwRAMoDtrXo'

const TYPE_COLORS: Record<string, string> = {
  street_meet:'#CC0000', car_show:'#F4A261', track_day:'#22c55e',
  cruise:'#3399FF', drag:'#a855f7', autocross:'#FFD700', hpde:'#14b8a6', popup:'#f43f5e',
}
const TYPE_LABELS: Record<string, string> = {
  street_meet:'Street Meet', car_show:'Car Show', track_day:'Track Day',
  cruise:'Cruise', drag:'Drag', autocross:'Autocross', hpde:'HPDE', popup:'Pop-up',
}
const TYPES = ['All','street_meet','car_show','track_day','cruise','drag','autocross','hpde']
const DATE_OPTIONS = [
  { value:'all',       label:'All Dates' },
  { value:'upcoming',  label:'Upcoming' },
  { value:'this_week', label:'This Week' },
  { value:'this_month',label:'This Month' },
]
const RADII = [25,50,100,200,500]

/* ─── types ─────────────────────────────────────────────────────────────── */
interface Ev {
  id:string; title:string; event_type:string; description:string|null
  address:string|null; city:string|null; state:string|null; zip:string|null
  lat:number|null; lng:number|null; starts_at:string; entry_fee:number|null
  current_attendees:number|null; cover_image_url:string|null
  is_published:boolean; is_cancelled:boolean
  distance?: number
}

/* ─── helpers ───────────────────────────────────────────────────────────── */
function fmtDate(iso:string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}) +
      ' · ' + d.toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'})
  } catch { return iso }
}

function haversine(la1:number,ln1:number,la2:number,ln2:number) {
  const R=3959, dLat=(la2-la1)*Math.PI/180, dLon=(ln2-ln1)*Math.PI/180
  const a=Math.sin(dLat/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dLon/2)**2
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

async function zipToCoords(zip:string):Promise<{lat:number;lng:number;city:string}|null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!r.ok) return null
    const d = await r.json()
    return { lat:parseFloat(d.places[0].latitude), lng:parseFloat(d.places[0].longitude), city:d.places[0]['place name'] }
  } catch { return null }
}

/* ─── shared input styles ───────────────────────────────────────────────── */
const SI: React.CSSProperties = {
  background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)',
  borderRadius:'0.5rem', padding:'0.5rem 0.75rem', color:'white',
  fontSize:'0.8rem', outline:'none',
}
const LBL: React.CSSProperties = {
  fontSize:'0.65rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase',
  letterSpacing:'0.06em', display:'block', marginBottom:'0.2rem',
}

/* ─── component ─────────────────────────────────────────────────────────── */
export default function EventsPage() {
  /* data */
  const [events,   setEvents]   = useState<Ev[]>([])
  const [loading,  setLoading]  = useState(true)
  const [loadErr,  setLoadErr]  = useState('')

  /* filters */
  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('all')
  const [zipInput,   setZipInput]   = useState('')
  const [radius,     setRadius]     = useState(200)
  const [anchor,     setAnchor]     = useState<{lat:number;lng:number;label:string}|null>(null)
  const [zipBusy,    setZipBusy]    = useState(false)
  const [zipErr,     setZipErr]     = useState('')

  /* create-event modal */
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({
    title:'', event_type:'street_meet', description:'', address:'',
    city:'', state:'', zip:'', starts_at:'', entry_fee:'', cover_image_url:'',
  })
  const [creating,   setCreating]   = useState(false)
  const [createErr,  setCreateErr]  = useState('')

  /* user (for create button) */
  const [userId, setUserId] = useState<string|null>(null)
  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
  }, [])

  /* ── load events via raw fetch (bypasses Supabase JS client init issues) */
  useEffect(() => {
    async function load() {
      setLoading(true); setLoadErr('')
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/events?select=*&is_published=eq.true&is_cancelled=eq.false&order=starts_at.asc`,
          { headers:{ apikey:SUPABASE_ANON, Authorization:`Bearer ${SUPABASE_ANON}`, Accept:'application/json' } }
        )
        const text = await res.text()
        if (!res.ok) { setLoadErr(`${res.status}: ${text.slice(0,200)}`); setLoading(false); return }
        const data: Ev[] = JSON.parse(text)
        console.log('[EVENTS] loaded', data.length, 'rows')
        setEvents(data)
      } catch(e:any) {
        console.error('[EVENTS]', e)
        setLoadErr(String(e))
      }
      setLoading(false)
    }
    load()
  }, [])

  /* ── ZIP search ── */
  async function findByZip() {
    setZipErr('')
    const z = zipInput.replace(/\D/g,'').slice(0,5)
    if (!z) { setAnchor(null); return }
    if (z.length < 5) { setZipErr('Enter a 5-digit ZIP'); return }
    setZipBusy(true)
    const coords = await zipToCoords(z)
    if (coords) setAnchor({ lat:coords.lat, lng:coords.lng, label:`${coords.city} (${z})` })
    else setZipErr('ZIP not found')
    setZipBusy(false)
  }

  /* ── filter & sort ── */
  const filtered = useMemo<(Ev & {distance?:number})[]>(() => {
    const now = new Date()
    const endWeek  = new Date(now); endWeek.setDate(now.getDate()+7)
    const endMonth = new Date(now.getFullYear(), now.getMonth()+1, 0, 23,59,59)

    return events
      .map(ev => ({
        ...ev,
        distance: anchor && ev.lat && ev.lng
          ? Math.round(haversine(anchor.lat, anchor.lng, ev.lat, ev.lng))
          : undefined,
      }))
      .filter(ev => {
        if (typeFilter !== 'All' && ev.event_type !== typeFilter) return false
        if (search.trim()) {
          const q = search.toLowerCase()
          if (!( (ev.title??'').toLowerCase().includes(q) ||
                 (ev.city??'').toLowerCase().includes(q)  ||
                 (ev.state??'').toLowerCase().includes(q) ||
                 (ev.description??'').toLowerCase().includes(q) )) return false
        }
        if (anchor && ev.distance !== undefined && ev.distance > radius) return false
        const d = new Date(ev.starts_at)
        if (dateFilter==='upcoming'  && d < now)                       return false
        if (dateFilter==='this_week' && (d < now || d > endWeek))      return false
        if (dateFilter==='this_month'&& (d < now || d > endMonth))     return false
        return true
      })
      .sort((a,b) => {
        if (anchor && a.distance!==undefined && b.distance!==undefined)
          return a.distance - b.distance
        return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      })
  }, [events, typeFilter, search, anchor, radius, dateFilter])

  /* ── create event ── */
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) return
    setCreating(true); setCreateErr('')
    try {
      let lat:number|null=null, lng:number|null=null
      if (form.zip.length===5) {
        const c = await zipToCoords(form.zip)
        if (c) { lat=c.lat; lng=c.lng }
      }
      const { data:{ session } } = await createClient().auth.getSession()
      const token = session?.access_token ?? SUPABASE_ANON
      const res = await fetch(`${SUPABASE_URL}/rest/v1/events`, {
        method:'POST',
        headers:{
          apikey:SUPABASE_ANON, Authorization:`Bearer ${token}`,
          'Content-Type':'application/json', Prefer:'return=minimal',
        },
        body: JSON.stringify({
          title:       form.title,
          event_type:  form.event_type,
          description: form.description || null,
          address:     form.address     || null,
          city:        form.city,
          state:       form.state.toUpperCase().slice(0,2),
          zip:         form.zip         || null,
          lat, lng,
          starts_at:   new Date(form.starts_at).toISOString(),
          entry_fee:   form.entry_fee ? parseInt(form.entry_fee) : null,
          cover_image_url: form.cover_image_url || null,
          organizer_id: userId,
          is_published: true, is_cancelled: false,
          registration_required: false, weather_sensitive: false,
          current_attendees: 0,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        setCreateErr(txt.slice(0,200))
      } else {
        setShowCreate(false)
        setForm({ title:'',event_type:'street_meet',description:'',address:'',city:'',state:'',zip:'',starts_at:'',entry_fee:'',cover_image_url:'' })
        // reload
        const r2 = await fetch(
          `${SUPABASE_URL}/rest/v1/events?select=*&is_published=eq.true&is_cancelled=eq.false&order=starts_at.asc`,
          { headers:{ apikey:SUPABASE_ANON, Authorization:`Bearer ${SUPABASE_ANON}`, Accept:'application/json' } }
        )
        if (r2.ok) setEvents(await r2.json())
      }
    } catch(e:any) { setCreateErr(String(e)) }
    setCreating(false)
  }

  /* ═══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ width:'100%' }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontSize:'1.6rem', fontWeight:800, margin:0 }}>📍 Events & Car Meets</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.2rem', fontSize:'0.8rem' }}>
            {loading ? 'Loading…'
              : loadErr ? 'Error — see below'
              : `${events.length} events · showing ${filtered.length}`}
          </p>
        </div>
        {userId && (
          <button onClick={() => setShowCreate(v => !v)}
            style={{ background:'linear-gradient(135deg,#CC0000,#990000)', color:'white', border:'none', padding:'0.6rem 1.25rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', fontSize:'0.85rem', boxShadow:'0 4px 14px rgba(204,0,0,0.35)', whiteSpace:'nowrap' }}>
            + Create Event
          </button>
        )}
      </div>

      {/* ── Error ── */}
      {loadErr && (
        <div style={{ background:'rgba(204,0,0,0.12)', border:'1px solid rgba(204,0,0,0.35)', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'1rem', color:'#E63946', fontSize:'0.8rem', fontFamily:'monospace' }}>
          ⚠️ {loadErr}
        </div>
      )}

      {/* ── Create Event Modal ── */}
      {showCreate && userId && (
        <div style={{ background:'#1C2E40', border:'1px solid rgba(204,0,0,0.25)', borderRadius:'1rem', padding:'1.25rem', marginBottom:'1.25rem' }}>
          <h2 style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'1rem' }}>Create New Event</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'0.625rem', marginBottom:'0.75rem' }}>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={LBL}>Event Title *</label>
                <input required value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}
                  placeholder="Cars & Coffee — July" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={LBL}>Type *</label>
                <select value={form.event_type} onChange={e=>setForm(f=>({...f,event_type:e.target.value}))}
                  style={{ ...SI, width:'100%', boxSizing:'border-box', cursor:'pointer' }}>
                  {TYPES.filter(t=>t!=='All').map(t=><option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Date & Time *</label>
                <input required type="datetime-local" value={form.starts_at} onChange={e=>setForm(f=>({...f,starts_at:e.target.value}))}
                  style={{ ...SI, width:'100%', boxSizing:'border-box', colorScheme:'dark' }} />
              </div>
              <div>
                <label style={LBL}>Entry Fee ($)</label>
                <input type="number" min="0" value={form.entry_fee} onChange={e=>setForm(f=>({...f,entry_fee:e.target.value}))}
                  placeholder="0 = Free" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={LBL}>City *</label>
                <input required value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}
                  placeholder="Tampa" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={LBL}>State *</label>
                <input required maxLength={2} value={form.state} onChange={e=>setForm(f=>({...f,state:e.target.value}))}
                  placeholder="FL" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={LBL}>ZIP</label>
                <input maxLength={5} value={form.zip} onChange={e=>setForm(f=>({...f,zip:e.target.value.replace(/\D/g,'')}))}
                  placeholder="33607" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={LBL}>Address / Venue</label>
                <input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}
                  placeholder="1234 Main St or parking lot name" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={LBL}>Description</label>
                <textarea rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                  placeholder="Tell people what to expect…" style={{ ...SI, width:'100%', boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div style={{ gridColumn:'1/-1' }}>
                <label style={LBL}>Cover Image URL</label>
                <input value={form.cover_image_url} onChange={e=>setForm(f=>({...f,cover_image_url:e.target.value}))}
                  placeholder="https://…" style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
              </div>
            </div>
            {createErr && <p style={{ color:'#E63946', fontSize:'0.75rem', marginBottom:'0.625rem' }}>{createErr}</p>}
            <div style={{ display:'flex', gap:'0.625rem' }}>
              <button type="submit" disabled={creating}
                style={{ background:creating?'rgba(204,0,0,0.4)':'#CC0000', color:'white', border:'none', padding:'0.55rem 1.25rem', borderRadius:'0.5rem', fontWeight:700, cursor:creating?'not-allowed':'pointer', fontSize:'0.8rem' }}>
                {creating ? 'Posting…' : 'Post Event'}
              </button>
              <button type="button" onClick={()=>setShowCreate(false)}
                style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.45)', padding:'0.55rem 0.875rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.8rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Search & Filter Panel ── */}
      <div style={{ background:'#1C2E40', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1rem', marginBottom:'1.25rem' }}>

        {/* Row 1: keyword + zip + radius + button */}
        <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'flex-end', marginBottom:'0.75rem' }}>
          {/* Keyword search */}
          <div style={{ flex:'1 1 200px' }}>
            <label style={LBL}>Search</label>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.5rem', padding:'0.5rem 0.75rem' }}>
              <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.85rem' }}>🔍</span>
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Event name, city, state…"
                style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.8rem', outline:'none' }} />
              {search && <button onClick={()=>setSearch('')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', lineHeight:1 }}>×</button>}
            </div>
          </div>

          {/* ZIP */}
          <div style={{ flex:'0 0 90px' }}>
            <label style={LBL}>ZIP Code</label>
            <input value={zipInput} onChange={e=>setZipInput(e.target.value.replace(/\D/g,'').slice(0,5))}
              onKeyDown={e=>e.key==='Enter'&&findByZip()}
              placeholder="34698" maxLength={5}
              style={{ ...SI, width:'100%', boxSizing:'border-box' }} />
          </div>

          {/* Radius */}
          <div style={{ flex:'0 0 100px' }}>
            <label style={LBL}>Radius</label>
            <select value={radius} onChange={e=>setRadius(parseInt(e.target.value))}
              style={{ ...SI, width:'100%', boxSizing:'border-box', cursor:'pointer' }}>
              {RADII.map(r=><option key={r} value={r}>{r} mi</option>)}
              <option value={99999}>Nationwide</option>
            </select>
          </div>

          {/* Find Events button + clear */}
          <div style={{ display:'flex', gap:'0.375rem', paddingBottom:'1px' }}>
            <button onClick={findByZip} disabled={zipBusy}
              style={{ background:zipBusy?'rgba(21,57,204,0.4)':'linear-gradient(135deg,#1539CC,#0D28AA)', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontWeight:700, cursor:zipBusy?'not-allowed':'pointer', fontSize:'0.8rem', whiteSpace:'nowrap' }}>
              {zipBusy ? '…' : 'Find Events'}
            </button>
            {anchor && (
              <button onClick={()=>{setAnchor(null);setZipInput('')}}
                style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.35)', padding:'0.5rem 0.625rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.75rem' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {zipErr  && <p style={{ color:'#E63946', fontSize:'0.72rem', margin:'0 0 0.5rem' }}>{zipErr}</p>}
        {anchor  && <p style={{ color:'#22c55e', fontSize:'0.72rem', margin:'0 0 0.625rem' }}>📍 Showing within {radius === 99999 ? 'nationwide' : `${radius} miles of`} {anchor.label}</p>}

        {/* Row 2: type chips */}
        <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap', marginBottom:'0.5rem' }}>
          {TYPES.map(t => {
            const c = TYPE_COLORS[t] ?? '#CC0000'
            const on = typeFilter === t
            return (
              <button key={t} onClick={()=>setTypeFilter(t)}
                style={{ padding:'0.25rem 0.7rem', borderRadius:'9999px', border:`1px solid ${on?c:'rgba(255,255,255,0.1)'}`, background:on?`${c}22`:'transparent', color:on?c:'rgba(255,255,255,0.38)', fontSize:'0.72rem', cursor:'pointer', fontWeight:on?700:400 }}>
                {t==='All'?'All Types':TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Row 3: date chips */}
        <div style={{ display:'flex', gap:'0.3rem', flexWrap:'wrap' }}>
          {DATE_OPTIONS.map(({value,label}) => {
            const on = dateFilter === value
            return (
              <button key={value} onClick={()=>setDateFilter(value)}
                style={{ padding:'0.25rem 0.7rem', borderRadius:'9999px', border:`1px solid ${on?'#3399FF':'rgba(255,255,255,0.1)'}`, background:on?'rgba(51,153,255,0.14)':'transparent', color:on?'#3399FF':'rgba(255,255,255,0.38)', fontSize:'0.72rem', cursor:'pointer', fontWeight:on?700:400 }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Status line ── */}
      <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.28)', marginBottom:'1rem' }}>
        {loading ? 'Loading events…'
          : `Showing ${filtered.length} of ${events.length} events${anchor ? ` within ${radius===99999?'nationwide':`${radius}mi of ${anchor.label}`}` : ''}${search ? ` · "${search}"` : ''}`}
      </p>

      {/* ── Loading spinner ── */}
      {loading && (
        <div style={{ textAlign:'center', padding:'4rem 0', color:'rgba(255,255,255,0.25)' }}>
          <div style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>⏳</div>
          <p>Loading events…</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:'center', padding:'3.5rem 1rem', background:'#1C2E40', borderRadius:'1rem', border:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📍</div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'1rem', marginBottom:'0.5rem' }}>No events found.</p>
          <p style={{ color:'rgba(255,255,255,0.28)', fontSize:'0.82rem', marginBottom:'1.25rem' }}>
            {events.length === 0
              ? 'No events in the database — be the first to create one!'
              : anchor
                ? 'Try a wider radius or clear the location filter.'
                : 'Try clearing some filters.'}
          </p>
          <div style={{ display:'flex', gap:'0.625rem', justifyContent:'center', flexWrap:'wrap' }}>
            {anchor && <button onClick={()=>{setAnchor(null);setZipInput('')}} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.45)', padding:'0.45rem 0.875rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.78rem' }}>Clear location</button>}
            {typeFilter!=='All' && <button onClick={()=>setTypeFilter('All')} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.45)', padding:'0.45rem 0.875rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.78rem' }}>Clear type filter</button>}
            {dateFilter!=='all'  && <button onClick={()=>setDateFilter('all')}  style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.45)', padding:'0.45rem 0.875rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.78rem' }}>Clear date filter</button>}
            {userId && <button onClick={()=>setShowCreate(true)} style={{ background:'#CC0000', border:'none', color:'white', padding:'0.45rem 0.875rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.78rem', fontWeight:700 }}>+ Post an Event</button>}
          </div>
        </div>
      )}

      {/* ── Event Cards Grid ── */}
      {!loading && filtered.length > 0 && (
        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
          gap:'1rem',
          width:'100%',
        }}>
          {filtered.map(ev => {
            const color = TYPE_COLORS[ev.event_type] ?? '#CC0000'
            return (
              <div key={ev.id} style={{
                background:'#1C2E40',
                border:`1px solid ${color}28`,
                borderRadius:'0.875rem',
                overflow:'hidden',
                display:'flex',
                flexDirection:'column',
                minHeight:'340px',
              }}>
                {/* Cover image */}
                <div style={{ height:'150px', background:`linear-gradient(135deg,${color}18,#0D1E30)`, position:'relative', flexShrink:0 }}>
                  {ev.cover_image_url
                    ? <img src={ev.cover_image_url} alt={ev.title}
                        style={{ width:'100%', height:'100%', objectFit:'cover' }}
                        onError={e=>{ (e.target as HTMLImageElement).style.display='none' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.75rem' }}>🚗</div>
                  }
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 35%,rgba(28,46,64,0.88) 100%)' }} />
                  {/* Type badge */}
                  <span style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:color, color:'white', padding:'0.15rem 0.55rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:700 }}>
                    {TYPE_LABELS[ev.event_type] ?? ev.event_type}
                  </span>
                  {/* Distance badge */}
                  {ev.distance !== undefined && (
                    <span style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'rgba(0,0,0,0.6)', color:'#22c55e', padding:'0.15rem 0.55rem', borderRadius:'9999px', fontSize:'0.62rem', fontWeight:700, border:'1px solid rgba(34,197,94,0.25)' }}>
                      📍 {ev.distance}mi
                    </span>
                  )}
                </div>

                {/* Card body */}
                <div style={{ padding:'0.875rem', flex:1, display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  <h3 style={{ fontWeight:700, fontSize:'0.9rem', lineHeight:1.3, margin:0, color:'white' }}>
                    {ev.title}
                  </h3>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem', margin:0 }}>
                    📅 {fmtDate(ev.starts_at)}
                  </p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem', margin:0 }}>
                    📍 {ev.city ?? '—'}, {ev.state ?? '—'}
                    {ev.address ? ` · ${ev.address}` : ''}
                  </p>
                  {ev.description && (
                    <p style={{
                      color:'rgba(255,255,255,0.3)', fontSize:'0.72rem', lineHeight:1.45,
                      margin:'0.1rem 0 0', overflow:'hidden',
                      display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical',
                    }}>
                      {ev.description}
                    </p>
                  )}

                  {/* Footer */}
                  <div style={{ marginTop:'auto', paddingTop:'0.625rem', borderTop:'1px solid rgba(255,255,255,0.05)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.32)' }}>
                      👥 {ev.current_attendees ?? 0} going
                    </span>
                    <span style={{ fontWeight:700, fontSize:'0.82rem', color: ev.entry_fee ? '#FFD700' : '#22c55e' }}>
                      {ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}
                    </span>
                  </div>

                  {/* RSVP button */}
                  <button
                    style={{ width:'100%', marginTop:'0.375rem', background:'transparent', border:`1px solid ${color}40`, color:'rgba(255,255,255,0.45)', padding:'0.4rem', borderRadius:'0.4rem', fontSize:'0.75rem', cursor:'pointer' }}
                    onClick={() => alert(userId ? `RSVP'd to ${ev.title}!` : 'Sign in to RSVP')}>
                    RSVP
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
