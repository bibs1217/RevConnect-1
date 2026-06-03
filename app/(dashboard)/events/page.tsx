'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/auth-provider'

const MOCK_EVENTS = [
  { id:'1', title:'DFW Car Meet — Summer Edition', event_type:'street_meet', city:'Dallas', state:'TX', starts_at:'2026-06-15T18:00:00', entry_fee:null, current_attendees:142, cover:'🚗', organizer:'@dfw_meets' },
  { id:'2', title:'Texas Tuner Showdown', event_type:'car_show', city:'Austin', state:'TX', starts_at:'2026-06-22T10:00:00', entry_fee:25, current_attendees:87, cover:'🏆', organizer:'@tx_tuners' },
  { id:'3', title:'COTA Track Day — Open Lapping', event_type:'track_day', city:'Austin', state:'TX', starts_at:'2026-07-04T08:00:00', entry_fee:350, current_attendees:34, cover:'🏁', organizer:'@cota_events' },
  { id:'4', title:'Saturday Night Cruise — Fort Worth', event_type:'cruise', city:'Fort Worth', state:'TX', starts_at:'2026-06-14T20:00:00', entry_fee:null, current_attendees:63, cover:'🌃', organizer:'@fw_cruise' },
  { id:'5', title:'H-Town Drag Wars', event_type:'drag', city:'Houston', state:'TX', starts_at:'2026-06-28T12:00:00', entry_fee:50, current_attendees:156, cover:'🏎️', organizer:'@htown_drag' },
  { id:'6', title:'Lone Star Autocross Series Round 4', event_type:'autocross', city:'San Antonio', state:'TX', starts_at:'2026-07-12T09:00:00', entry_fee:45, current_attendees:72, cover:'⚡', organizer:'@lone_star_ac' },
]

const TYPE_COLORS: Record<string,string> = { street_meet:'#CC0000', car_show:'#FFD700', track_day:'#22c55e', cruise:'#3b82f6', drag:'#a855f7', autocross:'#ec4899', hpde:'#14b8a6' }
const TYPE_LABELS: Record<string,string> = { street_meet:'Street Meet', car_show:'Car Show', track_day:'Track Day', cruise:'Cruise', drag:'Drag', autocross:'Autocross', hpde:'HPDE' }
const TYPES = ['All', 'street_meet', 'car_show', 'track_day', 'cruise', 'drag', 'autocross']

