'use client'

import { useState, useMemo } from 'react'

const WASHES = [
  { id:'1', name:'Tidal Wave Auto Spa', type:'tunnel_touchless', city:'Dallas', state:'TX', dist:2.1, price:'$$', ceramic:true, ppf:true, touchless:true, lowered:true, membership:true, rating:4.8, reviews:342, hours:'7am-9pm', phone:'(214) 555-0101', website:'https://www.tidalwave.net', description:'Top-rated touchless tunnel wash. Ceramic and PPF safe. Monthly memberships available.' },
  { id:'2', name:'Zips Car Wash', type:'tunnel_soft', city:'Dallas', state:'TX', dist:3.4, price:'$', ceramic:false, ppf:false, touchless:false, lowered:false, membership:true, rating:4.2, reviews:187, hours:'6am-10pm', phone:'(214) 555-0102', website:'https://www.zips.com', description:'Fast soft-touch tunnel. Not recommended for ceramic or PPF coatings.' },
  { id:'3', name:'Detail Kings Dallas', type:'hand_wash', city:'Dallas', state:'TX', dist:5.8, price:'$$$', ceramic:true, ppf:true, touchless:true, lowered:true, membership:false, rating:5.0, reviews:96, hours:'8am-6pm', phone:'(214) 555-0103', website:'https://www.detailkings.com', description:'Full-service professional hand wash and detailing. Safe for all coatings.' },
  { id:'4', name:"Tommy's Express", type:'tunnel_hybrid', city:'Plano', state:'TX', dist:7.2, price:'$$', ceramic:true, ppf:false, touchless:false, lowered:false, membership:true, rating:4.6, reviews:231, hours:'7am-10pm', phone:'(972) 555-0104', website:'https://www.tommysexpress.com', description:'Hybrid tunnel system. Ceramic safe with spot-free rinse. Unlimited monthly plans.' },
  { id:'5', name:'Splash Mobile Detailing', type:'mobile_detailer', city:'Dallas', state:'TX', dist:0, price:'$$$', ceramic:true, ppf:true, touchless:true, lowered:true, membership:false, rating:4.9, reviews:64, hours:'By appt', phone:'(214) 555-0105', website:'', description:'Professional mobile detailer comes to you. Safe for ceramic, PPF, and vinyl wraps.' },
  { id:'6', name:'Mister Car Wash', type:'tunnel_touchless', city:'Irving', state:'TX', dist:9.1, price:'$', ceramic:false, ppf:false, touchless:true, lowered:false, membership:true, rating:4.0, reviews:412, hours:'7am-9pm', phone:'(972) 555-0106', website:'https://www.mistercarwash.com', description:'National chain touchless tunnel. Unlimited monthly membership available nationwide.' },
  { id:'7', name:'Autobell Car Wash', type:'tunnel_soft', city:'Fort Worth', state:'TX', dist:15.3, price:'$$', ceramic:false, ppf:false, touchless:false, lowered:false, membership:true, rating:4.3, reviews:203, hours:'8am-8pm', phone:'(817) 555-0107', website:'https://www.autobell.com', description:'Soft-touch tunnel with interior cleaning options. Monthly plans available.' },
  { id:'8', name:'Pro Shine Mobile', type:'mobile_detailer', city:'Frisco', state:'TX', dist:18.4, price:'$$', ceramic:true, ppf:true, touchless:true, lowered:true, membership:false, rating:4.8, reviews:51, hours:'By appt', phone:'(972) 555-0108', website:'', description:'Waterless and rinseless wash options for show cars and garaged vehicles.' },
]

const TYPE_LABELS: Record<string,string> = { tunnel_touchless:'Touchless', tunnel_soft:'Soft Touch', tunnel_hybrid:'Hybrid', hand_wash:'Hand Wash', mobile_detailer:'Mobile Detailer', full_detail:'Full Detail' }
const PRICE_COLORS: Record<string,string> = { '$':'#22c55e', '$$':'#FFD700', '$$$':'#CC0000', '$$$$':'#a855f7' }

