'use client'

import { useState } from 'react'

const WASHES = [
  { id:'1', name:'Tidal Wave Auto Spa', type:'tunnel_touchless', city:'Dallas', state:'TX', dist:2.1, price:'$$', ceramic:true, ppf:true, touchless:true, membership:true, rating:4.8, reviews:342, hours:'7am-9pm', phone:'(214) 555-0101' },
  { id:'2', name:'Zips Car Wash', type:'tunnel_soft', city:'Dallas', state:'TX', dist:3.4, price:'$', ceramic:false, ppf:false, touchless:false, membership:true, rating:4.2, reviews:187, hours:'6am-10pm', phone:'(214) 555-0102' },
  { id:'3', name:'Detail Kings Dallas', type:'hand_wash', city:'Dallas', state:'TX', dist:5.8, price:'$$$', ceramic:true, ppf:true, touchless:true, membership:false, rating:5.0, reviews:96, hours:'8am-6pm', phone:'(214) 555-0103' },
  { id:'4', name:'Tommy\'s Express', type:'tunnel_hybrid', city:'Plano', state:'TX', dist:7.2, price:'$$', ceramic:true, ppf:false, touchless:false, membership:true, rating:4.6, reviews:231, hours:'7am-10pm', phone:'(972) 555-0104' },
  { id:'5', name:'Splash Mobile Detailing', type:'mobile_detailer', city:'Dallas', state:'TX', dist:0, price:'$$$', ceramic:true, ppf:true, touchless:true, membership:false, rating:4.9, reviews:64, hours:'By appt', phone:'(214) 555-0105' },
]

const TYPE_LABELS: Record<string,string> = { tunnel_touchless:'Touchless', tunnel_soft:'Soft Touch', tunnel_hybrid:'Hybrid Tunnel', hand_wash:'Hand Wash', mobile_detailer:'Mobile Detailer', full_detail:'Full Detail' }
const PRICE_COLORS: Record<string,string> = { '$':'#22c55e', '$$':'#FFD700', '$$$':'#FF4500', '$$$$':'#a855f7' }

