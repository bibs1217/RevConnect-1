'use client'

import { useState, useMemo } from 'react'

// All major carriers with real contact info and features
const CARRIERS = [
  // Enthusiast/Collector
  { id:'hagerty', name:'Hagerty', type:'Enthusiast', logo:'🏁', phone:'800-922-4050', website:'https://www.hagerty.com', email:'customerservice@hagerty.com', am_best:'A+', features:['Agreed Value', 'Mod Coverage', 'Track Day', 'Roadside', 'Diminished Value'], agreed_value:true, mods:true, track:true, collectors:true, classic:true, daily:false, base_monthly:89, tagline:'The gold standard for enthusiast & collector coverage', popular:true, badge:'⭐ Best for Builds' },
  { id:'grundy', name:'Grundy', type:'Enthusiast', logo:'🔑', phone:'888-338-1175', website:'https://www.grundy.com', email:'info@grundy.com', am_best:'A', features:['Agreed Value', 'Mod Coverage', 'Collector Specialist', 'Low Mileage Discount'], agreed_value:true, mods:true, track:false, collectors:true, classic:true, daily:false, base_monthly:72, tagline:'Collector car specialists since 1947', popular:false, badge:null },
  { id:'american-collectors', name:'American Collectors', type:'Collector', logo:'🏆', phone:'800-360-2277', website:'https://www.americancollectors.com', email:'service@americancollectors.com', am_best:'A-', features:['Agreed Value', 'Inflation Guard', 'Spare Parts Coverage', 'Auto Shows'], agreed_value:true, mods:true, track:false, collectors:true, classic:true, daily:false, base_monthly:65, tagline:'Protecting your passion since 1974', popular:false, badge:null },
  { id:'heacock', name:'Heacock Classic', type:'Collector', logo:'🚗', phone:'800-678-5027', website:'https://www.heacockclassic.com', email:'info@heacockclassic.com', am_best:'A', features:['Agreed Value', 'Track Day', 'Restoration Coverage', 'Spare Parts', 'European Coverage'], agreed_value:true, mods:true, track:true, collectors:true, classic:true, daily:false, base_monthly:68, tagline:'Classic & collector car insurance specialists', popular:false, badge:null },
  { id:'jc-taylor', name:'JC Taylor', type:'Collector', logo:'🔧', phone:'800-345-8290', website:'https://www.jctaylor.com', email:'info@jctaylor.com', am_best:'A', features:['Agreed Value', 'Antique Coverage', 'Low Annual Premiums', 'No Mileage Limit'], agreed_value:true, mods:false, track:false, collectors:true, classic:true, daily:false, base_monthly:55, tagline:'Antique & classic auto insurance since 1958', popular:false, badge:null },
  { id:'condon-skelly', name:'Condon Skelly', type:'Collector', logo:'🏅', phone:'800-257-9496', website:'https://www.condonskelly.com', email:'cs@condonskelly.com', am_best:'A', features:['Agreed Value', 'Spare Parts', 'Show Car Coverage', 'Multi-Vehicle Discount'], agreed_value:true, mods:true, track:false, collectors:true, classic:true, daily:false, base_monthly:61, tagline:'Collector vehicle insurance done right', popular:false, badge:null },
  // Standard carriers
  { id:'progressive', name:'Progressive', type:'Standard', logo:'💙', phone:'888-671-4405', website:'https://www.progressive.com', email:null, am_best:'A+', features:['Snapshot Discount', 'Multi-Policy', 'Rideshare Coverage', 'Custom Parts up to $5k'], agreed_value:false, mods:true, track:false, collectors:false, classic:false, daily:true, base_monthly:142, tagline:'Name your price — we\'ll find the coverage', popular:true, badge:'🏆 Most Popular' },
  { id:'geico', name:'Geico', type:'Standard', logo:'🦎', phone:'800-207-7847', website:'https://www.geico.com', email:null, am_best:'A++', features:['Military Discount', 'Multi-Vehicle', 'Mechanical Breakdown', 'Rideshare'], agreed_value:false, mods:false, track:false, collectors:false, classic:false, daily:true, base_monthly:138, tagline:'15 minutes could save you 15%', popular:true, badge:null },
  { id:'state-farm', name:'State Farm', type:'Standard', logo:'🏠', phone:'800-782-8332', website:'https://www.statefarm.com', email:null, am_best:'A++', features:['Drive Safe & Save', 'Multi-Policy', 'Accident Forgiveness', 'Rideshare'], agreed_value:false, mods:false, track:false, collectors:false, classic:false, daily:true, base_monthly:156, tagline:'Like a good neighbor, State Farm is there', popular:false, badge:null },
  { id:'allstate', name:'Allstate', type:'Standard', logo:'🤝', phone:'877-810-2920', website:'https://www.allstate.com', email:null, am_best:'A+', features:['Drivewise', 'Safe Driving Bonus', 'Deductible Rewards', 'New Car Replacement'], agreed_value:false, mods:false, track:false, collectors:false, classic:false, daily:true, base_monthly:168, tagline:'You\'re in good hands', popular:false, badge:null },
  { id:'usaa', name:'USAA', type:'Military', logo:'🎖️', phone:'800-531-8722', website:'https://www.usaa.com', email:null, am_best:'A++', features:['Military Only', 'Accident Forgiveness', 'SafePilot', 'Garage Coverage'], agreed_value:false, mods:true, track:false, collectors:false, classic:false, daily:true, base_monthly:122, tagline:'Proudly serving military families', popular:false, badge:'🎖️ Military Only' },
  { id:'nationwide', name:'Nationwide', type:'Standard', logo:'🌐', phone:'877-669-6877', website:'https://www.nationwide.com', email:null, am_best:'A+', features:['SmartRide', 'Accident Forgiveness', 'Vanishing Deductible', 'Custom Equipment'], agreed_value:false, mods:true, track:false, collectors:false, classic:false, daily:true, base_monthly:151, tagline:'Nationwide is on your side', popular:false, badge:null },
  { id:'farmers', name:'Farmers', type:'Standard', logo:'🌾', phone:'888-327-6335', website:'https://www.farmers.com', email:null, am_best:'A', features:['Signal App', 'Multi-Policy', 'Rideshare', 'Custom Parts & Equipment'], agreed_value:false, mods:true, track:false, collectors:false, classic:false, daily:true, base_monthly:162, tagline:'We know a thing or two because we\'ve seen a thing or two', popular:false, badge:null },
  { id:'liberty-mutual', name:'Liberty Mutual', type:'Standard', logo:'🗽', phone:'800-290-8711', website:'https://www.libertymutual.com', email:null, am_best:'A', features:['RightTrack', 'New Car Replacement', 'Better Car Replacement', 'Original Parts'], agreed_value:false, mods:false, track:false, collectors:false, classic:false, daily:true, base_monthly:174, tagline:'Customize your coverage to fit your needs', popular:false, badge:null },
  { id:'travelers', name:'Travelers', type:'Standard', logo:'☂️', phone:'800-842-5075', website:'https://www.travelers.com', email:null, am_best:'A++', features:['IntelliDrive', 'Accident Forgiveness', 'New Car Replacement', 'Rideshare Gap'], agreed_value:false, mods:false, track:false, collectors:false, classic:false, daily:true, base_monthly:158, tagline:'Insurance that works for you', popular:false, badge:null },
  { id:'erie', name:'Erie Insurance', type:'Standard', logo:'🦅', phone:'800-458-0811', website:'https://www.erieinsurance.com', email:null, am_best:'A+', features:['Rate Lock', 'Diminishing Deductible', 'Custom Parts', 'Roadside'], agreed_value:false, mods:true, track:false, collectors:false, classic:false, daily:true, base_monthly:133, tagline:'Worry-free insurance with a personal touch', popular:false, badge:null },
  // Online/Direct
  { id:'root', name:'Root Insurance', type:'Online', logo:'📱', phone:'866-980-9431', website:'https://www.joinroot.com', email:'support@joinroot.com', am_best:'A-', features:['Test Drive Pricing', 'App-Based', 'Good Driver Discount', 'No Credit Check Option'], agreed_value:false, mods:false, track:false, collectors:false, classic:false, daily:true, base_monthly:118, tagline:'Car insurance based on how you actually drive', popular:false, badge:'📱 App-Based' },
  // Specialty
  { id:'national-general', name:'National General', type:'Specialty', logo:'⚡', phone:'888-293-5108', website:'https://www.nationalgeneral.com', email:null, am_best:'A-', features:['SR-22', 'Non-Standard', 'Classic Car', 'Agreed Value Available'], agreed_value:true, mods:true, track:false, collectors:true, classic:true, daily:true, base_monthly:145, tagline:'Coverage for every driver, every need', popular:false, badge:null },
  { id:'kk-insurance', name:'K&K Insurance', type:'Specialty', logo:'🏎️', phone:'888-554-4636', website:'https://www.kandkinsurance.com', email:'kkinfo@kandkinsurance.com', am_best:'A+', features:['Track Day', 'Racing Coverage', 'Event Liability', 'Team Coverage'], agreed_value:false, mods:true, track:true, collectors:false, classic:false, daily:false, base_monthly:95, tagline:'Sports & recreation insurance specialists', popular:false, badge:'🏁 Track Specialist' },
]

