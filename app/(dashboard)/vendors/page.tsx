'use client'

import { useState } from 'react'

const VENDORS = [
  { id:'1', name:'Mishimoto', category:'Performance Parts', sub:'Cooling & Intakes', description:'Premium cooling, intake, and drivetrain components. OEM-quality aftermarket parts with lifetime warranty.', website:'https://www.mishimoto.com', featured:true, verified:true, discount:'10% off with code REVCONNECT', logo:'🔧' },
  { id:'2', name:'Enkei Wheels', category:'Wheels & Tires', sub:'Wheel Manufacturer', description:'World-renowned lightweight forged and cast wheels for performance and show applications.', website:'https://www.enkei.com', featured:true, verified:true, discount:null, logo:'⭕' },
  { id:'3', name:'Chemical Guys', category:'Car Care', sub:'Detailing Products', description:'Professional-grade car care products. Washes, waxes, coatings, and interior cleaners trusted by detailers worldwide.', website:'https://www.chemicalguys.com', featured:true, verified:true, discount:'15% off with code RC15', logo:'🧴' },
  { id:'4', name:'KW Suspensions', category:'Performance Parts', sub:'Suspension & Coilovers', description:'German-engineered suspension systems. From street to race, KW covers every application.', website:'https://www.kwsuspensions.net', featured:false, verified:true, discount:null, logo:'⚙️' },
  { id:'5', name:'Hagerty Insurance', category:'Insurance & Finance', sub:'Enthusiast Insurance', description:'Agreed-value insurance for collector cars, modified vehicles, and daily drivers with agreed-value options.', website:'https://www.hagerty.com', featured:true, verified:true, discount:'Free quote for RevConnect members', logo:'🛡️' },
  { id:'6', name:'Titan Motorsports', category:'Automotive Services', sub:'Performance Shop', description:'Full-service performance shop. Engine builds, turbo kits, suspension, dyno tuning, and fabrication.', website:'https://www.titanmotorsports.com', featured:false, verified:true, discount:null, logo:'🏁', local:true, city:'Orlando, FL' },
  { id:'7', name:'Yokohama Tires', category:'Wheels & Tires', sub:'Tire Manufacturer', description:'High-performance tires from ADVAN to Avid. Track-proven compound technology for street and race.', website:'https://www.yokohamatire.com', featured:false, verified:true, discount:null, logo:'🔘' },
  { id:'8', name:'Alpine Electronics', category:'Audio & Electronics', sub:'Car Audio', description:'Premium car audio equipment. Head units, amplifiers, speakers, and DSP for the ultimate audio build.', website:'https://www.alpine-usa.com', featured:false, verified:true, discount:'Free installation guide with any purchase', logo:'🔊' },
]

const CATS = ['All','Performance Parts','Wheels & Tires','Car Care','Insurance & Finance','Automotive Services','Audio & Electronics','Clothing','Fuel & Lubricants']
const CAT_COLORS: Record<string,string> = { 'Performance Parts':'#CC0000','Wheels & Tires':'#3b82f6','Car Care':'#22c55e','Insurance & Finance':'#a855f7','Automotive Services':'#FFD700','Audio & Electronics':'#14b8a6' }

export default function VendorsPage() {
  const [cat, setCat] = useState('All')
  const [search, setSearch] = useState('')

  const filtered = VENDORS.filter(v => {
    if (cat !== 'All' && v.category !== cat) return false
    if (search && !v.name.toLowerCase().includes(search.toLowerCase()) && !v.description.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a,b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0))

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🏪 Vendor Marketplace</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Trusted brands and local shops — targeted to your build and location</p>
      </div>

      <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors, brands, products…" style={{ flex:1, background:'#152234', border:'1px solid #1E3A6E', borderRadius:'0.75rem', padding:'0.625rem 1rem', color:'white', fontSize:'0.875rem', outline:'none' }} />
        <button style={{ background:'#CC0000', color:'white', border:'none', padding:'0.625rem 1.25rem', borderRadius:'0.75rem', fontWeight:600, fontSize:'0.875rem', cursor:'pointer' }}>Advertise Here</button>
      </div>

      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:`1px solid ${cat===c ? (CAT_COLORS[c] ?? '#CC0000') : '#1E3A6E'}`, background: cat===c ? `${CAT_COLORS[c] ?? '#CC0000'}15` : 'transparent', color: cat===c ? (CAT_COLORS[c] ?? '#CC0000') : '#aaa', fontSize:'0.8rem', cursor:'pointer' }}>
            {c}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.25rem' }}>
        {filtered.map(v => {
          const catColor = CAT_COLORS[v.category] ?? '#aaa'
          return (
            <div key={v.id} style={{ background:'#152234', border:`1px solid ${v.featured ? catColor+'40' : '#1E3A6E'}`, borderRadius:'1rem', padding:'1.5rem', position:'relative' }}>
              {v.featured && <div style={{ position:'absolute', top:'-1px', left:'1.5rem', background:catColor, color:'white', padding:'0.15rem 0.625rem', borderRadius:'0 0 0.5rem 0.5rem', fontSize:'0.65rem', fontWeight:700 }}>FEATURED</div>}
              <div style={{ display:'flex', gap:'1rem', alignItems:'flex-start', marginBottom:'0.875rem' }}>
                <div style={{ width:'52px', height:'52px', background:`${catColor}15`, border:`1px solid ${catColor}25`, borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.75rem', flexShrink:0 }}>{v.logo}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'0.125rem' }}>
                    <h3 style={{ fontWeight:700, fontSize:'1rem' }}>{v.name}</h3>
                    {v.verified && <span style={{ color:'#3b82f6', fontSize:'0.875rem' }}>✓</span>}
                  </div>
                  <span style={{ background:`${catColor}15`, color:catColor, padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:`1px solid ${catColor}25` }}>{v.sub}</span>
                </div>
              </div>
              <p style={{ color:'#888', fontSize:'0.8rem', lineHeight:1.5, marginBottom:'0.875rem' }}>{v.description}</p>
              {v.discount && (
                <div style={{ background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.5rem', padding:'0.5rem 0.75rem', marginBottom:'0.875rem', fontSize:'0.8rem', color:'#22c55e' }}>
                  🎁 {v.discount}
                </div>
              )}
              {'local' in v && v.local && (
                <p style={{ fontSize:'0.75rem', color:'#FFD700', marginBottom:'0.5rem' }}>📍 Local: {v.city}</p>
              )}
              <div style={{ display:'flex', gap:'0.5rem' }}>
                <a href={`https://${v.website}`} target="_blank" rel="noopener" style={{ flex:1, background:`${catColor}15`, border:`1px solid ${catColor}30`, color:catColor, padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:600, textAlign:'center', textDecoration:'none' }}>Visit Site →</a>
                <button style={{ background:'transparent', border:'1px solid #1E3A6E', color:'#aaa', padding:'0.5rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Save</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
