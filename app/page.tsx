import Link from 'next/link'

const FEATURES = [
  { icon:'📍', title:'Car Meets & Events', desc:'GPS-powered discovery, club management, QR check-ins.', color:'#0099FF' },
  { icon:'🏪', title:'Vendor Marketplace', desc:'Geo-targeted performance shops, detailers & more.', color:'#FF4500' },
  { icon:'🔍', title:'Car Search Engine', desc:'Live dealer + eBay Motors inventory in one search.', color:'#0099FF' },
  { icon:'🔩', title:'Parts Search', desc:'Real-time price comparison across 15+ retailers.', color:'#FF4500' },
  { icon:'🔧', title:'AI Mechanic', desc:'Personal ASE master tech, available 24/7.', color:'#FFD700' },
  { icon:'🚿', title:'Car Wash Locator', desc:'Ceramic & PPF-safe washes near you.', color:'#00C8FF' },
  { icon:'🏁', title:'Auction Intelligence', desc:'Every auction with all-in cost calculator.', color:'#FFD700' },
  { icon:'🛡️', title:'Insurance Quotes', desc:'30+ carriers — Hagerty, Grundy & more.', color:'#0099FF' },
  { icon:'🚗', title:'Digital Garage', desc:'Build documentation & community social hub.', color:'#FF4500' },
  { icon:'👕', title:'Merch Store', desc:'Exclusive drops & Rev Points loyalty program.', color:'#FFD700' },
]