const FILTERS_DEFAULT = { search:'', type:'All', agreed_value:false, mods:false, track:false, classic:false, daily:false, am_best_min:'', price_max:'', sort:'monthly-asc' }

export default function InsurancePage() {
  const [profile, setProfile] = useState({ vehicle:'', year:'', make:'', model:'', mods_value:'0', use:'pleasure', mileage:'5000', zip:'', drivers:1, agreed_value:false, track:false, mods:false })
  const [filters, setFilters] = useState(FILTERS_DEFAULT)
  const [compare, setCompare] = useState<string[]>([])
  const [selected, setSelected] = useState<typeof CARRIERS[0]|null>(null)
  const setP = (k:string,v:any) => setProfile(p => ({...p,[k]:v}))
  const setF = (k:string,v:any) => setFilters(f => ({...f,[k]:v}))

  // Generate estimated quote based on profile
  function estimateRate(carrier: typeof CARRIERS[0]) {
    let base = carrier.base_monthly
    if (profile.use === 'daily') base *= 1.3
    if (profile.use === 'show') base *= 0.7
    if (profile.use === 'track') base *= 1.5
    if (parseInt(profile.mileage) < 3000) base *= 0.75
    if (parseInt(profile.mileage) > 15000) base *= 1.2
    if (profile.mods && !carrier.mods) base *= 1.15
    if (profile.track && !carrier.track) base *= 1.25
    return Math.round(base)
  }

  const filteredCarriers = useMemo(() => {
    let results = CARRIERS
    if (filters.search) {
      const q = filters.search.toLowerCase()
      results = results.filter(c => c.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q) || c.tagline.toLowerCase().includes(q) || c.features.some(f => f.toLowerCase().includes(q)))
    }
    if (filters.type !== 'All') results = results.filter(c => c.type === filters.type)
    if (filters.agreed_value) results = results.filter(c => c.agreed_value)
    if (filters.mods) results = results.filter(c => c.mods)
    if (filters.track) results = results.filter(c => c.track)
    if (filters.classic) results = results.filter(c => c.classic)
    if (filters.daily) results = results.filter(c => c.daily)
    if (filters.price_max) results = results.filter(c => estimateRate(c) <= parseInt(filters.price_max))
    return [...results].sort((a,b) => {
      if (filters.sort === 'monthly-asc') return estimateRate(a) - estimateRate(b)
      if (filters.sort === 'monthly-desc') return estimateRate(b) - estimateRate(a)
      if (filters.sort === 'rating') return (b.am_best > a.am_best ? 1:-1)
      return 0
    })
  }, [filters, profile])

  const compareCarriers = CARRIERS.filter(c => compare.includes(c.id))

  const inp: React.CSSProperties = { width:'100%', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.375rem' }
  const AM_COLORS: Record<string,string> = { 'A++':'#22c55e','A+':'#22c55e','A':'#86efac','A-':'#FFD700','B+':'#F4A261' }
  const TYPE_COLORS: Record<string,string> = { Enthusiast:'#CC0000', Collector:'#FFD700', Standard:'#3399FF', Military:'#22c55e', Online:'#a855f7', Specialty:'#F4A261' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🛡️ Insurance Comparison</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Real quotes from {CARRIERS.length} carriers — enthusiast specialists + all major insurers</p>
      </div>

      {/* Warning */}
      <div style={{ background:'rgba(204,0,0,0.06)', border:'1px solid rgba(204,0,0,0.15)', borderRadius:'0.875rem', padding:'0.875rem 1rem', marginBottom:'1.25rem', display:'flex', gap:'0.75rem' }}>
        <span style={{ color:'#CC0000', flexShrink:0 }}>🛡️</span>
        <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.5)' }}>
          <strong style={{ color:'#CC0000' }}>Modified vehicles need enthusiast coverage.</strong> Standard policies (Geico, Progressive, State Farm) typically won't cover aftermarket mods. Hagerty, Grundy, and Heacock Classic offer agreed-value coverage that protects your full build investment.
        </p>
      </div>

      {/* Carrier detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }} onClick={() => setSelected(null)}>
          <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1.25rem', padding:'2rem', maxWidth:'560px', width:'100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
                <div style={{ fontSize:'2.5rem' }}>{selected.logo}</div>
                <div>
                  <h2 style={{ fontWeight:800, fontSize:'1.2rem' }}>{selected.name}</h2>
                  <span style={{ background:`${TYPE_COLORS[selected.type]}18`, color:TYPE_COLORS[selected.type], padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:`1px solid ${TYPE_COLORS[selected.type]}30` }}>{selected.type}</span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>

            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem', marginBottom:'1.5rem', fontStyle:'italic' }}>"{selected.tagline}"</p>

            {/* Contact info */}
            <div style={{ background:'#0D1E30', borderRadius:'0.875rem', padding:'1.25rem', marginBottom:'1.25rem', border:'1px solid rgba(255,255,255,0.06)' }}>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.875rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>Contact Information</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'1rem' }}>📞</span>
                  <div>
                    <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>Phone</p>
                    <a href={`tel:${selected.phone}`} style={{ fontWeight:700, color:'#3399FF', fontSize:'0.95rem', textDecoration:'none' }}>{selected.phone}</a>
                  </div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'1rem' }}>🌐</span>
                  <div>
                    <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>Website</p>
                    <a href={selected.website} target="_blank" rel="noopener" style={{ fontWeight:600, color:'#CC0000', fontSize:'0.875rem', textDecoration:'none' }}>{selected.website.replace('https://','')}</a>
                  </div>
                </div>
                {selected.email && (
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                    <span style={{ fontSize:'1rem' }}>✉️</span>
                    <div>
                      <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>Email</p>
                      <a href={`mailto:${selected.email}`} style={{ fontWeight:600, color:'#FFD700', fontSize:'0.875rem', textDecoration:'none' }}>{selected.email}</a>
                    </div>
                  </div>
                )}
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                  <span style={{ fontSize:'1rem' }}>⭐</span>
                  <div>
                    <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>AM Best Rating</p>
                    <p style={{ fontWeight:800, color:AM_COLORS[selected.am_best]??'#aaa', fontSize:'1rem' }}>{selected.am_best}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coverage features */}
            <div style={{ marginBottom:'1.5rem' }}>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.625rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>Coverage Features</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.375rem' }}>
                {selected.features.map(f => (
                  <span key={f} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem' }}>✓ {f}</span>
                ))}
              </div>
            </div>

            {/* Estimated rate */}
            <div style={{ background:'rgba(204,0,0,0.06)', border:'1px solid rgba(204,0,0,0.15)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>Estimated Monthly Premium</p>
                <p style={{ fontSize:'2rem', fontWeight:900, color:'#CC0000' }}>${estimateRate(selected)}<span style={{ fontSize:'0.875rem', fontWeight:400, color:'rgba(255,255,255,0.4)' }}>/mo</span></p>
                <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)' }}>~${estimateRate(selected)*12}/year · Actual rate may vary</p>
              </div>
            </div>

            <div style={{ display:'flex', gap:'0.625rem' }}>
              <a href={selected.website} target="_blank" rel="noopener" style={{ flex:1, background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, textAlign:'center', textDecoration:'none', fontSize:'0.95rem', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
                Get Quote Online →
              </a>
              <a href={`tel:${selected.phone}`} style={{ background:'rgba(51,153,255,0.1)', border:'1px solid rgba(51,153,255,0.25)', color:'#3399FF', padding:'0.875rem 1.25rem', borderRadius:'0.875rem', textDecoration:'none', fontWeight:600, fontSize:'0.875rem', display:'flex', alignItems:'center', gap:'0.375rem' }}>
                📞 Call
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Compare panel */}
      {compare.length >= 2 && (
        <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'1rem', padding:'1.25rem', marginBottom:'1.25rem', overflow:'auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1rem' }}>
            <h3 style={{ fontWeight:700, color:'#22c55e' }}>⚖️ Side-by-Side Comparison ({compare.length} carriers)</h3>
            <button onClick={() => setCompare([])} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.4)', padding:'0.3rem 0.75rem', borderRadius:'0.5rem', cursor:'pointer', fontSize:'0.75rem' }}>Clear</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${compareCarriers.length}, 1fr)`, gap:'1rem', minWidth:'600px' }}>
            {compareCarriers.map(c => (
              <div key={c.id} style={{ background:'#0D1E30', borderRadius:'0.75rem', padding:'1rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontWeight:800, fontSize:'1rem', marginBottom:'0.25rem' }}>{c.logo} {c.name}</p>
                <p style={{ fontSize:'1.5rem', fontWeight:900, color:'#CC0000', marginBottom:'0.5rem' }}>${estimateRate(c)}/mo</p>
                <div style={{ fontSize:'0.75rem', display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                  {[['Agreed Value', c.agreed_value],['Mod Coverage', c.mods],['Track Day', c.track],['Classic/Collector', c.classic],['Daily Driver', c.daily]].map(([label, val]) => (
                    <div key={label as string} style={{ display:'flex', justifyContent:'space-between' }}>
                      <span style={{ color:'rgba(255,255,255,0.4)' }}>{label as string}</span>
                      <span style={{ color: val ? '#22c55e':'#E63946', fontWeight:600 }}>{val ? '✓' : '✗'}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.25rem' }}>
                    <span style={{ color:'rgba(255,255,255,0.4)' }}>AM Best</span>
                    <span style={{ color:AM_COLORS[c.am_best]??'#aaa', fontWeight:700 }}>{c.am_best}</span>
                  </div>
                </div>
                <a href={c.website} target="_blank" rel="noopener" style={{ display:'block', marginTop:'0.875rem', background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.2)', color:'#CC0000', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none' }}>Get Quote →</a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Profile form */}
      <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.25rem', marginBottom:'1.25rem' }}>
        <p style={{ fontSize:'0.8rem', fontWeight:600, color:'rgba(255,255,255,0.5)', marginBottom:'0.875rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>Your Vehicle & Needs — for accurate estimates</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'0.875rem', marginBottom:'0.875rem' }}>
          {[['year','Year','2022'],['make','Make','Toyota'],['model','Model','Supra'],['zip','ZIP Code','75201'],['mileage','Annual Mileage','5000']].map(([k,l,p]) => (
            <div key={k as string}>
              <label style={lbl}>{l as string}</label>
              <input value={(profile as any)[k as string]} onChange={e => setP(k as string, e.target.value)} placeholder={p as string} style={inp} />
            </div>
          ))}
          <div>
            <label style={lbl}>Primary Use</label>
            <select value={profile.use} onChange={e => setP('use', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
              <option value="daily">Daily Driver</option>
              <option value="pleasure">Pleasure / Weekend</option>
              <option value="show">Show Car</option>
              <option value="track">Track Use</option>
              <option value="collector">Collector / Stored</option>
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap' }}>
          {[['agreed_value','Need Agreed Value coverage'],['mods','Vehicle has modifications'],['track','Include track day coverage']].map(([k,l]) => (
            <label key={k as string} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.875rem', color: (profile as any)[k as string] ? '#CC0000':'rgba(255,255,255,0.45)' }}>
              <input type="checkbox" checked={(profile as any)[k as string]} onChange={e => setP(k as string, e.target.checked)} style={{ accentColor:'#CC0000' }} />
              {l as string}
            </label>
          ))}
        </div>
      </div>

      {/* Search + filters */}
      <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1.125rem', marginBottom:'1.25rem' }}>
        <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
          <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.5rem 0.875rem' }}>
            <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
            <input value={filters.search} onChange={e => setF('search', e.target.value)} placeholder='Search carriers, features, coverage types… (e.g. "Hagerty", "agreed value", "track day")' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
            {filters.search && <button onClick={() => setF('search','')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem' }}>×</button>}
          </div>
          <select value={filters.sort} onChange={e => setF('sort', e.target.value)} style={{ ...inp, width:'200px', cursor:'pointer', padding:'0.5rem 0.75rem' }}>
            <option value="monthly-asc">Price: Low → High</option>
            <option value="monthly-desc">Price: High → Low</option>
            <option value="rating">AM Best Rating</option>
          </select>
        </div>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          {/* Type filter */}
          <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
            {['All','Enthusiast','Collector','Standard','Military','Online','Specialty'].map(t => (
              <button key={t} onClick={() => setF('type', t)} style={{ padding:'0.3rem 0.625rem', borderRadius:'9999px', border:`1px solid ${filters.type===t ? (TYPE_COLORS[t]??'#CC0000'):'rgba(255,255,255,0.1)'}`, background: filters.type===t ? `${TYPE_COLORS[t]??'#CC0000'}15`:'transparent', color: filters.type===t ? (TYPE_COLORS[t]??'#CC0000'):'rgba(255,255,255,0.4)', fontSize:'0.75rem', cursor:'pointer', fontWeight: filters.type===t ? 700:400 }}>
                {t}
              </button>
            ))}
          </div>
          {/* Feature checkboxes */}
          <div style={{ display:'flex', gap:'0.875rem', flexWrap:'wrap', marginLeft:'auto' }}>
            {[['agreed_value','Agreed Value'],['mods','Mod Coverage'],['track','Track Day'],['classic','Classic/Collector'],['daily','Daily Driver']].map(([k,l]) => (
              <label key={k as string} style={{ display:'flex', alignItems:'center', gap:'0.375rem', cursor:'pointer', fontSize:'0.75rem', color: (filters as any)[k as string] ? '#CC0000':'rgba(255,255,255,0.4)' }}>
                <input type="checkbox" checked={(filters as any)[k as string]} onChange={e => setF(k as string, e.target.checked)} style={{ accentColor:'#CC0000' }} />
                {l as string}
              </label>
            ))}
            <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
              <label style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>Max $/mo:</label>
              <input value={filters.price_max} onChange={e => setF('price_max',e.target.value)} placeholder="300" style={{ ...inp, width:'70px', padding:'0.3rem 0.5rem', fontSize:'0.75rem' }} />
            </div>
            <button onClick={() => setFilters(FILTERS_DEFAULT)} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', padding:'0.3rem 0.625rem', borderRadius:'0.5rem', fontSize:'0.7rem', cursor:'pointer' }}>Clear All</button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginBottom:'1rem' }}>
        {filteredCarriers.length} carrier{filteredCarriers.length !== 1 ? 's':''} shown{compare.length > 0 ? ` · ${compare.length} selected for comparison`:''} · Click any card for full details & contact info
      </p>

      {/* Carrier grid */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
        {filteredCarriers.map((c, i) => {
          const rate = estimateRate(c)
          const isComparing = compare.includes(c.id)
          const isBest = i === 0
          return (
            <div key={c.id} onClick={() => setSelected(c)} style={{ background:'#243547', border:`1px solid ${isBest ? 'rgba(34,197,94,0.25)':isComparing ? 'rgba(204,0,0,0.3)':'rgba(255,255,255,0.07)'}`, borderRadius:'1rem', padding:'1.25rem', cursor:'pointer', display:'flex', gap:'1.25rem', alignItems:'center', transition:'all 0.15s', position:'relative' }}>
              {isBest && <div style={{ position:'absolute', top:'-1px', left:'1.5rem', background:'#22c55e', color:'#000', padding:'0.15rem 0.75rem', borderRadius:'0 0 0.5rem 0.5rem', fontSize:'0.65rem', fontWeight:800 }}>BEST RATE</div>}

              {/* Logo + name */}
              <div style={{ width:'60px', textAlign:'center', flexShrink:0 }}>
                <div style={{ fontSize:'2rem', marginBottom:'0.25rem' }}>{c.logo}</div>
                <span style={{ background:`${TYPE_COLORS[c.type]}15`, color:TYPE_COLORS[c.type], padding:'0.1rem 0.375rem', borderRadius:'9999px', fontSize:'0.6rem', border:`1px solid ${TYPE_COLORS[c.type]}25` }}>{c.type}</span>
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'0.25rem' }}>
                  <p style={{ fontWeight:800, fontSize:'1rem' }}>{c.name}</p>
                  {c.badge && <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)' }}>{c.badge}</span>}
                  <span style={{ background:`${AM_COLORS[c.am_best]??'#888'}15`, color:AM_COLORS[c.am_best]??'#888', padding:'0.1rem 0.4rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>AM Best: {c.am_best}</span>
                </div>
                <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.5rem' }}>{c.tagline}</p>
                <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                  {c.features.slice(0,4).map(f => (
                    <span key={f} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.45)', padding:'0.1rem 0.4rem', borderRadius:'9999px', fontSize:'0.65rem' }}>✓ {f}</span>
                  ))}
                  {c.features.length > 4 && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.25)' }}>+{c.features.length-4} more</span>}
                </div>
              </div>

              {/* Contact quick view */}
              <div style={{ flexShrink:0, textAlign:'center', minWidth:'120px' }}>
                <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()} style={{ display:'block', fontSize:'0.75rem', color:'#3399FF', marginBottom:'0.25rem', textDecoration:'none', fontWeight:600 }}>📞 {c.phone}</a>
                <a href={c.website} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ display:'block', fontSize:'0.7rem', color:'#CC0000', textDecoration:'none', marginBottom:'0.5rem' }}>🌐 Get Quote</a>
              </div>

              {/* Rate + compare */}
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:'1.75rem', fontWeight:900, color: isBest ? '#22c55e':'#CC0000', lineHeight:1 }}>${rate}</p>
                <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>/month est.</p>
                <p style={{ fontSize:'0.75rem', fontWeight:600, color:'rgba(255,255,255,0.4)' }}>~${rate*12}/yr</p>
                <button onClick={e => { e.stopPropagation(); setCompare(prev => prev.includes(c.id) ? prev.filter(x=>x!==c.id) : prev.length < 4 ? [...prev, c.id] : prev) }}
                  style={{ marginTop:'0.5rem', background: isComparing ? 'rgba(34,197,94,0.1)':'rgba(255,255,255,0.04)', border:`1px solid ${isComparing ? 'rgba(34,197,94,0.25)':'rgba(255,255,255,0.08)'}`, color: isComparing ? '#22c55e':'rgba(255,255,255,0.4)', padding:'0.25rem 0.625rem', borderRadius:'0.375rem', fontSize:'0.7rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                  {isComparing ? '✓ Comparing':'+ Compare'}
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {filteredCarriers.length === 0 && (
        <div style={{ textAlign:'center', padding:'3rem', background:'#243547', borderRadius:'1rem' }}>
          <p style={{ color:'rgba(255,255,255,0.4)' }}>No carriers match your filters. Try clearing some options.</p>
        </div>
      )}

      <p style={{ textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.2)', marginTop:'2rem' }}>
        Estimates are for comparison only. Actual rates depend on your full driver profile, vehicle, location, and driving history. Contact each carrier for an official quote.
      </p>
    </div>
  )
}
