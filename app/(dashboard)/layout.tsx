'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'

const NAV = [
  { href:'/garage', icon:'🚗', label:'Garage', color:'#E63946' },
  { href:'/events', icon:'📍', label:'Events', color:'#2563EB' },
  { href:'/car-search', icon:'🔍', label:'Buy a Car', color:'#2563EB' },
  { href:'/parts', icon:'🔩', label:'Parts', color:'#E63946' },
  { href:'/mechanic', icon:'🔧', label:'AI Mechanic', color:'#FACC15' },
  { href:'/car-wash', icon:'🚿', label:'Car Wash', color:'#2563EB' },
  { href:'/auctions', icon:'🏁', label:'Auctions', color:'#FACC15' },
  { href:'/insurance', icon:'🛡️', label:'Insurance', color:'#2563EB' },
  { href:'/vendors', icon:'🏪', label:'Vendors', color:'#E63946' },
  { href:'/store', icon:'👕', label:'Store', color:'#FACC15' },
  { href:'/membership', icon:'⚡', label:'Membership', color:'#FACC15' },
  { href:'/admin', icon:'⚙️', label:'Admin', color:'#E63946' },
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
    <div style={{ minHeight:'100vh', background:'#050A14', display:'flex', flexDirection:'column' }}>
      {/* Top Nav */}
      <header style={{ background:'rgba(5,10,20,0.97)', backdropFilter:'blur(12px)', borderBottom:'1px solid #1E3A5F', padding:'0 1.5rem', height:'4rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <Link href="/" style={{ fontSize:'1.25rem', fontWeight:900, letterSpacing:'-0.5px' }}>
          <span style={{ color:'white' }}>Rev</span>
          <span style={{ color:'#E63946' }}>Connect</span>
          <span style={{ color:'#FACC15' }}>-1</span>
        </Link>

        <div style={{ flex:1, maxWidth:'420px', margin:'0 2rem', display:'flex', alignItems:'center', gap:'0.5rem', background:'#0D1B2A', border:'1px solid #1E3A5F', borderRadius:'0.75rem', padding:'0.5rem 1rem' }}>
          <span style={{ color:'#2563EB', fontSize:'1rem' }}>🔍</span>
          <input placeholder="Search cars, parts, events, builds…" style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <>
              <div style={{ background:'rgba(250,204,21,0.1)', border:'1px solid rgba(250,204,21,0.25)', borderRadius:'9999px', padding:'0.25rem 0.875rem', fontSize:'0.75rem', color:'#FACC15', fontWeight:600 }}>
                ⚡ {profile?.rev_points ?? 0} pts
              </div>
              <span style={{ color:'#aaa', fontSize:'0.875rem' }}>@{profile?.username ?? user.email?.split('@')[0]}</span>
              <button onClick={handleSignOut} style={{ background:'#0D1B2A', border:'1px solid #1E3A5F', color:'#aaa', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color:'#aaa', fontSize:'0.875rem' }}>Sign In</Link>
              <Link href="/register" style={{ background:'#E63946', color:'white', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontSize:'0.875rem', fontWeight:700 }}>Join Free</Link>
            </>
          )}
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:'220px', background:'#0A1628', borderRight:'1px solid #1E3A5F', padding:'1rem 0.75rem', position:'sticky', top:'4rem', height:'calc(100vh - 4rem)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <nav style={{ display:'flex', flexDirection:'column', gap:'0.25rem', flex:1 }}>
            {NAV.map(n => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.75rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight: active ? 700 : 400, background: active ? `${n.color}18` : 'transparent', color: active ? n.color : '#8899AA', border: active ? `1px solid ${n.color}35` : '1px solid transparent', transition:'all 0.15s' }}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>

          {/* Rev Points widget */}
          <div style={{ background:'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(37,99,235,0.1))', border:'1px solid rgba(250,204,21,0.2)', borderRadius:'0.875rem', padding:'1rem', marginTop:'1rem' }}>
            <p style={{ fontSize:'0.7rem', color:'#8899AA', marginBottom:'0.25rem' }}>Rev Points</p>
            <p style={{ fontSize:'1.5rem', fontWeight:900, color:'white' }}>{profile?.rev_points ?? 0}</p>
            <p style={{ fontSize:'0.7rem', color:'#FACC15', marginTop:'0.25rem', fontWeight:600, textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'} Tier</p>
            <div style={{ height:'3px', background:'#1E3A5F', borderRadius:'9999px', marginTop:'0.625rem', overflow:'hidden' }}>
              <div style={{ height:'100%', width:'35%', background:'linear-gradient(90deg, #E63946, #FACC15)', borderRadius:'9999px' }} />
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
