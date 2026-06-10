import Link from 'next/link'

const MUSTANGS = [
  { year:'1965', name:'First Generation', url:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=85', accent:'#CC0000' },
  { year:'1969', name:'Boss 429',         url:'https://images.unsplash.com/photo-1584345604476-8ec5e12e42dd?w=600&q=85', accent:'#1539CC' },
  { year:'1971', name:'Mach 1',           url:'https://images.unsplash.com/photo-1547744152-14d985cb937f?w=600&q=85', accent:'#FFD700' },
  { year:'2003', name:'Cobra SVT',        url:'https://images.unsplash.com/photo-1603553329474-99f95f35394f?w=600&q=85', accent:'#CC0000' },
  { year:'2013', name:'Shelby GT500',     url:'https://images.unsplash.com/photo-1612825173281-9a193378527e?w=600&q=85', accent:'#1539CC' },
  { year:'2024', name:'Dark Horse',       url:'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=85', accent:'#C0C0C0' },
]

const CLASSICS = [
  { year:'1969', name:'Camaro Z28',         make:'Chevrolet Camaro', url:'https://images.unsplash.com/photo-1604940500627-d3f44d1d21c6?w=600&q=85', accent:'#FFD700' },
  { year:'1970', name:'Challenger R/T',     make:'Dodge Challenger', url:'https://images.unsplash.com/photo-1609521263047-f8f205293f24?w=600&q=85', accent:'#CC0000' },
  { year:'1969', name:'GTO',                make:'Pontiac GTO',      url:'https://images.unsplash.com/photo-1778096402612-f9e99592ccdc?w=600&q=85', accent:'#22c55e' },
  { year:'2024', name:'Camaro ZL1',         make:'Chevrolet Camaro', url:'https://images.unsplash.com/photo-1562911791-c7a97b729ec5?w=600&q=85', accent:'#FFD700' },
  { year:'2023', name:'Challenger Hellcat', make:'Dodge Challenger', url:'https://images.unsplash.com/photo-1680574893873-c7563dc5f81d?w=600&q=85', accent:'#CC0000' },
  { year:'2024', name:'Shelby GT500',       make:'Ford Mustang',     url:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=85', accent:'#1539CC' },
]

const FEATURES = [
  { icon:'📍', title:'Car Meets & Events', desc:'GPS-powered discovery, clubs, QR check-ins.', color:'#1539CC' },
  { icon:'🏪', title:'Vendor Marketplace', desc:'Performance shops, detailers & sponsors.', color:'#CC0000' },
  { icon:'🔍', title:'Car Search Engine', desc:'Live dealer + eBay Motors in one search.', color:'#1539CC' },
  { icon:'🔩', title:'Parts Search', desc:'Real-time price comparison — 15+ retailers.', color:'#CC0000' },
  { icon:'🔧', title:'AI Mechanic', desc:'Personal ASE master tech, 24/7.', color:'#FFD700' },
  { icon:'🚿', title:'Car Wash Locator', desc:'Ceramic & PPF-safe washes near you.', color:'#1539CC' },
  { icon:'🏁', title:'Auction Intelligence', desc:'Every auction with all-in cost calculator.', color:'#FFD700' },
  { icon:'🛡️', title:'Insurance Quotes', desc:'30+ carriers — Hagerty, Grundy & more.', color:'#1539CC' },
  { icon:'🚗', title:'Digital Garage', desc:'Build docs, mods & community hub.', color:'#CC0000' },
  { icon:'👕', title:'Merch Store', desc:'Exclusive drops & Rev Points loyalty.', color:'#FFD700' },
]

export default function Home() {
  return (
    <main style={{ background:'#1B2A3E', minHeight:'100vh', color:'white' }}>

      {/* ═══ HERO ═══ */}
      <section style={{ position:'relative', overflow:'hidden', background:'linear-gradient(135deg, #0D1E30 0%, #1B2A3E 40%, #1A2040 100%)', paddingBottom:'4rem' }}>
        {/* Diagonal racing stripe overlay */}
        <div style={{ position:'absolute', inset:0, background:'repeating-linear-gradient(45deg, transparent, transparent 80px, rgba(204,0,0,0.025) 80px, rgba(204,0,0,0.025) 82px)', pointerEvents:'none' }} />
        {/* Bold red left bar */}
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'6px', background:'linear-gradient(180deg, #CC0000, #FF0000 50%, #CC0000)' }} />
        {/* Royal blue right bar */}
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'6px', background:'linear-gradient(180deg, #1539CC, #2255FF 50%, #1539CC)' }} />

        {/* Nav */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'1.25rem 2.5rem', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ fontSize:'1.5rem', fontWeight:900, letterSpacing:'-0.5px' }}>
            <span style={{ color:'white' }}>VictoryRev</span>
            <span className="chrome-text" style={{ fontSize:'1.5rem' }}>Connect</span>
            <span style={{ color:'#FFD700', textShadow:'0 0 15px rgba(255,215,0,0.4)' }}>-1</span>
          </div>
          <div style={{ display:'flex', gap:'1rem' }}>
            <Link href="/login" style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.9rem', padding:'0.5rem 1rem' }}>Sign In</Link>
            <Link href="/register" style={{ background:'#CC0000', color:'white', padding:'0.5rem 1.25rem', borderRadius:'0.5rem', fontSize:'0.9rem', fontWeight:700 }}>Join Free</Link>
          </div>
        </div>

        {/* Hero content */}
        <div style={{ textAlign:'center', padding:'5rem 2rem 3rem', position:'relative', zIndex:1 }}>
          {/* Red + Chrome + Blue badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.75rem', marginBottom:'2rem' }}>
            <div style={{ width:'12px', height:'12px', background:'#CC0000', borderRadius:'50%', boxShadow:'0 0 8px #CC0000' }} />
            <span style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'9999px', padding:'0.375rem 1.25rem', fontSize:'0.85rem', color:'rgba(255,255,255,0.8)', letterSpacing:'1px', textTransform:'uppercase', fontWeight:600 }}>🏁 Now in Early Access</span>
            <div style={{ width:'12px', height:'12px', background:'#1539CC', borderRadius:'50%', boxShadow:'0 0 8px #1539CC' }} />
          </div>

          {/* Big title */}
          <div style={{ marginBottom:'1.5rem' }}>
            <div style={{ fontSize:'clamp(1rem,3vw,1.25rem)', color:'rgba(255,255,255,0.4)', letterSpacing:'6px', textTransform:'uppercase', fontWeight:600, marginBottom:'0.5rem' }}>The Ultimate Platform For</div>
            <h1 style={{ fontSize:'clamp(4.5rem,12vw,9rem)', fontWeight:900, letterSpacing:'-5px', lineHeight:0.85, margin:0 }}>
              <span style={{ color:'white' }}>VictoryRev</span>
              <span className="chrome-text">Connect</span>
            </h1>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'1rem', marginTop:'0.25rem' }}>
              <div style={{ height:'4px', flex:1, maxWidth:'120px', background:'linear-gradient(90deg, transparent, #CC0000)' }} />
              <span style={{ fontSize:'clamp(3.5rem,10vw,7rem)', fontWeight:900, color:'#FFD700', letterSpacing:'-2px', textShadow:'0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,215,0,0.2)' }}>-1</span>
              <div style={{ height:'4px', flex:1, maxWidth:'120px', background:'linear-gradient(90deg, #1539CC, transparent)' }} />
            </div>
          </div>

          <p style={{ fontSize:'1.25rem', color:'rgba(255,255,255,0.55)', marginBottom:'0.5rem' }}>Car enthusiasts. One platform.</p>
          <p style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.9rem', marginBottom:'2.5rem', letterSpacing:'2px', textTransform:'uppercase' }}>Community · Commerce · AI · Real-World Utility</p>

          {/* CTAs */}
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'3.5rem' }}>
            <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'1.125rem 2.75rem', borderRadius:'0.75rem', fontWeight:800, fontSize:'1.1rem', boxShadow:'0 6px 30px rgba(204,0,0,0.5), 0 2px 0 rgba(255,100,100,0.2) inset', letterSpacing:'0.25px', display:'inline-block' }}>
              🚗 Join the Community
            </Link>
            <Link href="/garage" style={{ background:'linear-gradient(135deg, #1539CC, #1030AA)', color:'white', padding:'1.125rem 2.75rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'1.1rem', boxShadow:'0 6px 30px rgba(21,57,204,0.4)', display:'inline-block' }}>
              Explore Platform →
            </Link>
          </div>

          {/* Stats — chrome pills */}
          <div style={{ display:'flex', justifyContent:'center', gap:'1rem', flexWrap:'wrap' }}>
            {[['🏎️','10+','AI Features'],['⚡','24/7','AI Mechanic'],['🔍','1M+','Live Listings'],['🛡️','30+','Insurers']].map(([emoji, num, label]) => (
              <div key={label} className="chrome-pill" style={{ padding:'0.75rem 1.25rem', borderRadius:'0.75rem', textAlign:'center', minWidth:'100px' }}>
                <div style={{ fontSize:'1.25rem', marginBottom:'0.125rem' }}>{emoji}</div>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'white' }}>{num}</div>
                <div style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome + Red + Blue divider */}
      <div style={{ height:'4px', background:'linear-gradient(90deg, #CC0000 0%, #AA0000 20%, #C0C0C0 35%, #FFFFFF 50%, #C0C0C0 65%, #1539CC 80%, #0D28AA 100%)' }} />

      {/* ═══ AMERICAN MUSCLE SHOWCASE ═══ */}
      <section style={{ padding:'4rem 2rem', background:'linear-gradient(180deg, #1B2A3E, #20314A)' }}>
        <div style={{ maxWidth:'1300px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <div style={{ fontSize:'0.75rem', letterSpacing:'4px', textTransform:'uppercase', color:'#CC0000', fontWeight:700, marginBottom:'0.5rem' }}>Ford · Chevrolet · Dodge · Pontiac</div>
            <h2 style={{ fontSize:'2.25rem', fontWeight:900, letterSpacing:'-1px' }}>
              <span className="chrome-text">American Muscle</span>{' '}
              <span style={{ color:'#CC0000' }}>Through the Ages</span>
            </h2>
            <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.5rem' }}>Track every generation in your Digital Garage</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'0.875rem' }}>
            {/* Row 1 — Ford Mustangs */}
            {MUSTANGS.map(m => (
              <div key={`mustang-${m.year}`} className="card-hover" style={{ borderRadius:'0.875rem', overflow:'hidden', background:'#243547', border:`2px solid ${m.accent}30`, cursor:'pointer', position:'relative' }}>
                <div style={{ height:'150px', overflow:'hidden', background:`linear-gradient(135deg, ${m.accent}20, #1B2A3E)`, position:'relative' }}>
                  <img src={m.url} alt={`${m.year} Ford Mustang ${m.name}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, transparent 30%, #243547 100%)` }} />
                  <div style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:m.accent, color:'white', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:800 }}>{m.year}</div>
                </div>
                <div style={{ padding:'0.75rem' }}>
                  <p style={{ fontWeight:800, fontSize:'0.85rem', color:'white' }}>{m.name}</p>
                  <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>Ford Mustang</p>
                  <div style={{ height:'2px', background:`linear-gradient(90deg, ${m.accent}, transparent)`, marginTop:'0.5rem', borderRadius:'9999px' }} />
                </div>
              </div>
            ))}
            {/* Row 2 — Other American Muscle */}
            {CLASSICS.map(m => (
              <div key={`classic-${m.year}-${m.name}`} className="card-hover" style={{ borderRadius:'0.875rem', overflow:'hidden', background:'#243547', border:`2px solid ${m.accent}30`, cursor:'pointer', position:'relative' }}>
                <div style={{ height:'150px', overflow:'hidden', background:`linear-gradient(135deg, ${m.accent}20, #1B2A3E)`, position:'relative' }}>
                  <img src={m.url} alt={`${m.year} ${m.make} ${m.name}`} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  <div style={{ position:'absolute', inset:0, background:`linear-gradient(180deg, transparent 30%, #243547 100%)` }} />
                  <div style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:m.accent, color:'white', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:800 }}>{m.year}</div>
                </div>
                <div style={{ padding:'0.75rem' }}>
                  <p style={{ fontWeight:800, fontSize:'0.85rem', color:'white' }}>{m.name}</p>
                  <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>{m.make}</p>
                  <div style={{ height:'2px', background:`linear-gradient(90deg, ${m.accent}, transparent)`, marginTop:'0.5rem', borderRadius:'9999px' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center', marginTop:'2rem' }}>
            <Link href="/garage" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.3)', color:'#FF4444', padding:'0.75rem 1.75rem', borderRadius:'0.75rem', fontWeight:600, fontSize:'0.9rem' }}>
              Add Your Muscle Car to the Garage →
            </Link>
          </div>
        </div>
      </section>

      {/* Blue-to-Red divider */}
      <div style={{ height:'3px', background:'linear-gradient(90deg, #1539CC, #C0C0C0, #CC0000)' }} />

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding:'4rem 2rem', background:'#1B2A3E', maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <div style={{ fontSize:'0.75rem', letterSpacing:'4px', textTransform:'uppercase', color:'#1539CC', fontWeight:700, marginBottom:'0.5rem' }}>10 AI-Powered Features</div>
          <h2 style={{ fontSize:'2.25rem', fontWeight:900, letterSpacing:'-1px' }}>Everything Enthusiasts Need</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1.125rem' }}>
          {FEATURES.map((f, i) => (
            <div key={f.title} className="card-hover" style={{ background: i % 3 === 0 ? 'linear-gradient(135deg, rgba(204,0,0,0.08), #243547)' : i % 3 === 1 ? 'linear-gradient(135deg, rgba(21,57,204,0.08), #243547)' : 'linear-gradient(135deg, rgba(255,215,0,0.06), #243547)', border:`1px solid ${f.color}25`, borderRadius:'1rem', padding:'1.5rem', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${f.color}, transparent)` }} />
              <div style={{ fontSize:'2.25rem', marginBottom:'0.875rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:800, fontSize:'1.05rem', marginBottom:'0.5rem', color:'white' }}>{f.title}</h3>
              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.875rem', lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding:'5rem 2rem', textAlign:'center', background:'linear-gradient(135deg, #0D1E30 0%, #1B2A3E 50%, #0D1E30 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', left:0, top:0, bottom:0, width:'8px', background:'linear-gradient(180deg, #CC0000, #FF0000, #CC0000)' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'8px', background:'linear-gradient(180deg, #1539CC, #2255FF, #1539CC)' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ width:'80px', height:'80px', background:'linear-gradient(135deg, #CC0000, #FF3300)', borderRadius:'50%', margin:'0 auto 2rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem', boxShadow:'0 0 40px rgba(204,0,0,0.5), 0 0 80px rgba(204,0,0,0.2)' }}>🏎️</div>
          <h2 style={{ fontSize:'2.75rem', fontWeight:900, marginBottom:'1rem', letterSpacing:'-1.5px' }}>Ready to Rev Up?</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'2rem', fontSize:'1.0625rem' }}>Join thousands of enthusiasts on the only platform built for the culture.</p>
          <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'1.25rem 3rem', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.2rem', boxShadow:'0 6px 40px rgba(204,0,0,0.5)', display:'inline-block', letterSpacing:'0.25px' }}>
            Join VictoryRevConnect-1 Free →
          </Link>
        </div>
      </section>

    </main>
  )
}
