import Link from 'next/link'

const FEATURES = [
  { icon: '📍', title: 'Car Meets & Events', desc: 'GPS-powered event discovery, club management, QR check-ins.' },
  { icon: '🏪', title: 'Vendor Marketplace', desc: 'Geo-targeted ads from performance shops and detailers.' },
  { icon: '🔍', title: 'Car Search Engine', desc: 'Aggregated listings from dealers, Carvana, BaT, eBay and more.' },
  { icon: '🔩', title: 'Parts Search', desc: 'Price comparison across AutoZone, Summit, RockAuto and more.' },
  { icon: '🔧', title: 'AI Mechanic', desc: 'Your personal ASE master tech available 24/7.' },
  { icon: '🚿', title: 'Car Wash Locator', desc: 'Find coating-safe washes with community damage reports.' },
  { icon: '🏁', title: 'Auction Intelligence', desc: 'Every auction in one place with all-in cost calculator.' },
  { icon: '🛡️', title: 'Insurance Quotes', desc: 'Real-time quotes from 30+ carriers including Hagerty.' },
  { icon: '🚗', title: 'Digital Garage', desc: 'Complete build documentation and community social hub.' },
  { icon: '👕', title: 'Merch Store', desc: 'Exclusive drops and the Rev Points loyalty program.' },
]

export default function Home() {
  return (
    <main style={{ background: '#0D0D0D', minHeight: '100vh', color: 'white' }}>
      {/* Hero */}
      <section style={{ textAlign: 'center', padding: '6rem 2rem', background: 'linear-gradient(180deg, #1a0a0a 0%, #0D0D0D 100%)' }}>
        <div style={{ display: 'inline-block', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: '9999px', padding: '0.375rem 1rem', fontSize: '0.875rem', color: '#E63946', marginBottom: '1.5rem' }}>
          🔥 Now in Early Access
        </div>
        <h1 style={{ fontSize: 'clamp(3rem,8vw,5rem)', fontWeight: 900, margin: '0 0 1.5rem', lineHeight: 1 }}>
          <span style={{ color: 'white' }}>Rev</span><span style={{ color: '#E63946' }}>Connect</span><span style={{ color: '#F4A261' }}>-1</span>
        </h1>
        <p style={{ fontSize: '1.25rem', color: '#ccc', maxWidth: '600px', margin: '0 auto 1rem' }}>
          The ultimate all-in-one platform for car enthusiasts.
        </p>
        <p style={{ color: '#777', marginBottom: '2.5rem' }}>
          Community, commerce, AI-powered assistance, and real-world utility — all in one place.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/register" style={{ background: '#E63946', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 700, fontSize: '1.125rem' }}>
            Join the Community
          </Link>
          <Link href="/garage" style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '1rem 2rem', borderRadius: '0.75rem', textDecoration: 'none', fontWeight: 600, fontSize: '1.125rem' }}>
            Explore
          </Link>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 800, marginBottom: '0.75rem' }}>Everything Enthusiasts Need</h2>
        <p style={{ textAlign: 'center', color: '#777', marginBottom: '3rem' }}>10 purpose-built AI agents, one seamless platform.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '1rem', padding: '1.5rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.125rem' }}>{f.title}</h3>
              <p style={{ color: '#888', fontSize: '0.875rem', margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