export default function EventsPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState('All')
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [newEvent, setNewEvent] = useState({ title:'', event_type:'street_meet', city:'', state:'', address:'', starts_at:'', entry_fee:'' })

  const filtered = filter === 'All' ? MOCK_EVENTS : MOCK_EVENTS.filter(e => e.event_type === filter)

  function toggleRsvp(id: string) {
    setRsvpd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>📍 Events & Car Meets</h1>
          <p style={{ color:'#666', marginTop:'0.25rem' }}>Discover meets, shows, track days, and cruises near you</p>
        </div>
        {user && <button onClick={() => setShowCreate(!showCreate)} style={{ background:'#CC0000', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>+ Create Event</button>}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {TYPES.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding:'0.4rem 0.875rem', borderRadius:'9999px', border:`1px solid ${filter === t ? TYPE_COLORS[t] ?? '#CC0000' : '#1E3A6E'}`, background: filter === t ? `${TYPE_COLORS[t] ?? '#CC0000'}15` : 'transparent', color: filter === t ? (TYPE_COLORS[t] ?? '#CC0000') : '#aaa', fontSize:'0.8rem', fontWeight: filter === t ? 600 : 400, cursor:'pointer' }}>
            {t === 'All' ? 'All Events' : TYPE_LABELS[t]}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', height:'200px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem' }}>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🗺️</p>
          <p style={{ color:'#666', fontSize:'0.875rem' }}>Interactive map — enable location to find nearby events</p>
          <button style={{ marginTop:'0.75rem', background:'transparent', border:'1px solid #CC0000', color:'#CC0000', padding:'0.4rem 1rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Enable Location</button>
        </div>
      </div>

      {/* Create event form */}
      {showCreate && (
        <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
          <h2 style={{ fontWeight:700, marginBottom:'1rem' }}>Create an Event</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
            {[['title','Event Name','DFW Summer Meet','text'],['city','City','Dallas','text'],['state','State','TX','text'],['address','Address','123 Main St','text'],['starts_at','Date & Time','','datetime-local'],['entry_fee','Entry Fee ($)','0','number']].map(([k,l,p,t]) => (
              <div key={k as string}>
                <label style={{ display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }}>{l as string}</label>
                <input type={t as string} value={(newEvent as any)[k as string]} onChange={e => setNewEvent(v => ({ ...v, [k as string]: e.target.value }))} placeholder={p as string} style={{ width:'100%', background:'#0D0D0D', border:'1px solid #1E3A6E', borderRadius:'0.625rem', padding:'0.625rem 0.75rem', color:'white', fontSize:'0.875rem', outline:'none' }} />
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }}>Event Type</label>
              <select value={newEvent.event_type} onChange={e => setNewEvent(v => ({ ...v, event_type: e.target.value }))} style={{ width:'100%', background:'#0D0D0D', border:'1px solid #1E3A6E', borderRadius:'0.625rem', padding:'0.625rem 0.75rem', color:'white', fontSize:'0.875rem', outline:'none' }}>
                {Object.entries(TYPE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'1rem' }}>
            <button style={{ background:'#CC0000', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>Publish Event</button>
            <button onClick={() => setShowCreate(false)} style={{ background:'transparent', color:'#aaa', border:'1px solid #1E3A6E', padding:'0.75rem 1.5rem', borderRadius:'0.75rem' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Events grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.25rem' }}>
        {filtered.map(ev => {
          const typeColor = TYPE_COLORS[ev.event_type] ?? '#CC0000'
          const date = new Date(ev.starts_at)
          const isRsvpd = rsvpd.has(ev.id)
          return (
            <div key={ev.id} style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', overflow:'hidden' }}>
              <div style={{ height:'120px', background:`linear-gradient(135deg, ${typeColor}15, transparent)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3.5rem', position:'relative' }}>
                {ev.cover}
                <span style={{ position:'absolute', top:'0.75rem', left:'0.75rem', background:`${typeColor}20`, border:`1px solid ${typeColor}40`, color:typeColor, padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:600 }}>{TYPE_LABELS[ev.event_type]}</span>
                <span style={{ position:'absolute', top:'0.75rem', right:'0.75rem', background:'rgba(0,0,0,0.5)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color:'#aaa' }}>{ev.organizer}</span>
              </div>
              <div style={{ padding:'1rem' }}>
                <h3 style={{ fontWeight:700, marginBottom:'0.5rem', fontSize:'0.95rem' }}>{ev.title}</h3>
                <p style={{ color:'#666', fontSize:'0.8rem', marginBottom:'0.25rem' }}>📍 {ev.city}, {ev.state}</p>
                <p style={{ color:'#666', fontSize:'0.8rem', marginBottom:'0.75rem' }}>📅 {date.toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric' })} at {date.toLocaleTimeString('en-US',{ hour:'2-digit', minute:'2-digit' })}</p>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.875rem' }}>
                  <span style={{ fontSize:'0.8rem', color:'#aaa' }}>👥 {ev.current_attendees} going</span>
                  <span style={{ fontSize:'0.875rem', fontWeight:700, color: ev.entry_fee ? '#FFD700' : '#22c55e' }}>{ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}</span>
                </div>
                <div style={{ display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => toggleRsvp(ev.id)} style={{ flex:1, background: isRsvpd ? `${typeColor}20` : 'transparent', border:`1px solid ${typeColor}${isRsvpd ? '60' : '40'}`, color: isRsvpd ? typeColor : '#aaa', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
                    {isRsvpd ? '✓ Going' : 'RSVP'}
                  </button>
                  <button style={{ flex:1, background:'transparent', border:'1px solid #1E3A6E', color:'#aaa', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Details</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
