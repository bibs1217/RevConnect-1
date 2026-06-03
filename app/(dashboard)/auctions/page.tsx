'use client'

import { useState } from 'react'

const AUCTIONS = [
  { id:'1', title:'2020 Toyota Supra GR — Clean Title', source:'Bring a Trailer', year:2020, make:'Toyota', model:'Supra', trim:'GR Premium', mileage:14200, current_bid:52500, reserve_met:true, ends_at:'2026-06-10T18:00:00', img:'🏎️', buyer_premium:5, location:'California', type:'collector' },
  { id:'2', title:'2021 Ford Mustang Shelby GT500', source:'Cars & Bids', year:2021, make:'Ford', model:'Mustang', trim:'Shelby GT500', mileage:3400, current_bid:89000, reserve_met:false, ends_at:'2026-06-12T20:00:00', img:'🐎', buyer_premium:4.5, location:'Texas', type:'collector' },
  { id:'3', title:'2018 BMW M3 Competition', source:'Copart', year:2018, make:'BMW', model:'M3', trim:'Competition', mileage:38200, current_bid:28500, reserve_met:true, ends_at:'2026-06-09T14:00:00', img:'🚗', buyer_premium:12, location:'Georgia', type:'public' },
  { id:'4', title:'2019 Porsche 911 Carrera — Low Miles', source:'eBay Motors', year:2019, make:'Porsche', model:'911', trim:'Carrera', mileage:8900, current_bid:105000, reserve_met:true, ends_at:'2026-06-14T21:00:00', img:'🏁', buyer_premium:0, location:'Florida', type:'online' },
  { id:'5', title:'2022 Subaru WRX — Stage 2 Built', source:'Mecum', year:2022, make:'Subaru', model:'WRX', trim:'Base', mileage:22000, current_bid:38000, reserve_met:null, ends_at:'2026-06-20T12:00:00', img:'🚙', buyer_premium:10, location:'Illinois', type:'collector' },
]

const SOURCE_COLORS: Record<string,string> = { 'Bring a Trailer':'#E63946','Cars & Bids':'#FACC15','Copart':'#3b82f6','eBay Motors':'#a855f7','Mecum':'#22c55e' }

