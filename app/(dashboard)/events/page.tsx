'use client'

import { useEffect, useState, useMemo } from 'react'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODk5NjMsImV4cCI6MjA5NjA2NTk2M30.SnLIQX-Ntn0ba3Ap1lcfG8RULan15E3qGwRAMoDtrXo'

interface EvRow {
  id: string
  title: string
  event_type: string
  description: string | null
  address: string | null
  city: string | null
  state: string | null
  zip: string | null
  lat: number | null
  lng: number | null
  starts_at: string
  entry_fee: number | null
  current_attendees: number | null
  cover_image_url: string | null
  is_published: boolean
  is_cancelled: boolean
}

const TYPE_COLORS: Record<string, string> = {
  street_meet: '#CC0000', car_show: '#F4A261', track_day: '#22c55e',
  cruise: '#3399FF', drag: '#a855f7', autocross: '#FFD700', hpde: '#14b8a6', popup: '#f43f5e',
}
const TYPE_LABELS: Record<string, string> = {
  street_meet: 'Street Meet', car_show: 'Car Show', track_day: 'Track Day',
  cruise: 'Cruise', drag: 'Drag', autocross: 'Autocross', hpde: 'HPDE', popup: 'Pop-up',
}

const TYPES = ['All', 'street_meet', 'car_show', 'track_day', 'cruise', 'drag', 'autocross', 'hpde']

function fmt(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

export default function EventsPage() {
  const [events, setEvents]   = useState<EvRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [search, setSearch]   = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/events?select=*&is_published=eq.true&is_cancelled=eq.false&order=starts_at.asc`,
          {
            headers: {
              'apikey': SUPABASE_ANON,
              'Authorization': `Bearer ${SUPABASE_ANON}`,
              'Accept': 'application/json',
            },
          }
        )
        const text = await res.text()
        console.log('[EVENTS] status:', res.status, 'body preview:', text.slice(0, 200))
        if (!res.ok) {
          setError(`Supabase returned ${res.status}: ${text.slice(0, 200)}`)
          setLoading(false)
          return
        }
        const data: EvRow[] = JSON.parse(text)
        console.log('[EVENTS] loaded', data.length, 'events, first:', data[0]?.title)
        setEvents(data)
      } catch (e: any) {
        console.error('[EVENTS] fetch exception:', e)
        setError(String(e))
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = useMemo(() => {
    let res = events
    if (typeFilter !== 'All') res = res.filter(e => e.event_type === typeFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      res = res.filter(e =>
        (e.title ?? '').toLowerCase().includes(q) ||
        (e.city ?? '').toLowerCase().includes(q) ||
        (e.state ?? '').toLowerCase().includes(q) ||
        (e.description ?? '').toLowerCase().includes(q)
      )
    }
    return res
  }, [events, typeFilter, search])

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>📍 Events & Car Meets</h1>
        <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem', fontSize: '0.875rem' }}>
          {loading
            ? 'Loading events…'
            : error
              ? 'Error loading events'
              : `${events.length} events loaded · showing ${filtered.length}`}
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{ background: 'rgba(204,0,0,0.15)', border: '1px solid rgba(204,0,0,0.4)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem', color: '#E63946', fontSize: '0.875rem', fontFamily: 'monospace' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Filters */}
      <div style={{ background: '#1C2E40', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1rem', padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0D1E30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.5rem 0.875rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.3)' }}>🔍</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search events, cities…"
              style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.875rem', outline: 'none' }}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {TYPES.map(t => {
            const color = TYPE_COLORS[t] ?? '#CC0000'
            const active = typeFilter === t
            return (
              <button key={t} onClick={() => setTypeFilter(t)} style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`, background: active ? `${color}20` : 'transparent', color: active ? color : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: active ? 700 : 400 }}>
                {t === 'All' ? 'All Events' : TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</p>
          <p>Loading events…</p>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#1C2E40', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📍</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginBottom: '0.5rem' }}>
            No events found.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>
            {events.length === 0
              ? 'No events in the database yet — be the first to create one!'
              : 'Try clearing the filters.'}
          </p>
          {typeFilter !== 'All' && (
            <button onClick={() => setTypeFilter('All')} style={{ marginTop: '1rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>
              Clear type filter
            </button>
          )}
        </div>
      )}

      {/* Cards */}
      {!loading && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.125rem' }}>
          {filtered.map(ev => {
            const color = TYPE_COLORS[ev.event_type] ?? '#CC0000'
            return (
              <div key={ev.id} style={{ background: '#1C2E40', border: `1px solid ${color}30`, borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Photo / placeholder */}
                <div style={{ height: '160px', background: '#152234', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                  {ev.cover_image_url ? (
                    <img src={ev.cover_image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: `linear-gradient(135deg, ${color}18, #152234)` }}>🚗</div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(21,34,52,0.85) 100%)' }} />
                  <span style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', background: color, color: 'white', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {TYPE_LABELS[ev.event_type] ?? ev.event_type}
                  </span>
                </div>

                {/* Body */}
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.35, margin: 0 }}>{ev.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0 }}>
                    📍 {ev.city ?? '—'}, {ev.state ?? '—'}{ev.address ? ` · ${ev.address}` : ''}
                  </p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0 }}>
                    📅 {fmt(ev.starts_at)}
                  </p>
                  {ev.description && (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', lineHeight: 1.45, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {ev.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                      👥 {ev.current_attendees ?? 0} going
                    </span>
                    <span style={{ fontWeight: 700, color: ev.entry_fee ? '#FFD700' : '#22c55e', fontSize: '0.875rem' }}>
                      {ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}
                    </span>
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
