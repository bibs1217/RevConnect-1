'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'

const MAKES = ['','Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mitsubishi','Nissan','Porsche','Subaru','Toyota','Volkswagen']
const CATEGORIES = ['Engine & Drivetrain','Suspension & Steering','Brakes','Exhaust','Electrical','Body & Exterior','Interior','Wheels & Tires','Performance & FI','Cooling','Fuel System','Transmission','Filters & Fluids']

interface Part {
  id: string; title: string; price: number | null; shipping: number
  total_price: number; free_shipping: boolean; condition: string
  image: string; url: string; seller: string; seller_feedback_score: number
  seller_feedback_pct: string; location: string; listing_type: string
  is_auction: boolean; time_left: string; source: string
}

export default function PartsPage() {
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [vehicle, setVehicle] = useState({ year:'', make:'', model:'' })
  const [filters, setFilters] = useState({ priceMax:'', condition:'', sortBy:'price-asc' })
  const [parts, setParts] = useState<Part[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<Part | null>(null)

  const setV = (k: string, v: string) => setVehicle(prev => ({ ...prev, [k]: v }))
  const setF = (k: string, v: string) => setFilters(prev => ({ ...prev, [k]: v }))

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) { setError('Enter a part name to search'); return }
    setLoading(true); setError(''); setSelected(null)
    const params = new URLSearchParams({ query, ...vehicle, ...filters })
    try {
      const res = await fetch(`/api/parts-search?${params}`)
      const data = await res.json()
      if (data.error) { setError(data.error); setParts([]); setTotal(0) }
      else { setParts(data.listings ?? []); setTotal(data.total ?? 0) }
      setSearched(true)
    } catch { setError('Search failed. Please try again.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.375rem' }

  const cheapest = parts.length > 0 ? [...parts].sort((a,b) => (a.total_price||999999)-(b.total_price||999999))[0] : null

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🔩 Parts Search</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>
          Search eBay Motors Parts & Accessories — real listings, real prices
        </p>
      </div>

      {/* Vehicle selector */}
      <div style={{ background:'rgba(21,57,204,0.08)', border:'1px solid rgba(21,57,204,0.2)', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:'1 1 120px' }}>
          <label style={lbl}>Year</label>
          <input value={vehicle.year} onChange={e => setV('year', e.target.value)} placeholder="2022" style={inp} />
        </div>
        <div style={{ flex:'1 1 150px' }}>
          <label style={lbl}>Make</label>
          <select value={vehicle.make} onChange={e => setV('make', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
            {MAKES.map(m => <option key={m} value={m}>{m || 'Any Make'}</option>)}
          </select>
        </div>
        <div style={{ flex:'1 1 150px' }}>
          <label style={lbl}>Model</label>
          <input value={vehicle.model} onChange={e => setV('model', e.target.value)} placeholder="Mustang GT" style={inp} />
        </div>
        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', alignSelf:'center' }}>
          Adding your vehicle improves fitment results
        </p>
      </div>

      {/* Main search */}
      <form onSubmit={handleSearch} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='Search any part — e.g. "brake pads", "K&N air filter", "coilovers", "headers"'
              style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }}
            />
          </div>
          <button type="submit" disabled={loading} style={{ background: loading ? '#1E3A5F' : 'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.75rem', borderRadius:'0.875rem', fontWeight:700, cursor: loading ? 'default' : 'pointer', whiteSpace:'nowrap', boxShadow: loading ? 'none' : '0 4px 16px rgba(204,0,0,0.4)' }}>
            {loading ? 'Searching…' : 'Search Parts'}
          </button>
        </div>

        {/* Filters */}
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <div>
            <label style={lbl}>Max Price</label>
            <input value={filters.priceMax} onChange={e => setF('priceMax', e.target.value)} placeholder="$500" style={{ ...inp, width:'120px' }} />
          </div>
          <div>
            <label style={lbl}>Condition</label>
            <select value={filters.condition} onChange={e => setF('condition', e.target.value)} style={{ ...inp, width:'160px', cursor:'pointer' }}>
              <option value="">Any Condition</option>
              <option value="new_oem">New</option>
              <option value="used">Used</option>
              <option value="remanufactured">Remanufactured</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Sort By</label>
            <select value={filters.sortBy} onChange={e => setF('sortBy', e.target.value)} style={{ ...inp, width:'180px', cursor:'pointer' }}>
              <option value="price-asc">Price: Low → High</option>
              <option value="price-desc">Price: High → Low</option>
            </select>
          </div>

          {/* Quick category buttons */}
          <div style={{ marginLeft:'auto', display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
            {['Brake Pads','Air Filter','Coilovers','Headers','Oil Filter','Spark Plugs'].map(s => (
              <button key={s} type="button" onClick={() => setQuery(s)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'0.3rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', cursor:'pointer' }}>{s}</button>
            ))}
          </div>
        </div>
      </form>

      {error && (
        <div style={{ background:'rgba(204,0,0,0.08)', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#FF6666', fontSize:'0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {!searched && !loading && (
        <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
          <p style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔩</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.75rem' }}>Search any part for any vehicle</h2>
          <p style={{ color:'rgba(255,255,255,0.3)', marginBottom:'1.5rem' }}>Powered by eBay Motors Parts & Accessories — millions of real listings</p>
          <div style={{ display:'flex', gap:'0.5rem', justifyContent:'center', flexWrap:'wrap' }}>
            {CATEGORIES.map(c => (
              <span key={c} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.35)', padding:'0.375rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem' }}>{c}</span>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'4rem' }}>
          <p style={{ fontSize:'2rem', marginBottom:'1rem' }}>🔍</p>
          <p style={{ color:'rgba(255,255,255,0.4)' }}>Searching eBay Motors parts…</p>
        </div>
      )}

      {searched && !loading && !selected && (
        <div>
          {/* Best value banner */}
          {cheapest && cheapest.price && (
            <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.875rem', padding:'0.875rem 1.25rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.875rem' }}>
              <span style={{ color:'#22c55e', fontSize:'1.25rem' }}>🏆</span>
              <div>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#22c55e' }}>Best Price: ${cheapest.total_price.toFixed(2)} shipped</p>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{cheapest.title.slice(0,80)}{cheapest.title.length > 80 ? '…' : ''}</p>
              </div>
              <span style={{ marginLeft:'auto', fontSize:'0.8rem', color:'rgba(255,255,255,0.3)' }}>{total.toLocaleString()} results</span>
            </div>
          )}

          {parts.length === 0 ? (
            <div style={{ textAlign:'center', padding:'3rem', background:'#243547', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'1rem' }}>
              <p style={{ color:'rgba(255,255,255,0.4)' }}>No parts found. Try a different search term or broaden your filters.</p>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
              {parts.map(p => {
                const isBest = cheapest?.id === p.id
                return (
                  <div key={p.id} onClick={() => setSelected(p)} style={{ background:'#243547', border:`1px solid ${isBest ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'0.875rem', padding:'1rem', cursor:'pointer', display:'flex', gap:'1rem', alignItems:'center', transition:'border-color 0.15s' }}
                    onMouseEnter={e => { if (!isBest) (e.currentTarget as HTMLElement).style.borderColor='rgba(204,0,0,0.3)' }}
                    onMouseLeave={e => { if (!isBest) (e.currentTarget as HTMLElement).style.borderColor='rgba(255,255,255,0.07)' }}>
                    {/* Image */}
                    <div style={{ width:'80px', height:'80px', flexShrink:0, borderRadius:'0.5rem', overflow:'hidden', background:'#0D1E30', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {p.image
                        ? <img src={p.image} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} />
                        : <span style={{ fontSize:'2rem' }}>🔩</span>
                      }
                    </div>

                    {/* Info */}
                    <div style={{ flex:1, minWidth:0 }}>
                      <p style={{ fontWeight:600, fontSize:'0.9rem', color:'white', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{p.title}</p>
                      <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.375rem', flexWrap:'wrap' }}>
                        <span style={{ fontSize:'0.75rem', background:'rgba(255,255,255,0.06)', padding:'0.15rem 0.5rem', borderRadius:'9999px', color:'rgba(255,255,255,0.5)' }}>{p.condition}</span>
                        {p.free_shipping && <span style={{ fontSize:'0.75rem', background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.15)', padding:'0.15rem 0.5rem', borderRadius:'9999px', color:'#22c55e' }}>Free Shipping</span>}
                        {p.is_auction && <span style={{ fontSize:'0.75rem', background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.15)', padding:'0.15rem 0.5rem', borderRadius:'9999px', color:'#FFD700' }}>🏁 Auction</span>}
                        <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>⭐ {p.seller_feedback_pct}% ({p.seller_feedback_score.toLocaleString()})</span>
                        {p.location && <span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>📍 {p.location}</span>}
                      </div>
                    </div>

                    {/* Price */}
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontWeight:900, fontSize:'1.25rem', color: isBest ? '#22c55e' : '#CC0000' }}>
                        {p.price ? `$${p.price.toFixed(2)}` : 'Bid'}
                      </p>
                      {!p.free_shipping && p.shipping > 0 && (
                        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)' }}>+${p.shipping.toFixed(2)} ship</p>
                      )}
                      <p style={{ fontSize:'0.8rem', fontWeight:700, color:'rgba(255,255,255,0.6)', marginTop:'0.125rem' }}>
                        ${p.total_price.toFixed(2)} total
                      </p>
                      {isBest && <p style={{ fontSize:'0.65rem', color:'#22c55e', fontWeight:700 }}>BEST VALUE</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Detail view */}
      {selected && (
        <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'2rem' }}>
          <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', marginBottom:'1.5rem', fontSize:'0.8rem', cursor:'pointer' }}>← Back to Results</button>
          <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:'2rem' }}>
            <div>
              <div style={{ background:'#0D1E30', borderRadius:'0.75rem', height:'260px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom:'0.75rem' }}>
                {selected.image
                  ? <img src={selected.image} alt="" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} />
                  : <span style={{ fontSize:'5rem' }}>🔩</span>
                }
              </div>
              <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                <span style={{ background:'rgba(255,255,255,0.06)', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', color:'rgba(255,255,255,0.5)' }}>{selected.condition}</span>
                {selected.free_shipping && <span style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', border:'1px solid rgba(34,197,94,0.2)' }}>✓ Free Shipping</span>}
              </div>
            </div>
            <div>
              <h2 style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'1rem', lineHeight:1.4 }}>{selected.title}</h2>
              <div style={{ marginBottom:'1.25rem' }}>
                <p style={{ fontSize:'2.5rem', fontWeight:900, color:'#CC0000' }}>
                  {selected.price ? `$${selected.price.toFixed(2)}` : 'Place Bid'}
                </p>
                {!selected.free_shipping && selected.shipping > 0 && (
                  <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>+ ${selected.shipping.toFixed(2)} shipping</p>
                )}
                <p style={{ fontWeight:700, color:'#22c55e', fontSize:'1.1rem', marginTop:'0.25rem' }}>
                  Total: ${selected.total_price.toFixed(2)}
                </p>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.625rem', marginBottom:'1.5rem' }}>
                {[
                  ['🏪','Seller', selected.seller],
                  ['⭐','Feedback', `${selected.seller_feedback_pct}% (${selected.seller_feedback_score.toLocaleString()})`],
                  ['📍','Location', selected.location || '—'],
                  ['🏷️','Type', selected.is_auction ? 'Auction' : 'Buy It Now'],
                ].map(([icon, label, val]) => (
                  <div key={label as string} style={{ background:'#0D1E30', borderRadius:'0.5rem', padding:'0.75rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                    <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>{icon} {label as string}</p>
                    <p style={{ fontSize:'0.875rem', fontWeight:600, marginTop:'0.125rem' }}>{val as string}</p>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <a href={selected.url} target="_blank" rel="noopener" style={{ flex:1, background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', fontSize:'0.95rem', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
                  {selected.is_auction ? '🏁 Place Bid on eBay →' : 'Buy on eBay →'}
                </a>
                <button style={{ background:'rgba(21,57,204,0.1)', border:'1px solid rgba(21,57,204,0.25)', color:'#6699FF', padding:'0.875rem 1.25rem', borderRadius:'0.75rem', cursor:'pointer', fontWeight:600, fontSize:'0.875rem' }}>
                  + Build List
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