function timeLeft(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  if (diff < 0) return 'Ended'
  const d = Math.floor(diff / 86400000), h = Math.floor((diff % 86400000) / 3600000), m = Math.floor((diff % 3600000) / 60000)
  return d > 0 ? `${d}d ${h}h left` : h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export default function AuctionsPage() {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<typeof AUCTIONS[0] | null>(null)
  const [bidAmount, setBidAmount] = useState('')

  const filtered = filter === 'All' ? AUCTIONS : AUCTIONS.filter(a => a.type === filter)

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🏁 Auction Discovery</h1>
        <p style={{ color:'#666', marginTop:'0.25rem' }}>Every collector, public, and online auction — with buyer premium calculator</p>
      </div>

      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {['All','collector','public','online','dealer'].map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:`1px solid ${filter===t ? '#E63946' : '#1E3A5F'}`, background: filter===t ? 'rgba(230,57,70,0.1)' : 'transparent', color: filter===t ? '#E63946' : '#aaa', fontSize:'0.8rem', cursor:'pointer', textTransform:'capitalize' }}>
            {t === 'All' ? 'All Types' : `${t.charAt(0).toUpperCase()}${t.slice(1)}`}
          </button>
        ))}

        {/* Source pills */}
        <div style={{ marginLeft:'auto', display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
          {Object.entries(SOURCE_COLORS).map(([s,c]) => (
            <span key={s} style={{ background:`${c}15`, border:`1px solid ${c}30`, color:c, padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem' }}>{s}</span>
          ))}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 380px' : 'repeat(auto-fill, minmax(340px, 1fr))', gap:'1.25rem' }}>
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap:'1rem' }}>
          {filtered.map(a => {
            const srcColor = SOURCE_COLORS[a.source] ?? '#aaa'
            const allIn = a.current_bid * (1 + a.buyer_premium / 100)
            return (
              <div key={a.id} onClick={() => setSelected(a)} style={{ background:'#0D1B2A', border:`1px solid ${selected?.id===a.id ? '#E63946' : '#1E3A5F'}`, borderRadius:'1rem', overflow:'hidden', cursor:'pointer' }}>
                <div style={{ height:'140px', background:'linear-gradient(135deg, rgba(230,57,70,0.08), transparent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem', position:'relative' }}>
                  {a.img}
                  <span style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:`${srcColor}20`, border:`1px solid ${srcColor}40`, color:srcColor, padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:600 }}>{a.source}</span>
                  <span style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'rgba(0,0,0,0.6)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', color: timeLeft(a.ends_at).includes('h') || timeLeft(a.ends_at).includes('m') ? '#E63946' : '#FACC15' }}>{timeLeft(a.ends_at)}</span>
                </div>
                <div style={{ padding:'1rem' }}>
                  <h3 style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.375rem' }}>{a.title}</h3>
                  <p style={{ color:'#666', fontSize:'0.75rem', marginBottom:'0.625rem' }}>📍 {a.location} · {a.mileage.toLocaleString()} mi</p>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                    <div>
                      <p style={{ fontSize:'0.7rem', color:'#666' }}>Current Bid</p>
                      <p style={{ fontWeight:900, color:'#E63946', fontSize:'1.25rem' }}>${a.current_bid.toLocaleString()}</p>
                      <p style={{ fontSize:'0.75rem', color:'#FACC15' }}>All-in: ~${Math.round(allIn).toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      {a.reserve_met === true && <span style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.2)' }}>Reserve Met</span>}
                      {a.reserve_met === false && <span style={{ background:'rgba(230,57,70,0.1)', color:'#E63946', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(230,57,70,0.2)' }}>No Reserve</span>}
                      {a.reserve_met === null && <span style={{ background:'rgba(244,162,97,0.1)', color:'#FACC15', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(244,162,97,0.2)' }}>Reserve?</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {selected && (
          <div style={{ background:'#0D1B2A', border:'1px solid #E63946', borderRadius:'1rem', padding:'1.5rem', height:'fit-content', position:'sticky', top:'5rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
              <h2 style={{ fontWeight:800, fontSize:'1rem' }}>Bid Calculator</h2>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'#555', fontSize:'1.25rem', cursor:'pointer' }}>×</button>
            </div>
            <h3 style={{ fontWeight:700, fontSize:'0.875rem', marginBottom:'0.25rem' }}>{selected.year} {selected.make} {selected.model}</h3>
            <p style={{ color:'#666', fontSize:'0.8rem', marginBottom:'1.25rem' }}>{selected.source}</p>

            <div style={{ background:'#0D0D0D', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.8rem', color:'#aaa' }}>Current Bid</span>
                <span style={{ fontWeight:700, color:'#E63946' }}>${selected.current_bid.toLocaleString()}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <span style={{ fontSize:'0.8rem', color:'#aaa' }}>Buyer Premium ({selected.buyer_premium}%)</span>
                <span style={{ fontWeight:600, color:'#aaa' }}>${Math.round(selected.current_bid * selected.buyer_premium / 100).toLocaleString()}</span>
              </div>
              <div style={{ height:'1px', background:'#1E3A5F', margin:'0.5rem 0' }} />
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:'0.875rem', fontWeight:700 }}>All-In Cost</span>
                <span style={{ fontWeight:800, color:'#22c55e', fontSize:'1.1rem' }}>${Math.round(selected.current_bid * (1 + selected.buyer_premium / 100)).toLocaleString()}</span>
              </div>
            </div>

            <div style={{ marginBottom:'1rem' }}>
              <label style={{ display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }}>What would you bid?</label>
              <input value={bidAmount} onChange={e => setBidAmount(e.target.value)} placeholder="Enter your max bid" type="number" style={{ width:'100%', background:'#0D0D0D', border:'1px solid #1E3A5F', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.9rem', outline:'none' }} />
              {bidAmount && (
                <p style={{ fontSize:'0.8rem', color:'#FACC15', marginTop:'0.375rem' }}>
                  Your all-in cost: ${Math.round(parseInt(bidAmount) * (1 + selected.buyer_premium / 100)).toLocaleString()}
                </p>
              )}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              <a href="#" style={{ background:'#E63946', color:'white', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', fontSize:'0.9rem' }}>View on {selected.source} →</a>
              <button style={{ background:'transparent', border:'1px solid #1E3A5F', color:'#aaa', padding:'0.625rem', borderRadius:'0.75rem', cursor:'pointer', fontSize:'0.8rem' }}>♡ Watch This Lot</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
