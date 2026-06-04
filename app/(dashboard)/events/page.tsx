'use client'

import { useState, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/auth-provider'

// Events with real coordinates
const MOCK_EVENTS = [
  { id:'1', title:'DFW Car Meet — Summer Edition', event_type:'street_meet', city:'Dallas', state:'TX', lat:32.7767, lng:-96.7970, starts_at:'2026-06-15T18:00:00', entry_fee:null, current_attendees:142, organizer:'@dfw_meets', img:'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&q=80' },
  { id:'2', title:'Texas Tuner Showdown', event_type:'car_show', city:'Austin', state:'TX', lat:30.2672, lng:-97.7431, starts_at:'2026-06-22T10:00:00', entry_fee:25, current_attendees:87, organizer:'@tx_tuners', img:'https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=500&q=80' },
  { id:'3', title:'COTA Track Day — Open Lapping', event_type:'track_day', city:'Austin', state:'TX', lat:30.1328, lng:-97.6411, starts_at:'2026-07-04T08:00:00', entry_fee:350, current_attendees:34, organizer:'@cota_events', img:'https://images.unsplash.com/photo-1541348263662-e068662d82af?w=500&q=80' },
  { id:'4', title:'Saturday Night Cruise — Fort Worth', event_type:'cruise', city:'Fort Worth', state:'TX', lat:32.7555, lng:-97.3308, starts_at:'2026-06-14T20:00:00', entry_fee:null, current_attendees:63, organizer:'@fw_cruise', img:'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500&q=80' },
  { id:'5', title:'H-Town Drag Wars', event_type:'drag', city:'Houston', state:'TX', lat:29.7604, lng:-95.3698, starts_at:'2026-06-28T12:00:00', entry_fee:50, current_attendees:156, organizer:'@htown_drag', img:'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500&q=80' },
  { id:'6', title:'Lone Star Autocross — Round 4', event_type:'autocross', city:'San Antonio', state:'TX', lat:29.4241, lng:-98.4936, starts_at:'2026-07-12T09:00:00', entry_fee:45, current_attendees:72, organizer:'@lone_star_ac', img:'https://images.unsplash.com/photo-1594535182308-8ffbba1b9516?w=500&q=80' },
  { id:'7', title:'SoCal JDM Fest', event_type:'car_show', city:'Los Angeles', state:'CA', lat:34.0522, lng:-118.2437, starts_at:'2026-06-20T09:00:00', entry_fee:20, current_attendees:312, organizer:'@socal_jdm', img:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80' },
  { id:'8', title:'Miami Beach Exotic Car Meet', event_type:'street_meet', city:'Miami', state:'FL', lat:25.7617, lng:-80.1918, starts_at:'2026-06-13T19:00:00', entry_fee:null, current_attendees:198, organizer:'@miami_exotics', img:'https://images.unsplash.com/photo-1617788138017-80ad40651399?w=500&q=80' },
]

const TYPE_COLORS: Record<string,string> = { street_meet:'#CC0000', car_show:'#F4A261', track_day:'#22c55e', cruise:'#3399FF', drag:'#a855f7', autocross:'#FFD700', hpde:'#14b8a6' }
const TYPE_LABELS: Record<string,string> = { street_meet:'Street Meet', car_show:'Car Show', track_day:'Track Day', cruise:'Cruise', drag:'Drag', autocross:'Autocross', hpde:'HPDE' }
const TYPES = ['All','street_meet','car_show','track_day','cruise','drag','autocross']

function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959
  const dLat = (lat2-lat1) * Math.PI/180
  const dLon = (lng2-lng1) * Math.PI/180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
}

export default function EventsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [location, setLocation] = useState<{lat:number,lng:number,city:string}|null>(null)
  const [locLoading, setLocLoading] = useState(false)
  const [locError, setLocError] = useState('')
  const [radius, setRadius] = useState(500)

  function enableLocation() {
    if (!navigator.geolocation) { setLocError('Geolocation not supported by your browser'); return }
    setLocLoading(true); setLocError('')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        // Reverse geocode using free API
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
          const data = await res.json()
          const city = data.address?.city || data.address?.town || data.address?.county || 'Your Location'
          setLocation({ lat, lng, city })
        } catch {
          setLocation({ lat, lng, city:'Your Location' })
        }
        setLocLoading(false)
      },
      (err) => {
        setLocError(err.code === 1 ? 'Location access denied. Please allow location in your browser settings.' : 'Could not get your location. Please try again.')
        setLocLoading(false)
      },
      { timeout:10000, enableHighAccuracy:false }
    )
  }

  const eventsWithDistance = useMemo(() => {
    return MOCK_EVENTS.map(ev => ({
      ...ev,
      distance: location ? Math.round(distanceMiles(location.lat, location.lng, ev.lat, ev.lng)) : null
    }))
  }, [location])

  const filtered = useMemo(() => {
    let results = eventsWithDistance
    if (filter !== 'All') results = results.filter(e => e.event_type === filter)
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(e => e.title.toLowerCase().includes(q) || e.city.toLowerCase().includes(q) || e.organizer.toLowerCase().includes(q))
    }
    if (location) results = results.filter(e => e.distance !== null && e.distance <= radius)
    return [...results].sort((a,b) => {
      if (location && a.distance !== null && b.distance !== null) return a.distance - b.distance
      return new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
    })
  }, [eventsWithDistance, filter, search, location, radius])

  async function toggleRsvp(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    setRsvpd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    if (user) {
      const supabase = createClient()
      if (!rsvpd.has(id)) {
        await supabase.from('notifications').insert({ user_id: user.id, type:'event_rsvp', title:`You're going!`, body:`RSVP confirmed for event ${id}` })
      }
    }
  }

  const inp: React.CSSProperties = { background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', color:'white', fontSize:'0.8rem', outline:'none' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>📍 Events & Car Meets</h1>
          <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Discover meets, shows, track days, and cruises near you</p>
        </div>
        {user && <button onClick={() => setShowCreate(!showCreate)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>+ Create Event</button>}
      </div>

      {/* Location bar */}
      <div style={{ background: location ? 'rgba(34,197,94,0.06)':'rgba(21,57,204,0.06)', border:`1px solid ${location ? 'rgba(34,197,94,0.2)':'rgba(21,57,204,0.15)'}`, borderRadius:'0.875rem', padding:'0.875rem 1.25rem', marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
        {location ? (
          <>
            <span style={{ color:'#22c55e', fontSize:'1.25rem' }}>📍</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#22c55e' }}>Location enabled — {location.city}</p>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>Showing events within {radius} miles · {filtered.length} found</p>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <label style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>Radius:</label>
              <select value={radius} onChange={e => setRadius(parseInt(e.target.value))} style={{ ...inp, cursor:'pointer', padding:'0.375rem 0.5rem' }}>
                {[25,50,100,200,500].map(r => <option key={r} value={r}>{r} mi</option>)}
              </select>
            </div>
            <button onClick={() => setLocation(null)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem', cursor:'pointer' }}>Clear</button>
          </>
        ) : (
          <>
            <span style={{ color:'#3399FF', fontSize:'1.25rem' }}>🗺️</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:'0.875rem', fontWeight:600 }}>Find events near you</p>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>Enable location to see distance, sort by proximity, and filter by radius</p>
            </div>
            {locError && <p style={{ fontSize:'0.75rem', color:'#E63946', maxWidth:'300px' }}>{locError}</p>}
            <button onClick={enableLocation} disabled={locLoading} style={{ background:'linear-gradient(135deg, #1539CC, #0D28AA)', color:'white', border:'none', padding:'0.625rem 1.25rem', borderRadius:'0.625rem', fontWeight:700, cursor: locLoading ? 'default':'pointer', fontSize:'0.875rem', boxShadow:'0 4px 16px rgba(21,57,204,0.3)', opacity: locLoading ? 0.7:1, whiteSpace:'nowrap' }}>
              {locLoading ? '⏳ Detecting…' : '📍 Enable Location'}
            </button>
          </>
        )}
      </div>

      {/* Search + filters */}
      <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1.125rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.5rem 0.875rem' }}>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search events, cities, organizers…' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem' }}>×</button>}
          </div>
        </div>
        <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
          {TYPES.map(t => (
            <button key={t} onClick={() => setFilter(t)} style={{ padding:'0.3rem 0.75rem', borderRadius:'9999px', border:`1px solid ${filter===t ? (TYPE_COLORS[t]??'#CC0000'):'rgba(255,255,255,0.1)'}`, background: filter===t ? `${TYPE_COLORS[t]??'#CC0000'}15`:'transparent', color: filter===t ? (TYPE_COLORS[t]??'#CC0000'):'rgba(255,255,255,0.4)', fontSize:'0.75rem', cursor:'pointer', fontWeight: filter===t ? 700:400 }}>
              {t === 'All' ? 'All Events' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginBottom:'1rem' }}>
        {filtered.length} event{filtered.length !== 1 ? 's' : ''}{location ? ` within ${radius}mi of ${location.city}` : ''}{search ? ` matching "${search}"` : ''}
      </p>

      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', background:'#243547', borderRadius:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📍</p>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem' }}>No events found{location ? ` within ${radius} miles` : ''}.</p>
          {location && <button onClick={() => setRadius(500)} style={{ background:'transparent', border:'1px solid rgba(21,57,204,0.3)', color:'#3399FF', padding:'0.5rem 1rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.8rem', marginTop:'0.5rem' }}>Expand to 500 miles</button>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(330px, 1fr))', gap:'1.125rem' }}>
          {filtered.map(ev => {
            const typeColor = TYPE_COLORS[ev.event_type] ?? '#CC0000'
            const date = new Date(ev.starts_at)
            const isRsvpd = rsvpd.has(ev.id)
            return (
              <div key={ev.id} style={{ background:'#243547', border:`1px solid ${typeColor}20`, borderRadius:'1rem', overflow:'hidden' }}>
                {/* Event photo */}
                <div style={{ height:'160px', position:'relative', overflow:'hidden' }}>
                  <img src={ev.img} alt={ev.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 30%, rgba(36,53,71,0.95) 100%)' }} />
                  <div style={{ position:'absolute', top:'0.625rem', left:'0.625rem', background:`${typeColor}`, color:'white', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>{TYPE_LABELS[ev.event_type]}</div>
                  {ev.distance !== null && (
                    <div style={{ position:'absolute', top:'0.625rem', right:'0.625rem', background:'rgba(13,30,48,0.85)', color:'#22c55e', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700, border:'1px solid rgba(34,197,94,0.2)' }}>
                      📍 {ev.distance}mi away
                    </div>
                  )}
                  <div style={{ position:'absolute', bottom:'0.625rem', right:'0.625rem', fontSize:'0.7rem', color:'rgba(255,255,255,0.6)' }}>{ev.organizer}</div>
                </div>

                <div style={{ padding:'1rem' }}>
                  <h3 style={{ fontWeight:700, marginBottom:'0.5rem', fontSize:'0.95rem' }}>{ev.title}</h3>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', marginBottom:'0.25rem' }}>📍 {ev.city}, {ev.state}</p>
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem', marginBottom:'0.75rem' }}>
                    📅 {date.toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric' })} at {date.toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' })}
                  </p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
                    <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)' }}>👥 {ev.current_attendees} going</span>
                    <span style={{ fontWeight:700, color: ev.entry_fee ? '#FFD700':'#22c55e', fontSize:'0.875rem' }}>{ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}</span>
                  </div>
                  <div style={{ display:'flex', gap:'0.5rem' }}>
                    <button onClick={e => toggleRsvp(ev.id, e)} style={{ flex:1, background: isRsvpd ? `${typeColor}18`:'transparent', border:`1px solid ${typeColor}${isRsvpd ? '50':'30'}`, color: isRsvpd ? typeColor:'rgba(255,255,255,0.5)', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight: isRsvpd ? 700:400, cursor:'pointer' }}>
                      {isRsvpd ? '✓ Going' : 'RSVP'}
                    </button>
                    <button style={{ flex:1, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Details</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
