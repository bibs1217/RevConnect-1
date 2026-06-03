'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/app/providers/auth-provider'

interface Stats {
  users: number
  vehicles: number
  events: number
  orders: number
  revenue: number
}

const ADMIN_EMAILS = ['cbibs1217@gmail.com'] // Add admin emails here

export default function AdminPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<Stats>({ users: 0, vehicles: 0, events: 0, orders: 0, revenue: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [tab, setTab] = useState<'overview' | 'users' | 'events' | 'store'>('overview')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const isAdmin = user && ADMIN_EMAILS.includes(user.email ?? '')

  useEffect(() => {
    if (isAdmin) loadData()
  }, [isAdmin])

  async function loadData() {
    setLoading(true)
    const [profilesRes, vehiclesRes, eventsRes, ordersRes] = await Promise.all([
      supabase.from('profiles').select('id, username, membership_tier, rev_points, created_at').order('created_at', { ascending: false }).limit(50),
      supabase.from('vehicles').select('id', { count: 'exact' }),
      supabase.from('events').select('id', { count: 'exact' }),
      supabase.from('orders').select('total', { count: 'exact' }),
    ])
    setStats({
      users: profilesRes.data?.length ?? 0,
      vehicles: vehiclesRes.count ?? 0,
      events: eventsRes.count ?? 0,
      orders: ordersRes.count ?? 0,
      revenue: (ordersRes.data ?? []).reduce((a: number, o: any) => a + (o.total ?? 0), 0),
    })
    setUsers(profilesRes.data ?? [])
    setLoading(false)
  }

  if (!user) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ color: '#666' }}>Please sign in to access admin.</p>
    </div>
  )

  if (!isAdmin) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🚫</p>
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Admin Access Required</h2>
      <p style={{ color: '#666' }}>You don&apos;t have permission to access this page.</p>
    </div>
  )

  const TABS = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'users', label: '👥 Users' },
    { id: 'events', label: '📍 Events' },
    { id: 'store', label: '👕 Store' },
  ] as const

  const TIER_COLORS: Record<string, string> = { cruiser: '#aaa', builder: '#3b82f6', racer: '#a855f7', legend: '#FFD700' }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>⚙️ Admin Dashboard</h1>
          <p style={{ color: '#666', marginTop: '0.25rem' }}>Platform management and analytics</p>
        </div>
        <button onClick={loadData} style={{ background: '#071428', border: '1px solid #1A3A6B', color: '#aaa', padding: '0.5rem 1rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #1A3A6B', paddingBottom: '0.5rem' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem 0.5rem 0 0', border: 'none', background: tab === t.id ? '#FF4500' : 'transparent', color: tab === t.id ? 'white' : '#aaa', fontWeight: tab === t.id ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div>
          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {[
              { label: 'Total Users', value: stats.users, icon: '👥', color: '#3b82f6' },
              { label: 'Vehicles', value: stats.vehicles, icon: '🚗', color: '#FF4500' },
              { label: 'Events', value: stats.events, icon: '📍', color: '#22c55e' },
              { label: 'Orders', value: stats.orders, icon: '📦', color: '#FFD700' },
              { label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: '💰', color: '#a855f7' },
            ].map(s => (
              <div key={s.label} style={{ background: '#071428', border: `1px solid ${s.color}25`, borderRadius: '1rem', padding: '1.25rem' }}>
                <p style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>{s.icon}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color }}>{loading ? '…' : s.value}</p>
                <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tier breakdown */}
          <div style={{ background: '#071428', border: '1px solid #1A3A6B', borderRadius: '1rem', padding: '1.5rem' }}>
            <h2 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem' }}>Membership Tier Breakdown</h2>
            {['cruiser', 'builder', 'racer', 'legend'].map(tier => {
              const count = users.filter(u => u.membership_tier === tier).length
              const pct = users.length ? (count / users.length * 100).toFixed(0) : '0'
              return (
                <div key={tier} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                  <span style={{ width: '70px', fontSize: '0.8rem', color: TIER_COLORS[tier], textTransform: 'capitalize', fontWeight: 600 }}>{tier}</span>
                  <div style={{ flex: 1, background: '#0D0D0D', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, background: TIER_COLORS[tier], height: '100%', borderRadius: '9999px', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#aaa', width: '60px', textAlign: 'right' }}>{count} ({pct}%)</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div>
          <div style={{ background: '#071428', border: '1px solid #1A3A6B', borderRadius: '1rem', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#0D0D0D', borderBottom: '1px solid #1A3A6B' }}>
                  {['Username', 'Tier', 'Rev Points', 'Joined', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '0.875rem 1rem', textAlign: 'left', fontSize: '0.75rem', color: '#666', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>Loading users…</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: '#555' }}>No users yet</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid #071428' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', fontWeight: 600 }}>@{u.username}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <span style={{ background: `${TIER_COLORS[u.membership_tier]}15`, color: TIER_COLORS[u.membership_tier], padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', textTransform: 'capitalize', border: `1px solid ${TIER_COLORS[u.membership_tier]}25` }}>{u.membership_tier}</span>
                    </td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#FFD700' }}>⚡ {u.rev_points ?? 0}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#666' }}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button style={{ background: 'transparent', border: '1px solid #1A3A6B', color: '#aaa', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.75rem', cursor: 'pointer' }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(tab === 'events' || tab === 'store') && (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#071428', border: '1px solid #1A3A6B', borderRadius: '1rem' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{tab === 'events' ? '📍' : '👕'}</p>
          <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{tab === 'events' ? 'Event Management' : 'Store Management'}</h2>
          <p style={{ color: '#666' }}>Coming soon — full CRUD for {tab === 'events' ? 'events, approval queue, featured picks' : 'products, inventory, orders, drops'}.</p>
        </div>
      )}
    </div>
  )
}
