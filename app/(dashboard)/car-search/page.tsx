'use client'

import { useState } from 'react'

const MAKES = ['','Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mercedes-Benz','Mitsubishi','Nissan','Porsche','Subaru','Tesla','Toyota','Volkswagen']

interface Listing {
  id: string
  source_name: string
  source_badge: string
  listing_type: string
  year: number | null
  make: string | null
  model: string | null
  trim: string | null
  price: number | null
  mileage: number | null
  location: string
  distance: number | null
  images: string[]
  exterior_color: string | null
  transmission: string | null
  drivetrain: string | null
  engine: string | null
  mpg_city: number | null
  mpg_hwy: number | null
  is_certified: boolean
  dealer_name: string | null
  dealer_phone: string | null
  listing_url: string | null
  days_on_market: number | null
  price_drop: boolean
  deal_rating: string | null
  time_left: string | null
  bid_count: string | null
}

function monthly(price: number) { return Math.round(price / 60 * 1.05) }

function getDealBadge(l: Listing): { label: string; bg: string; color: string; border: string } | null {
  if (l.is_certified) return { label: '✓ CPO Certified', bg: 'rgba(21,57,204,0.15)', color: '#1539CC', border: 'rgba(21,57,204,0.3)' }
  if (l.deal_rating === 'great') return { label: '🔥 Great Deal', bg: 'rgba(0,180,60,0.12)', color: '#00C44A', border: 'rgba(0,180,60,0.3)' }
  if (l.deal_rating === 'good') return { label: '👍 Good Deal', bg: 'rgba(21,57,204,0.1)', color: '#2255EE', border: 'rgba(21,57,204,0.25)' }
  if (l.price_drop) return { label: '↓ Price Drop', bg: 'rgba(204,0,0,0.12)', color: '#CC0000', border: 'rgba(204,0,0,0.3)' }
  if (l.days_on_market !== null && l.days_on_market <= 2) return { label: '⚡ Just Listed', bg: 'rgba(255,215,0,0.1)', color: '#FFD700', border: 'rgba(255,215,0,0.25)' }
  return null
}

