'use client'

import { useState } from 'react'

const CATEGORIES = ['Engine & Drivetrain','Suspension & Steering','Brakes','Exhaust','Electrical','Body & Exterior','Interior','Wheels & Tires','Performance & FI','Cooling','Fuel System','Transmission']

const MOCK_RESULTS = [
  { id:'1', name:'EBC Redstuff Brake Pads - Front', brand:'EBC', condition:'new_aftermarket', price:89.99, shipping:0, source:'Amazon', inStock:true, rating:4.7, reviews:312, warranty:'Lifetime', partNumber:'DP31552C', fitment:'2020-2023 Toyota Supra' },
  { id:'2', name:'EBC Redstuff Brake Pads - Front', brand:'EBC', condition:'new_aftermarket', price:94.50, shipping:0, source:'AutoZone', inStock:true, rating:4.6, reviews:89, warranty:'Lifetime', partNumber:'DP31552C', fitment:'2020-2023 Toyota Supra' },
  { id:'3', name:'EBC Redstuff Brake Pads - Front', brand:'EBC', condition:'new_aftermarket', price:79.99, shipping:9.99, source:'Summit Racing', inStock:true, rating:4.8, reviews:156, warranty:'Lifetime', partNumber:'DP31552C', fitment:'2020-2023 Toyota Supra' },
  { id:'4', name:'EBC Redstuff Brake Pads - Front', brand:'EBC', condition:'new_aftermarket', price:82.00, shipping:0, source:'RockAuto', inStock:false, rating:4.7, reviews:204, warranty:'1 Year', partNumber:'DP31552C', fitment:'2020-2023 Toyota Supra' },
]

const SOURCE_COLORS: Record<string,string> = { Amazon:'#F90', AutoZone:'#CC0000', 'Summit Racing':'#3b82f6', RockAuto:'#22c55e', JEGS:'#a855f7', NAPA:'#FFD700' }

