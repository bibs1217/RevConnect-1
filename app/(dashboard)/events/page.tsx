'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/auth-provider'

interface Event {
  id: string
  title: string
  event_type: string
  description: string
  address: string
  city: string
  state: string
  zip: string
  lat: number | null
  lng: number | null
  starts_at: string
  ends_at: string | null
  entry_fee: number | null
  max_attendees: number | null
  current_attendees: number
  cover_image_url: string
  registration_required: boolean
  is_published: boolean
  is_cancelled: boolean
  organizer_id: string | null
  distance?: number | null
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
const DATE_FILTERS = ['upcoming', 'this_week', 'this_month', 'all']
const DATE_LABELS: Record<string, string> = { upcoming: 'All Upcoming', this_week: 'This Week', this_month: 'This Month', all: 'All' }

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3959, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function zipToLatLng(zip: string): Promise<{ lat: number; lng: number; city: string } | null> {
  try {
    const r = await fetch(`https://api.zippopotam.us/us/${zip}`)
    if (!r.ok) return null
    const d = await r.json()
    return { lat: parseFloat(d.places[0].latitude), lng: parseFloat(d.places[0].longitude), city: d.places[0]['place name'] }
  } catch { return null }
}

const inp: React.CSSProperties = { background: '#0D1E30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.625rem', padding: '0.5rem 0.75rem', color: 'white', fontSize: '0.8rem', outline: 'none' }
const lbl: React.CSSProperties = { fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem', display: 'block' }

export default function EventsPage() {
  const { user } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('All')
  const [dateFilter, setDateFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [zipInput, setZipInput] = useState('')
  const [radius, setRadius] = useState(200)
  const [anchor, setAnchor] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [zipSearching, setZipSearching] = useState(false)
  const [zipError, setZipError] = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [rsvpd, setRsvpd] = useState<Set<string>>(new Set())
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ title: '', event_type: 'street_meet', description: '', address: '', city: '', state: '', zip: '', starts_at: '', entry_fee: '', cover_image_url: '' })
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [loadError, setLoadError] = useState('')

  useEffect(() => { loadEvents() }, [])

  async function loadEvents() {
    setLoading(true)
    setLoadError('')
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_published', true)
        .eq('is_cancelled', false)
        .order('starts_at', { ascending: true })
      if (error) {
        console.error('[events] Supabase error:', error.message, error.code)
        setLoadError(`Could not load events: ${error.message}`)
      } else {
        console.log('[events] loaded', data?.length ?? 0, 'events')
        setEvents((data ?? []) as Event[])
      }
    } catch (e) {
      console.error('[events] exception:', e)
      setLoadError('Failed to load events. Check your connection.')
    }
    setLoading(false)
  }

  async function handleZipSearch() {
    setZipError('')
    const clean = zipInput.replace(/\D/g, '').slice(0, 5)

    // No ZIP entered — clear location filter and show all events
    if (!clean) {
      setAnchor(null)
      return
    }

    if (clean.length < 5) {
      setZipError('Enter a full 5-digit ZIP code')
      return
    }

    setZipSearching(true)
    try {
      const result = await zipToLatLng(clean)
      if (result) {
        setAnchor({ lat: result.lat, lng: result.lng, label: `${result.city} (${clean})` })
      } else {
        setZipError('ZIP code not found. Try another.')
      }
    } catch (e) {
      console.error('[events] ZIP lookup failed:', e)
      setZipError('ZIP lookup failed. Try again.')
    }
    setZipSearching(false)
  }

