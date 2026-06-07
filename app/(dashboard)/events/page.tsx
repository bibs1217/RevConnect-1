'use client'

import { useEffect, useState } from 'react'
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

  /* ── filter — computed synchronously on every render ── */
  const filtered = events.filter(ev => {
    if (typeFilter !== 'All' && ev.event_type !== typeFilter) return false
    if (search && !((ev.title ?? '').toLowerCase().includes(search.toLowerCase()) || (ev.city ?? '').toLowerCase().includes(search.toLowerCase()))) return false
    if (anchor && ev.lat != null && ev.lng != null) {
      const dist = haversine(anchor.lat, anchor.lng, Number(ev.lat), Number(ev.lng))
      if (dist > radius) return false
    }
    return true
  })

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
    <div style={{ background:'#1B2A3E', minHeight:'100vh', color:'white', padding:'1.5rem' }}>

      <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'1rem' }}>
        🚗 Car Meets & Events
      </h1>

      <p style={{ color:'rgba(255,255,255,0.5)', marginBottom:'2rem' }}>
        {loading ? 'Loading...' : `${events.length} events loaded · ${filtered.length} showing`}
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'1rem' }}>
        {filtered.map(ev => (
          <div key={ev.id} style={{ background:'#243547', borderRadius:'1rem', padding:'1.5rem', border:'1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize:'0.75rem', color:'#FFD700', marginBottom:'0.5rem' }}>{ev.event_type}</div>
            <h3 style={{ fontWeight:800, marginBottom:'0.5rem' }}>{ev.title}</h3>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.875rem', marginBottom:'0.5rem' }}>📍 {ev.city}, {ev.state}</p>
            <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.875rem', marginBottom:'0.5rem' }}>📅 {ev.starts_at}</p>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{ev.description}</p>
          </div>
        ))}
      </div>

      {!loading && filtered.length === 0 && (
        <p style={{ color:'rgba(255,255,255,0.4)', textAlign:'center', marginTop:'4rem' }}>
          No events found
        </p>
      )}
    </div>
  )
}