export default function CarWashPage() {
  const [filterType, setFilterType] = useState('All')
  const [ceramicOnly, setCeramicOnly] = useState(false)
  const [selected, setSelected] = useState<typeof WASHES[0] | null>(null)

  const filtered = WASHES.filter(w => {
    if (filterType !== 'All' && w.type !== filterType) return false
    if (ceramicOnly && !w.ceramic) return false
    return true
  })

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🚿 Car Wash Locator</h1>
        <p style={{ color:'#666', marginTop:'0.25rem' }}>Find coating-safe washes — ceramic, PPF, and vinyl wrap safe flagged by community</p>
      </div>

      <div style={{ background:'rgba(244,162,97,0.08)', border:'1px solid rgba(244,162,97,0.2)', borderRadius:'0.75rem', padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', gap:'0.75rem' }}>
        <span style={{ color:'#FFD700', fontSize:'1.1rem' }}>⚠️</span>
        <div>
          <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#FFD700' }}>Coating protection active</p>
          <p style={{ fontSize:'0.8rem', color:'#666' }}>Incompatible wash types flagged. Add your vehicle&apos;s coating type in Garage settings.</p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1rem', alignItems:'center' }}>
        {['All','tunnel_touchless','tunnel_soft','hand_wash','mobile_detailer','full_detail'].map(t => (
          <button key={t} onClick={() => setFilterType(t)} style={{ padding:'0.375rem 0.75rem', borderRadius:'9999px', border:`1px solid ${filterType===t ? '#FF4500' : '#1A3A6B'}`, background: filterType===t ? 'rgba(255,69,0,0.1)' : 'transparent', color: filterType===t ? '#FF4500' : '#aaa', fontSize:'0.8rem', cursor:'pointer' }}>
            {t === 'All' ? 'All Types' : TYPE_LABELS[t]}
          </button>
        ))}
        <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginLeft:'auto', cursor:'pointer', fontSize:'0.8rem', color: ceramicOnly ? '#3b82f6' : '#aaa' }}>
          <input type="checkbox" checked={ceramicOnly} onChange={e => setCeramicOnly(e.target.checked)} style={{ accentColor:'#3b82f6' }} />
          Ceramic Safe Only
        </label>
      </div>

      {/* Map */}
      <div style={{ background:'#071428', border:'1px solid #1A3A6B', borderRadius:'1rem', height:'180px', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem' }}>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>🗺️</p>
          <button style={{ background:'transparent', border:'1px solid #FF4500', color:'#FF4500', padding:'0.4rem 1rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Enable Location for Map View</button>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr 1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.25rem' }}>
        <div style={{ display:'grid', gridTemplateColumns: selected ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
          {filtered.map(w => (
            <div key={w.id} onClick={() => setSelected(w)} style={{ background:'#071428', border:`1px solid ${selected?.id === w.id ? '#FF4500' : '#1A3A6B'}`, borderRadius:'1rem', padding:'1rem', cursor:'pointer' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>{w.name}</h3>
                <span style={{ fontWeight:700, color: PRICE_COLORS[w.price] ?? '#aaa' }}>{w.price}</span>
              </div>
              <p style={{ fontSize:'0.8rem', color:'#666', marginBottom:'0.5rem' }}>📍 {w.city}, {w.state}{w.dist > 0 ? ` · ${w.dist}mi away` : ' · Comes to you'} · {TYPE_LABELS[w.type]}</p>
              <p style={{ fontSize:'0.8rem', color:'#FFD700', marginBottom:'0.625rem' }}>⭐ {w.rating} ({w.reviews} reviews) · {w.hours}</p>
              <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                {w.ceramic && <span style={{ background:'rgba(59,130,246,0.1)', color:'#3b82f6', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(59,130,246,0.2)' }}>Ceramic Safe</span>}
                {w.ppf && <span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(168,85,247,0.2)' }}>PPF Safe</span>}
                {w.touchless && <span style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.2)' }}>Touchless</span>}
                {w.membership && <span style={{ background:'rgba(244,162,97,0.1)', color:'#FFD700', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(244,162,97,0.2)' }}>Membership</span>}
              </div>
            </div>
          ))}
        </div>

        {selected && (
          <div style={{ background:'#071428', border:'1px solid #FF4500', borderRadius:'1rem', padding:'1.5rem', height:'fit-content' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <h2 style={{ fontWeight:800, fontSize:'1.1rem' }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'#555', fontSize:'1.25rem', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <p style={{ color:'#666', fontSize:'0.875rem', marginBottom:'0.25rem' }}>📍 {selected.city}, {selected.state}</p>
            <p style={{ color:'#666', fontSize:'0.875rem', marginBottom:'0.25rem' }}>🕐 {selected.hours}</p>
            <p style={{ color:'#666', fontSize:'0.875rem', marginBottom:'1rem' }}>📞 {selected.phone}</p>
            <div style={{ background:'#0D0D0D', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem' }}>
              <p style={{ fontSize:'0.75rem', color:'#666', marginBottom:'0.5rem' }}>Coating compatibility</p>
              {[['Ceramic Coating', selected.ceramic],['PPF', selected.ppf],['Vinyl Wrap', selected.ppf],['Wax/Sealant', true]].map(([label, safe]) => (
                <div key={label as string} style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.25rem' }}>
                  <span style={{ fontSize:'0.8rem', color:'#aaa' }}>{label as string}</span>
                  <span style={{ fontSize:'0.8rem', color: safe ? '#22c55e' : '#FF4500', fontWeight:600 }}>{safe ? '✓ Safe' : '✗ Risk'}</span>
                </div>
              ))}
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
              <button style={{ background:'#FF4500', color:'white', border:'none', padding:'0.75rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>Get Directions</button>
              <button style={{ background:'transparent', border:'1px solid #1A3A6B', color:'#aaa', padding:'0.625rem', borderRadius:'0.75rem', cursor:'pointer' }}>Report Damage Issue</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
