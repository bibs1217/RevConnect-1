'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'

const NAV = [
  { href:'/garage', icon:'🚗', label:'Garage', color:'#CC0000' },
  { href:'/events', icon:'📍', label:'Events', color:'#1539CC' },
  { href:'/car-search', icon:'🔍', label:'Buy a Car', color:'#3399FF' },
  { href:'/parts', icon:'🔩', label:'Parts', color:'#CC0000' },
  { href:'/tires', icon:'🛞', label:'Tires', color:'#3399FF' },
  { href:'/mechanic', icon:'🔧', label:'VictoryRevConnect AI', color:'#FFD700' },
  { href:'/car-wash', icon:'🚿', label:'Car Wash', color:'#1539CC' },
  { href:'/auctions', icon:'🏁', label:'Auctions', color:'#FFD700' },
  { href:'/insurance', icon:'🛡️', label:'Insurance', color:'#3399FF' },
  { href:'/vendors', icon:'🏪', label:'Vendors', color:'#CC0000' },
  { href:'/store', icon:'👕', label:'Store', color:'#FFD700' },
  { href:'/forums', icon:'🏁', label:'Forums', color:'#CC0000' },
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

  function guardNav(e: React.MouseEvent, href: string) {
    if (
      pathname.startsWith('/mechanic') &&
      !href.startsWith('/mechanic') &&
      typeof window !== 'undefined' &&
      (window as any).__rcChatActive &&
      !window.confirm('Leave your VictoryRevConnect AI conversation? Your chat will be cleared.')
    ) {
      e.preventDefault()
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#1B2A3E', display:'flex', flexDirection:'column' }}>

      {/* Nav — bold chrome/red/blue bar */}
      <header style={{ background:'#0D1E30', borderBottom:'3px solid transparent', borderImage:'linear-gradient(90deg, #CC0000 0%, #888 30%, #FFFFFF 50%, #888 70%, #1539CC 100%) 1', padding:'0 1.5rem', height:'4rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50, boxShadow:'0 4px 24px rgba(0,0,0,0.4)' }}>

        <Link href="/" onClick={e => guardNav(e, '/')} style={{ fontSize:'1.25rem', fontWeight:900, letterSpacing:'-0.5px', display:'flex', alignItems:'center' }}>
          <span style={{ color:'#CC0000' }}>Victory</span>
          <span style={{ color:'white' }}>Rev</span>
          <span style={{ color:'#3B82F6' }}>Connect</span>
          <span style={{ color:'#FFD700', textShadow:'0 0 10px rgba(255,215,0,0.5)' }}>1</span>
        </Link>

        <div style={{ flex:1, maxWidth:'400px', margin:'0 2rem', display:'flex', alignItems:'center', gap:'0.5rem', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.5rem 1rem' }}>
          <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
          <input placeholder="Search cars, parts, events…" style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <>
              <div style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', borderRadius:'9999px', padding:'0.25rem 0.875rem', fontSize:'0.75rem', color:'#FFD700', fontWeight:700 }}>
                ⚡ {profile?.rev_points ?? 0} pts
              </div>
              <span style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>@{profile?.username ?? user.email?.split('@')[0]}</span>
              <button onClick={handleSignOut} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.6)', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>Sign In</Link>
              <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontSize:'0.875rem', fontWeight:700, boxShadow:'0 2px 12px rgba(204,0,0,0.4)' }}>Join Free</Link>
            </>
          )}
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar — dark steel with color accents */}
        <aside style={{ width:'220px', background:'#0D1E30', borderRight:'1px solid rgba(255,255,255,0.06)', padding:'1.25rem 0.875rem', position:'sticky', top:'4rem', height:'calc(100vh - 4rem)', overflowY:'auto', display:'flex', flexDirection:'column' }}>

          {/* Mustang hero image */}
          <div style={{ borderRadius:'0.75rem', overflow:'hidden', marginBottom:'1.25rem', height:'80px', position:'relative', background:'linear-gradient(135deg, rgba(204,0,0,0.2), #1B2A3E)' }}>
            <img src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=400&q=75" alt="Mustang" style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.7 }} />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, rgba(13,30,48,0.5), transparent)' }} />
            <div style={{ position:'absolute', bottom:'0.5rem', left:'0.75rem', fontSize:'0.6rem', color:'rgba(255,215,0,0.9)', fontWeight:800, letterSpacing:'2px', textTransform:'uppercase' }}>VictoryRevConnect1</div>
          </div>

          <nav style={{ display:'flex', flexDirection:'column', gap:'0.15rem', flex:1 }}>
            {NAV.map(n => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} onClick={e => guardNav(e, n.href)} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.875rem', borderRadius:'0.625rem', fontSize:'0.875rem', fontWeight: active ? 700 : 400, background: active ? `${n.color}18` : 'transparent', color: active ? n.color : 'rgba(255,255,255,0.45)', borderLeft: `3px solid ${active ? n.color : 'transparent'}`, paddingLeft: '0.625rem', transition:'all 0.15s' }}>
                  <span style={{ fontSize:'1rem' }}>{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>

          {/* Rev Points card */}
          <div style={{ marginTop:'1rem', borderRadius:'0.875rem', padding:'1rem', background:'linear-gradient(135deg, rgba(204,0,0,0.12), rgba(21,57,204,0.08))', border:'1px solid rgba(255,215,0,0.12)', position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg, #CC0000, #FFD700, #1539CC)' }} />
            <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.25rem', letterSpacing:'0.5px', textTransform:'uppercase' }}>Rev Points</p>
            <p className="chrome-text" style={{ fontSize:'1.75rem', fontWeight:900 }}>{profile?.rev_points ?? 0}</p>
            <p style={{ fontSize:'0.7rem', color:'#FFD700', marginTop:'0.25rem', fontWeight:700, textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'} Tier</p>
            <div style={{ height:'3px', background:'rgba(0,0,0,0.3)', borderRadius:'9999px', marginTop:'0.75rem', overflow:'hidden' }}>
              <div style={{ height:'100%', width:'35%', background:'linear-gradient(90deg, #CC0000, #FFD700, #1539CC)', borderRadius:'9999px' }} />
            </div>
          </div>
        </aside>

        <main style={{ flex:1, padding:'2rem', overflowX:'hidden', background:'#1B2A3E' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
