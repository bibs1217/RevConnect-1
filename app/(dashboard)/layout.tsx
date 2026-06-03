'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'

const NAV = [
  { href:'/garage', icon:'🚗', label:'Garage', color:'#FF4500' },
  { href:'/events', icon:'📍', label:'Events', color:'#0099FF' },
  { href:'/car-search', icon:'🔍', label:'Buy a Car', color:'#00C8FF' },
  { href:'/parts', icon:'🔩', label:'Parts', color:'#FF4500' },
  { href:'/mechanic', icon:'🔧', label:'AI Mechanic', color:'#FFD700' },
  { href:'/car-wash', icon:'🚿', label:'Car Wash', color:'#0099FF' },
  { href:'/auctions', icon:'🏁', label:'Auctions', color:'#FFD700' },
  { href:'/insurance', icon:'🛡️', label:'Insurance', color:'#00C8FF' },
  { href:'/vendors', icon:'🏪', label:'Vendors', color:'#FF8C42' },
  { href:'/store', icon:'👕', label:'Store', color:'#FFD700' },
  { href:'/membership', icon:'⚡', label:'Membership', color:'#FFD700' },
  { href:'/admin', icon:'⚙️', label:'Admin', color:'#C0C0C0' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#030B1A', display:'flex', flexDirection:'column' }}>
      {/* Top Nav — chrome bar */}
      <header style={{ background:'rgba(3,11,26,0.97)', backdropFilter:'blur(16px)', borderBottom:'1px solid transparent', backgroundImage:'linear-gradient(rgba(3,11,26,0.97),rgba(3,11,26,0.97)), linear-gradient(90deg,transparent,rgba(192,192,192,0.15),rgba(255,215,0,0.1),rgba(192,192,192,0.15),transparent)', backgroundOrigin:'border-box', backgroundClip:'padding-box, border-box', padding:'0 1.5rem', height:'4rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>

        {/* Logo */}
        <Link href="/" style={{ fontSize:'1.25rem', fontWeight:900, letterSpacing:'-0.5px', display:'flex', alignItems:'center', gap:'0.1rem' }}>
          <span style={{ color:'white' }}>Rev</span>
          <span className="chrome-text" style={{ fontSize:'1.25rem' }}>Connect</span>
          <span style={{ color:'#FFD700', textShadow:'0 0 10px rgba(255,215,0,0.4)' }}>-1</span>
        </Link>

        {/* Search */}
        <div style={{ flex:1, maxWidth:'420px', margin:'0 2rem', display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(0,150,255,0.05)', border:'1px solid rgba(0,150,255,0.15)', borderRadius:'0.75rem', padding:'0.5rem 1rem' }}>
          <span style={{ color:'#00C8FF', fontSize:'0.9rem' }}>🔍</span>
          <input placeholder="Search cars, parts, events, builds…" style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
        </div>

        {/* Auth */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <>
              <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:'9999px', padding:'0.25rem 0.875rem', fontSize:'0.75rem', color:'#FFD700', fontWeight:700 }}>
                ⚡ {profile?.rev_points ?? 0} pts
              </div>
              <span style={{ color:'#7090B0', fontSize:'0.875rem' }}>@{profile?.username ?? user.email?.split('@')[0]}</span>
              <button onClick={handleSignOut} style={{ background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.2)', color:'#C0C0C0', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color:'#7090B0', fontSize:'0.875rem' }}>Sign In</Link>
              <Link href="/register" style={{ background:'linear-gradient(135deg, #FF4500, #FF6B00)', color:'white', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontSize:'0.875rem', fontWeight:700, boxShadow:'0 2px 12px rgba(255,69,0,0.3)' }}>Join Free</Link>
            </>
          )}
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:'220px', background:'linear-gradient(180deg, #040E1F, #030B1A)', borderRight:'1px solid rgba(192,192,192,0.08)', padding:'1rem 0.75rem', position:'sticky', top:'4rem', height:'calc(100vh - 4rem)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <nav style={{ display:'flex', flexDirection:'column', gap:'0.2rem', flex:1 }}>
            {NAV.map(n => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.75rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight: active ? 700 : 400, background: active ? `${n.color}12` : 'transparent', color: active ? n.color : '#5A7090', border: active ? `1px solid ${n.color}30` : '1px solid transparent', transition:'all 0.15s' }}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>

          {/* Rev Points — chrome card */}
          <div className="chrome-border" style={{ borderRadius:'0.875rem', padding:'1rem', marginTop:'1rem', background:'linear-gradient(135deg, rgba(255,69,0,0.08), rgba(255,215,0,0.05))', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:'-10px', right:'-10px', width:'60px', height:'60px', background:'radial-gradient(ellipse, rgba(255,215,0,0.15), transparent 70%)', borderRadius:'50%' }} />
            <p style={{ fontSize:'0.7rem', color:'#5A7090', marginBottom:'0.25rem' }}>Rev Points</p>
            <p style={{ fontSize:'1.5rem', fontWeight:900, color:'white' }}>{profile?.rev_points ?? 0}</p>
            <p style={{ fontSize:'0.7rem', color:'#FFD700', marginTop:'0.25rem', fontWeight:700, textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'} Tier</p>
            <div style={{ height:'3px', background:'rgba(0,0,0,0.3)', borderRadius:'9999px', marginTop:'0.75rem', overflow:'hidden' }}>
              <div style={{ height:'100%', width:'35%', background:'linear-gradient(90deg, #FF4500, #FFD700, #FF8C42)', borderRadius:'9999px' }} />
            </div>
          </div>
        </aside>

        <main style={{ flex:1, padding:'2rem', overflowX:'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
