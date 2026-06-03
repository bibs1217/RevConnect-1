'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'

const NAV = [
  { href:'/garage', icon:'🚗', label:'Garage' },
  { href:'/events', icon:'📍', label:'Events' },
  { href:'/car-search', icon:'🔍', label:'Buy a Car' },
  { href:'/parts', icon:'🔩', label:'Parts' },
  { href:'/mechanic', icon:'🔧', label:'Mechanic' },
  { href:'/car-wash', icon:'🚿', label:'Car Wash' },
  { href:'/auctions', icon:'🏁', label:'Auctions' },
  { href:'/insurance', icon:'🛡️', label:'Insurance' },
  { href:'/vendors', icon:'🏪', label:'Vendors' },
  { href:'/store', icon:'👕', label:'Store' },
  { href:'/membership', icon:'⚡', label:'Membership' },
  { href:'/admin', icon:'⚙️', label:'Admin' },
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
    <div style={{ minHeight:'100vh', background:'#0D0D0D', display:'flex', flexDirection:'column' }}>
      {/* Top Nav */}
      <header style={{ background:'rgba(13,13,13,0.95)', backdropFilter:'blur(8px)', borderBottom:'1px solid #1a1a2e', padding:'0 1.5rem', height:'4rem', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:50 }}>
        <Link href="/" style={{ fontSize:'1.25rem', fontWeight:900 }}>
          <span style={{ color:'white' }}>Rev</span><span style={{ color:'#E63946' }}>Connect</span><span style={{ color:'#F4A261' }}>-1</span>
        </Link>

        {/* Search bar */}
        <div style={{ flex:1, maxWidth:'400px', margin:'0 2rem', display:'flex', alignItems:'center', gap:'0.5rem', background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'0.75rem', padding:'0.5rem 1rem' }}>
          <span style={{ color:'#555' }}>🔍</span>
          <input placeholder="Search cars, parts, events, builds…" style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
        </div>

        {/* Auth area */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          {user ? (
            <>
              <div style={{ background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'9999px', padding:'0.25rem 0.75rem', fontSize:'0.75rem', color:'#F4A261' }}>
                ⚡ {profile?.rev_points ?? 0} pts
              </div>
              <span style={{ color:'#aaa', fontSize:'0.875rem' }}>@{profile?.username ?? user.email?.split('@')[0]}</span>
              <button onClick={handleSignOut} style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', color:'#aaa', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem' }}>Sign Out</button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color:'#aaa', fontSize:'0.875rem' }}>Sign In</Link>
              <Link href="/register" style={{ background:'#E63946', color:'white', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontSize:'0.875rem', fontWeight:600 }}>Join Free</Link>
            </>
          )}
        </div>
      </header>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <aside style={{ width:'220px', background:'rgba(26,26,46,0.4)', borderRight:'1px solid #1a1a2e', padding:'1rem 0.75rem', position:'sticky', top:'4rem', height:'calc(100vh - 4rem)', overflowY:'auto', display:'flex', flexDirection:'column' }}>
          <nav style={{ display:'flex', flexDirection:'column', gap:'0.25rem', flex:1 }}>
            {NAV.map(n => {
              const active = pathname === n.href || pathname.startsWith(n.href + '/')
              return (
                <Link key={n.href} href={n.href} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.625rem 0.75rem', borderRadius:'0.75rem', fontSize:'0.875rem', fontWeight: active ? 600 : 400, background: active ? 'rgba(230,57,70,0.12)' : 'transparent', color: active ? '#E63946' : '#aaa', border: active ? '1px solid rgba(230,57,70,0.2)' : '1px solid transparent', transition:'all 0.15s' }}>
                  <span>{n.icon}</span>{n.label}
                </Link>
              )
            })}
          </nav>

          {/* Rev Points widget */}
          <div style={{ background:'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(244,162,97,0.08))', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'0.75rem', padding:'1rem', marginTop:'1rem' }}>
            <p style={{ fontSize:'0.7rem', color:'#777', marginBottom:'0.25rem' }}>Rev Points</p>
            <p style={{ fontSize:'1.5rem', fontWeight:900, color:'white' }}>{profile?.rev_points ?? 0}</p>
            <p style={{ fontSize:'0.7rem', color:'#F4A261', marginTop:'0.25rem', textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'} Tier</p>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex:1, padding:'2rem', overflowX:'hidden' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
