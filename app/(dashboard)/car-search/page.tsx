'use client'

import { useState } from 'react'

const MAKES = ['Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mercedes-Benz','Mitsubishi','Nissan','Porsche','Subaru','Tesla','Toyota','Volkswagen']

const MOCK_LISTINGS = [
  { id:'1', year:2022, make:'Toyota', model:'Supra', trim:'GR Premium', price:55990, mileage:8200, mpg:'21/30', img:'🏎️', source:'CarGurus', location:'Dallas, TX', distance:12, rating:4.8, oneOwner:true, noAccidents:true, priceDrop:false, monthlyEstimate:987 },
  { id:'2', year:2021, make:'Subaru', model:'WRX STI', trim:'Limited', price:42500, mileage:14800, mpg:'17/22', img:'🚗', source:'AutoTrader', location:'Austin, TX', distance:8, rating:4.6, oneOwner:true, noAccidents:false, priceDrop:true, monthlyEstimate:749 },
  { id:'3', year:2023, make:'Ford', model:'Mustang', trim:'GT500', price:78900, mileage:2100, mpg:'14/21', img:'🐎', source:'Cars.com', location:'Houston, TX', distance:34, rating:4.9, oneOwner:true, noAccidents:true, priceDrop:false, monthlyEstimate:1390 },
  { id:'4', year:2020, make:'BMW', model:'M3', trim:'Competition', price:65000, mileage:22400, mpg:'16/23', img:'🚙', source:'Carvana', location:'San Antonio, TX', distance:67, rating:4.7, oneOwner:false, noAccidents:true, priceDrop:true, monthlyEstimate:1145 },
  { id:'5', year:2022, make:'Porsche', model:'911', trim:'Carrera S', price:124500, mileage:5600, mpg:'19/24', img:'🏁', source:'Bring a Trailer', location:'Dallas, TX', distance:15, rating:5.0, oneOwner:true, noAccidents:true, priceDrop:false, monthlyEstimate:2194 },
  { id:'6', year:2021, make:'Nissan', model:'GT-R', trim:'Premium', price:115000, mileage:9800, mpg:'16/22', img:'🚗', source:'eBay Motors', location:'Plano, TX', distance:22, rating:4.8, oneOwner:true, noAccidents:true, priceDrop:false, monthlyEstimate:2026 },
]

const SOURCES = ['CarGurus','AutoTrader','Cars.com','Carvana','CarMax','BaT','Cars & Bids','eBay','TrueCar','Vroom']

