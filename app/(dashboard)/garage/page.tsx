'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Vehicle {
  id: string; year: number; make: string; model: string; trim: string | null
  nickname: string | null; status: string; hero_image_url: string | null
  mileage: number | null; total_build_cost: number; paint_protection: string | null
  gallery_images: string[]
}

interface UploadState {
  vehicleId: string | null
  mode: 'idle' | 'choosing' | 'uploading' | 'done'
  urlInput: string
  error: string
  tab: 'upload' | 'url'
}

export default function GaragePage() {
  const { user, profile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ year:'', make:'', model:'', trim:'', nickname:'', mileage:'' })
  const [saving, setSaving] = useState(false)
  const [upload, setUpload] = useState<UploadState>({ vehicleId:null, mode:'idle', urlInput:'', error:'', tab:'upload' })
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => { if (user) loadVehicles() }, [user])

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
      owner_id: user.id, year: parseInt(form.year), make: form.make,
      model: form.model, trim: form.trim || null, nickname: form.nickname || null,
      mileage: form.mileage ? parseInt(form.mileage) : null, status: 'active',
    })
    setForm({ year:'', make:'', model:'', trim:'', nickname:'', mileage:'' })
    setShowAdd(false); setSaving(false); loadVehicles()
  }

  function openUpload(vehicleId: string) {
    setUpload({ vehicleId, mode:'choosing', urlInput:'', error:'', tab:'upload' })
  }

  function closeUpload() {
    setUpload({ vehicleId:null, mode:'idle', urlInput:'', error:'', tab:'upload' })
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !upload.vehicleId || !user) return

    // Validate
    if (!file.type.startsWith('image/')) { setUpload(u => ({ ...u, error:'Please select an image file (JPG, PNG, WEBP, etc.)' })); return }
    if (file.size > 10 * 1024 * 1024) { setUpload(u => ({ ...u, error:'Image must be under 10MB' })); return }

    setUpload(u => ({ ...u, mode:'uploading', error:'' }))

    const ext = file.name.split('.').pop()
    const path = `${user.id}/${upload.vehicleId}/hero_${Date.now()}.${ext}`

    const { data, error } = await supabase.storage.from('vehicles').upload(path, file, { upsert: true, contentType: file.type })

    if (error) { setUpload(u => ({ ...u, mode:'choosing', error: `Upload failed: ${error.message}` })); return }

    const { data: urlData } = supabase.storage.from('vehicles').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    await supabase.from('vehicles').update({ hero_image_url: publicUrl }).eq('id', upload.vehicleId)
    setUpload(u => ({ ...u, mode:'done' }))
    loadVehicles()
    setTimeout(closeUpload, 1500)
  }

  async function handleUrlSave() {
    if (!upload.urlInput.trim() || !upload.vehicleId) return
    const url = upload.urlInput.trim()
    // Basic URL validation
    if (!url.startsWith('http')) { setUpload(u => ({ ...u, error:'Please enter a valid URL starting with http://' })); return }
    setUpload(u => ({ ...u, mode:'uploading', error:'' }))
    await supabase.from('vehicles').update({ hero_image_url: url }).eq('id', upload.vehicleId)
    setUpload(u => ({ ...u, mode:'done' }))
    loadVehicles()
    setTimeout(closeUpload, 1500)
  }

  async function removePhoto(vehicleId: string) {
    await supabase.from('vehicles').update({ hero_image_url: null }).eq('id', vehicleId)
    loadVehicles()
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.375rem' }
  const STATUS_COLORS: Record<string,string> = { active:'#22c55e', project:'#F4A261', for_sale:'#FFD700', sold:'#888', archived:'#555' }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>

      {/* Upload modal */}
      {upload.vehicleId && upload.mode !== 'idle' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }} onClick={closeUpload}>
          <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1.25rem', padding:'2rem', maxWidth:'480px', width:'100%' }} onClick={e => e.stopPropagation()}>

            {upload.mode === 'uploading' && (
              <div style={{ textAlign:'center', padding:'2rem' }}>
                <p style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>⬆️</p>
                <p style={{ fontWeight:600 }}>Uploading photo…</p>
                <div style={{ height:'4px', background:'rgba(255,255,255,0.1)', borderRadius:'9999px', marginTop:'1.5rem', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'60%', background:'linear-gradient(90deg, #CC0000, #FFD700)', borderRadius:'9999px', animation:'slide 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            )}

            {upload.mode === 'done' && (
              <div style={{ textAlign:'center', padding:'2rem' }}>
                <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>✅</p>
                <p style={{ fontWeight:700, color:'#22c55e' }}>Photo saved!</p>
              </div>
            )}

            {upload.mode === 'choosing' && (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                  <h2 style={{ fontWeight:800, fontSize:'1.125rem' }}>📸 Add Car Photo</h2>
                  <button onClick={closeUpload} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
                </div>

                {/* Tabs */}
                <div style={{ display:'flex', background:'rgba(0,0,0,0.3)', borderRadius:'0.75rem', padding:'0.25rem', marginBottom:'1.5rem' }}>
                  {(['upload','url'] as const).map(t => (
                    <button key={t} onClick={() => setUpload(u => ({ ...u, tab:t }))} style={{ flex:1, padding:'0.625rem', borderRadius:'0.5rem', border:'none', background: upload.tab === t ? '#CC0000' : 'transparent', color: upload.tab === t ? 'white' : 'rgba(255,255,255,0.5)', fontWeight: upload.tab === t ? 700 : 400, cursor:'pointer', fontSize:'0.875rem' }}>
                      {t === 'upload' ? '📁 Upload Photo' : '🔗 Paste URL'}
                    </button>
                  ))}
                </div>

                {upload.tab === 'upload' ? (
                  <div>
                    {/* Drop zone */}
                    <div onClick={() => fileRef.current?.click()} style={{ border:'2px dashed rgba(204,0,0,0.4)', borderRadius:'1rem', padding:'2.5rem 2rem', textAlign:'center', cursor:'pointer', background:'rgba(204,0,0,0.03)', marginBottom:'1rem', transition:'all 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background='rgba(204,0,0,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background='rgba(204,0,0,0.03)')}>
                      <p style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>📷</p>
                      <p style={{ fontWeight:700, marginBottom:'0.25rem' }}>Click to choose a photo</p>
                      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.35)' }}>JPG, PNG, WEBP — up to 10MB</p>
                      <div style={{ marginTop:'1rem', background:'#CC0000', color:'white', padding:'0.625rem 1.5rem', borderRadius:'0.5rem', display:'inline-block', fontWeight:600, fontSize:'0.875rem' }}>
                        Browse Files
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />
                    <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>
                      Photos are stored securely and displayed on your garage profile
                    </p>
                  </div>
                ) : (
                  <div>
                    <label style={lbl}>Photo URL — paste a link from Instagram, Google Images, or any car site</label>
                    <input
                      value={upload.urlInput}
                      onChange={e => setUpload(u => ({ ...u, urlInput: e.target.value }))}
                      placeholder="https://example.com/my-car-photo.jpg"
                      style={{ ...inp, marginBottom:'1rem' }}
                    />
                    <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', marginBottom:'1.25rem' }}>
                      Works with any direct image URL from the web
                    </p>
                    <button onClick={handleUrlSave} disabled={!upload.urlInput.trim()} style={{ width:'100%', background: upload.urlInput.trim() ? 'linear-gradient(135deg, #CC0000, #AA0000)' : '#333', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, cursor: upload.urlInput.trim() ? 'pointer':'default', boxShadow: upload.urlInput.trim() ? '0 4px 16px rgba(204,0,0,0.35)':'none' }}>
                      Save Photo
                    </button>
                  </div>
                )}

                {upload.error && (
                  <div style={{ marginTop:'1rem', background:'rgba(204,0,0,0.08)', border:'1px solid rgba(204,0,0,0.2)', borderRadius:'0.5rem', padding:'0.75rem', fontSize:'0.8rem', color:'#FF6666' }}>
                    ⚠️ {upload.error}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Profile header */}
      <div style={{ background:'linear-gradient(135deg, #1B2A3E, #0D1E30)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'2rem', marginBottom:'2rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #CC0000, #FFD700, #1539CC)' }} />
        <div style={{ display:'flex', alignItems:'flex-end', gap:'1.5rem', flexWrap:'wrap' }}>
          <div style={{ width:'80px', height:'80px', background:'rgba(204,0,0,0.12)', border:'2px solid rgba(204,0,0,0.25)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', flexShrink:0 }}>🚗</div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800 }}>{profile?.display_name ?? profile?.username ?? user?.email?.split('@')[0] ?? 'My Garage'}</h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>@{profile?.username ?? '—'} · <span style={{ color:'#FFD700', textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'}</span></p>
            <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.75rem' }}>
              <span style={{ fontSize:'0.875rem' }}><strong>{vehicles.length}</strong> <span style={{ color:'rgba(255,255,255,0.4)' }}>Vehicles</span></span>
              <span style={{ fontSize:'0.875rem' }}><strong style={{ color:'#FFD700' }}>{profile?.rev_points ?? 0}</strong> <span style={{ color:'rgba(255,255,255,0.4)' }}>Rev Points</span></span>
              <span style={{ fontSize:'0.875rem' }}><strong>${vehicles.reduce((a,v) => a + (v.total_build_cost ?? 0), 0).toLocaleString()}</strong> <span style={{ color:'rgba(255,255,255,0.4)' }}>Total Build</span></span>
            </div>
          </div>
          {user && (
            <button onClick={() => setShowAdd(!showAdd)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Add vehicle form */}
      {showAdd && (
        <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'2rem' }}>
          <h2 style={{ fontSize:'1.125rem', fontWeight:700, marginBottom:'1.25rem' }}>Add a Vehicle</h2>
          <form onSubmit={addVehicle}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1rem' }}>
              {[['year','Year *','2023',true],['make','Make *','Toyota',true],['model','Model *','Supra',true],['trim','Trim','GR Premium',false],['nickname','Nickname','The Beast',false],['mileage','Mileage','12500',false]].map(([k,l,p,req]) => (
                <div key={k as string}>
                  <label style={lbl}>{l as string}</label>
                  <input value={(form as any)[k as string]} onChange={e => setForm(v => ({ ...v, [k as string]: e.target.value }))} required={req as boolean} placeholder={p as string} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="submit" disabled={saving} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>{saving ? 'Saving…' : 'Save Vehicle'}</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background:'transparent', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.1)', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', cursor:'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Not logged in */}
      {!user && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#243547', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'1rem', marginBottom:'2rem' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚗</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Your Digital Garage Awaits</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem' }}>Sign in to catalog your vehicles, upload photos, and track your builds.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
            <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>Join Free</Link>
            <Link href="/login" style={{ background:'rgba(255,255,255,0.06)', color:'white', border:'1px solid rgba(255,255,255,0.1)', padding:'0.75rem 1.5rem', borderRadius:'0.75rem' }}>Sign In</Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {user && !loading && vehicles.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#243547', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'1rem' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🏎️</p>
          <h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>No vehicles yet</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem' }}>Add your first vehicle to start your digital garage.</p>
          <button onClick={() => setShowAdd(true)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>Add Your First Vehicle</button>
        </div>
      )}

      {/* Vehicle grid */}
      {vehicles.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1.25rem' }}>
          {vehicles.map(v => (
            <div key={v.id} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', overflow:'hidden' }}>
              {/* Photo area */}
              <div style={{ height:'180px', background:'linear-gradient(135deg, rgba(204,0,0,0.1), #1B2A3E)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', overflow:'hidden' }}>
                {v.hero_image_url ? (
                  <img src={v.hero_image_url} alt={v.nickname ?? ''} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                ) : (
                  <div style={{ textAlign:'center' }}>
                    <p style={{ fontSize:'3.5rem', marginBottom:'0.25rem' }}>🚗</p>
                    <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)' }}>No photo yet</p>
                  </div>
                )}

                {/* Upload overlay button */}
                <div style={{ position:'absolute', bottom:'0.625rem', right:'0.625rem', display:'flex', gap:'0.375rem' }}>
                  <button onClick={() => openUpload(v.id)} style={{ background:'rgba(13,30,48,0.88)', border:'1px solid rgba(255,255,255,0.15)', color:'white', padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem', fontWeight:600, cursor:'pointer', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', gap:'0.375rem' }}>
                    📸 {v.hero_image_url ? 'Change Photo' : 'Add Photo'}
                  </button>
                  {v.hero_image_url && (
                    <button onClick={() => removePhoto(v.id)} style={{ background:'rgba(204,0,0,0.7)', border:'1px solid rgba(204,0,0,0.4)', color:'white', padding:'0.375rem 0.5rem', borderRadius:'0.5rem', fontSize:'0.75rem', cursor:'pointer', backdropFilter:'blur(4px)' }} title="Remove photo">
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Info */}
              <div style={{ padding:'1rem' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'0.5rem' }}>
                  <div>
                    <h3 style={{ fontWeight:700, fontSize:'1rem' }}>{v.nickname ?? `${v.year} ${v.make} ${v.model}`}</h3>
                    {v.nickname && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{v.year} {v.make} {v.model} {v.trim}</p>}
                  </div>
                  <span style={{ fontSize:'0.7rem', padding:'0.2rem 0.5rem', borderRadius:'9999px', background:`${STATUS_COLORS[v.status] ?? '#888'}18`, color: STATUS_COLORS[v.status] ?? '#888', border:`1px solid ${STATUS_COLORS[v.status] ?? '#888'}30` }}>
                    {v.status.replace('_',' ')}
                  </span>
                </div>
                {v.mileage && <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.375rem' }}>📍 {v.mileage.toLocaleString()} mi</p>}
                {v.total_build_cost > 0 && <p style={{ fontSize:'0.8rem', color:'#FFD700' }}>💰 ${v.total_build_cost.toLocaleString()} build</p>}
                <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.875rem' }}>
                  <Link href={`/garage/${v.id}`} style={{ flex:1, textAlign:'center', background:'rgba(204,0,0,0.08)', border:'1px solid rgba(204,0,0,0.2)', color:'#CC0000', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:600 }}>View Build</Link>
                  <button onClick={() => openUpload(v.id)} style={{ flex:1, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.6)', padding:'0.5rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>📸 Photos</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
