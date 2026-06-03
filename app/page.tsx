import Link from 'next/link'

const FEATURES = [
  { icon:'📍', title:'Car Meets & Events', desc:'GPS-powered event discovery, club management, QR check-ins.', color:'#2563EB' },
  { icon:'🏪', title:'Vendor Marketplace', desc:'Geo-targeted ads from performance shops and detailers.', color:'#E63946' },
  { icon:'🔍', title:'Car Search Engine', desc:'Live dealer inventory from Marketcheck — real listings, real prices.', color:'#2563EB' },
  { icon:'🔩', title:'Parts Search', desc:'Price comparison across AutoZone, Summit, RockAuto and more.', color:'#E63946' },
  { icon:'🔧', title:'AI Mechanic', desc:'Your personal ASE master tech available 24/7.', color:'#FACC15' },
  { icon:'🚿', title:'Car Wash Locator', desc:'Find coating-safe washes with community damage reports.', color:'#2563EB' },
  { icon:'🏁', title:'Auction Intelligence', desc:'Every auction in one place with all-in cost calculator.', color:'#FACC15' },
  { icon:'🛡️', title:'Insurance Quotes', desc:'Real-time quotes from 30+ carriers including Hagerty.', color:'#2563EB' },
  { icon:'🚗', title:'Digital Garage', desc:'Complete build documentation and community social hub.', color:'#E63946' },
  { icon:'👕', title:'Merch Store', desc:'Exclusive drops and the Rev Points loyalty program.', color:'#FACC15' },
]

export default function Home() {
  return (
    <main style={{ background:'#050A14', minHeight:'100vh', color:'white' }}>
      {/* Hero */}
      <section style={{ textAlign:'center', padding:'6rem 2rem 5rem', position:'relative', overflow:'hidden' }}>
        {/* Background glow effects */}
        <div style={{ position:'absolute', top:'-100px', left:'50%', transform:'translateX(-50%)', width:'600px', height:'400px', background:'radial-gradient(ellipse, rgba(230,57,70,0.15) 0%, rgba(37,99,235,0.08) 50%, transparent 70%)', pointerEvents:'none' }} />
        
        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'0.5rem', background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.2)', borderRadius:'9999px', padding:'0.375rem 1rem', fontSize:'0.875rem', color:'#FACC15', marginBottom:'2rem', fontWeight:600 }}>
            🔥 Now in Early Access
          </div>

          <h1 style={{ fontSize:'clamp(3.5rem,9vw,6rem)', fontWeight:900, margin:'0 0 1.5rem', lineHeight:0.95, letterSpacing:'-2px' }}>
            <span style={{ color:'white' }}>Rev</span>
            <span style={{ color:'#E63946' }}>Connect</span>
            <span style={{ color:'#FACC15' }}>-1</span>
          </h1>

          <p style={{ fontSize:'1.375rem', color:'#CBD5E1', maxWidth:'580px', margin:'0 auto 1rem', lineHeight:1.5 }}>
            The ultimate all-in-one platform for car enthusiasts.
          </p>
          <p style={{ color:'#64748B', marginBottom:'2.5rem', fontSize:'1rem' }}>
            Community · Commerce · AI-powered assistance · Real-world utility
          </p>

          <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" style={{ background:'linear-gradient(135deg, #E63946, #C41530)', color:'white', padding:'1rem 2.25rem', borderRadius:'0.875rem', textDecoration:'none', fontWeight:800, fontSize:'1.125rem', boxShadow:'0 4px 24px rgba(230,57,70,0.35)', border:'1px solid rgba(255,255,255,0.1)' }}>
              Join the Community
            </Link>
            <Link href="/garage" style={{ border:'1px solid #1E3A5F', color:'white', padding:'1rem 2.25rem', borderRadius:'0.875rem', textDecoration:'none', fontWeight:600, fontSize:'1.125rem', background:'rgba(37,99,235,0.08)' }}>
              Explore Platform
            </Link>
          </div>

          {/* Stats bar */}
          <div style={{ display:'flex', justifyContent:'center', gap:'3rem', marginTop:'4rem', flexWrap:'wrap' }}>
            {[['10+','AI-Powered Features'],['24/7','AI Mechanic'],['30+','Insurance Carriers'],['1M+','Live Listings']].map(([num, label]) => (
              <div key={label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:'1.75rem', fontWeight:900, color:'#FACC15' }}>{num}</p>
                <p style={{ fontSize:'0.75rem', color:'#64748B', marginTop:'0.25rem' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div style={{ height:'1px', background:'linear-gradient(90deg, transparent, #1E3A5F 30%, #E63946 50%, #1E3A5F 70%, transparent)' }} />

      {/* Features */}
      <section style={{ padding:'5rem 2rem', maxWidth:'1200px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'3rem' }}>
          <h2 style={{ fontSize:'2.25rem', fontWeight:900, marginBottom:'0.75rem', letterSpacing:'-1px' }}>Everything Enthusiasts Need</h2>
          <p style={{ color:'#64748B', fontSize:'1.125rem' }}>10 purpose-built AI agents — one seamless platform</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1.25rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background:'#0A1628', border:`1px solid ${f.color}20`, borderRadius:'1rem', padding:'1.5rem', transition:'all 0.2s', position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, right:0, width:'80px', height:'80px', background:`radial-gradient(ellipse at top right, ${f.color}12, transparent)`, pointerEvents:'none' }} />
              <div style={{ fontSize:'2rem', marginBottom:'0.875rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight:800, marginBottom:'0.5rem', fontSize:'1.05rem', color:'white' }}>{f.title}</h3>
              <p style={{ color:'#64748B', fontSize:'0.875rem', lineHeight:1.6, margin:0 }}>{f.desc}</p>
              <div style={{ height:'2px', background:`linear-gradient(90deg, ${f.color}, transparent)`, borderRadius:'9999px', marginTop:'1.25rem' }} />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'4rem 2rem', textAlign:'center', background:'linear-gradient(180deg, #050A14, #0A1628)' }}>
        <h2 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'1rem' }}>Ready to Rev Up?</h2>
        <p style={{ color:'#64748B', marginBottom:'2rem' }}>Join thousands of car enthusiasts on the only platform built for the culture.</p>
        <Link href="/register" style={{ background:'linear-gradient(135deg, #E63946, #C41530)', color:'white', padding:'1rem 2.5rem', borderRadius:'0.875rem', fontWeight:800, fontSize:'1.125rem', textDecoration:'none', boxShadow:'0 4px 24px rgba(230,57,70,0.4)' }}>
          Join RevConnect-1 Free →
        </Link>
      </section>
    </main>
  )
}
