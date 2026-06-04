'use client'

import { useState } from 'react'

const MAKES = ['','Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mitsubishi','Nissan','Porsche','Subaru','Toyota','Volkswagen']

// Retailers with direct search links
const RETAILERS = [
  { name:'eBay Motors', logo:'🏁', color:'#E43137', url:(q:string) => `https://www.ebay.com/sch/6028/i.html?_nkw=${encodeURIComponent(q)}`, hasApi:true, badge:'Live Results' },
  { name:'AutoZone', logo:'🔴', color:'#E61A1A', url:(q:string) => `https://www.autozone.com/searchresult?searchText=${encodeURIComponent(q)}` },
  { name:'O\'Reilly Auto', logo:'🟠', color:'#E87722', url:(q:string) => `https://www.oreillyauto.com/search?q=${encodeURIComponent(q)}` },
  { name:'Advance Auto', logo:'🟡', color:'#E8A400', url:(q:string) => `https://shop.advanceautoparts.com/find/searchresult?query=${encodeURIComponent(q)}` },
  { name:'NAPA Auto Parts', logo:'🔵', color:'#003DA5', url:(q:string) => `https://www.napaonline.com/en/search?query=${encodeURIComponent(q)}` },
  { name:'Amazon Auto', logo:'📦', color:'#FF9900', url:(q:string) => `https://www.amazon.com/s?k=${encodeURIComponent(q+' auto parts')}&rh=n%3A15684181` },
  { name:'Walmart Auto', logo:'🛒', color:'#0071DC', url:(q:string) => `https://www.walmart.com/search?q=${encodeURIComponent(q+' auto parts')}` },
  { name:'RockAuto', logo:'🪨', color:'#CC0000', url:(q:string) => `https://www.rockauto.com/en/catalog/?parttype=${encodeURIComponent(q)}` },
  { name:'Summit Racing', logo:'🏎️', color:'#003087', url:(q:string) => `https://www.summitracing.com/search?keyword=${encodeURIComponent(q)}` },
  { name:'JEGS', logo:'⚡', color:'#FFD700', url:(q:string) => `https://www.jegs.com/i/JEGS/900?ptype=searchresults&query=${encodeURIComponent(q)}` },
  { name:'CarParts.com', logo:'🚗', color:'#1539CC', url:(q:string) => `https://www.carparts.com/search?searchTerm=${encodeURIComponent(q)}` },
  { name:'AutoAnything', logo:'🔧', color:'#CC6600', url:(q:string) => `https://www.autoanything.com/search#Au_No_Rec=20&Au_srq=${encodeURIComponent(q)}` },
  { name:'PartsGeek', logo:'🔩', color:'#006633', url:(q:string) => `https://www.partsgeek.com/search?q=${encodeURIComponent(q)}` },
  { name:'1A Auto', logo:'1️⃣', color:'#CC0000', url:(q:string) => `https://www.1aauto.com/search?searchterm=${encodeURIComponent(q)}` },
]

interface Part {
  id: string; title: string; price: number | null; shipping: number
  total_price: number; free_shipping: boolean; condition: string
  image: string; url: string; seller: string; seller_feedback_score: number
  seller_feedback_pct: string; location: string; is_auction: boolean; source: string
}