  function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      const { latitude: lat, longitude: lng } = pos.coords
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
        const d = await r.json()
        const city = d.address?.city || d.address?.town || d.address?.county || 'Your Location'
        setAnchor({ lat, lng, label: city })
      } catch { setAnchor({ lat, lng, label: 'Your Location' }) }
      setGeoLoading(false)
    }, () => setGeoLoading(false), { timeout: 10000 })
  }

  const eventsWithDistance = useMemo(() =>
    events.map(ev => ({
      ...ev,
      distance: anchor && ev.lat && ev.lng ? Math.round(haversine(anchor.lat, anchor.lng, ev.lat, ev.lng)) : null,
    })), [events, anchor])

  // Normalize Supabase timestamp to ISO 8601 with T separator so all browsers parse it
  function parseDate(s: string): Date {
    if (!s) return new Date(0)
    return new Date(s.replace(' ', 'T'))
  }

  const filtered = useMemo(() => {
    const now = new Date()
    const endOfWeek = new Date(now); endOfWeek.setDate(now.getDate() + 7)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    let res = eventsWithDistance
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
    if (dateFilter === 'upcoming') res = res.filter(e => parseDate(e.starts_at) >= now)
    else if (dateFilter === 'this_week') res = res.filter(e => { const d = parseDate(e.starts_at); return d >= now && d <= endOfWeek })
    else if (dateFilter === 'this_month') res = res.filter(e => { const d = parseDate(e.starts_at); return d >= now && d <= endOfMonth })
    // 'all' → no date filter
    if (anchor) res = res.filter(e => e.distance !== null && e.distance <= radius)

    return [...res].sort((a, b) => {
      if (anchor && a.distance !== null && b.distance !== null) return a.distance - b.distance
      return parseDate(a.starts_at).getTime() - parseDate(b.starts_at).getTime()
    })
  }, [eventsWithDistance, typeFilter, search, dateFilter, anchor, radius])

  async function toggleRsvp(id: string, e?: React.MouseEvent) {
    e?.stopPropagation()
    setRsvpd(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
    if (user) {
      const supabase = createClient()
      if (!rsvpd.has(id)) {
        await supabase.from('notifications').insert({ user_id: user.id, type: 'event_rsvp', title: `You're going!`, body: `RSVP confirmed for event ${id}` })
      }
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setCreating(true); setCreateError('')
    const supabase = createClient()
    let lat: number | null = null, lng: number | null = null
    if (createForm.zip.length === 5) {
      const geo = await zipToLatLng(createForm.zip)
      if (geo) { lat = geo.lat; lng = geo.lng }
    }
    const { error } = await supabase.from('events').insert({
      title: createForm.title,
      event_type: createForm.event_type,
      description: createForm.description,
      address: createForm.address,
      city: createForm.city,
      state: createForm.state.toUpperCase().slice(0, 2),
      zip: createForm.zip,
      lat, lng,
      starts_at: createForm.starts_at,
      entry_fee: createForm.entry_fee ? parseInt(createForm.entry_fee) : null,
      cover_image_url: createForm.cover_image_url || '',
      organizer_id: user.id,
      is_published: true,
      is_cancelled: false,
      registration_required: false,
      weather_sensitive: false,
    })
    if (error) { setCreateError(error.message) }
    else {
      setShowCreate(false)
      setCreateForm({ title: '', event_type: 'street_meet', description: '', address: '', city: '', state: '', zip: '', starts_at: '', entry_fee: '', cover_image_url: '' })
      await loadEvents()
    }
    setCreating(false)
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>📍 Events & Car Meets</h1>
          <p style={{ color: 'rgba(255,255,255,0.35)', marginTop: '0.25rem' }}>
            {loading ? 'Loading events…' : events.length === 0 ? 'No events loaded — check console for errors' : `${events.length} events nationwide`}
          </p>
        </div>
        {user && (
          <button onClick={() => setShowCreate(!showCreate)}
            style={{ background: 'linear-gradient(135deg,#CC0000,#AA0000)', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(204,0,0,0.35)' }}>
            + Create Event
          </button>
        )}
      </div>

      {/* Create Event Form */}
      {showCreate && user && (
        <div style={{ background: '#1C2E40', border: '1px solid rgba(204,0,0,0.25)', borderRadius: '1rem', padding: '1.5rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Create New Event</h2>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Event Title *</label>
                <input required value={createForm.title} onChange={e => setCreateForm(f => ({ ...f, title: e.target.value }))} placeholder="Cars & Coffee — July Edition" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={lbl}>Type *</label>
                <select value={createForm.event_type} onChange={e => setCreateForm(f => ({ ...f, event_type: e.target.value }))} style={{ ...inp, width: '100%', boxSizing: 'border-box' }}>
                  {TYPES.filter(t => t !== 'All').map(t => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Date & Time *</label>
                <input required type="datetime-local" value={createForm.starts_at} onChange={e => setCreateForm(f => ({ ...f, starts_at: e.target.value }))} style={{ ...inp, width: '100%', boxSizing: 'border-box', colorScheme: 'dark' }} />
              </div>
              <div>
                <label style={lbl}>Entry Fee ($)</label>
                <input type="number" min="0" value={createForm.entry_fee} onChange={e => setCreateForm(f => ({ ...f, entry_fee: e.target.value }))} placeholder="Leave blank = Free" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={lbl}>City *</label>
                <input required value={createForm.city} onChange={e => setCreateForm(f => ({ ...f, city: e.target.value }))} placeholder="Tampa" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={lbl}>State *</label>
                <input required maxLength={2} value={createForm.state} onChange={e => setCreateForm(f => ({ ...f, state: e.target.value }))} placeholder="FL" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={lbl}>ZIP Code</label>
                <input maxLength={5} value={createForm.zip} onChange={e => setCreateForm(f => ({ ...f, zip: e.target.value.replace(/\D/g, '') }))} placeholder="33607" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Venue / Address</label>
                <input value={createForm.address} onChange={e => setCreateForm(f => ({ ...f, address: e.target.value }))} placeholder="1234 Main St or parking lot name" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Description</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))} placeholder="Tell people about the event…" rows={3} style={{ ...inp, width: '100%', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label style={lbl}>Cover Image URL</label>
                <input value={createForm.cover_image_url} onChange={e => setCreateForm(f => ({ ...f, cover_image_url: e.target.value }))} placeholder="https://…" style={{ ...inp, width: '100%', boxSizing: 'border-box' }} />
              </div>
            </div>
            {createError && <p style={{ color: '#E63946', fontSize: '0.8rem', marginBottom: '0.75rem' }}>{createError}</p>}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" disabled={creating}
                style={{ background: creating ? 'rgba(204,0,0,0.4)' : '#CC0000', color: 'white', border: 'none', padding: '0.625rem 1.5rem', borderRadius: '0.625rem', fontWeight: 700, cursor: creating ? 'not-allowed' : 'pointer', fontSize: '0.875rem' }}>
                {creating ? 'Creating…' : 'Post Event'}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', padding: '0.625rem 1rem', borderRadius: '0.625rem', cursor: 'pointer', fontSize: '0.875rem' }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search Panel */}
      <div style={{ background: '#243547', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '1rem', padding: '1.125rem', marginBottom: '1.25rem' }}>

        {/* Top row: keyword + ZIP */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0.625rem', marginBottom: '0.875rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={lbl}>Search</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0D1E30', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.75rem', padding: '0.5rem 0.875rem' }}>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Event name, city, state…"
                style={{ flex: 1, background: 'transparent', border: 'none', color: 'white', fontSize: '0.875rem', outline: 'none' }} />
              {search && <button onClick={() => setSearch('')} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}>×</button>}
            </div>
          </div>

          <div>
            <label style={lbl}>ZIP Code</label>
            <input value={zipInput} onChange={e => setZipInput(e.target.value.replace(/\D/g, '').slice(0, 5))}
              onKeyDown={e => e.key === 'Enter' && handleZipSearch()}
              placeholder="34698" maxLength={5}
              style={{ ...inp, width: '80px' }} />
          </div>

          <div>
            <label style={lbl}>Radius</label>
            <select value={radius} onChange={e => setRadius(parseInt(e.target.value))} style={{ ...inp, cursor: 'pointer' }}>
              {[25, 50, 100, 200, 500].map(r => <option key={r} value={r}>{r} mi</option>)}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.375rem', paddingTop: '1.1rem' }}>
            <button onClick={handleZipSearch} disabled={zipSearching}
              style={{ background: zipSearching ? 'rgba(21,57,204,0.4)' : 'linear-gradient(135deg,#1539CC,#0D28AA)', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.625rem', fontWeight: 700, cursor: zipSearching ? 'not-allowed' : 'pointer', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
              {zipSearching ? 'Searching…' : 'Find Events'}
            </button>
            <button onClick={useMyLocation} disabled={geoLoading} title="Use my location"
              style={{ background: '#0D1E30', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', padding: '0.5rem 0.625rem', borderRadius: '0.625rem', cursor: 'pointer', fontSize: '1rem' }}>
              {geoLoading ? '⏳' : '📍'}
            </button>
            {anchor && (
              <button onClick={() => { setAnchor(null); setZipInput('') }} title="Clear location"
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)', padding: '0.5rem 0.625rem', borderRadius: '0.625rem', cursor: 'pointer', fontSize: '0.75rem' }}>
                ✕
              </button>
            )}
          </div>
        </div>

        {zipError && <p style={{ color: '#E63946', fontSize: '0.75rem', marginBottom: '0.625rem' }}>{zipError}</p>}
        {anchor && <p style={{ color: '#22c55e', fontSize: '0.75rem', marginBottom: '0.625rem' }}>📍 Searching within {radius} miles of {anchor.label}</p>}

        {/* Type filter chips */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.625rem' }}>
          {TYPES.map(t => {
            const color = TYPE_COLORS[t] ?? '#CC0000'
            const active = typeFilter === t
            return (
              <button key={t} onClick={() => setTypeFilter(t)}
                style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', border: `1px solid ${active ? color : 'rgba(255,255,255,0.1)'}`, background: active ? `${color}18` : 'transparent', color: active ? color : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: active ? 700 : 400 }}>
                {t === 'All' ? 'All Events' : TYPE_LABELS[t]}
              </button>
            )
          })}
        </div>

        {/* Date filter */}
        <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
          {DATE_FILTERS.map(d => (
            <button key={d} onClick={() => setDateFilter(d)}
              style={{ padding: '0.3rem 0.75rem', borderRadius: '9999px', border: `1px solid ${dateFilter === d ? '#3399FF' : 'rgba(255,255,255,0.1)'}`, background: dateFilter === d ? 'rgba(51,153,255,0.12)' : 'transparent', color: dateFilter === d ? '#3399FF' : 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer', fontWeight: dateFilter === d ? 700 : 400 }}>
              {DATE_LABELS[d]}
            </button>
          ))}
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.3)', borderRadius: '0.75rem', padding: '0.875rem 1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div>
            <p style={{ color: '#E63946', fontWeight: 600, fontSize: '0.875rem', margin: 0 }}>{loadError}</p>
            <button onClick={loadEvents} style={{ background: 'transparent', border: 'none', color: '#3399FF', fontSize: '0.8rem', cursor: 'pointer', padding: 0, marginTop: '0.25rem', textDecoration: 'underline' }}>Retry</button>
          </div>
        </div>
      )}

      {/* Result count */}
      <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1rem' }}>
        {loading
          ? 'Loading…'
          : events.length === 0
            ? 'No events returned from database'
            : `Showing ${filtered.length} of ${events.length} events${anchor ? ` within ${radius}mi of ${anchor.label}` : ''}${search ? ` matching "${search}"` : ''}`}
      </p>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</p>
          <p>Loading events…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', background: '#243547', borderRadius: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📍</p>
          <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', fontSize: '1rem' }}>
            No events found{anchor ? ` within ${radius} miles of ${anchor.label}` : ''}.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {anchor
              ? 'Try expanding your radius, changing the type filter, or clearing location.'
              : 'No events match your filters — be the first to create one!'}
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            {anchor && <button onClick={() => setRadius(500)} style={{ background: 'transparent', border: '1px solid rgba(21,57,204,0.4)', color: '#3399FF', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Expand to 500 miles</button>}
            {anchor && <button onClick={() => { setAnchor(null); setZipInput('') }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Clear location filter</button>}
            {typeFilter !== 'All' && <button onClick={() => setTypeFilter('All')} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.5)', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem' }}>Show all types</button>}
            {user && <button onClick={() => setShowCreate(true)} style={{ background: '#CC0000', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>+ Post Your Event</button>}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.125rem' }}>
          {filtered.map(ev => {
            const typeColor = TYPE_COLORS[ev.event_type] ?? '#CC0000'
            const date = parseDate(ev.starts_at)
            const isRsvpd = rsvpd.has(ev.id)
            return (
              <div key={ev.id} style={{ background: '#243547', border: `1px solid ${typeColor}25`, borderRadius: '1rem', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Photo */}
                <div style={{ height: '165px', position: 'relative', overflow: 'hidden', background: '#1B2A3E', flexShrink: 0 }}>
                  {ev.cover_image_url ? (
                    <img src={ev.cover_image_url} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🚗</div>
                  )}
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 30%,rgba(36,53,71,0.92) 100%)' }} />
                  <span style={{ position: 'absolute', top: '0.625rem', left: '0.625rem', background: typeColor, color: 'white', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700 }}>
                    {TYPE_LABELS[ev.event_type] ?? ev.event_type}
                  </span>
                  {ev.distance !== null && (
                    <span style={{ position: 'absolute', top: '0.625rem', right: '0.625rem', background: 'rgba(13,30,48,0.85)', color: '#22c55e', padding: '0.2rem 0.55rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700, border: '1px solid rgba(34,197,94,0.2)' }}>
                      📍 {ev.distance}mi
                    </span>
                  )}
                </div>

                {/* Body */}
                <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem', lineHeight: 1.3, margin: 0 }}>{ev.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0 }}>📍 {ev.city}, {ev.state}{ev.address ? ` · ${ev.address}` : ''}</p>
                  <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.78rem', margin: 0 }}>
                    📅 {date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {ev.description && (
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.45, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {ev.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '0.5rem' }}>
                    <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)' }}>👥 {ev.current_attendees} going</span>
                    <div style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
                      {ev.registration_required && <span style={{ fontSize: '0.65rem', color: '#FFD700', border: '1px solid rgba(255,215,0,0.3)', borderRadius: '9999px', padding: '0.1rem 0.4rem' }}>RSVP req.</span>}
                      <span style={{ fontWeight: 700, color: ev.entry_fee ? '#FFD700' : '#22c55e', fontSize: '0.875rem' }}>{ev.entry_fee ? `$${ev.entry_fee}` : 'Free'}</span>
                    </div>
                  </div>
                  <button onClick={e2 => toggleRsvp(ev.id, e2)}
                    style={{ width: '100%', background: isRsvpd ? `${typeColor}18` : 'transparent', border: `1px solid ${typeColor}${isRsvpd ? '55' : '30'}`, color: isRsvpd ? typeColor : 'rgba(255,255,255,0.5)', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: isRsvpd ? 700 : 400, cursor: 'pointer', marginTop: '0.25rem' }}>
                    {isRsvpd ? '✓ Going' : 'RSVP'}
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
