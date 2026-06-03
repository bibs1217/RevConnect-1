'use client'

import { useState } from 'react'

const MAKES = ['','Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mercedes-Benz','Mitsubishi','Nissan','Porsche','Subaru','Tesla','Toyota','Volkswagen']

interface Listing {
  id: string; year: number; make: string; model: string; trim: string
  price: number; mileage: number; source: string; location: string
  distance: number | null; images: string[]; exterior_color: string
  transmission: string; drivetrain: string; engine: string
  mpg_city: number; mpg_hwy: number; is_certified: boolean
  dealer_name: string; dealer_phone: string; listing_url: string
  days_on_market: number; price_drop: boolean; price_change: number
}

function monthly(price: number) { return Math.round(price / 60 * 1.05) }

export default function CarSearchPage() {
  const [filters, setFilters] = useState({ make:'', model:'', yearMin:'', yearMax:'', priceMax:'', mileageMax:'', zip:'75201', radius:'100', condition:'used', sortBy:'price-asc' })
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Listing | null>(null)
  const [error, setError] = useState('')

  const set = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSelected(null)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => { if (v) params.set(k, v) })
    try {
      const res = await fetch(`/api/car-search?${params}`)
      const data = await res.json()
      if (data.error) { setError(data.error + (data.detail ? `: ${data.detail}` : '')); setListings([]); setTotal(0) }
      else { setListings(data.listings ?? []); setTotal(data.total ?? 0) }
      setSearched(true)
    } catch (err) { setError('Search failed. Please try again.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0D0D0D', border:'1px solid #1E3A5F', borderRadius:'0.625rem', padding:'0.625rem 0.75rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🔍 Buy a Car</h1>
        <p style={{ color:'#666', marginTop:'0.25rem' }}>Live dealer inventory — powered by Marketcheck</p>
      </div>

      {/* Search form */}
      <div style={{ background:'#0D1B2A', border:'1px solid #1E3A5F', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1rem' }}>
            <div>
              <label style={lbl}>Make</label>
              <select value={filters.make} onChange={e => set('make', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">Any Make</option>
                {MAKES.filter(Boolean).map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Model</label>
              <input value={filters.model} onChange={e => set('model', e.target.value)} placeholder="e.g. Supra" style={inp} />
            </div>
            <div>
              <label style={lbl}>Year Min</label>
              <input value={filters.yearMin} onChange={e => set('yearMin', e.target.value)} placeholder="2015" style={inp} />
            </div>
            <div>
              <label style={lbl}>Year Max</label>
              <input value={filters.yearMax} onChange={e => set('yearMax', e.target.value)} placeholder="2024" style={inp} />
            </div>
            <div>
              <label style={lbl}>Max Price</label>
              <input value={filters.priceMax} onChange={e => set('priceMax', e.target.value)} placeholder="$80,000" style={inp} />
            </div>
            <div>
              <label style={lbl}>Max Mileage</label>
              <input value={filters.mileageMax} onChange={e => set('mileageMax', e.target.value)} placeholder="50,000" style={inp} />
            </div>
            <div>
              <label style={lbl}>ZIP Code</label>
              <input value={filters.zip} onChange={e => set('zip', e.target.value)} placeholder="75201" style={inp} />
            </div>
            <div>
              <label style={lbl}>Radius</label>
              <select value={filters.radius} onChange={e => set('radius', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                {['25','50','100','150','250'].map(r => <option key={r} value={r}>{r} mi</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            {['new','used','cpo'].map(c => (
              <label key={c} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', fontSize:'0.875rem', color: filters.condition===c ? '#E63946' : '#aaa' }}>
                <input type="radio" name="cond" value={c} checked={filters.condition===c} onChange={e => set('condition', e.target.value)} style={{ accentColor:'#E63946' }} />
                {c === 'cpo' ? 'CPO' : c.charAt(0).toUpperCase()+c.slice(1)}
              </label>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <select value={filters.sortBy} onChange={e => set('sortBy', e.target.value)} style={{ ...inp, width:'auto', padding:'0.5rem 0.75rem' }}>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="mileage-asc">Lowest Mileage</option>
              </select>
            </div>
            <button type="submit" disabled={loading} style={{ background: loading ? '#333' : '#E63946', color:'white', border:'none', padding:'0.625rem 1.75rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'0.9rem', whiteSpace:'nowrap', cursor: loading ? 'default' : 'pointer' }}>
              {loading ? 'Searching…' : 'Search Cars'}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ background:'rgba(230,57,70,0.08)', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#E63946', fontSize:'0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
          <p style={{ fontSize:'4rem', marginBottom:'1rem' }}>🚗</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Search live dealer inventory</h2>
          <p style={{ color:'#666' }}>Real listings from thousands of dealers — enter your ZIP and hit Search.</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'4rem' }}>
          <p style={{ fontSize:'2rem', marginBottom:'1rem', animation:'spin 1s linear infinite' }}>🔍</p>
          <p style={{ color:'#666' }}>Searching live dealer inventory…</p>
        </div>
      )}

      {searched && !loading && !selected && (
        <div>
          <p style={{ color:'#666', fontSize:'0.875rem', marginBottom:'1rem' }}>
            {total > 0 ? `${total.toLocaleString()} vehicles found` : 'No vehicles found — try broadening your search'}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
            {listings.map(l => (
              <div key={l.id} onClick={() => setSelected(l)} style={{ background:'#0D1B2A', border:'1px solid #1E3A5F', borderRadius:'1rem', overflow:'hidden', cursor:'pointer' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor='#E63946')}
                onMouseLeave={e => (e.currentTarget.style.borderColor='#1E3A5F')}>
                <div style={{ height:'180px', background:'linear-gradient(135deg, rgba(230,57,70,0.06), transparent)', position:'relative', overflow:'hidden' }}>
                  {l.images?.[0]
                    ? <img src={l.images[0]} alt={`${l.year} ${l.make} ${l.model}`} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                    : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem' }}>🚗</div>
                  }
                  <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'rgba(13,13,13,0.85)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color:'#aaa' }}>
                    {l.days_on_market ? `${l.days_on_market}d listed` : 'New listing'}
                  </div>
                  {l.price_drop && (
                    <div style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:'rgba(230,57,70,0.9)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color:'white', fontWeight:600 }}>
                      ↓ Price Drop
                    </div>
                  )}
                </div>
                <div style={{ padding:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.375rem' }}>
                    <div>
                      <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>{l.year} {l.make} {l.model}</h3>
                      <p style={{ color:'#666', fontSize:'0.8rem' }}>{l.trim}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontWeight:800, color:'#E63946', fontSize:'1.1rem' }}>{l.price ? `$${l.price.toLocaleString()}` : 'Call'}</p>
                      {l.price && <p style={{ color:'#FACC15', fontSize:'0.75rem' }}>~${monthly(l.price).toLocaleString()}/mo</p>}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'0.75rem', fontSize:'0.8rem', color:'#666', marginBottom:'0.625rem', flexWrap:'wrap' }}>
                    {l.mileage && <span>🔢 {l.mileage.toLocaleString()} mi</span>}
                    {l.distance !== null && <span>📍 {l.distance}mi away</span>}
                    {l.exterior_color && <span>🎨 {l.exterior_color}</span>}
                  </div>
                  <p style={{ fontSize:'0.75rem', color:'#555', overflow:'hidden', whiteSpace:'nowrap' }}>🏪 {l.dealer_name ?? l.source}</p>
                  {l.is_certified && <span style={{ display:'inline-block', marginTop:'0.375rem', background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.2)' }}>✓ Certified</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div style={{ background:'#0D1B2A', border:'1px solid #1E3A5F', borderRadius:'1rem', padding:'2rem' }}>
          <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'1px solid #1E3A5F', color:'#aaa', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', marginBottom:'1.5rem', fontSize:'0.8rem', cursor:'pointer' }}>← Back to Results</button>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
            <div>
              {selected.images?.[0]
                ? <img src={selected.images[0]} alt="" style={{ width:'100%', borderRadius:'0.75rem', marginBottom:'0.75rem' }} />
                : <div style={{ height:'260px', background:'rgba(230,57,70,0.06)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', marginBottom:'0.75rem' }}>🚗</div>
              }
              {selected.images?.length > 1 && (
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {selected.images.slice(1,5).map((img, i) => (
                    <img key={i} src={img} alt="" style={{ width:'calc(25% - 0.375rem)', aspectRatio:'4/3', objectFit:'cover', borderRadius:'0.375rem' }} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'0.25rem' }}>{selected.year} {selected.make} {selected.model}</h2>
              <p style={{ color:'#aaa', marginBottom:'0.75rem' }}>{selected.trim}</p>
              <p style={{ fontSize:'2.25rem', fontWeight:900, color:'#E63946', marginBottom:'0.25rem' }}>
                {selected.price ? `$${selected.price.toLocaleString()}` : 'Call for Price'}
              </p>
              {selected.price && <p style={{ color:'#FACC15', marginBottom:'1.25rem' }}>~${monthly(selected.price).toLocaleString()}/mo est. (60mo)</p>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem', marginBottom:'1.5rem' }}>
                {[
                  ['🔢','Mileage', selected.mileage ? `${selected.mileage.toLocaleString()} mi` : '—'],
                  ['📍','Location', selected.location || '—'],
                  ['⚙️','Engine', selected.engine || '—'],
                  ['🔄','Transmission', selected.transmission || '—'],
                  ['🚘','Drivetrain', selected.drivetrain || '—'],
                  ['⛽','MPG', selected.mpg_city && selected.mpg_hwy ? `${selected.mpg_city}/${selected.mpg_hwy}` : '—'],
                  ['🎨','Color', selected.exterior_color || '—'],
                  ['📅','Days Listed', selected.days_on_market ? `${selected.days_on_market} days` : 'New'],
                ].map(([icon, label, val]) => (
                  <div key={label as string} style={{ background:'#0D0D0D', borderRadius:'0.5rem', padding:'0.625rem' }}>
                    <p style={{ fontSize:'0.7rem', color:'#555' }}>{icon} {label as string}</p>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, marginTop:'0.125rem' }}>{val as string}</p>
                  </div>
                ))}
              </div>

              <p style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.375rem' }}>🏪 {selected.dealer_name}</p>
              {selected.dealer_phone && <p style={{ fontSize:'0.8rem', color:'#aaa', marginBottom:'1rem' }}>📞 {selected.dealer_phone}</p>}

              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {selected.listing_url
                  ? <a href={selected.listing_url} target="_blank" rel="noopener" style={{ background:'#E63946', color:'white', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none' }}>View Full Listing →</a>
                  : <button style={{ background:'#E63946', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>Contact Dealer</button>
                }
                <button style={{ background:'rgba(230,57,70,0.08)', border:'1px solid rgba(230,57,70,0.2)', color:'#E63946', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:600, cursor:'pointer' }}>+ Save to My Garage</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