export default function Home() {
  return (
    <main style={{ background:'#030B1A', minHeight:'100vh', color:'white', overflow:'hidden' }}>

      {/* Hero */}
      <section style={{ position:'relative', textAlign:'center', padding:'5rem 2rem 4rem', overflow:'hidden' }}>
        {/* Ocean gradient background */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg, #000D1F 0%, #001F3F 40%, #030B1A 100%)', zIndex:0 }} />

        {/* Sun glow */}
        <div style={{ position:'absolute', top:'-80px', left:'50%', transform:'translateX(-50%)', width:'500px', height:'400px', background:'radial-gradient(ellipse, rgba(255,215,0,0.18) 0%, rgba(255,69,0,0.1) 40%, transparent 70%)', zIndex:1, pointerEvents:'none' }} />

        {/* Horizon line - beach effect */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, transparent, #00C8FF 20%, #0099FF 50%, #00C8FF 80%, transparent)', zIndex:1 }} />

        {/* Chrome speed lines */}
        {[15, 30, 55, 70, 85].map((left, i) => (
          <div key={i} style={{ position:'absolute', top:0, bottom:0, left:`${left}%`, width:'1px', background:`linear-gradient(180deg, transparent, rgba(192,192,192,${0.03 + i*0.01}), transparent)`, zIndex:1 }} />
        ))}

        <div style={{ position:'relative', zIndex:2 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'9999px', padding:'0.375rem 1.25rem', fontSize:'0.875rem', color:'#FFD700', marginBottom:'2rem', fontWeight:600 }}>
            🏁 Now in Early Access
          </div>

          {/* Logo with chrome effect */}
          <h1 style={{ fontSize:'clamp(4rem,10vw,7rem)', fontWeight:900, margin:'0 0 1.5rem', letterSpacing:'-3px', lineHeight:0.9 }}>
            <span style={{ color:'white' }}>Rev</span>
            <span className="chrome-text">Connect</span>
            <span style={{ color:'#FFD700', textShadow:'0 0 30px rgba(255,215,0,0.5)' }}>-1</span>
          </h1>

          <p style={{ fontSize:'1.375rem', color:'#B8D4E8', maxWidth:'600px', margin:'0 auto 0.75rem', lineHeight:1.5 }}>
            The ultimate all-in-one platform for car enthusiasts.
          </p>
          <p style={{ color:'#4A6F8A', marginBottom:'2.5rem' }}>
            Community · Commerce · AI-powered assistance · Real-world utility
          </p>

          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap', marginBottom:'3rem' }}>
            <Link href="/register" style={{ background:'linear-gradient(135deg, #FF4500 0%, #FF6B00 100%)', color:'white', padding:'1rem 2.25rem', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.125rem', boxShadow:'0 4px 30px rgba(255,69,0,0.4), 0 0 0 1px rgba(255,150,50,0.2)', textDecoration:'none', position:'relative', overflow:'hidden' }}>
              <span style={{ position:'relative', zIndex:1 }}>Join the Community</span>
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)', zIndex:0 }} />
            </Link>
            <Link href="/garage" style={{ border:'1px solid rgba(0,200,255,0.3)', color:'#00C8FF', padding:'1rem 2.25rem', borderRadius:'0.875rem', fontWeight:600, fontSize:'1.125rem', background:'rgba(0,200,255,0.05)', textDecoration:'none' }}>
              Explore Platform
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', justifyContent:'center', gap:'2.5rem', flexWrap:'wrap' }}>
            {[['10+','AI Features'],['24/7','AI Mechanic'],['1M+','Live Listings'],['30+','Insurers']].map(([num, label]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:'1.75rem', fontWeight:900, background:'linear-gradient(135deg, #FFD700, #FF8C42)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>{num}</p>
                <p style={{ fontSize:'0.75rem', color:'#4A6F8A', marginTop:'0.125rem' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ocean wave divider */}
      <div style={{ height:'60px', background:'linear-gradient(180deg, #001F3F, #030B1A)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', bottom:0, left:'-10%', right:'-10%', height:'40px', background:'rgba(0,150,255,0.08)', borderRadius:'50%', transform:'scaleX(1.2)' }} />
      </div>

      {/* Features */}
      <section style={{ padding:'4rem 2rem', maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <h2 style={{ fontSize:'2.25rem', fontWeight:900, letterSpacing:'-1px', marginBottom:'0.75rem' }}>
            Everything Enthusiasts Need
          </h2>
          <p style={{ color:'#4A6F8A', fontSize:'1.0625rem' }}>10 purpose-built AI agents · one seamless platform</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(270px, 1fr))', gap:'1.25rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} className="chrome-border" style={{ borderRadius:'1rem', padding:'1.5rem', background:'#071428', position:'relative', overflow:'hidden', transition:'transform 0.2s' }}>
              {/* Shimmer top edge */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:`linear-gradient(90deg, transparent, ${f.color}60, transparent)` }} />
              {/* Corner glow */}
              <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'80px', height:'80px', background:`radial-gradient(ellipse, ${f.color}15, transparent 70%)`, borderRadius:'50%' }} />

              <div style={{ fontSize:'2rem', marginBottom:'0.875rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:800, marginBottom:'0.5rem', fontSize:'1.05rem' }}>{f.title}</h3>
              <p style={{ color:'#4A6F8A', fontSize:'0.875rem', lineHeight:1.6 }}>{f.desc}</p>
              <div style={{ height:'2px', background:`linear-gradient(90deg, ${f.color}, transparent)`, borderRadius:'9999px', marginTop:'1.25rem' }} />
            </div>
          ))}
        </div>
      </section>

      {/* Beach sunset CTA */}
      <section style={{ padding:'5rem 2rem', textAlign:'center', background:'linear-gradient(180deg, #030B1A 0%, #0A1A2E 50%, #030B1A 100%)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'600px', height:'300px', background:'radial-gradient(ellipse, rgba(255,140,66,0.08) 0%, rgba(255,69,0,0.05) 40%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'relative', zIndex:1 }}>
          <div className="sun-glow" style={{ width:'80px', height:'80px', background:'linear-gradient(135deg, #FFD700, #FF8C42)', borderRadius:'50%', margin:'0 auto 2rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2rem' }}>🏎️</div>
          <h2 style={{ fontSize:'2.25rem', fontWeight:900, marginBottom:'1rem', letterSpacing:'-1px' }}>Ready to Rev Up?</h2>
          <p style={{ color:'#4A6F8A', marginBottom:'2rem', fontSize:'1.0625rem' }}>Join thousands of enthusiasts on the only platform built for the culture.</p>
          <Link href="/register" style={{ background:'linear-gradient(135deg, #FF4500, #FF8C42)', color:'white', padding:'1.125rem 2.75rem', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.125rem', textDecoration:'none', boxShadow:'0 4px 30px rgba(255,69,0,0.35), 0 0 60px rgba(255,140,66,0.15)', display:'inline-block' }}>
            Join RevConnect-1 Free →
          </Link>
        </div>
      </section>

    </main>
  )
}
