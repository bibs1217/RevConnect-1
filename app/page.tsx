import Link from 'next/link'

// Mustang photos from different eras - Unsplash CDN
const MUSTANGS = [
  { year:'1965', name:'First Generation', url:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&q=85', color:'#CC0000' },
  { year:'1969', name:'Boss 429', url:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&q=85', color:'#2255EE' },
  { year:'1971', name:'Mach 1', url:'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=600&q=85', color:'#FFD700' },
  { year:'2003', name:'Cobra SVT', url:'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&q=85', color:'#CC0000' },
  { year:'2013', name:'Shelby GT500', url:'https://images.unsplash.com/photo-1580274455152-f4af44f89116?w=600&q=85', color:'#2255EE' },
  { year:'2024', name:'Dark Horse', url:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=85', color:'#C0C0C0' },
]

const FEATURES = [
  { icon:'📍', title:'Car Meets & Events', desc:'GPS-powered discovery, club management, QR check-ins.', color:'#2255EE' },
  { icon:'🏪', title:'Vendor Marketplace', desc:'Geo-targeted performance shops, detailers & more.', color:'#CC0000' },
  { icon:'🔍', title:'Car Search Engine', desc:'Live dealer + eBay Motors inventory in one search.', color:'#2255EE' },
  { icon:'🔩', title:'Parts Search', desc:'Real-time price comparison across 15+ retailers.', color:'#CC0000' },
  { icon:'🔧', title:'AI Mechanic', desc:'Personal ASE master tech, available 24/7.', color:'#FFD700' },
  { icon:'🚿', title:'Car Wash Locator', desc:'Ceramic & PPF-safe washes near you.', color:'#2255EE' },
  { icon:'🏁', title:'Auction Intelligence', desc:'Every auction with all-in cost calculator.', color:'#FFD700' },
  { icon:'🛡️', title:'Insurance Quotes', desc:'30+ carriers — Hagerty, Grundy & more.', color:'#2255EE' },
  { icon:'🚗', title:'Digital Garage', desc:'Build docs, mods & community hub.', color:'#CC0000' },
  { icon:'👕', title:'Merch Store', desc:'Exclusive drops & Rev Points loyalty.', color:'#FFD700' },
]

export default function Home() {
  return (
    <main style={{ background:'#0E1825', minHeight:'100vh', color:'white' }}>

      {/* ═══ HERO ═══ */}
      <section style={{ position:'relative', textAlign:'center', padding:'5rem 2rem 3rem', overflow:'hidden', background:'linear-gradient(180deg, #0A1220 0%, #112035 50%, #0E1825 100%)' }}>
        {/* Chrome vertical lines */}
        {[10,25,42,58,75,90].map((l,i) => (
          <div key={i} style={{ position:'absolute', top:0, bottom:0, left:`${l}%`, width:'1px', background:`linear-gradient(180deg,transparent,rgba(192,192,192,${0.04+i*0.01}),rgba(255,215,0,0.02),transparent)`, pointerEvents:'none' }} />
        ))}
        {/* Royal blue glow top */}
        <div style={{ position:'absolute', top:'-60px', left:'30%', width:'300px', height:'200px', background:'radial-gradient(ellipse, rgba(34,85,238,0.2), transparent 70%)', pointerEvents:'none' }} />
        {/* Red glow right */}
        <div style={{ position:'absolute', top:'20%', right:'5%', width:'250px', height:'250px', background:'radial-gradient(ellipse, rgba(204,0,0,0.12), transparent 70%)', pointerEvents:'none' }} />
        {/* Gold glow center */}
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:'400px', height:'300px', background:'radial-gradient(ellipse, rgba(255,215,0,0.1), transparent 70%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'linear-gradient(135deg, rgba(204,0,0,0.15), rgba(255,215,0,0.08))', border:'1px solid rgba(255,215,0,0.3)', borderRadius:'9999px', padding:'0.375rem 1.25rem', fontSize:'0.875rem', color:'#FFD700', marginBottom:'2rem', fontWeight:700, letterSpacing:'0.5px' }}>
            🏁 Now in Early Access
          </div>

          <h1 style={{ fontSize:'clamp(4rem,11vw,8rem)', fontWeight:900, margin:'0 0 1.5rem', letterSpacing:'-4px', lineHeight:0.88 }}>
            <span style={{ color:'white' }}>Rev</span>
            <span className="chrome-text">Connect</span>
            <span style={{ color:'#FFD700', textShadow:'0 0 40px rgba(255,215,0,0.6), 0 0 80px rgba(255,215,0,0.3)' }}>-1</span>
          </h1>

          <p style={{ fontSize:'1.375rem', color:'#7090B0', maxWidth:'580px', margin:'0 auto 0.75rem', lineHeight:1.5 }}>
            The ultimate all-in-one platform for car enthusiasts.
          </p>
          <p style={{ color:'#3A5070', marginBottom:'2.5rem' }}>Community · Commerce · AI-powered assistance · Real-world utility</p>

          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'3.5rem' }}>
            <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000 0%, #AA0000 100%)', color:'white', padding:'1.125rem 2.5rem', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.125rem', boxShadow:'0 4px 30px rgba(204,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)', textDecoration:'none', letterSpacing:'0.25px' }}>
              Join the Community
            </Link>
            <Link href="/garage" style={{ background:'rgba(34,85,238,0.1)', border:'1px solid rgba(34,85,238,0.4)', color:'#6699FF', padding:'1.125rem 2.5rem', borderRadius:'0.875rem', fontWeight:600, fontSize:'1.125rem', textDecoration:'none' }}>
              Explore Platform
            </Link>
          </div>

          {/* Stats — chrome style */}
          <div style={{ display:'flex', justifyContent:'center', gap:'3rem', flexWrap:'wrap' }}>
            {[['10+','AI Features'],['24/7','AI Mechanic'],['1M+','Live Listings'],['30+','Insurers']].map(([num, label]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <p className="chrome-text" style={{ fontSize:'2rem', fontWeight:900 }}>{num}</p>
                <p style={{ fontSize:'0.75rem', color:'#3A5070', marginTop:'0.25rem', letterSpacing:'0.5px', textTransform:'uppercase' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome divider */}
      <div style={{ height:'2px', background:'linear-gradient(90deg, transparent 0%, #555 15%, #fff 30%, #CC0000 50%, #fff 70%, #555 85%, transparent 100%)' }} />

      {/* ═══ MUSTANG SHOWCASE ═══ */}
      <section style={{ padding:'4rem 2rem', background:'linear-gradient(180deg, #0E1825, #112035, #0E1825)' }}>
        <div style={{ maxWidth:'1300px', margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:'2.5rem' }}>
            <h2 style={{ fontSize:'2rem', fontWeight:900, letterSpacing:'-1px', marginBottom:'0.5rem' }}>
              <span className="chrome-text">Mustang</span>{' '}
              <span style={{ color:'#CC0000' }}>Through the Ages</span>
            </h2>
            <p style={{ color:'#3A5070' }}>60 years of American muscle — track every era in your Digital Garage</p>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'1rem' }}>
            {MUSTANGS.map(m => (
              <div key={m.year} className="mustang-card chrome-border" style={{ borderRadius:'0.875rem', overflow:'hidden', background:'#152234', cursor:'pointer' }}>
                <div style={{ position:'relative', height:'140px', overflow:'hidden' }}>
                  <img
                    src={m.url}
                    alt={`${m.year} Ford Mustang ${m.name}`}
                    style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }}
                  />
                  {/* Chrome overlay gradient */}
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, transparent 40%, rgba(21,34,52,0.9) 100%)' }} />
                  <div style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:`${m.color}`, borderRadius:'9999px', padding:'0.15rem 0.5rem', fontSize:'0.7rem', fontWeight:700, color:'white' }}>{m.year}</div>
                </div>
                <div style={{ padding:'0.75rem 1rem' }}>
                  <p style={{ fontWeight:700, fontSize:'0.9rem', color:'white' }}>{m.name}</p>
                  <p style={{ fontSize:'0.75rem', color:'#3A5070', marginTop:'0.125rem' }}>Ford Mustang {m.year}</p>
                  <div style={{ height:'2px', background:`linear-gradient(90deg,${m.color},transparent)`, borderRadius:'9999px', marginTop:'0.625rem' }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign:'center', marginTop:'2rem' }}>
            <Link href="/garage" style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(204,0,0,0.08)', border:'1px solid rgba(204,0,0,0.25)', color:'#FF4444', padding:'0.75rem 1.75rem', borderRadius:'0.75rem', fontWeight:600, textDecoration:'none' }}>
              Add Your Mustang to the Garage →
            </Link>
          </div>
        </div>
      </section>

      {/* Chrome divider */}
      <div style={{ height:'1px', background:'linear-gradient(90deg, transparent, #2255EE40, #FFD70040, #CC000040, #FFD70040, #2255EE40, transparent)' }} />

      {/* ═══ FEATURES ═══ */}
      <section style={{ padding:'4rem 2rem', maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <h2 style={{ fontSize:'2.25rem', fontWeight:900, letterSpacing:'-1px', marginBottom:'0.75rem' }}>Everything Enthusiasts Need</h2>
          <p style={{ color:'#3A5070', fontSize:'1rem' }}>10 purpose-built AI agents · one seamless platform</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1.25rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} className="mustang-card" style={{ background:'linear-gradient(135deg, #152234, #112030)', border:`1px solid ${f.color}25`, borderRadius:'1rem', padding:'1.5rem', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, transparent, ${f.color}, transparent)` }} />
              <div style={{ position:'absolute', top:'-15px', right:'-15px', width:'70px', height:'70px', background:`radial-gradient(ellipse, ${f.color}18, transparent 70%)`, borderRadius:'50%' }} />
              <div style={{ fontSize:'2rem', marginBottom:'0.875rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:800, marginBottom:'0.5rem', fontSize:'1.05rem', color:'white' }}>{f.title}</h3>
              <p style={{ color:'#5070A0', fontSize:'0.875rem', lineHeight:1.6 }}>{f.desc}</p>
              <div style={{ height:'2px', background:`linear-gradient(90deg, ${f.color}, transparent)`, borderRadius:'9999px', marginTop:'1.25rem' }} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section style={{ padding:'5rem 2rem', textAlign:'center', background:'linear-gradient(180deg, #0E1825, #112035)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'700px', height:'400px', background:'radial-gradient(ellipse, rgba(204,0,0,0.08) 0%, rgba(34,85,238,0.06) 50%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div className="sun-glow" style={{ width:'72px', height:'72px', background:'linear-gradient(135deg, #CC0000, #FF4444)', borderRadius:'50%', margin:'0 auto 2rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.875rem' }}>🏎️</div>
          <h2 style={{ fontSize:'2.5rem', fontWeight:900, marginBottom:'1rem', letterSpacing:'-1px' }}>Ready to Rev Up?</h2>
          <p style={{ color:'#3A5070', marginBottom:'2rem', fontSize:'1.0625rem' }}>Join thousands of enthusiasts on the only platform built for the culture.</p>
          <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'1.125rem 2.75rem', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.125rem', textDecoration:'none', boxShadow:'0 4px 30px rgba(204,0,0,0.4), 0 0 60px rgba(204,0,0,0.15)', letterSpacing:'0.25px', display:'inline-block' }}>
            Join RevConnect-1 Free →
          </Link>
        </div>
      </section>

    </main>
  )
}
