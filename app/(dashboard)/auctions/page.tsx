'use client'

import { useState, useMemo } from 'react'

const ALL_AUCTIONS = [
  { id:'1', title:'2020 Toyota Supra GR Premium', source:'Bring a Trailer', year:2020, make:'Toyota', model:'Supra', trim:'GR Premium', mileage:14200, current_bid:52500, reserve_met:true, ends_at:'2026-06-12T18:00:00', img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80', buyer_premium:5, location:'California', type:'collector', condition:'Excellent' },
  { id:'2', title:'2021 Ford Mustang Shelby GT500', source:'Cars & Bids', year:2021, make:'Ford', model:'Mustang', trim:'Shelby GT500', mileage:3400, current_bid:89000, reserve_met:false, ends_at:'2026-06-14T20:00:00', img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80', buyer_premium:4.5, location:'Texas', type:'collector', condition:'Like New' },
  { id:'3', title:'2018 BMW M3 Competition', source:'Copart', year:2018, make:'BMW', model:'M3', trim:'Competition', mileage:38200, current_bid:28500, reserve_met:true, ends_at:'2026-06-10T14:00:00', img:'https://images.unsplash.com/photo-1580274455152-f4af44f89116?w=500&q=80', buyer_premium:12, location:'Georgia', type:'public', condition:'Good' },
  { id:'4', title:'2019 Porsche 911 Carrera', source:'eBay Motors', year:2019, make:'Porsche', model:'911', trim:'Carrera', mileage:8900, current_bid:105000, reserve_met:true, ends_at:'2026-06-16T21:00:00', img:'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500&q=80', buyer_premium:0, location:'Florida', type:'online', condition:'Excellent' },
  { id:'5', title:'2022 Subaru WRX Stage 2', source:'Mecum', year:2022, make:'Subaru', model:'WRX', trim:'Base', mileage:22000, current_bid:38000, reserve_met:null, ends_at:'2026-06-22T12:00:00', img:'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=500&q=80', buyer_premium:10, location:'Illinois', type:'collector', condition:'Modified' },
  { id:'6', title:'1969 Chevrolet Camaro Z/28', source:'Barrett-Jackson', year:1969, make:'Chevrolet', model:'Camaro', trim:'Z/28', mileage:87400, current_bid:72000, reserve_met:true, ends_at:'2026-06-18T16:00:00', img:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80', buyer_premium:10, location:'Arizona', type:'collector', condition:'Restored' },
  { id:'7', title:'2015 Dodge Challenger Hellcat', source:'Copart', year:2015, make:'Dodge', model:'Challenger', trim:'SRT Hellcat', mileage:44100, current_bid:31000, reserve_met:true, ends_at:'2026-06-11T10:00:00', img:'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=500&q=80', buyer_premium:12, location:'Nevada', type:'public', condition:'Good' },
  { id:'8', title:'2023 BMW M4 Competition xDrive', source:'Cars & Bids', year:2023, make:'BMW', model:'M4', trim:'Competition xDrive', mileage:2100, current_bid:78000, reserve_met:false, ends_at:'2026-06-19T19:00:00', img:'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=500&q=80', buyer_premium:4.5, location:'New York', type:'online', condition:'Like New' },
]

const MAKES = ['All Makes','Toyota','Ford','BMW','Porsche','Subaru','Chevrolet','Dodge','Nissan','Honda','Lexus']
const SOURCES = ['All Sources','Bring a Trailer','Cars & Bids','Copart','eBay Motors','Mecum','Barrett-Jackson','Hagerty']
const TYPES = ['All','collector','public','online','dealer']
const TYPES_LABEL: Record<string,string> = { collector:'Collector', public:'Public', online:'Online', dealer:'Dealer' }
const SOURCE_COLORS: Record<string,string> = { 'Bring a Trailer':'#E63946','Cars & Bids':'#F4A261','Copart':'#3399FF','eBay Motors':'#a855f7','Mecum':'#22c55e','Barrett-Jackson':'#FFD700','Hagerty':'#CC0000' }

function timeLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return 'Ended'
  const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000)
  return d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}

export default function AuctionsPage() {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({ type:'All', make:'All Makes', source:'All Sources', priceMin:'', priceMax:'', yearMin:'', yearMax:'', reserveMet:'any' })
  const [sortBy, setSortBy] = useState('ends-soon')
  const [selected, setSelected] = useState<typeof ALL_AUCTIONS[0] | null>(null)
  const [bidInput, setBidInput] = useState('')
  const setF = (k: string, v: string) => setFilters(f => ({ ...f, [k]: v }))

  const filtered = useMemo(() => {
    let results = ALL_AUCTIONS
    if (search.trim()) {
      const q = search.toLowerCase()
      results = results.filter(a => a.title.toLowerCase().includes(q) || a.make.toLowerCase().includes(q) || a.model.toLowerCase().includes(q) || a.source.toLowerCase().includes(q) || a.location.toLowerCase().includes(q))
    }
    if (filters.type !== 'All') results = results.filter(a => a.type === filters.type)
    if (filters.make !== 'All Makes') results = results.filter(a => a.make === filters.make)
    if (filters.source !== 'All Sources') results = results.filter(a => a.source === filters.source)
    if (filters.priceMin) results = results.filter(a => a.current_bid >= parseInt(filters.priceMin))
    if (filters.priceMax) results = results.filter(a => a.current_bid <= parseInt(filters.priceMax))
    if (filters.yearMin) results = results.filter(a => a.year >= parseInt(filters.yearMin))
    if (filters.yearMax) results = results.filter(a => a.year <= parseInt(filters.yearMax))
    if (filters.reserveMet === 'met') results = results.filter(a => a.reserve_met === true)
    if (filters.reserveMet === 'not-met') results = results.filter(a => a.reserve_met === false)

    return [...results].sort((a,b) => {
      if (sortBy === 'ends-soon') return new Date(a.ends_at).getTime() - new Date(b.ends_at).getTime()
      if (sortBy === 'bid-low') return a.current_bid - b.current_bid
      if (sortBy === 'bid-high') return b.current_bid - a.current_bid
      return 0
    })
  }, [search, filters, sortBy])

  const inp: React.CSSProperties = { background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', color:'white', fontSize:'0.8rem', outline:'none' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🏁 Auction Discovery</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Every collector, public & online auction — with buyer premium calculator</p>
      </div>

      {/* Search + filters */}
      <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.25rem', marginBottom:'1.25rem' }}>
        {/* Search bar */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.625rem 1rem' }}>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search make, model, auction house, location… (e.g. "Mustang", "Copart", "California")' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem', lineHeight:1 }}>×</button>}
          </div>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ ...inp, padding:'0.625rem 0.875rem', cursor:'pointer' }}>
            <option value="ends-soon">Ending Soon</option>
            <option value="bid-low">Bid: Low → High</option>
            <option value="bid-high">Bid: High → Low</option>
          </select>
        </div>

        {/* Filter row */}
        <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap', alignItems:'flex-end' }}>
          {/* Type */}
          <div style={{ display:'flex', gap:'0.375rem' }}>
            {TYPES.map(t => (
              <button key={t} onClick={() => setF('type', t)} style={{ padding:'0.3rem 0.75rem', borderRadius:'9999px', border:`1px solid ${filters.type===t ? '#CC0000':'rgba(255,255,255,0.1)'}`, background: filters.type===t ? 'rgba(204,0,0,0.1)':'transparent', color: filters.type===t ? '#CC0000':'rgba(255,255,255,0.4)', fontSize:'0.75rem', cursor:'pointer', fontWeight: filters.type===t ? 700:400 }}>
                {t === 'All' ? 'All Types' : TYPES_LABEL[t]}
              </button>
            ))}
          </div>

          <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginLeft:'auto' }}>
            <select value={filters.make} onChange={e => setF('make', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {MAKES.map(m => <option key={m}>{m}</option>)}
            </select>
            <select value={filters.source} onChange={e => setF('source', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              {SOURCES.map(s => <option key={s}>{s}</option>)}
            </select>
            <input value={filters.priceMin} onChange={e => setF('priceMin', e.target.value)} placeholder="Min $" style={{ ...inp, width:'90px' }} />
            <input value={filters.priceMax} onChange={e => setF('priceMax', e.target.value)} placeholder="Max $" style={{ ...inp, width:'90px' }} />
            <input value={filters.yearMin} onChange={e => setF('yearMin', e.target.value)} placeholder="Yr min" style={{ ...inp, width:'80px' }} />
            <input value={filters.yearMax} onChange={e => setF('yearMax', e.target.value)} placeholder="Yr max" style={{ ...inp, width:'80px' }} />
            <select value={filters.reserveMet} onChange={e => setF('reserveMet', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="any">Any Reserve</option>
              <option value="met">Reserve Met</option>
              <option value="not-met">Reserve Not Met</option>
            </select>
            <button onClick={() => { setFilters({ type:'All', make:'All Makes', source:'All Sources', priceMin:'', priceMax:'', yearMin:'', yearMax:'', reserveMet:'any' }); setSearch('') }} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', padding:'0.5rem 0.875rem', borderRadius:'0.625rem', fontSize:'0.75rem', cursor:'pointer' }}>Clear</button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginBottom:'1rem' }}>
        {filtered.length} auction{filtered.length !== 1 ? 's' : ''} {search ? `for "${search}"` : 'found'}
      </p>

      {/* Detail panel */}
      {selected && (
        <div style={{ background:'#243547', border:'1px solid rgba(204,0,0,0.25)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.25rem', display:'grid', gridTemplateColumns:'300px 1fr', gap:'1.5rem' }}>
          <div>
            <img src={selected.img} alt={selected.title} style={{ width:'100%', borderRadius:'0.75rem', marginBottom:'0.75rem' }} />
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
              {selected.reserve_met === true && <span style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.2)' }}>✓ Reserve Met</span>}
              {selected.reserve_met === false && <span style={{ background:'rgba(204,0,0,0.1)', color:'#E63946', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem' }}>Reserve Not Met</span>}
              <span style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem' }}>{selected.condition}</span>
            </div>
          </div>
          <div>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.75rem' }}>
              <div>
                <span style={{ background:`${SOURCE_COLORS[selected.source]??'#888'}20`, color:SOURCE_COLORS[selected.source]??'#aaa', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:700, border:`1px solid ${SOURCE_COLORS[selected.source]??'#888'}30` }}>{selected.source}</span>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'1.25rem' }}>×</button>
            </div>
            <h2 style={{ fontWeight:800, fontSize:'1.2rem', marginBottom:'0.25rem' }}>{selected.title}</h2>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem', marginBottom:'1rem' }}>📍 {selected.location} · {selected.mileage.toLocaleString()} mi · ⏱ {timeLeft(selected.ends_at)} left</p>

            {/* Bid calculator */}
            <div style={{ background:'#0D1E30', borderRadius:'0.875rem', padding:'1.25rem', marginBottom:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>Buyer Premium Calculator</p>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>Current Bid</span>
                <span style={{ fontWeight:700, color:'#CC0000' }}>${selected.current_bid.toLocaleString()}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.4rem' }}>
                <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>Buyer Premium ({selected.buyer_premium}%)</span>
                <span style={{ color:'rgba(255,255,255,0.5)' }}>${Math.round(selected.current_bid * selected.buyer_premium / 100).toLocaleString()}</span>
              </div>
              <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', margin:'0.625rem 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontWeight:700 }}>All-In Estimate</span>
                <span style={{ fontWeight:900, color:'#22c55e', fontSize:'1.1rem' }}>${Math.round(selected.current_bid * (1 + selected.buyer_premium/100)).toLocaleString()}</span>
              </div>

              {bidInput && (
                <div style={{ marginTop:'0.625rem', paddingTop:'0.625rem', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display:'flex', justifyContent:'space-between' }}>
                    <span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>Your max bid all-in</span>
                    <span style={{ fontWeight:700, color:'#FFD700' }}>${Math.round(parseInt(bidInput||'0') * (1 + selected.buyer_premium/100)).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:'0.625rem', marginBottom:'0.75rem' }}>
              <input value={bidInput} onChange={e => setBidInput(e.target.value)} placeholder="Enter your max bid" type="number" style={{ flex:1, background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }} />
            </div>
            <div style={{ display:'flex', gap:'0.625rem' }}>
              <a href={selected.source === 'Copart' ? 'https://www.copart.com' : selected.source === 'eBay Motors' ? 'https://www.ebay.com/motors' : '#'} target="_blank" rel="noopener" style={{ flex:1, background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>View on {selected.source} →</a>
              <button onClick={() => setSelected(null)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.5)', padding:'0.75rem 1rem', borderRadius:'0.75rem', cursor:'pointer', fontSize:'0.8rem' }}>♡ Watch</button>
            </div>
          </div>
        </div>
      )}

      {/* Auction grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', background:'#243547', borderRadius:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🔍</p>
          <p style={{ color:'rgba(255,255,255,0.4)' }}>No auctions match your search. Try adjusting your filters.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(330px, 1fr))', gap:'1.125rem' }}>
          {filtered.map(a => {
            const srcColor = SOURCE_COLORS[a.source] ?? '#aaa'
            const allIn = Math.round(a.current_bid * (1 + a.buyer_premium/100))
            const tl = timeLeft(a.ends_at)
            const urgent = tl.includes('h') && !tl.includes('d')
            return (
              <div key={a.id} onClick={() => { setSelected(a); setBidInput('') }} style={{ background:'#243547', border:`1px solid ${selected?.id === a.id ? '#CC0000':'rgba(255,255,255,0.07)'}`, borderRadius:'1rem', overflow:'hidden', cursor:'pointer', transition:'all 0.15s' }}>
                <div style={{ height:'160px', position:'relative', overflow:'hidden' }}>
                  <img src={a.img} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 40%, rgba(36,53,71,0.95) 100%)' }} />
                  <span style={{ position:'absolute', top:'0.625rem', left:'0.625rem', background:`${srcColor}22`, border:`1px solid ${srcColor}44`, color:srcColor, padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:700 }}>{a.source}</span>
                  <span style={{ position:'absolute', top:'0.625rem', right:'0.625rem', background: urgent ? 'rgba(204,0,0,0.85)':'rgba(13,30,48,0.85)', color: urgent ? 'white':'rgba(255,255,255,0.7)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight: urgent ? 700:400 }}>⏱ {tl}</span>
                </div>
                <div style={{ padding:'1rem' }}>
                  <h3 style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.25rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{a.title}</h3>
                  <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.75rem' }}>📍 {a.location} · {a.mileage.toLocaleString()} mi</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div>
                      <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>Current Bid</p>
                      <p style={{ fontWeight:900, color:'#CC0000', fontSize:'1.2rem' }}>${a.current_bid.toLocaleString()}</p>
                      <p style={{ fontSize:'0.7rem', color:'#FFD700' }}>All-in ~${allIn.toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {a.reserve_met === true && <span style={{ display:'block', fontSize:'0.7rem', color:'#22c55e', marginBottom:'0.25rem' }}>✓ Reserve Met</span>}
                      {a.reserve_met === false && <span style={{ display:'block', fontSize:'0.7rem', color:'#E63946', marginBottom:'0.25rem' }}>Reserve Not Met</span>}
                      <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>{a.buyer_premium}% premium</span>
                    </div>
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
