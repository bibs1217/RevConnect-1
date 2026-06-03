'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Vehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
  nickname: string | null
  status: string
  hero_image_url: string | null
  mileage: number | null
  total_build_cost: number
  paint_protection: string | null
}

export default function GaragePage() {
  const { user, profile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ year:'', make:'', model:'', trim:'', nickname:'', mileage:'' })
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (user) loadVehicles()
  }, [user])

  async function loadVehicles() {
    setLoading(true)
    const { data } = await supabase.from('vehicles').select('*').eq('owner_id', user!.id).order('is_primary', { ascending: false })
    setVehicles((data ?? []) as Vehicle[])
    setLoading(false)
  }

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    await supabase.from('vehicles').insert({
      owner_id: user.id,
      year: parseInt(form.year),
      make: form.make,
      model: form.model,
      trim: form.trim || null,
      nickname: form.nickname || null,
      mileage: form.mileage ? parseInt(form.mileage) : null,
      status: 'active',
    })
    setForm({ year:'', make:'', model:'', trim:'', nickname:'', mileage:'' })
    setShowAdd(false)
    setSaving(false)
    loadVehicles()
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0D0D0D', border:'1px solid #1E3A6E', borderRadius:'0.75rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }

  const STATUS_COLORS: Record<string, string> = { active:'#22c55e', project:'#FFD700', for_sale:'#facc15', sold:'#888', archived:'#555' }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>
      {/* Profile header */}
      <div style={{ background:'linear-gradient(135deg, #152234, #0D0D0D)', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'2rem', marginBottom:'2rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, right:0, width:'300px', height:'100%', background:'linear-gradient(90deg, transparent, rgba(204,0,0,0.05))', pointerEvents:'none' }} />
        <div style={{ display:'flex', alignItems:'flex-end', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ width:'80px', height:'80px', background:'rgba(204,0,0,0.15)', border:'3px solid rgba(204,0,0,0.3)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', flexShrink:0 }}>🚗</div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800 }}>
              {profile?.display_name ?? profile?.username ?? user?.email?.split('@')[0] ?? 'My Garage'}
            </h1>
            <p style={{ color:'#777', fontSize:'0.875rem' }}>@{profile?.username ?? '—'} · <span style={{ color:'#FFD700', textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'}</span></p>
            <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.75rem' }}>
              <span style={{ fontSize:'0.875rem' }}><strong style={{ color:'white' }}>{vehicles.length}</strong> <span style={{ color:'#666' }}>Vehicles</span></span>
              <span style={{ fontSize:'0.875rem' }}><strong style={{ color:'white' }}>{profile?.rev_points ?? 0}</strong> <span style={{ color:'#666' }}>Rev Points</span></span>
              <span style={{ fontSize:'0.875rem' }}><strong style={{ color:'white' }}>${vehicles.reduce((a,v) => a + (v.total_build_cost ?? 0), 0).toLocaleString()}</strong> <span style={{ color:'#666' }}>Total Build</span></span>
            </div>
          </div>
          {user && (
            <button onClick={() => setShowAdd(!showAdd)} style={{ background:'#CC0000', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, fontSize:'0.9rem' }}>
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Add vehicle form */}
      {showAdd && (
        <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'1.5rem', marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'1.25rem' }}>Add a Vehicle</h2>
          <form onSubmit={addVehicle}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'1rem', marginBottom:'1rem' }}>
              {[
                { key:'year', label:'Year *', placeholder:'2023', required:true },
                { key:'make', label:'Make *', placeholder:'Toyota', required:true },
                { key:'model', label:'Model *', placeholder:'Supra', required:true },
                { key:'trim', label:'Trim', placeholder:'GR Premium', required:false },
                { key:'nickname', label:'Nickname', placeholder:'The Beast', required:false },
                { key:'mileage', label:'Mileage', placeholder:'12500', required:false },
              ].map(f => (
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input value={(form as any)[f.key]} onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))} required={f.required} placeholder={f.placeholder} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="submit" disabled={saving} style={{ background:'#CC0000', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>
                {saving ? 'Saving…' : 'Save Vehicle'}
              </button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background:'transparent', color:'#aaa', border:'1px solid #1E3A6E', padding:'0.75rem 1.5rem', borderRadius:'0.75rem' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Guest prompt */}
      {!user && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#152234', border:'1px dashed #1E3A6E', borderRadius:'1rem', marginBottom:'2rem' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚗</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Your Digital Garage Awaits</h2>
          <p style={{ color:'#666', marginBottom:'1.5rem' }}>Sign in to catalog your vehicles, track mods, and document your builds.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
            <Link href="/register" style={{ background:'#CC0000', color:'white', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>Join Free</Link>
            <Link href="/login" style={{ background:'#152234', color:'white', border:'1px solid #1E3A6E', padding:'0.75rem 1.5rem', borderRadius:'0.75rem' }}>Sign In</Link>
          </div>
        </div>
      )}

      {/* Vehicles grid */}
      {user && !loading && vehicles.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#152234', border:'1px dashed #1E3A6E', borderRadius:'1rem' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏎️</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>No vehicles yet</h2>
          <p style={{ color:'#666', marginBottom:'1.5rem' }}>Add your first vehicle to start building your digital garage.</p>
          <button onClick={() => setShowAdd(true)} style={{ background:'#CC0000', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>Add Your First Vehicle</button>
        </div>
      )}

      {vehicles.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
          {vehicles.map(v => (
            <div key={v.id} style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', overflow:'hidden' }}>
              <div style={{ height:'160px', background:'linear-gradient(135deg, rgba(204,0,0,0.1), rgba(244,162,97,0.05))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'4rem' }}>
                {v.hero_image_url ? <img src={v.hero_image_url} alt={v.nickname ?? ''} style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '🚗'}
              </div>
              <div style={{ padding:'1rem' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight:700, fontSize:'1rem' }}>{v.nickname ?? `${v.year} ${v.make} ${v.model}`}</h3>
                    {v.nickname && <p style={{ color:'#666', fontSize:'0.8rem' }}>{v.year} {v.make} {v.model} {v.trim}</p>}
                  </div>
                  <span style={{ fontSize:'0.7rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:`${STATUS_COLORS[v.status] ?? '#888'}20`, color: STATUS_COLORS[v.status] ?? '#888', border:`1px solid ${STATUS_COLORS[v.status] ?? '#888'}40` }}>
                    {v.status.replace('_', ' ')}
                  </span>
                </div>
                {v.mileage && <p style={{ fontSize:'0.8rem', color:'#666', marginBottom:'0.5rem' }}>📍 {v.mileage.toLocaleString()} mi</p>}
                {v.total_build_cost > 0 && <p style={{ fontSize:'0.8rem', color:'#FFD700' }}>💰 ${v.total_build_cost.toLocaleString()} build</p>}
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.875rem' }}>
                  <Link href={`/garage/${v.id}`} style={{ flex:1, textAlign:'center', background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.2)', color:'#CC0000', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:600 }}>View Build</Link>
                  <button style={{ flex:1, background:'#0D0D0D', border:'1px solid #1E3A6E', color:'#aaa', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem' }}>Edit</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