export default function PartsPage() {
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
      if (data.error && !data.listings) { setError(data.error); setParts([]); setTotal(0) }
      else { setParts(data.listings ?? []); setTotal(data.total ?? 0); if (data.error) setError(data.error) }
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
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Search across eBay Motors + direct links to 14 major retailers</p>
      </div>

      {/* Vehicle */}
      <div style={{ background:'rgba(21,57,204,0.06)', border:'1px solid rgba(21,57,204,0.15)', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:'1 1 100px' }}>
          <label style={lbl}>Year</label>
          <input value={vehicle.year} onChange={e => setV('year', e.target.value)} placeholder="2022" style={inp} />
        </div>
        <div style={{ flex:'1 1 130px' }}>
          <label style={lbl}>Make</label>
          <select value={vehicle.make} onChange={e => setV('make', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
            {MAKES.map(m => <option key={m} value={m}>{m || 'Any Make'}</option>)}
          </select>
        </div>
        <div style={{ flex:'1 1 130px' }}>
          <label style={lbl}>Model</label>
          <input value={vehicle.model} onChange={e => setV('model', e.target.value)} placeholder="Mustang GT" style={inp} />
        </div>
        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', flex:'2 1 200px' }}>Vehicle info gets included in search across all retailers</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
            <input value={query} onChange={e => setQuery(e.target.value)}
              placeholder='e.g. "brake pads", "K&N air filter", "coilovers", "headers", "spark plugs"'
              style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ background: loading ? '#1E3A5F' : 'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.75rem', borderRadius:'0.875rem', fontWeight:700, cursor: loading ? 'default':'pointer', whiteSpace:'nowrap', boxShadow: loading ? 'none':'0 4px 16px rgba(204,0,0,0.4)' }}>
            {loading ? 'Searching…' : 'Search All Retailers'}
          </button>
        </div>

        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <div>
            <label style={lbl}>Max Price</label>
            <input value={filters.priceMax} onChange={e => setF('priceMax', e.target.value)} placeholder="$500" style={{ ...inp, width:'110px' }} />
          </div>
          <div>
            <label style={lbl}>Condition</label>
            <select value={filters.condition} onChange={e => setF('condition', e.target.value)} style={{ ...inp, width:'150px', cursor:'pointer' }}>
              <option value="">Any</option>
              <option value="new_oem">New</option>
              <option value="used">Used</option>
              <option value="remanufactured">Remanufactured</option>
            </select>
          </div>
          <div style={{ marginLeft:'auto', display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
            {['Brake Pads','Air Filter','Coilovers','Oil Filter','Spark Plugs','Rotors','Headers','Shocks'].map(s => (
              <button key={s} type="button" onClick={() => setQuery(s)}
                style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.45)', padding:'0.3rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', cursor:'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </form>

      {error && (
        <div style={{ background:'rgba(244,162,97,0.08)', border:'1px solid rgba(244,162,97,0.2)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#F4A261', fontSize:'0.875rem' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Retailer grid — always visible after search */}
      {(searched || query.trim().length > 2) && (
        <div style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.75rem', letterSpacing:'0.5px', textTransform:'uppercase' }}>
            🛒 Search on {RETAILERS.length} Retailers {query ? `— "${query}"` : ''}
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.625rem' }}>
            {RETAILERS.map(r => {
              const fullQuery = [vehicle.year, vehicle.make, vehicle.model, query].filter(Boolean).join(' ')
              return (
                <a key={r.name} href={fullQuery ? r.url(fullQuery) : '#'} target="_blank" rel="noopener"
                  onClick={e => { if (!fullQuery) { e.preventDefault(); setError('Enter a part name first') } }}
                  style={{ display:'flex', alignItems:'center', gap:'0.625rem', background:'#243547', border:`1px solid ${r.color}25`, borderRadius:'0.75rem', padding:'0.625rem 0.875rem', textDecoration:'none', transition:'all 0.15s', cursor:'pointer', position:'relative' }}>
                  <span style={{ fontSize:'1.25rem' }}>{r.logo}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'0.8rem', fontWeight:600, color:'white', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{r.name}</p>
                    {r.hasApi ? (
                      <p style={{ fontSize:'0.65rem', color:'#22c55e', fontWeight:600 }}>● Live Results</p>
                    ) : (
                      <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>Opens site →</p>
                    )}
                  </div>
                  <div style={{ width:'6px', height:'100%', position:'absolute', left:0, top:0, background:r.color, borderRadius:'0.75rem 0 0 0.75rem', opacity:0.6 }} />
                </a>
              )
            })}
          </div>
          <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.2)', marginTop:'0.625rem' }}>
            ✓ eBay Motors shows live prices below · All other retailers open in a new tab with your search pre-filled
          </p>
        </div>
      )}

      {!searched && query.trim().length <= 2 && (
        <div style={{ textAlign:'center', padding:'3rem 2rem' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔩</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Search any part</h2>
          <p style={{ color:'rgba(255,255,255,0.3)', marginBottom:'1.5rem' }}>Type a part name to search eBay Motors + get direct links to 13 retailers</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.5rem', maxWidth:'800px', margin:'0 auto' }}>
            {RETAILERS.map(r => (
              <div key={r.name} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#243547', border:`1px solid ${r.color}20`, borderRadius:'0.625rem', padding:'0.5rem 0.75rem' }}>
                <span>{r.logo}</span>
                <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>{r.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign:'center', padding:'3rem' }}>
          <p style={{ fontSize:'2rem', marginBottom:'1rem' }}>🔍</p>
          <p style={{ color:'rgba(255,255,255,0.4)' }}>Searching eBay Motors parts…</p>
        </div>
      )}

      {/* eBay results */}
      {searched && !loading && !selected && parts.length > 0 && (
        <div>
          <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.875rem' }}>
            🏁 <strong style={{ color:'#E43137' }}>eBay Motors</strong> — {total.toLocaleString()} results for "{[vehicle.year,vehicle.make,vehicle.model,query].filter(Boolean).join(' ')}"
          </p>

          {cheapest && cheapest.price && (
            <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:'0.875rem' }}>
              <span style={{ color:'#22c55e', fontSize:'1.1rem' }}>🏆</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'0.875rem', fontWeight:700, color:'#22c55e' }}>Best eBay Price: ${cheapest.total_price.toFixed(2)} shipped</p>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{cheapest.title.slice(0,80)}…</p>
              </div>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
            {parts.map(p => {
              const isBest = cheapest?.id === p.id
              return (
                <div key={p.id} onClick={() => setSelected(p)}
                  style={{ background:'#243547', border:`1px solid ${isBest ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'0.875rem', padding:'0.875rem', cursor:'pointer', display:'flex', gap:'0.875rem', alignItems:'center' }}>
                  <div style={{ width:'72px', height:'72px', flexShrink:0, borderRadius:'0.5rem', overflow:'hidden', background:'#0D1E30', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {p.image ? <img src={p.image} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:'1.75rem' }}>🔩</span>}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:600, fontSize:'0.875rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{p.title}</p>
                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.25rem', flexWrap:'wrap' }}>
                      <span style={{ fontSize:'0.7rem', background:'rgba(255,255,255,0.06)', padding:'0.1rem 0.4rem', borderRadius:'9999px', color:'rgba(255,255,255,0.4)' }}>{p.condition}</span>
                      {p.free_shipping && <span style={{ fontSize:'0.7rem', color:'#22c55e' }}>Free Ship</span>}
                      {p.is_auction && <span style={{ fontSize:'0.7rem', color:'#FFD700' }}>🏁 Auction</span>}
                      <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)' }}>⭐ {p.seller_feedback_pct}%</span>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <p style={{ fontWeight:900, fontSize:'1.2rem', color: isBest ? '#22c55e' : '#CC0000' }}>{p.price ? `$${p.price.toFixed(2)}` : 'Bid'}</p>
                    <p style={{ fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,0.5)' }}>${p.total_price.toFixed(2)} total</p>
                    {isBest && <p style={{ fontSize:'0.6rem', color:'#22c55e', fontWeight:700 }}>✓ BEST</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {searched && !loading && !selected && parts.length === 0 && !error && (
        <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'1rem', padding:'2rem', textAlign:'center' }}>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem' }}>No eBay listings found — try the retailer links above to search on AutoZone, O'Reilly, or Amazon.</p>
        </div>
      )}

      {/* Detail */}
      {selected && (
        <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'2rem' }}>
          <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', marginBottom:'1.5rem', fontSize:'0.8rem', cursor:'pointer' }}>← Back</button>
          <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'2rem' }}>
            <div style={{ background:'#0D1E30', borderRadius:'0.75rem', height:'240px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
              {selected.image ? <img src={selected.image} alt="" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:'5rem' }}>🔩</span>}
            </div>
            <div>
              <h2 style={{ fontWeight:800, fontSize:'1.05rem', marginBottom:'1rem', lineHeight:1.4 }}>{selected.title}</h2>
              <p style={{ fontSize:'2.5rem', fontWeight:900, color:'#CC0000', marginBottom:'0.25rem' }}>{selected.price ? `$${selected.price.toFixed(2)}` : 'Bid'}</p>
              {!selected.free_shipping && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.875rem', marginBottom:'0.25rem' }}>+ ${selected.shipping.toFixed(2)} shipping</p>}
              <p style={{ color:'#22c55e', fontWeight:700, fontSize:'1rem', marginBottom:'1.25rem' }}>Total: ${selected.total_price.toFixed(2)}</p>
              <a href={selected.url} target="_blank" rel="noopener" style={{ display:'block', background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', fontSize:'0.95rem', boxShadow:'0 4px 16px rgba(204,0,0,0.35)', marginBottom:'0.75rem' }}>
                {selected.is_auction ? '🏁 Bid on eBay Motors →' : 'Buy on eBay Motors →'}
              </a>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.5rem' }}>
                {RETAILERS.filter(r => !r.hasApi).slice(0,6).map(r => {
                  const q = [vehicle.year, vehicle.make, vehicle.model, selected.title.slice(0,40)].filter(Boolean).join(' ')
                  return (
                    <a key={r.name} href={r.url(q)} target="_blank" rel="noopener"
                      style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'#0D1E30', border:`1px solid ${r.color}25`, borderRadius:'0.5rem', padding:'0.5rem 0.625rem', textDecoration:'none', fontSize:'0.75rem', color:'rgba(255,255,255,0.6)' }}>
                      <span>{r.logo}</span>{r.name}
                    </a>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
