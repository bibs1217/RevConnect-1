'use client'
import { useState } from 'react'

interface Listing {
  id: string
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  price: number | null
  miles: number | null
  exterior_color: string | null
  transmission: string | null
  drivetrain: string | null
  car_type: string | null
  photo: string | null
  dealer_name: string | null
  dealer_city: string | null
  dealer_state: string | null
  dealer_phone: string | null
  listing_url: string | null
  dom: number | null
  price_drop: boolean
  distance: number | null
  source?: string
  listing_type?: string
}

const BG      = '#1B2A3E'
const CARD    = '#152234'
const RED     = '#CC0000'
const BLUE    = '#1539CC'
const BLUE2   = '#2255EE'
const GOLD    = '#FFD700'
const INPUT   = '#0E1825'
const BORDER  = '#2A3F5A'
const TEXT    = '#E8EDF2'
const MUTED   = '#7A9BBD'

export default function CarSearchPage() {
  const [filters, setFilters] = useState({
    make: '', model: '', yearMin: '', yearMax: '',
    priceMin: '', priceMax: '', mileageMax: '',
    zip: '', radius: '250', condition: '',
    transmission: '', drivetrain: '', sortBy: 'price-asc',
  })
  const [listings, setListings]           = useState<Listing[]>([])
  const [total, setTotal]                 = useState(0)
  const [totalFiltered, setTotalFiltered] = useState(0)
  const [totalPages, setTotalPages]       = useState(0)
  const [page, setPage]                   = useState(1)
  const [locationMode, setLocationMode]   = useState('')
  const [loading, setLoading]             = useState(false)
  const [searched, setSearched]           = useState(false)
  const [error, setError]                 = useState('')
  const [selected, setSelected]           = useState<Listing | null>(null)
  const [saved, setSaved]                 = useState<Set<string>>(new Set())
  const [geoLoading, setGeoLoading]       = useState(false)
  const [activeFilters, setActiveFilters]   = useState<string[]>([])
  const [filtersRelaxed, setFiltersRelaxed] = useState(false)

  function setF(k: string, v: string) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  async function runSearch(pageNum: number) {
    setLoading(true)
    setError('')
    setSelected(null)

    const yMin = filters.yearMin.replace(/[^0-9]/g, '')
    const yMax = filters.yearMax.replace(/[^0-9]/g, '')
    const pMin = filters.priceMin.replace(/[^0-9]/g, '')
    const pMax = filters.priceMax.replace(/[^0-9]/g, '')
    const mMax = filters.mileageMax.replace(/[^0-9]/g, '')
    const cleanZip = filters.zip.replace(/[^0-9]/g, '')

    const params = new URLSearchParams()
    if (filters.make)  params.set('make', filters.make)
    if (filters.model) params.set('model', filters.model)
    if (yMin) params.set('yearMin', yMin)
    if (yMax) params.set('yearMax', yMax)
    if (pMin) params.set('priceMin', pMin)
    if (pMax) params.set('priceMax', pMax)
    if (mMax) params.set('mileageMax', mMax)
    if (cleanZip) { params.set('zip', cleanZip); params.set('radius', filters.radius) }
    if (filters.condition)    params.set('condition', filters.condition)
    if (filters.transmission) params.set('transmission', filters.transmission)
    if (filters.drivetrain)   params.set('drivetrain', filters.drivetrain)
    if (filters.sortBy)       params.set('sortBy', filters.sortBy)
    params.set('page', String(pageNum))

    const af: string[] = []
    if (filters.make || filters.model)
      af.push([filters.make, filters.model].filter(Boolean).join(' '))
    if (yMin || yMax)
      af.push(`${yMin || 'any'}–${yMax || 'any'} year`)
    if (pMin || pMax)
      af.push(`$${Number(pMin || 0).toLocaleString()}–$${pMax ? Number(pMax).toLocaleString() : '∞'}`)
    if (mMax)
      af.push(`≤${Number(mMax).toLocaleString()} mi`)
    if (filters.condition)
      af.push(filters.condition.toUpperCase())
    if (filters.transmission)
      af.push(filters.transmission.charAt(0).toUpperCase() + filters.transmission.slice(1))
    if (filters.drivetrain)
      af.push(filters.drivetrain.toUpperCase())
    if (cleanZip)
      af.push(`Within ${filters.radius} mi of ${cleanZip}`)
    setActiveFilters(af)

    try {
      const res = await fetch(`/api/car-search?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setListings([])
      } else {
        setListings(data.listings ?? [])
        setTotal(data.total ?? 0)
        setTotalFiltered(data.totalFiltered ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setPage(data.page ?? pageNum)
        setLocationMode(data.locationMode ?? '')
        setFiltersRelaxed(data.filtersRelaxed ?? false)
      }
      setSearched(true)
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setPage(1)
    runSearch(1)
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const { latitude, longitude } = pos.coords
        const res = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
        )
        const data = await res.json()
        if (data.postcode) setF('zip', data.postcode)
      } catch { /* ignore */ }
      finally { setGeoLoading(false) }
    }, () => setGeoLoading(false))
  }

  function toggleSave(id: string) {
    setSaved(s => {
      const n = new Set(s)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }

  const monthly = (price: number | null) =>
    price ? `$${Math.round(price / 60 * 1.05).toLocaleString()}/mo` : ''

  const inputStyle: React.CSSProperties = {
    background: INPUT, border: `1px solid ${BORDER}`, borderRadius: 6,
    color: TEXT, padding: '8px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
  }
  const selectStyle: React.CSSProperties = { ...inputStyle }
  const labelStyle: React.CSSProperties = {
    color: MUTED, fontSize: 11, marginBottom: 4, display: 'block',
    textTransform: 'uppercase', letterSpacing: 1,
  }

  // ── Detail overlay ──────────────────────────────────────────────────────────
  if (selected) {
    const s = selected
    return (
      <div style={{ minHeight: '100vh', background: BG, color: TEXT, padding: 24 }}>
        <button onClick={() => setSelected(null)}
          style={{ background: 'none', border: `1px solid ${BORDER}`, color: TEXT, padding: '6px 16px', borderRadius: 6, cursor: 'pointer', marginBottom: 20, fontSize: 13 }}>
          ← Back to results
        </button>
        <div style={{ maxWidth: 900, margin: '0 auto', background: CARD, borderRadius: 12, overflow: 'hidden' }}>
          {s.photo && (
            <img src={s.photo} alt={`${s.year} ${s.make} ${s.model}`}
              style={{ width: '100%', maxHeight: 420, objectFit: 'cover' }} />
          )}
          <div style={{ padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700 }}>
                  {s.year} {s.make} {s.model}
                </h1>
                {s.trim && <div style={{ color: MUTED, fontSize: 15, marginTop: 4 }}>{s.trim}</div>}
              </div>
              <div style={{ textAlign: 'right' }}>
                {s.price ? (
                  <>
                    <div style={{ fontSize: 28, fontWeight: 700, color: GOLD }}>${s.price.toLocaleString()}</div>
                    <div style={{ color: MUTED, fontSize: 13 }}>{monthly(s.price)}</div>
                  </>
                ) : <div style={{ color: MUTED }}>Price not listed</div>}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14, marginTop: 24 }}>
              {[
                ['Mileage', s.miles !== null ? `${s.miles.toLocaleString()} mi` : '—'],
                ['Transmission', s.transmission || '—'],
                ['Drivetrain', s.drivetrain || '—'],
                ['Exterior Color', s.exterior_color || '—'],
                ['Days on Market', s.dom !== null ? `${s.dom} days` : '—'],
                ['Distance', s.distance !== null ? `${s.distance} mi away` : '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: INPUT, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{val}</div>
                </div>
              ))}
            </div>

            {(s.dealer_name || s.dealer_city) && (
              <div style={{ marginTop: 24, padding: '14px 18px', background: INPUT, borderRadius: 10 }}>
                <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Dealer</div>
                {s.dealer_name && <div style={{ fontWeight: 600, fontSize: 16 }}>{s.dealer_name}</div>}
                {(s.dealer_city || s.dealer_state) && (
                  <div style={{ color: MUTED, fontSize: 14, marginTop: 2 }}>
                    {[s.dealer_city, s.dealer_state].filter(Boolean).join(', ')}
                  </div>
                )}
                {s.dealer_phone && <div style={{ color: MUTED, fontSize: 14, marginTop: 2 }}>{s.dealer_phone}</div>}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              {s.listing_url && (
                <a href={s.listing_url} target="_blank" rel="noopener noreferrer"
                  style={{ background: BLUE2, color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  View Full Listing
                </a>
              )}
              <button onClick={() => toggleSave(s.id)}
                style={{ background: saved.has(s.id) ? GOLD : 'transparent', border: `2px solid ${GOLD}`, color: saved.has(s.id) ? '#000' : GOLD, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {saved.has(s.id) ? '★ Saved' : '☆ Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Main page ───────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, sans-serif' }}>
      <div style={{ background: '#0E1825', borderBottom: `1px solid ${BORDER}`, padding: '16px 24px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          <span style={{ color: RED }}>Rev</span>Connect Car Search
        </h1>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        <form onSubmit={handleSearch}>
          <div style={{ background: CARD, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Make</label>
                <input value={filters.make} onChange={e => setF('make', e.target.value)}
                  placeholder="e.g. Toyota" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input value={filters.model} onChange={e => setF('model', e.target.value)}
                  placeholder="e.g. Camry" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year Min</label>
                <input value={filters.yearMin} onChange={e => setF('yearMin', e.target.value)}
                  placeholder="2015" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year Max</label>
                <input value={filters.yearMax} onChange={e => setF('yearMax', e.target.value)}
                  placeholder="2024" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Price Min</label>
                <input value={filters.priceMin} onChange={e => setF('priceMin', e.target.value)}
                  placeholder="$5,000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Price Max</label>
                <input value={filters.priceMax} onChange={e => setF('priceMax', e.target.value)}
                  placeholder="$30,000" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Max Mileage</label>
                <input value={filters.mileageMax} onChange={e => setF('mileageMax', e.target.value)}
                  placeholder="50,000" style={inputStyle} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>ZIP Code</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input value={filters.zip} onChange={e => setF('zip', e.target.value)}
                    placeholder="34698" maxLength={5} style={{ ...inputStyle, flex: 1 }} />
                  <button type="button" onClick={useMyLocation} disabled={geoLoading}
                    title="Use my location"
                    style={{ background: INPUT, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: '0 10px', cursor: 'pointer', fontSize: 16, flexShrink: 0 }}>
                    {geoLoading ? '…' : '📍'}
                  </button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Radius</label>
                <select value={filters.radius} onChange={e => setF('radius', e.target.value)} style={selectStyle}>
                  <option value="50">50 mi</option>
                  <option value="100">100 mi</option>
                  <option value="150">150 mi</option>
                  <option value="250">250 mi</option>
                  <option value="500">500 mi</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Transmission</label>
                <select value={filters.transmission} onChange={e => setF('transmission', e.target.value)} style={selectStyle}>
                  <option value="">Any</option>
                  <option value="automatic">Automatic</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Drivetrain</label>
                <select value={filters.drivetrain} onChange={e => setF('drivetrain', e.target.value)} style={selectStyle}>
                  <option value="">Any</option>
                  <option value="fwd">FWD</option>
                  <option value="rwd">RWD</option>
                  <option value="awd">AWD</option>
                  <option value="4wd">4WD</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Sort By</label>
                <select value={filters.sortBy} onChange={e => setF('sortBy', e.target.value)} style={selectStyle}>
                  <option value="price-asc">Price: Low → High</option>
                  <option value="price-desc">Price: High → Low</option>
                  <option value="mileage-asc">Mileage: Low → High</option>
                  <option value="distance-asc">Distance: Nearest First</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ ...labelStyle, margin: 0 }}>Condition:</span>
                {[['', 'All'], ['new', 'New'], ['used', 'Used'], ['cpo', 'CPO']].map(([val, label]) => (
                  <label key={val} style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: filters.condition === val ? TEXT : MUTED, fontSize: 13 }}>
                    <input type="radio" name="condition" value={val} checked={filters.condition === val}
                      onChange={() => setF('condition', val)} />
                    {label}
                  </label>
                ))}
              </div>
              <button type="submit" disabled={loading}
                style={{ marginLeft: 'auto', background: loading ? BORDER : RED, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Searching…' : 'Search'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div style={{ background: '#3A1010', border: `1px solid ${RED}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#FF8080' }}>
            {error}
          </div>
        )}

        {searched && !loading && (
          <>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>
                  {totalFiltered.toLocaleString()} matching result{totalFiltered !== 1 ? 's' : ''}
                </span>
                <span style={{ color: MUTED, fontSize: 13 }}>
                  from {total.toLocaleString()} listings · page {page} of {totalPages}
                </span>
                {locationMode === 'local' && (
                  <span style={{ color: '#4CAF50', fontSize: 13 }}>
                    Within {filters.radius} mi of {filters.zip}
                  </span>
                )}
                {locationMode === 'nearest_only' && (
                  <span style={{ color: '#FF9800', fontSize: 13 }}>
                    None within {filters.radius} mi of {filters.zip} — showing nearest available
                  </span>
                )}
                {locationMode === 'zip_invalid' && (
                  <span style={{ color: '#FF9800', fontSize: 13 }}>
                    Invalid ZIP — showing all locations
                  </span>
                )}
              </div>
              {activeFilters.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {activeFilters.map(f => (
                    <span key={f} style={{ background: BLUE, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {filtersRelaxed && (
                <div style={{ marginTop: 10, background: '#2A1F00', border: '1px solid #FF9800', borderRadius: 8, padding: '10px 14px', color: '#FF9800', fontSize: 13 }}>
                  No exact year matches found in current inventory — showing similar {filters.make || ''} {filters.model || ''} listings sorted by price. Try widening your year range.
                </div>
              )}
            </div>

            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 18, marginBottom: 8, color: TEXT }}>No results found</div>
                <div style={{ fontSize: 14 }}>Try adjusting your filters or expanding your search area.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16, marginBottom: 24 }}>
                  {listings.map(l => (
                    <div key={l.id}
                      style={{ background: CARD, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ position: 'relative', height: 180, background: INPUT, flexShrink: 0 }}>
                        {l.photo ? (
                          <img src={l.photo} alt={`${l.year} ${l.make} ${l.model}`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 36 }}>
                            🚗
                          </div>
                        )}
                        {l.source === 'eBay' && (
                          <span style={{ position: 'absolute', top: 8, left: 8, background: '#E43137', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                            eBay{l.listing_type === 'Auction' ? ' AUCTION' : ''}
                          </span>
                        )}
                        {l.price_drop && l.source !== 'eBay' && (
                          <span style={{ position: 'absolute', top: 8, left: 8, background: RED, color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                            PRICE DROP
                          </span>
                        )}
                        <button onClick={() => toggleSave(l.id)}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', color: saved.has(l.id) ? GOLD : '#fff', fontSize: 18, cursor: 'pointer', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          {saved.has(l.id) ? '★' : '☆'}
                        </button>
                      </div>

                      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          {l.year} {l.make} {l.model}
                        </div>
                        {l.trim && <div style={{ color: MUTED, fontSize: 12 }}>{l.trim}</div>}

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: GOLD }}>
                            {l.price !== null ? `$${l.price.toLocaleString()}` : 'Call for price'}
                          </span>
                          {l.price && <span style={{ color: MUTED, fontSize: 12 }}>{monthly(l.price)}</span>}
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: MUTED }}>
                          {l.miles !== null && <span>{l.miles.toLocaleString()} mi</span>}
                          {l.distance !== null && <span>📍 {l.distance} mi away</span>}
                        </div>

                        {(l.dealer_name || l.dealer_city) && (
                          <div style={{ fontSize: 12, color: MUTED, borderTop: `1px solid ${BORDER}`, paddingTop: 6, marginTop: 2 }}>
                            {l.dealer_name && <div style={{ color: TEXT, fontWeight: 500 }}>{l.dealer_name}</div>}
                            {(l.dealer_city || l.dealer_state) && (
                              <div>{[l.dealer_city, l.dealer_state].filter(Boolean).join(', ')}</div>
                            )}
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                          {l.listing_url ? (
                            <a href={l.listing_url} target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, background: BLUE2, color: '#fff', padding: '7px 0', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                              View Listing
                            </a>
                          ) : (
                            <button onClick={() => setSelected(l)}
                              style={{ flex: 1, background: BLUE, color: '#fff', padding: '7px 0', borderRadius: 6, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                              View Details
                            </button>
                          )}
                          <button onClick={() => setSelected(l)}
                            style={{ background: INPUT, border: `1px solid ${BORDER}`, color: MUTED, padding: '7px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px 0' }}>
                    <button
                      disabled={page <= 1}
                      onClick={() => runSearch(page - 1)}
                      style={{ background: page <= 1 ? INPUT : BLUE2, color: page <= 1 ? MUTED : '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 20px', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                      ← Previous
                    </button>
                    <span style={{ color: MUTED, fontSize: 14 }}>Page {page} of {totalPages}</span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => runSearch(page + 1)}
                      style={{ background: page >= totalPages ? INPUT : BLUE2, color: page >= totalPages ? MUTED : '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 20px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                      Next →
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 16 }}>Fetching listings and applying filters…</div>
          </div>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 20, marginBottom: 8, color: TEXT }}>Find your next car</div>
            <div style={{ fontSize: 14 }}>Enter make and model above, apply any filters, then click Search.</div>
          </div>
        )}
      </div>
    </div>
  )
}