export default function CarSearchPage() {
  const [searched, setSearched] = useState(false)
  const [filters, setFilters] = useState({ make:'', model:'', yearMin:'', yearMax:'', priceMin:'', priceMax:'', mileageMax:'', zip:'', radius:'100', condition:'used' })
  const [listings, setListings] = useState(MOCK_LISTINGS)
  const [selectedId, setSelectedId] = useState<string|null>(null)
  const [sortBy, setSortBy] = useState('price-asc')

  const set = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    let results = MOCK_LISTINGS
    if (filters.make) results = results.filter(l => l.make.toLowerCase().includes(filters.make.toLowerCase()))
    if (filters.priceMax) results = results.filter(l => l.price <= parseInt(filters.priceMax))
    if (filters.mileageMax) results = results.filter(l => l.mileage <= parseInt(filters.mileageMax))
    results = [...results].sort((a,b) => sortBy === 'price-asc' ? a.price - b.price : sortBy === 'price-desc' ? b.price - a.price : a.mileage - b.mileage)
    setListings(results)
    setSearched(true)
    setSelectedId(null)
  }

  const selected = listings.find(l => l.id === selectedId)

  const inp: React.CSSProperties = { width:'100%', background:'#0D0D0D', border:'1px solid #2a2a3e', borderRadius:'0.625rem', padding:'0.625rem 0.75rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🔍 Buy a Car</h1>
        <p style={{ color:'#666', marginTop:'0.25rem' }}>Aggregated from {SOURCES.join(', ')} and more</p>
      </div>

      {/* Search form */}
      <div style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
        <form onSubmit={handleSearch}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1rem' }}>
            <div>
              <label style={lbl}>Make</label>
              <select value={filters.make} onChange={e => set('make', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                <option value="">Any Make</option>
                {MAKES.map(m => <option key={m}>{m}</option>)}
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
              <label key={c} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', fontSize:'0.875rem', color: filters.condition === c ? '#E63946' : '#aaa' }}>
                <input type="radio" name="condition" value={c} checked={filters.condition === c} onChange={e => set('condition', e.target.value)} style={{ accentColor:'#E63946' }} />
                {c === 'cpo' ? 'CPO' : c.charAt(0).toUpperCase() + c.slice(1)}
              </label>
            ))}
            <div style={{ marginLeft:'auto', display:'flex', gap:'0.5rem', alignItems:'center' }}>
              <label style={{ ...lbl, margin:0, whiteSpace:'nowrap' }}>Sort:</label>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, width:'auto', padding:'0.5rem 0.75rem' }}>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="mileage-asc">Lowest Mileage</option>
              </select>
            </div>
            <button type="submit" style={{ background:'#E63946', color:'white', border:'none', padding:'0.625rem 1.75rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'0.9rem', whiteSpace:'nowrap' }}>
              Search Cars
            </button>
          </div>
        </form>
      </div>

      {!searched ? (
        <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
          <p style={{ fontSize:'4rem', marginBottom:'1rem' }}>🚗</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Search for your next vehicle</h2>
          <p style={{ color:'#666' }}>We search across {SOURCES.length}+ sources simultaneously.</p>
        </div>
      ) : selectedId ? (
        /* Detail view */
        <div style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'1rem', padding:'2rem' }}>
          <button onClick={() => setSelectedId(null)} style={{ background:'transparent', border:'1px solid #2a2a3e', color:'#aaa', padding:'0.5rem 1rem', borderRadius:'0.5rem', marginBottom:'1.5rem', fontSize:'0.875rem' }}>← Back to Results</button>
          {selected && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
              <div>
                <div style={{ height:'280px', background:'linear-gradient(135deg, rgba(230,57,70,0.1), rgba(244,162,97,0.05))', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'6rem', marginBottom:'1rem' }}>{selected.img}</div>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {selected.oneOwner && <span style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', color:'#22c55e', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem' }}>1 Owner</span>}
                  {selected.noAccidents && <span style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.2)', color:'#22c55e', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem' }}>No Accidents</span>}
                  {selected.priceDrop && <span style={{ background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.2)', color:'#E63946', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem' }}>Price Drop ↓</span>}
                </div>
              </div>
              <div>
                <h2 style={{ fontSize:'1.75rem', fontWeight:800, marginBottom:'0.25rem' }}>{selected.year} {selected.make} {selected.model}</h2>
                <p style={{ color:'#aaa', marginBottom:'1rem' }}>{selected.trim}</p>
                <p style={{ fontSize:'2.5rem', fontWeight:900, color:'#E63946', marginBottom:'0.25rem' }}>${selected.price.toLocaleString()}</p>
                <p style={{ color:'#F4A261', marginBottom:'1.5rem' }}>~${selected.monthlyEstimate}/mo est.</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.5rem' }}>
                  {[['📍', 'Location', `${selected.location} (${selected.distance}mi)`],['🔢', 'Mileage', `${selected.mileage.toLocaleString()} mi`],['⛽', 'MPG', selected.mpg],['🏪', 'Source', selected.source]].map(([icon, label, val]) => (
                    <div key={label as string} style={{ background:'#0D0D0D', borderRadius:'0.5rem', padding:'0.75rem' }}>
                      <p style={{ fontSize:'0.7rem', color:'#666' }}>{icon} {label as string}</p>
                      <p style={{ fontSize:'0.9rem', fontWeight:600, marginTop:'0.25rem' }}>{val as string}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                  <button style={{ background:'#E63946', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'1rem' }}>Contact Seller</button>
                  <button style={{ background:'rgba(230,57,70,0.08)', border:'1px solid rgba(230,57,70,0.25)', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:600, color:'#E63946' }}>+ Save to My Garage</button>
                  <button style={{ background:'transparent', color:'#aaa', border:'1px solid #2a2a3e', padding:'0.75rem', borderRadius:'0.75rem' }}>Get Financing Estimate</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          <p style={{ color:'#666', fontSize:'0.875rem', marginBottom:'1rem' }}>{listings.length} vehicles found</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
            {listings.map(l => (
              <div key={l.id} onClick={() => setSelectedId(l.id)} style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'1rem', overflow:'hidden', cursor:'pointer', transition:'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor='#E63946')}
                onMouseLeave={e => (e.currentTarget.style.borderColor='#2a2a3e')}>
                <div style={{ height:'160px', background:'linear-gradient(135deg, rgba(230,57,70,0.08), rgba(244,162,97,0.04))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem', position:'relative' }}>
                  {l.img}
                  <span style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'#0D0D0D', border:'1px solid #2a2a3e', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color:'#aaa' }}>{l.source}</span>
                  {l.priceDrop && <span style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:'rgba(230,57,70,0.15)', border:'1px solid rgba(230,57,70,0.3)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color:'#E63946' }}>↓ Price Drop</span>}
                </div>
                <div style={{ padding:'1rem' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                    <div>
                      <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>{l.year} {l.make} {l.model}</h3>
                      <p style={{ color:'#666', fontSize:'0.8rem' }}>{l.trim}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontWeight:800, color:'#E63946', fontSize:'1.1rem' }}>${l.price.toLocaleString()}</p>
                      <p style={{ color:'#F4A261', fontSize:'0.75rem' }}>~${l.monthlyEstimate}/mo</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:'0.75rem', fontSize:'0.8rem', color:'#666', marginBottom:'0.75rem' }}>
                    <span>📍 {l.distance}mi away</span>
                    <span>🔢 {l.mileage.toLocaleString()}mi</span>
                    <span>⭐ {l.rating}</span>
                  </div>
                  <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                    {l.oneOwner && <span style={{ background:'rgba(34,197,94,0.08)', color:'#22c55e', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.15)' }}>1 Owner</span>}
                    {l.noAccidents && <span style={{ background:'rgba(34,197,94,0.08)', color:'#22c55e', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.15)' }}>Clean Title</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
