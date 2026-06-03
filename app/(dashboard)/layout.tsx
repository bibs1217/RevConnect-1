'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'

const NAV = [
  { href:'/garage', icon:'🚗', label:'Garage', color:'#CC0000' },
  { href:'/events', icon:'📍', label:'Events', color:'#2255EE' },
  { href:'/car-search', icon:'🔍', label:'Buy a Car', color:'#3399FF' },
  { href:'/parts', icon:'🔩', label:'Parts', color:'#CC0000' },
  { href:'/mechanic', icon:'🔧', label:'AI Mechanic', color:'#FFD700' },
  { href:'/car-wash', icon:'🚿', label:'Car Wash', color:'#2255EE' },
  { href:'/auctions', icon:'🏁', label:'Auctions', color:'#FFD700' },
  { href:'/insurance', icon:'🛡️', label:'Insurance', color:'#3399FF' },
  { href:'/vendors', icon:'🏪', label:'Vendors', color:'#CC0000' },
  { href:'/store', icon:'👕', label:'Store', color:'#FFD700' },
  { href:'/membership', icon:'⚡', label:'Membership', color:'#FFD700' },
  { href:'/admin', icon:'⚙️', label:'Admin', color:'#C0C0C0' },
]

// Mini Mustang images for sidebar accent
const SIDEBAR_MUSTANG = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=400&q=80'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  async function handleSignOut() {
    await signOut()
    router.push('/')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0E1825', display:'flex', flexDirection:'column' }}>
      {/* Nav — chrome gradient border */}
      <header style={{
        background:'rgba(14,24,37,0.97)', backdropFilter:'blur(16px)',
        borderBottom:'2px solid #CC0000',
        padding:'0 1.5rem', height:'4rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50,
        boxShadow:'0 4px 20px rgba(0,0,0,0.4), 0 2px 0 #CC000050'
      }}>
        <Link href="/" style={{ fontSize:'1.25rem', fontWeight:900, letterSpacing:'-0.5px', display:'flex', alignItems:'center' }}>
          <span style={{ color:'white' }}>Rev</span>
          <span className="chrome-text" style={{ fontSize:'1.25rem' }}>Connect</span>
          <span style={{ color:'#FFD700', textShadow:'0 0 12px rgba(255,215,0,0.5)' }}>-1</span>
        </Link>

        <div style={{ flex:1, maxWidth:'420px', margin:'0 2rem', display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(34,85,238,0.06)', border:'1px solid rgba(34,85,238,0.15)', borderRadius:'0.75rem', padding:'0.5rem 1rem' }}>
          <span style={{ color:'#3399FF', fontSize:'0.9rem' }}>🔍</span>
          <input placeholder="Search cars, parts, events, builds…" style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <>
              <div style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'9999px', padding:'0.25rem 0.875rem', fontSize:'0.75rem', color:'#FFD700', fontWeight:700 }}>
                ⚡ {profile?.rev_points ?? 0} pts
              </div>
              <span style={{ color:'#5070A0', fontSize:'0.875rem' }}>@{profile?.username ?? user.email?.split('@')[0]}</span>
              <button onClick={handleSignOut} style={{ background:'rgba(192,192,192,0.08)', border:'1px solid rgba(192,192,192,0.2)', color:'#C0C0C0', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color:'#5070A0', fontSize:'0.875rem' }}>Sign In</Link>
              <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontSize:'0.875rem', fontWeight:700, boxShadow:'0 2px 12px rgba(204,0,0,0.35)' }}>Join Free</Link>
            </>
          )}
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:'224px', background:'linear-gradient(180deg, #0A1520, #0E1825)', borderRight:'1px solid rgba(255,255,255,0.06)', padding:'1rem 0.75rem', position:'sticky', top:'4rem', height:'calc(100vh - 4rem)', overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Mustang accent image */}
          <div style={{ borderRadius:'0.75rem', overflow:'hidden', marginBottom:'1rem', position:'relative', height:'90px' }}>
            <img src={SIDEBAR_MUSTANG} alt="Mustang" style={{ width:'100%', height:'100%', objectFit:'cover' }}
              onError={e => { (e.currentTarget.parentElement as HTMLElement).style.background='linear-gradient(135deg, rgba(204,0,0,0.2),rgba(21,34,52,1))'; e.currentTarget.style.display='none' }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(14,24,37,0.6), transparent, rgba(14,24,37,0.6))' }} />
            <div style={{ position:'absolute', bottom:'0.5rem', left:'0.75rem' }}>
              <p style={{ fontSize:'0.6rem', color:'rgba(255,215,0,0.9)', fontWeight:700, letterSpacing:'1px', textTransform:'uppercase' }}>RevConnect-1</p>
            </div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:'0.2rem', flex:1 }}>
            {NAV.map(n => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} className="nav-glow" style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.75rem', borderRadius:'0.625rem', fontSize:'0.875rem', fontWeight: active ? 700 : 400, background: active ? `${n.color}15` : 'transparent', color: active ? n.color : '#4A6A90', borderLeft: active ? `3px solid ${n.color}` : '3px solid transparent', paddingLeft: active ? '0.5rem' : '0.75rem', transition:'all 0.15s' }}>
                  <span style={{ fontSize:'1rem' }}>{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>

          {/* Rev Points card */}
          <div style={{ marginTop:'1rem', borderRadius:'0.875rem', padding:'1rem', background:'linear-gradient(135deg, rgba(204,0,0,0.1), rgba(34,85,238,0.08))', border:'1px solid rgba(255,215,0,0.15)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg, #CC0000, #FFD700, #2255EE)' }} />
            <p style={{ fontSize:'0.65rem', color:'#3A5070', marginBottom:'0.25rem', letterSpacing:'0.5px', textTransform:'uppercase' }}>Rev Points</p>
            <p className="chrome-text" style={{ fontSize:'1.625rem', fontWeight:900 }}>{profile?.rev_points ?? 0}</p>
            <p style={{ fontSize:'0.7rem', color:'#FFD700', marginTop:'0.25rem', fontWeight:700, textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'} Tier</p>
            <div style={{ height:'3px', background:'rgba(0,0,0,0.3)', borderRadius:'9999px', marginTop:'0.75rem', overflow:'hidden' }}>
              <div style={{ height:'100%', width:'35%', background:'linear-gradient(90deg, #CC0000, #FFD700, #2255EE)', borderRadius:'9999px' }} />
            </div>
          </div>
        </aside>

        <main style={{ flex:1, padding:'2rem', overflowX:'hidden', background:'#0E1825' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