export default function PartsPage() {
  const [query, setQuery] = useState('')
  const [searched, setSearched] = useState(false)
  const [category, setCategory] = useState('')
  const [condition, setCondition] = useState<string[]>([])
  const [results, setResults] = useState(MOCK_RESULTS)
  const [selected, setSelected] = useState<typeof MOCK_RESULTS[0] | null>(null)

  function handleSearch(e: React.FormEvent) { e.preventDefault(); setSearched(true); setSelected(null) }

  const cheapest = searched ? [...results].sort((a,b) => (a.price + a.shipping) - (b.price + b.shipping))[0] : null

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🔩 Parts Search</h1>
        <p style={{ color:'#666', marginTop:'0.25rem' }}>Price comparison across AutoZone, RockAuto, Summit, eBay, Amazon & more — fitment verified</p>
      </div>

      {/* Vehicle selector */}
      <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.75rem', padding:'0.75rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <span style={{ color:'#22c55e', fontSize:'1.1rem' }}>✓</span>
          <div>
            <p style={{ fontSize:'0.875rem', fontWeight:600 }}>Searching for: All vehicles</p>
            <p style={{ fontSize:'0.75rem', color:'#666' }}>Add your vehicle to filter by fitment</p>
          </div>
        </div>
        <button style={{ background:'transparent', border:'1px solid #1E3A6E', color:'#aaa', padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Select Vehicle</button>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} style={{ display:'flex', gap:'0.75rem', marginBottom:'1.5rem' }}>
        <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#152234', border:'1px solid #1E3A6E', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
          <span style={{ color:'#555' }}>🔍</span>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder='Search parts, part numbers, brands… (e.g. "EBC brake pads", "K&N air filter")' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }} />
        </div>
        <button type="submit" style={{ background:'#CC0000', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.875rem', fontWeight:700 }}>Search</button>
      </form>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'1.5rem' }}>
        {/* Filters */}
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'0.875rem', padding:'1rem' }}>
            <h3 style={{ fontSize:'0.875rem', fontWeight:700, marginBottom:'0.75rem' }}>Category</h3>
            {CATEGORIES.map(c => (
              <label key={c} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', marginBottom:'0.5rem' }}>
                <input type="checkbox" style={{ accentColor:'#CC0000' }} />
                <span style={{ fontSize:'0.8rem', color:'#aaa' }}>{c}</span>
              </label>
            ))}
          </div>
          <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'0.875rem', padding:'1rem' }}>
            <h3 style={{ fontSize:'0.875rem', fontWeight:700, marginBottom:'0.75rem' }}>Condition</h3>
            {['New OEM','New Aftermarket','Remanufactured','Used','Performance'].map(c => (
              <label key={c} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', marginBottom:'0.5rem' }}>
                <input type="checkbox" style={{ accentColor:'#CC0000' }} />
                <span style={{ fontSize:'0.8rem', color:'#aaa' }}>{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results */}
        <div>
          {!searched ? (
            <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
              <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔩</p>
              <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Search for any part</h2>
              <p style={{ color:'#666' }}>We compare prices from 15+ retailers simultaneously.</p>
            </div>
          ) : selected ? (
            <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'1.5rem' }}>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'1px solid #1E3A6E', color:'#aaa', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', marginBottom:'1rem', fontSize:'0.8rem', cursor:'pointer' }}>← Back</button>
              <h2 style={{ fontWeight:700, marginBottom:'0.25rem' }}>{selected.name}</h2>
              <p style={{ color:'#666', fontSize:'0.875rem', marginBottom:'1rem' }}>Part #: {selected.partNumber} · Fits: {selected.fitment}</p>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', marginBottom:'1rem' }}>
                <div style={{ background:'#0D0D0D', borderRadius:'0.75rem', padding:'1rem' }}>
                  <p style={{ fontSize:'2rem', fontWeight:900, color:'#CC0000' }}>${selected.price.toFixed(2)}</p>
                  <p style={{ color:'#666', fontSize:'0.8rem' }}>+ ${selected.shipping.toFixed(2)} shipping</p>
                  <p style={{ fontWeight:700, color:'#22c55e', marginTop:'0.25rem' }}>Total: ${(selected.price + selected.shipping).toFixed(2)}</p>
                  <p style={{ color:'#aaa', fontSize:'0.8rem', marginTop:'0.5rem' }}>From {selected.source}</p>
                </div>
                <div style={{ background:'#0D0D0D', borderRadius:'0.75rem', padding:'1rem' }}>
                  <p style={{ fontSize:'0.75rem', color:'#666', marginBottom:'0.25rem' }}>Community Rating</p>
                  <p style={{ fontSize:'1.5rem', fontWeight:800 }}>⭐ {selected.rating}</p>
                  <p style={{ color:'#666', fontSize:'0.8rem' }}>{selected.reviews} reviews</p>
                  <p style={{ color:'#aaa', fontSize:'0.8rem', marginTop:'0.5rem' }}>Warranty: {selected.warranty}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:'0.75rem' }}>
                <a href="#" style={{ flex:1, background:'#CC0000', color:'white', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', fontSize:'0.9rem' }}>Buy on {selected.source} →</a>
                <button style={{ background:'#152234', border:'1px solid #1E3A6E', color:'white', padding:'0.875rem 1.25rem', borderRadius:'0.75rem', cursor:'pointer' }}>+ Build List</button>
                <button style={{ background:'#152234', border:'1px solid #1E3A6E', color:'white', padding:'0.875rem 1.25rem', borderRadius:'0.75rem', cursor:'pointer' }}>♡ Save</button>
              </div>
            </div>
          ) : (
            <div>
              {cheapest && (
                <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.875rem', padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ color:'#22c55e', fontSize:'1.25rem' }}>🏆</span>
                  <div>
                    <p style={{ fontSize:'0.875rem', fontWeight:700 }}>Best Value: {cheapest.source} — ${(cheapest.price + cheapest.shipping).toFixed(2)} shipped</p>
                    <p style={{ fontSize:'0.75rem', color:'#666' }}>Lowest total landed cost across all sources</p>
                  </div>
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {results.map(r => (
                  <div key={r.id} onClick={() => setSelected(r)} style={{ background:'#152234', border:`1px solid ${(r.price + r.shipping) === Math.min(...results.map(x => x.price + x.shipping)) ? 'rgba(34,197,94,0.3)' : '#1E3A6E'}`, borderRadius:'0.875rem', padding:'1rem', cursor:'pointer', display:'flex', alignItems:'center', gap:'1rem' }}>
                    <div style={{ width:'40px', height:'40px', background:`${SOURCE_COLORS[r.source] ?? '#555'}20`, border:`1px solid ${SOURCE_COLORS[r.source] ?? '#555'}30`, borderRadius:'0.5rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.65rem', fontWeight:700, color: SOURCE_COLORS[r.source] ?? '#aaa', textAlign:'center', flexShrink:0 }}>
                      {r.source.split(' ')[0]}
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontWeight:600, fontSize:'0.9rem' }}>{r.name}</p>
                      <p style={{ fontSize:'0.75rem', color:'#666' }}>⭐ {r.rating} ({r.reviews}) · {r.warranty} warranty · {r.inStock ? '✓ In Stock' : '⚠ Backorder'}</p>
                    </div>
                    <div style={{ textAlign:'right', flexShrink:0 }}>
                      <p style={{ fontWeight:800, color:'#CC0000', fontSize:'1.1rem' }}>${r.price.toFixed(2)}</p>
                      <p style={{ fontSize:'0.75rem', color:'#666' }}>+ ${r.shipping.toFixed(2)} ship</p>
                      <p style={{ fontSize:'0.8rem', fontWeight:700, color:'#22c55e' }}>${(r.price + r.shipping).toFixed(2)} total</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