export default function CarWashPage() {
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [ceramicOnly, setCeramicOnly] = useState(false)
  const [ppfOnly, setPpfOnly] = useState(false)
  const [membershipsOnly, setMembershipsOnly] = useState(false)
  const [loweredSafe, setLoweredSafe] = useState(false)
  const [selected, setSelected] = useState<typeof WASHES[0] | null>(null)

  const filtered = useMemo(() => {
    return WASHES.filter(w => {
      if (filterType !== 'All' && w.type !== filterType) return false
      if (ceramicOnly && !w.ceramic) return false
      if (ppfOnly && !w.ppf) return false
      if (membershipsOnly && !w.membership) return false
      if (loweredSafe && !w.lowered) return false
      if (search) {
        const q = search.toLowerCase()
        if (!w.name.toLowerCase().includes(q) && !w.city.toLowerCase().includes(q) && !w.type.toLowerCase().includes(q)) return false
      }
      return true
    }).sort((a,b) => a.dist - b.dist)
  }, [search, filterType, ceramicOnly, ppfOnly, membershipsOnly, loweredSafe])

  const inp: React.CSSProperties = { background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', color:'white', fontSize:'0.8rem', outline:'none' }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🚿 Car Wash Locator</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Find coating-safe washes — ceramic, PPF, and vinyl wrap safe flagged by community</p>
      </div>

      {/* Warning */}
      <div style={{ background:'rgba(255,215,0,0.06)', border:'1px solid rgba(255,215,0,0.15)', borderRadius:'0.875rem', padding:'0.875rem 1rem', marginBottom:'1.25rem', display:'flex', gap:'0.75rem' }}>
        <span style={{ color:'#FFD700', flexShrink:0 }}>⚠️</span>
        <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>
          <strong style={{ color:'#FFD700' }}>Soft-touch and brush tunnels can damage ceramic coatings and PPF.</strong> Always choose Touchless, Hand Wash, or Mobile Detailer if your car has any protective coating or wrap.
        </p>
      </div>

      {/* Search + filters */}
      <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1.125rem', marginBottom:'1.25rem' }}>
        {/* Search bar */}
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.625rem 1rem' }}>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search by name, city, or wash type…' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
            {search && <button onClick={() => setSearch('')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem' }}>×</button>}
          </div>
          <button onClick={() => navigator.geolocation?.getCurrentPosition(p => {}, () => {})} style={{ background:'linear-gradient(135deg, #1539CC, #0D28AA)', color:'white', border:'none', padding:'0.625rem 1.25rem', borderRadius:'0.75rem', fontWeight:600, fontSize:'0.875rem', cursor:'pointer', whiteSpace:'nowrap' }}>
            📍 Near Me
          </button>
        </div>

        {/* Type filters */}
        <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', marginBottom:'0.75rem' }}>
          {['All','tunnel_touchless','tunnel_soft','tunnel_hybrid','hand_wash','mobile_detailer','full_detail'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{ padding:'0.3rem 0.625rem', borderRadius:'9999px', border:`1px solid ${filterType===t ? '#CC0000':'rgba(255,255,255,0.1)'}`, background:filterType===t ? 'rgba(204,0,0,0.1)':'transparent', color:filterType===t ? '#CC0000':'rgba(255,255,255,0.4)', fontSize:'0.75rem', cursor:'pointer', fontWeight:filterType===t?700:400 }}>
              {t==='All' ? 'All Types' : TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        {/* Feature toggles */}
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
          {[
            [ceramicOnly, setCeramicOnly, '🔵 Ceramic Safe'],
            [ppfOnly, setPpfOnly, '🟣 PPF Safe'],
            [membershipsOnly, setMembershipsOnly, '💳 Monthly Plans'],
            [loweredSafe, setLoweredSafe, '🚗 Lowered Safe'],
          ].map(([val, setter, label]) => (
            <label key={label as string} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', fontSize:'0.8rem', color:(val as boolean) ? '#CC0000':'rgba(255,255,255,0.4)' }}>
              <input type="checkbox" checked={val as boolean} onChange={e => (setter as Function)(e.target.checked)} style={{ accentColor:'#CC0000' }} />
              {label as string}
            </label>
          ))}
          <button onClick={() => { setSearch(''); setFilterType('All'); setCeramicOnly(false); setPpfOnly(false); setMembershipsOnly(false); setLoweredSafe(false) }} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.3)', padding:'0.2rem 0.625rem', borderRadius:'0.5rem', fontSize:'0.7rem', cursor:'pointer', marginLeft:'auto' }}>Clear All</button>
        </div>
      </div>

      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginBottom:'1rem' }}>{filtered.length} wash{filtered.length!==1?'es':''} found{search ? ` matching "${search}"`:''}</p>

      {/* Detail panel */}
      {selected && (
        <div style={{ background:'#243547', border:'1px solid rgba(204,0,0,0.25)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.25rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
            <div>
              <h2 style={{ fontWeight:800, fontSize:'1.15rem' }}>{selected.name}</h2>
              <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>{TYPE_LABELS[selected.type]} · {selected.city}, {selected.state} · {selected.price}</p>
            </div>
            <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'1.25rem', cursor:'pointer' }}>×</button>
          </div>
          <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.875rem', marginBottom:'1.25rem' }}>{selected.description}</p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.625rem', marginBottom:'1.25rem' }}>
            {[
              ['⭐','Rating', `${selected.rating} (${selected.reviews} reviews)`],
              ['🕐','Hours', selected.hours],
              ['📍','Distance', selected.dist > 0 ? `${selected.dist} mi away` : 'Comes to you'],
              ['💵','Price Range', selected.price],
            ].map(([icon, label, val]) => (
              <div key={label as string} style={{ background:'#0D1E30', borderRadius:'0.625rem', padding:'0.75rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>{icon} {label as string}</p>
                <p style={{ fontWeight:600, fontSize:'0.875rem', marginTop:'0.125rem' }}>{val as string}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
            {selected.ceramic && <span style={{ background:'rgba(59,130,246,0.1)', color:'#3b82f6', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', border:'1px solid rgba(59,130,246,0.2)' }}>✓ Ceramic Safe</span>}
            {selected.ppf && <span style={{ background:'rgba(168,85,247,0.1)', color:'#a855f7', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', border:'1px solid rgba(168,85,247,0.2)' }}>✓ PPF Safe</span>}
            {selected.touchless && <span style={{ background:'rgba(34,197,94,0.1)', color:'#22c55e', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', border:'1px solid rgba(34,197,94,0.2)' }}>✓ Touchless</span>}
            {selected.lowered && <span style={{ background:'rgba(255,215,0,0.08)', color:'#FFD700', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', border:'1px solid rgba(255,215,0,0.15)' }}>✓ Lowered Safe</span>}
            {selected.membership && <span style={{ background:'rgba(204,0,0,0.1)', color:'#CC0000', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', border:'1px solid rgba(204,0,0,0.2)' }}>✓ Monthly Plans</span>}
          </div>
          <div style={{ display:'flex', gap:'0.625rem' }}>
            <a href={`tel:${selected.phone}`} style={{ flex:1, background:'rgba(51,153,255,0.1)', border:'1px solid rgba(51,153,255,0.2)', color:'#3399FF', padding:'0.75rem', borderRadius:'0.75rem', textDecoration:'none', textAlign:'center', fontWeight:600, fontSize:'0.875rem' }}>📞 {selected.phone}</a>
            {selected.website ? <a href={selected.website} target="_blank" rel="noopener" style={{ flex:1, background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.75rem', borderRadius:'0.75rem', textDecoration:'none', textAlign:'center', fontWeight:700, boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>Visit Website →</a> : <button onClick={() => setSelected(null)} style={{ flex:1, background:'#243547', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'0.75rem', borderRadius:'0.75rem', cursor:'pointer' }}>Close</button>}
          </div>
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:'3rem', background:'#243547', borderRadius:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>🚿</p>
          <p style={{ color:'rgba(255,255,255,0.4)' }}>No washes match your filters. Try clearing some options.</p>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(310px, 1fr))', gap:'1.125rem' }}>
          {filtered.map(w => (
            <div key={w.id} onClick={() => setSelected(w)} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1.25rem', cursor:'pointer', transition:'border-color 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor='rgba(204,0,0,0.3)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor='rgba(255,255,255,0.07)')}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>{w.name}</h3>
                <span style={{ fontWeight:700, color:PRICE_COLORS[w.price]??'#aaa' }}>{w.price}</span>
              </div>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.25rem' }}>📍 {w.city}, {w.state}{w.dist > 0 ? ` · ${w.dist}mi`:' · Comes to you'}</p>
              <p style={{ fontSize:'0.8rem', color:'#FFD700', marginBottom:'0.75rem' }}>⭐ {w.rating} ({w.reviews}) · {w.hours} · {TYPE_LABELS[w.type]}</p>
              <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                {w.ceramic && <span style={{ background:'rgba(59,130,246,0.08)', color:'#3b82f6', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(59,130,246,0.15)' }}>Ceramic Safe</span>}
                {w.ppf && <span style={{ background:'rgba(168,85,247,0.08)', color:'#a855f7', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(168,85,247,0.15)' }}>PPF Safe</span>}
                {w.touchless && <span style={{ background:'rgba(34,197,94,0.08)', color:'#22c55e', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(34,197,94,0.15)' }}>Touchless</span>}
                {w.membership && <span style={{ background:'rgba(204,0,0,0.08)', color:'#CC0000', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:'1px solid rgba(204,0,0,0.15)' }}>Monthly Plan</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
