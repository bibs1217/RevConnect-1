'use client'
import { useState, useEffect } from 'react'

const SUPABASE_URL = 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyNjYyMzQsImV4cCI6MjA2MDg0MjIzNH0.TZOjsdXpRSjcupX0GYGcaEqrpgp0F5djVl6h78dBf5M'

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8
  const dLat = (lat2-lat1)*Math.PI/180
  const dLon = (lon2-lon1)*Math.PI/180
  const a = Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2)
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))
}

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [zip, setZip] = useState('')
  const [radius, setRadius] = useState(100)
  const [typeFilter, setTypeFilter] = useState('all')
  const [anchor, setAnchor] = useState<{lat:number,lon:number}|null>(null)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetch(`${SUPABASE_URL}/rest/v1/events?select=*&is_published=eq.true&is_cancelled=eq.false&order=starts_at.asc`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` }
    })
    .then(r => r.json())
    .then(data => { setEvents(Array.isArray(data) ? data : []); setLoading(false) })
    .catch(() => setLoading(false))
  }, [])

  async function handleSearch() {
    if (!zip || zip.length < 5) { setAnchor(null); return }
    setSearching(true)
    try {
      const r = await fetch(`https://api.zippopotam.us/us/${zip}`)
      const d = await r.json()
      setAnchor({ lat: parseFloat(d.places[0].latitude), lon: parseFloat(d.places[0].longitude) })
    } catch(e) { alert('ZIP not found') }
    setSearching(false)
  }

  const filtered = events.filter(ev => {
    if (typeFilter !== 'all' && ev.event_type !== typeFilter) return false
    if (anchor && ev.lat != null && ev.lng != null) {
      const dist = haversine(anchor.lat, anchor.lon, Number(ev.lat), Number(ev.lng))
      if (dist > radius) return false
    }
    return true
  })

  const inp = { background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'0.5rem', color:'white', padding:'0.625rem 0.875rem', fontSize:'0.875rem', outline:'none', width:'100%' }

  return (
    <div style={{ background:'#1B2A3E', minHeight:'100vh', color:'white', padding:'1.5rem' }}>
      <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'1.5rem' }}>📍 Car Meets & Events</h1>

      {/* Search */}
      <div style={{ background:'#243547', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:'150px' }}>
          <label style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>ZIP Code</label>
          <input style={inp as any} placeholder="34698" value={zip} onChange={e => setZip(e.target.value)} maxLength={5} onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <div style={{ minWidth:'120px' }}>
          <label style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.4)', display:'block', marginBottom:'0.35rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>Radius</label>
          <select style={inp as any} value={radius} onChange={e => setRadius(Number(e.target.value))}>
            {[25,50,100,200,500].map(r => <option key={r} value={r} style={{background:'#243547'}}>{r} miles</option>)}
          </select>
        </div>
        <button onClick={handleSearch} disabled={searching} style={{ background:'#CC0000', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 2rem', fontWeight:700, fontSize:'0.95rem', cursor:'pointer', whiteSpace:'nowrap' }}>
          {searching ? 'Searching...' : '🔍 Find Events'}
        </button>
        {anchor && <button onClick={() => { setAnchor(null); setZip('') }} style={{ background:'rgba(255,255,255,0.1)', color:'white', border:'none', borderRadius:'0.75rem', padding:'0.75rem 1rem', cursor:'pointer', fontSize:'0.85rem' }}>Clear Location</button>}
      </div>

      {/* Type filters */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {[['all','All Events'],['street_meet','Street Meet'],['car_show','Car Show'],['track_day','Track Day'],['cruise','Cruise'],['drag','Drag'],['autocross','Autocross'],['hpde','HPDE']].map(([val,label]) => (
          <button key={val} onClick={() => setTypeFilter(val)} style={{ background: typeFilter===val ? '#CC0000' : 'rgba(255,255,255,0.07)', color:'white', border:`1px solid ${typeFilter===val ? '#CC0000' : 'rgba(255,255,255,0.15)'}`, borderRadius:'9999px', padding:'0.4rem 1rem', fontSize:'0.8rem', fontWeight: typeFilter===val ? 700 : 400, cursor:'pointer' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Results count */}
      <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem', marginBottom:'1rem' }}>
        {loading ? 'Loading events...' : `${filtered.length} events ${anchor ? `within ${radius} miles of ${zip}` : 'nationwide'}`}
      </p>

      {/* Events grid */}
      {loading ? (
        <p style={{ color:'rgba(255,255,255,0.4)', textAlign:'center', padding:'4rem' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem', color:'rgba(255,255,255,0.4)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>📍</div>
          <p style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>No events found</p>
          <p style={{ fontSize:'0.875rem' }}>Try a wider radius or clear the location filter</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'1.25rem' }}>
          {filtered.map(ev => {
            const dist = anchor && ev.lat && ev.lng ? Math.round(haversine(anchor.lat, anchor.lon, Number(ev.lat), Number(ev.lng))) : null
            const date = ev.starts_at ? new Date(ev.starts_at.replace(' ','T')).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : 'TBD'
            return (
              <div key={ev.id} style={{ background:'#243547', borderRadius:'1rem', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
                {ev.cover_image_url ? (
                  <img src={ev.cover_image_url} alt={ev.title} style={{ width:'100%', height:'160px', objectFit:'cover' }} />
                ) : (
                  <div style={{ width:'100%', height:'160px', background:'linear-gradient(135deg, #1539CC20, #CC000020)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem' }}>🚗</div>
                )}
                <div style={{ padding:'1.25rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
                    <span style={{ background:'#CC0000', color:'white', padding:'0.2rem 0.6rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase' }}>{ev.event_type?.replace('_',' ')}</span>
                    {dist !== null && <span style={{ color:'#FFD700', fontSize:'0.75rem', fontWeight:600 }}>📍 {dist} mi away</span>}
                  </div>
                  <h3 style={{ fontWeight:800, fontSize:'1rem', marginBottom:'0.4rem', color:'white' }}>{ev.title}</h3>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.8rem', marginBottom:'0.25rem' }}>📍 {ev.city}, {ev.state}</p>
                  <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.8rem', marginBottom:'0.75rem' }}>📅 {date}</p>
                  {ev.description && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', lineHeight:1.5, marginBottom:'0.75rem' }}>{ev.description.slice(0,100)}{ev.description.length>100?'...':''}</p>}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'#00C853', fontSize:'0.8rem', fontWeight:600 }}>{ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}</span>
                    <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem' }}>👥 {ev.current_attendees || 0} going</span>
                  </div>
                  <button style={{ width:'100%', marginTop:'0.75rem', background:'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', border:'none', borderRadius:'0.5rem', padding:'0.6rem', fontWeight:700, cursor:'pointer', fontSize:'0.875rem' }}>
                    RSVP →
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