export default function CarSearchPage() {
  const [filters, setFilters] = useState({
    make:'', model:'', yearMin:'', yearMax:'', priceMin:'', priceMax:'',
    mileageMax:'', zip:'', radius:'250', condition:'',
    transmission:'', drivetrain:'', sortBy:'price-asc'
  })
  const [listings, setListings] = useState<Listing[]>([])
  const [total, setTotal] = useState(0)
  const [sources, setSources] = useState<{marketcheck:number, ebay:number} | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selected, setSelected] = useState<Listing | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState<Set<string>>(new Set())

  const set = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))
  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSaved(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next })
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(''); setSelected(null)
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k,v]) => { if (v) params.set(k, v) })
    try {
      const res = await fetch(`/api/car-search?${params}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setListings([]); setTotal(0) }
      else { setListings(data.listings ?? []); setTotal(data.total ?? 0); setSources(data.sources ?? null) }
      setSearched(true)
    } catch { setError('Search failed. Please try again.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0E1825', border:'1px solid #1E3A6E', borderRadius:'0.625rem', padding:'0.625rem 0.75rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'#A0B4CC', marginBottom:'0.375rem' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🔍 Buy a Car</h1>
        <p style={{ color:'#7090B0', marginTop:'0.25rem' }}>
          Live dealer inventory + eBay Motors auctions &amp; buy-it-now listings
        </p>
      </div>

      {/* Search form */}
      <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(148px, 1fr))', gap:'0.875rem', marginBottom:'1rem' }}>
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
              <label style={lbl}>Min Price</label>
              <input value={filters.priceMin} onChange={e => set('priceMin', e.target.value)} placeholder="$10,000" style={inp} />
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
              <input value={filters.zip} onChange={e => set('zip', e.target.value)} placeholder="Leave blank for nationwide" style={inp} />
            </div>
            <div>
              <label style={lbl}>Radius</label>
              <select value={filters.radius} onChange={e => set('radius', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                {['25','50','100','150','250'].map(r => <option key={r} value={r}>{r} mi</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Transmission</label>
              <select value={filters.transmission} onChange={e => set('transmission', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">Any</option>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Drivetrain</label>
              <select value={filters.drivetrain} onChange={e => set('drivetrain', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">Any</option>
                <option value="fwd">FWD</option>
                <option value="rwd">RWD</option>
                <option value="awd">AWD</option>
                <option value="4wd">4WD/4x4</option>
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', alignItems:'center', flexWrap:'wrap' }}>
            {([['', 'All'], ['new', 'New'], ['used', 'Used'], ['cpo', 'CPO']] as [string,string][]).map(([val, label]) => (
              <label key={val} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', fontSize:'0.875rem', color: filters.condition===val ? '#CC0000' : '#A0B4CC' }}>
                <input type="radio" name="cond" value={val} checked={filters.condition===val} onChange={e => set('condition', e.target.value)} style={{ accentColor:'#CC0000' }} />
                {label}
              </label>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', gap:'0.625rem', alignItems:'center' }}>
              <select value={filters.sortBy} onChange={e => set('sortBy', e.target.value)} style={{ ...inp, width:'auto', padding:'0.5rem 0.75rem' }}>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
                <option value="mileage-asc">Lowest Mileage</option>
              </select>
              <button type="submit" disabled={loading} style={{ background: loading ? '#1E3A6E' : '#CC0000', color:'white', border:'none', padding:'0.625rem 1.75rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'0.9rem', whiteSpace:'nowrap', cursor: loading ? 'default' : 'pointer' }}>
                {loading ? 'Searching…' : 'Search Cars'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {error && (
        <div style={{ background:'rgba(204,0,0,0.08)', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#CC0000', fontSize:'0.875rem' }}>⚠️ {error}</div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
          <p style={{ fontSize:'4rem', marginBottom:'1rem' }}>🚗</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.75rem' }}>Search live inventory</h2>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <span style={{ background:'rgba(34,85,238,0.1)', border:'1px solid rgba(34,85,238,0.2)', color:'#2255EE', padding:'0.375rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem' }}>🏪 Dealer Inventory via Marketcheck</span>
            <span style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', color:'#FFD700', padding:'0.375rem 0.875rem', borderRadius:'9999px', fontSize:'0.8rem' }}>🏁 eBay Motors Auctions &amp; Buy-It-Now</span>
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'4rem' }}>
          <p style={{ fontSize:'2rem', marginBottom:'1rem' }}>🔍</p>
          <p style={{ color:'#7090B0' }}>Searching dealer inventory + eBay Motors simultaneously…</p>
        </div>
      )}

      {searched && !loading && !selected && (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
            <p style={{ color:'#7090B0', fontSize:'0.875rem' }}>{total} vehicles found</p>
            {sources && (
              <div style={{ display:'flex', gap:'0.625rem' }}>
                <span style={{ background:'rgba(34,85,238,0.08)', border:'1px solid rgba(34,85,238,0.15)', color:'#2255EE', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem' }}>🏪 {sources.marketcheck} dealers</span>
                <span style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.15)', color:'#FFD700', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem' }}>🏁 {sources.ebay} eBay</span>
              </div>
            )}
          </div>

          {listings.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem' }}>
              <p style={{ color:'#7090B0' }}>No vehicles found. Try broadening your search — different make, higher price, wider radius.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
              {listings.map(l => {
                const badge = getDealBadge(l)
                const isSaved = saved.has(l.id)
                return (
                  <div key={l.id} onClick={() => setSelected(l)}
                    style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', overflow:'hidden', cursor:'pointer', transition:'border-color 0.15s, transform 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = l.listing_type === 'auction' ? '#FFD700' : '#2255EE'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#1E3A6E'; e.currentTarget.style.transform = 'translateY(0)' }}>
                    <div style={{ height:'180px', background:'linear-gradient(135deg, rgba(34,85,238,0.06), transparent)', position:'relative', overflow:'hidden' }}>
                      {l.images?.[0]
                        ? <img src={l.images[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                        : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem' }}>🚗</div>
                      }
                      {/* Source badge */}
                      <span style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'rgba(5,10,20,0.9)', border:'1px solid #1E3A6E', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color:'#A0B4CC' }}>
                        {l.source_badge} {l.source_name}
                      </span>
                      {/* Save button */}
                      <button
                        onClick={e => toggleSave(l.id, e)}
                        style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background: isSaved ? 'rgba(204,0,0,0.85)' : 'rgba(5,10,20,0.75)', border:'1px solid rgba(255,255,255,0.15)', borderRadius:'9999px', width:'2rem', height:'2rem', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'0.9rem', transition:'background 0.15s' }}>
                        {isSaved ? '❤️' : '🤍'}
                      </button>
                      {/* Auction badge */}
                      {l.listing_type === 'auction' && (
                        <span style={{ position:'absolute', bottom:'0.5rem', left:'0.5rem', background:'rgba(255,215,0,0.15)', border:'1px solid rgba(255,215,0,0.35)', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.7rem', color:'#FFD700', fontWeight:700 }}>
                          🏁 Auction{l.bid_count && l.bid_count !== '0' ? ` · ${l.bid_count} bids` : ''}
                        </span>
                      )}
                    </div>
                    <div style={{ padding:'1rem' }}>
                      {/* Deal badge */}
                      {badge && (
                        <span style={{ display:'inline-block', background:badge.bg, border:`1px solid ${badge.border}`, color:badge.color, padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:600, marginBottom:'0.5rem' }}>
                          {badge.label}
                        </span>
                      )}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.375rem' }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>{l.year} {l.make} {l.model}</h3>
                          <p style={{ color:'#7090B0', fontSize:'0.8rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:'165px' }}>{l.trim}</p>
                        </div>
                        <div style={{ textAlign:'right', flexShrink:0 }}>
                          <p style={{ fontWeight:800, color:'#CC0000', fontSize:'1.1rem' }}>{l.price ? `$${l.price.toLocaleString()}` : 'Call'}</p>
                          {l.price && l.listing_type !== 'auction' && <p style={{ color:'#FFD700', fontSize:'0.75rem' }}>~${monthly(l.price).toLocaleString()}/mo</p>}
                          {l.listing_type === 'auction' && l.time_left && <p style={{ color:'#FFD700', fontSize:'0.7rem' }}>⏱ {l.time_left.replace('P','').replace('T',' ').replace('H','h ').replace('M','m').replace('D','d ')}</p>}
                        </div>
                      </div>
                      <div style={{ display:'flex', gap:'0.625rem', fontSize:'0.8rem', color:'#7090B0', flexWrap:'wrap', marginBottom:'0.625rem' }}>
                        {l.mileage && <span>🔢 {l.mileage.toLocaleString()} mi</span>}
                        {l.distance !== null && <span>📍 {l.distance}mi</span>}
                        {l.transmission && <span>⚙️ {l.transmission}</span>}
                        {l.drivetrain && <span>🚘 {l.drivetrain.toUpperCase()}</span>}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.625rem', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
                        <p style={{ fontSize:'0.75rem', color:'#7090B0', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', maxWidth:'160px' }}>
                          🏪 {l.dealer_name || 'Dealer'}
                        </p>
                        {l.listing_url
                          ? <a href={l.listing_url} target="_blank" rel="noopener"
                              onClick={e => e.stopPropagation()}
                              style={{ background:'rgba(21,57,204,0.12)', border:'1px solid rgba(21,57,204,0.25)', color:'#2255EE', padding:'0.25rem 0.625rem', borderRadius:'0.375rem', fontSize:'0.75rem', fontWeight:600, textDecoration:'none', whiteSpace:'nowrap' }}>
                              View Listing →
                            </a>
                          : null
                        }
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {selected && (
        <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'2rem' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.5rem' }}>
            <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'1px solid #1E3A6E', color:'#A0B4CC', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>← Back to Results</button>
            <button onClick={e => toggleSave(selected.id, e)} style={{ background: saved.has(selected.id) ? 'rgba(204,0,0,0.15)' : 'rgba(255,255,255,0.05)', border:`1px solid ${saved.has(selected.id) ? 'rgba(204,0,0,0.3)' : 'rgba(255,255,255,0.1)'}`, color: saved.has(selected.id) ? '#CC0000' : '#A0B4CC', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer', fontWeight:600 }}>
              {saved.has(selected.id) ? '❤️ Saved' : '🤍 Save'}
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
            <div>
              {selected.images?.[0]
                ? <img src={selected.images[0]} alt="" style={{ width:'100%', borderRadius:'0.75rem', marginBottom:'0.75rem' }} />
                : <div style={{ height:'260px', background:'rgba(34,85,238,0.06)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', marginBottom:'0.75rem' }}>🚗</div>
              }
              {selected.images && selected.images.length > 1 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:'0.375rem' }}>
                  {selected.images.slice(1,5).map((img, i) => (
                    <img key={i} src={img} alt="" style={{ aspectRatio:'4/3', objectFit:'cover', borderRadius:'0.375rem', width:'100%' }} />
                  ))}
                </div>
              )}
            </div>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
                <span style={{ background: selected.listing_type === 'auction' ? 'rgba(255,215,0,0.1)' : 'rgba(34,85,238,0.1)', border:`1px solid ${selected.listing_type === 'auction' ? 'rgba(255,215,0,0.25)' : 'rgba(34,85,238,0.25)'}`, color: selected.listing_type === 'auction' ? '#FFD700' : '#2255EE', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600 }}>
                  {selected.source_badge} {selected.source_name} {selected.listing_type === 'auction' ? '· Auction' : '· Buy Now'}
                </span>
                {(() => { const b = getDealBadge(selected); return b ? <span style={{ background:b.bg, border:`1px solid ${b.border}`, color:b.color, padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight:600 }}>{b.label}</span> : null })()}
              </div>
              <h2 style={{ fontSize:'1.5rem', fontWeight:800, marginBottom:'0.25rem' }}>{selected.year} {selected.make} {selected.model}</h2>
              <p style={{ color:'#A0B4CC', marginBottom:'0.75rem' }}>{selected.trim}</p>
              <p style={{ fontSize:'2.25rem', fontWeight:900, color:'#CC0000', marginBottom:'0.25rem' }}>
                {selected.price ? `$${selected.price.toLocaleString()}` : 'Call for Price'}
              </p>
              {selected.price && selected.listing_type !== 'auction' && <p style={{ color:'#FFD700', marginBottom:'1.25rem' }}>~${monthly(selected.price).toLocaleString()}/mo est.</p>}
              {selected.listing_type === 'auction' && selected.bid_count && <p style={{ color:'#FFD700', marginBottom:'1.25rem' }}>🏁 {selected.bid_count} bids · {selected.time_left}</p>}

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem', marginBottom:'1.5rem' }}>
                {[
                  ['🔢','Mileage', selected.mileage ? `${selected.mileage.toLocaleString()} mi` : '—'],
                  ['📍','Location', selected.location || '—'],
                  ['⚙️','Engine', selected.engine || '—'],
                  ['🔄','Transmission', selected.transmission || '—'],
                  ['🚘','Drivetrain', selected.drivetrain ? selected.drivetrain.toUpperCase() : '—'],
                  ['⛽','MPG', selected.mpg_city && selected.mpg_hwy ? `${selected.mpg_city}/${selected.mpg_hwy}` : '—'],
                  ['🎨','Color', selected.exterior_color || '—'],
                  ['📅','Days Listed', selected.days_on_market ? `${selected.days_on_market}d` : '—'],
                ].map(([icon, label, val]) => (
                  <div key={label as string} style={{ background:'#0E1825', borderRadius:'0.5rem', padding:'0.625rem', border:'1px solid #1E3A6E' }}>
                    <p style={{ fontSize:'0.7rem', color:'#7090B0' }}>{icon} {label as string}</p>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, marginTop:'0.125rem' }}>{val as string}</p>
                  </div>
                ))}
              </div>

              {selected.dealer_name && <p style={{ fontSize:'0.875rem', fontWeight:600, marginBottom:'0.25rem' }}>🏪 {selected.dealer_name}</p>}
              {selected.dealer_phone && <p style={{ fontSize:'0.8rem', color:'#A0B4CC', marginBottom:'1rem' }}>📞 {selected.dealer_phone}</p>}

              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                {selected.listing_url
                  ? <a href={selected.listing_url} target="_blank" rel="noopener" style={{ background:'#CC0000', color:'white', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', fontSize:'0.95rem' }}>
                      {selected.listing_type === 'auction' ? '🏁 Bid on eBay Motors →' : 'View Full Listing →'}
                    </a>
                  : <button style={{ background:'#CC0000', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>Contact Dealer</button>
                }
                <button
                  onClick={e => toggleSave(selected.id, e)}
                  style={{ background: saved.has(selected.id) ? 'rgba(204,0,0,0.1)' : 'rgba(34,85,238,0.08)', border:`1px solid ${saved.has(selected.id) ? 'rgba(204,0,0,0.25)' : 'rgba(34,85,238,0.2)'}`, color: saved.has(selected.id) ? '#CC0000' : '#2255EE', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:600, cursor:'pointer', fontSize:'0.9rem' }}>
                  {saved.has(selected.id) ? '❤️ Saved to Favorites' : '🤍 Save to Favorites'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
