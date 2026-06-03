import Link from 'next/link'

const NAV = [
  { href: '/garage', label: '🚗 Garage' },
  { href: '/events', label: '📍 Events' },
  { href: '/car-search', label: '🔍 Car Search' },
  { href: '/parts', label: '🔩 Parts' },
  { href: '/mechanic', label: '🔧 Mechanic' },
  { href: '/car-wash', label: '🚿 Car Wash' },
  { href: '/auctions', label: '🏁 Auctions' },
  { href: '/insurance', label: '🛡️ Insurance' },
  { href: '/vendors', label: '🏪 Vendors' },
  { href: '/store', label: '👕 Store' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', flexDirection: 'column' }}>
      <header style={{ background: '#0D0D0D', borderBottom: '1px solid #1a1a2e', padding: '0 1.5rem', height: '4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <Link href="/" style={{ textDecoration: 'none', fontSize: '1.25rem', fontWeight: 900 }}>
          <span style={{ color: 'white' }}>Rev</span><span style={{ color: '#E63946' }}>Connect</span><span style={{ color: '#F4A261' }}>-1</span>
        </Link>
        <nav style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {NAV.map(n => <Link key={n.href} href={n.href} style={{ color: '#aaa', textDecoration: 'none', fontSize: '0.875rem' }}>{n.label}</Link>)}
        </nav>
        <Link href="/login" style={{ background: '#E63946', color: 'white', padding: '0.5rem 1rem', borderRadius: '0.5rem', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 600 }}>Sign In</Link>
      </header>
      <main style={{ flex: 1, padding: '2rem' }}>{children}</main>
    </div>
  )
}
