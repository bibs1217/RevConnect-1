'use client'
import { useState } from 'react'

interface Listing {
  id: string
  vin?: string | null
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

interface Filters {
  make: string; model: string; yearMin: string; yearMax: string
  priceMin: string; priceMax: string; mileageMax: string
  zip: string; radius: string; condition: string
  transmission: string; drivetrain: string; sortBy: string
}

const BG     = '#1B2A3E'
const CARD   = '#152234'
const RED    = '#CC0000'
const BLUE   = '#1539CC'
const BLUE2  = '#2255EE'
const GOLD   = '#FFD700'
const INPUT  = '#0E1825'
const BORDER = '#2A3F5A'
const TEXT   = '#E8EDF2'
const MUTED  = '#7A9BBD'

// ── External search link builder ──────────────────────────────────────────────
function buildSearchLinks(f: Filters) {
  const make  = f.make.trim()
  const model = f.model.trim()
  const yMin  = f.yearMin.replace(/\D/g, '')
  const yMax  = f.yearMax.replace(/\D/g, '')
  const pMax  = f.priceMax.replace(/\D/g, '')
  const mMax  = f.mileageMax.replace(/\D/g, '')
  const zip   = f.zip.replace(/\D/g, '')
  const rad   = f.radius

  // ── CarGurus ────────────────────────────────────────────────────────────
  // Fragment format: d2|key=val|key=val  — encoded as d2%7Ckey%3Dval%7C...
  const cgParts = ['d2', 'listingType%3Dused']
  if (make)  cgParts.push(`make%3D${encodeURIComponent(make)}`)
  if (model) cgParts.push(`model%3D${encodeURIComponent(model)}`)
  if (yMin)  cgParts.push(`minYear%3D${yMin}`)
  if (yMax)  cgParts.push(`maxYear%3D${yMax}`)
  if (pMax)  cgParts.push(`maxPrice%3D${pMax}`)
  if (mMax)  cgParts.push(`maxMileage%3D${mMax}`)
  if (zip)  { cgParts.push(`zip%3D${zip}`); cgParts.push(`distance%3D${rad}`) }
  const carGurus = `https://www.cargurus.com/Cars/new/nl#listing=${cgParts.join('%7C')}`

  // ── AutoTrader ───────────────────────────────────────────────────────────
  const atBase = (make && model)
    ? `https://www.autotrader.com/cars-for-sale/used-cars/${encodeURIComponent(make.toLowerCase())}/${encodeURIComponent(model.toLowerCase())}`
    : 'https://www.autotrader.com/cars-for-sale/used-cars'
  const atP: string[] = []
  if (zip)  atP.push(`zip=${zip}`)
  if (pMax) atP.push(`maxPrice=${pMax}`)
  if (yMin) atP.push(`startYear=${yMin}`)
  if (yMax) atP.push(`endYear=${yMax}`)
  if (mMax) atP.push(`mileage=${mMax}`)
  if (zip && rad) atP.push(`searchRadius=${rad}`)
  const autoTrader = atBase + (atP.length ? `?${atP.join('&')}` : '')

  // ── CarMax ───────────────────────────────────────────────────────────────
  const carMax = (make && model)
    ? `https://www.carmax.com/cars/${encodeURIComponent(make.toLowerCase())}/${encodeURIComponent(model.toLowerCase())}`
    : 'https://www.carmax.com/cars'

  // ── Carvana ──────────────────────────────────────────────────────────────
  const cvSlug = (make && model)
    ? encodeURIComponent(`${make}-${model}`.toLowerCase().replace(/\s+/g, '-'))
    : null
  const cvBase  = cvSlug ? `https://www.carvana.com/cars/${cvSlug}` : 'https://www.carvana.com/cars'
  const cvP: string[] = []
  if (yMin) cvP.push(`year-min=${yMin}`)
  if (yMax) cvP.push(`year-max=${yMax}`)
  if (pMax) cvP.push(`price-max=${pMax}`)
  if (mMax) cvP.push(`miles-max=${mMax}`)
  const carvana = cvP.length ? `${cvBase}?${cvP.join('&')}` : cvBase

  // ── Cars.com ─────────────────────────────────────────────────────────────
  const carsP: string[] = ['stock_type=used']
  if (make)  carsP.push(`makes[]=${encodeURIComponent(make.toLowerCase())}`)
  if (model) carsP.push(`models[]=${encodeURIComponent(`${make}-${model}`.toLowerCase().replace(/\s+/g, '-'))}`)
  if (zip)   carsP.push(`zip=${zip}`)
  if (rad)   carsP.push(`maximum_distance=${rad}`)
  if (yMin)  carsP.push(`year_min=${yMin}`)
  if (yMax)  carsP.push(`year_max=${yMax}`)
  if (pMax)  carsP.push(`price_max=${pMax}`)
  if (mMax)  carsP.push(`mileage_max=${mMax}`)
  const carsDotCom = `https://www.cars.com/shopping/results/?${carsP.join('&')}`

  return { carGurus, autoTrader, carMax, carvana, carsDotCom }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function CarSearchPage() {
  const [filters, setFilters] = useState<Filters>({
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
  const [loading, setLoading]             = useState(false)
  const [searched, setSearched]           = useState(false)
  const [error, setError]                 = useState('')
  const [selected, setSelected]           = useState<Listing | null>(null)
  const [saved, setSaved]                 = useState<Set<string>>(new Set())
  const [geoLoading, setGeoLoading]       = useState(false)
  const [activeFilters, setActiveFilters] = useState<string[]>([])
  const [filtersRelaxed, setFiltersRelaxed] = useState(false)
  const [ebayCount, setEbayCount]         = useState(0)
  const [searchedFilters, setSearchedFilters] = useState<Filters | null>(null)

  function setF(k: keyof Filters, v: string) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  async function runSearch(pageNum: number) {
    setLoading(true)
    setPage(pageNum)
    setError('')
    setSelected(null)

    const yMin = filters.yearMin.replace(/\D/g, '')
    const yMax = filters.yearMax.replace(/\D/g, '')
    const pMin = filters.priceMin.replace(/\D/g, '')
    const pMax = filters.priceMax.replace(/\D/g, '')
    const mMax = filters.mileageMax.replace(/\D/g, '')
    const cleanZip = filters.zip.replace(/\D/g, '')

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
    if (filters.make || filters.model) af.push([filters.make, filters.model].filter(Boolean).join(' '))
    if (yMin || yMax) af.push(`${yMin || 'any'}–${yMax || 'any'} year`)
    if (pMin || pMax) af.push(`$${Number(pMin||0).toLocaleString()}–$${pMax ? Number(pMax).toLocaleString() : '∞'}`)
    if (mMax) af.push(`≤${Number(mMax).toLocaleString()} mi`)
    if (filters.condition) af.push(filters.condition.toUpperCase())
    if (filters.transmission) af.push(filters.transmission.charAt(0).toUpperCase() + filters.transmission.slice(1))
    if (filters.drivetrain) af.push(filters.drivetrain.toUpperCase())
    if (cleanZip) af.push(`Within ${filters.radius} mi of ${cleanZip}`)
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
        setFiltersRelaxed(data.filtersRelaxed ?? false)
        setEbayCount(data.sources?.ebay ?? 0)
        setSearchedFilters({ ...filters })
        console.log('[car-search] sources:', data.sources, 'total:', data.total)
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
    setSaved(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n })
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
    const makeSlug  = encodeURIComponent((s.make  || '').toLowerCase())
    const modelSlug = encodeURIComponent((s.model || '').toLowerCase())
    const carvanaSlug = encodeURIComponent(
      `${s.make || ''}-${s.model || ''}`.toLowerCase().replace(/\s+/g, '-')
    )
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
                {s.trim && s.trim !== `${s.year} ${s.make} ${s.model}` && (
                  <div style={{ color: MUTED, fontSize: 14, marginTop: 4 }}>{s.trim}</div>
                )}
                <span style={{ display: 'inline-block', marginTop: 8, background: '#E43137', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 4 }}>
                  eBay Motors{s.listing_type === 'Auction' ? ' — AUCTION' : ''}
                </span>
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
                ['Mileage',      s.miles ? `${s.miles.toLocaleString()} mi` : '—'],
                ['Transmission', s.transmission || '—'],
                ['Drivetrain',   s.drivetrain || '—'],
                ['Color',        s.exterior_color || '—'],
                ['Seller',       s.dealer_name || '—'],
                ['Location',     s.dealer_city || '—'],
              ].map(([label, val]) => (
                <div key={label} style={{ background: INPUT, borderRadius: 8, padding: '10px 14px' }}>
                  <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{val}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap' }}>
              {s.listing_url && (
                <a href={s.listing_url} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#E43137', color: '#fff', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
                  View on eBay ↗
                </a>
              )}
              <button onClick={() => toggleSave(s.id)}
                style={{ background: saved.has(s.id) ? GOLD : 'transparent', border: `2px solid ${GOLD}`, color: saved.has(s.id) ? '#000' : GOLD, padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                {saved.has(s.id) ? '★ Saved' : '☆ Save'}
              </button>
            </div>

            {/* Also search on other sites */}
            <div style={{ marginTop: 24, borderTop: `1px solid ${BORDER}`, paddingTop: 20 }}>
              <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                Search This Vehicle On
              </div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {s.vin && (
                  <a href={`https://www.cargurus.com/Cars/new/nl#listing=${s.vin}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ background: '#102A10', color: '#4DD88A', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #1A5A1A' }}>
                    CarGurus ↗
                  </a>
                )}
                {s.vin && (
                  <a href={`https://www.autotrader.com/cars-for-sale/vehicledetails.xhtml?vin=${s.vin}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ background: '#0A1A30', color: '#7AB8FF', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #1A3A60' }}>
                    AutoTrader ↗
                  </a>
                )}
                <a href={`https://www.carmax.com/cars/${makeSlug}/${modelSlug}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#0A2018', color: '#4DD88A', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #0D4020' }}>
                  CarMax ↗
                </a>
                <a href={`https://www.carvana.com/cars/${carvanaSlug}`}
                  target="_blank" rel="noopener noreferrer"
                  style={{ background: '#18102A', color: '#A78BFA', padding: '8px 18px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #30186A' }}>
                  Carvana ↗
                </a>
              </div>
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
        <div style={{ color: MUTED, fontSize: 12, marginTop: 4 }}>
          Live listings from eBay Motors · Links to CarGurus, AutoTrader, CarMax, Carvana
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '24px 20px' }}>
        {/* ── Search form ── */}
        <form onSubmit={handleSearch}>
          <div style={{ background: CARD, borderRadius: 12, padding: 20, marginBottom: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Make</label>
                <input value={filters.make} onChange={e => setF('make', e.target.value)}
                  placeholder="e.g. Ford" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input value={filters.model} onChange={e => setF('model', e.target.value)}
                  placeholder="e.g. Mustang" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Year Min</label>
                <input value={filters.yearMin} onChange={e => setF('yearMin', e.target.value)}
                  placeholder="2011" style={inputStyle} />
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
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ ...labelStyle, margin: 0 }}>Condition:</span>
                {([['', 'All'], ['new', 'New'], ['used', 'Used'], ['cpo', 'CPO']] as const).map(([val, label]) => (
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

        {/* ── Results area ── */}
        {searched && !loading && (
          <>
            {/* ── Search these sites ── */}
            {searchedFilters && (() => {
              const links = buildSearchLinks(searchedFilters)
              return (
                <div style={{ background: CARD, borderRadius: 10, padding: '14px 18px', marginBottom: 16, border: `1px solid ${BORDER}` }}>
                  <div style={{ color: MUTED, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                    Search Other Sites With These Filters
                  </div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a href={links.carGurus} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#102A10', color: '#4DD88A', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #1A5A1A' }}>
                      CarGurus ↗
                    </a>
                    <a href={links.autoTrader} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#0A1A30', color: '#7AB8FF', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #1A3A60' }}>
                      AutoTrader ↗
                    </a>
                    <a href={links.carMax} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#0A2018', color: '#4DD88A', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #0D4020' }}>
                      CarMax ↗
                    </a>
                    <a href={links.carvana} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#18102A', color: '#A78BFA', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #30186A' }}>
                      Carvana ↗
                    </a>
                    <a href={links.carsDotCom} target="_blank" rel="noopener noreferrer"
                      style={{ background: '#1A1808', color: GOLD, padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 600, border: '1px solid #3A3208' }}>
                      Cars.com ↗
                    </a>
                  </div>
                </div>
              )
            })()}

            {/* ── Status bar ── */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>
                  {totalFiltered.toLocaleString()} result{totalFiltered !== 1 ? 's' : ''}
                </span>
                <span style={{ color: MUTED, fontSize: 13 }}>
                  from {total.toLocaleString()} eBay listings · Page {page} of {totalPages}
                </span>
                {ebayCount > 0 && (
                  <span style={{ background: '#3A1A1A', color: '#FF8080', fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600 }}>
                    eBay Motors: {ebayCount.toLocaleString()}
                  </span>
                )}
              </div>

              {activeFilters.length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                  {activeFilters.map(f => (
                    <span key={f} style={{ background: BLUE, color: '#fff', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>
                      {f}
                    </span>
                  ))}
                </div>
              )}

              {filtersRelaxed && (
                <div style={{ background: '#2A1F00', border: '1px solid #FF9800', borderRadius: 8, padding: '10px 14px', color: '#FF9800', fontSize: 13 }}>
                  No exact matches — showing similar listings. Try widening your filters or use the links above to search other sites.
                </div>
              )}
            </div>

            {/* ── Result cards ── */}
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
                <div style={{ fontSize: 18, marginBottom: 8, color: TEXT }}>No eBay results found</div>
                <div style={{ fontSize: 14, marginBottom: 16 }}>Try adjusting your filters.</div>
                <div style={{ fontSize: 13, color: MUTED }}>Use the links above to search CarGurus, AutoTrader, CarMax, or Carvana directly.</div>
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
                        <span style={{ position: 'absolute', top: 8, left: 8, background: '#E43137', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                          eBay{l.listing_type === 'Auction' ? ' AUCTION' : ''}
                        </span>
                        <button onClick={() => toggleSave(l.id)}
                          style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.55)', border: 'none', color: saved.has(l.id) ? GOLD : '#fff', fontSize: 18, cursor: 'pointer', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                          {saved.has(l.id) ? '★' : '☆'}
                        </button>
                      </div>

                      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>
                          {l.year ? `${l.year} ` : ''}{l.make} {l.model}
                        </div>
                        {l.trim && (
                          <div style={{ color: MUTED, fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={l.trim ?? ''}>
                            {l.trim}
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                          <span style={{ fontSize: 20, fontWeight: 700, color: l.price ? GOLD : MUTED }}>
                            {l.price ? `$${l.price.toLocaleString()}` : 'Call for price'}
                          </span>
                          {l.price ? <span style={{ color: MUTED, fontSize: 12 }}>{monthly(l.price)}</span> : null}
                        </div>

                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: MUTED, flexWrap: 'wrap' }}>
                          {l.miles ? <span>{l.miles.toLocaleString()} mi</span> : null}
                          {l.dealer_city && <span>📍 {l.dealer_city}</span>}
                        </div>

                        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                          {l.listing_url ? (
                            <a href={l.listing_url} target="_blank" rel="noopener noreferrer"
                              style={{ flex: 1, background: '#E43137', color: '#fff', padding: '7px 0', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                              View on eBay ↗
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '16px 0' }}>
                    <button
                      disabled={page <= 1 || loading}
                      onClick={() => runSearch(page - 1)}
                      style={{ background: (page <= 1 || loading) ? INPUT : BLUE2, color: (page <= 1 || loading) ? MUTED : '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 20px', cursor: (page <= 1 || loading) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                      ← Previous
                    </button>
                    <span style={{ color: TEXT, fontSize: 14, fontWeight: 600 }}>Page {page} of {totalPages}</span>
                    <button
                      disabled={page >= totalPages || loading}
                      onClick={() => runSearch(page + 1)}
                      style={{ background: (page >= totalPages || loading) ? INPUT : BLUE2, color: (page >= totalPages || loading) ? MUTED : '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 20px', cursor: (page >= totalPages || loading) ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
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
            <div style={{ fontSize: 16 }}>Searching eBay Motors…</div>
          </div>
        )}

        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: MUTED }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <div style={{ fontSize: 20, marginBottom: 8, color: TEXT }}>Find your next car</div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>Enter make and model, apply filters, then click Search.</div>
            <div style={{ fontSize: 13 }}>
              Results from eBay Motors · direct links to CarGurus, AutoTrader, CarMax, Carvana & Cars.com
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
