'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Vehicle {
  id: string; year: number; make: string; model: string; trim: string | null
  nickname: string | null; status: string; hero_image_url: string | null
  mileage: number | null; total_build_cost: number
}

export default function GaragePage() {
  const { user, profile } = useAuth()
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ year:'', make:'', model:'', trim:'', nickname:'', mileage:'' })
  const [saving, setSaving] = useState(false)

  // Upload state
  const [uploadVehicleId, setUploadVehicleId] = useState<string|null>(null)
  const [uploadTab, setUploadTab] = useState<'device'|'url'>('device')
  const [urlInput, setUrlInput] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadDone, setUploadDone] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  useEffect(() => { if (user) loadVehicles() }, [user])

  async function loadVehicles() {
    setLoading(true)
    const { data } = await supabase.from('vehicles').select('*').eq('owner_id', user!.id).order('created_at', { ascending: false })
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

  function openUpload(vid: string) {
    setUploadVehicleId(vid); setUploadTab('device')
    setUrlInput(''); setUploading(false); setUploadDone(false); setUploadError('')
  }
  function closeUpload() { setUploadVehicleId(null) }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !uploadVehicleId || !user) return
    if (!file.type.startsWith('image/')) { setUploadError('Please select an image file'); return }
    if (file.size > 15 * 1024 * 1024) { setUploadError('File must be under 15MB'); return }
    setUploading(true); setUploadError('')
    const ext = file.name.split('.').pop()
    const path = `${user.id}/${uploadVehicleId}/hero_${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('vehicles').upload(path, file, { upsert:true, contentType:file.type })
    if (error) { setUploadError(`Upload failed: ${error.message}`); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('vehicles').getPublicUrl(path)
    await supabase.from('vehicles').update({ hero_image_url: urlData.publicUrl }).eq('id', uploadVehicleId)
    setUploadDone(true); setUploading(false); loadVehicles()
    setTimeout(() => { closeUpload(); setUploadDone(false) }, 1500)
  }

  async function handleUrl() {
    if (!urlInput.trim() || !uploadVehicleId) return
    if (!urlInput.startsWith('http')) { setUploadError('Please enter a valid URL (must start with http)'); return }
    setUploading(true); setUploadError('')
    await supabase.from('vehicles').update({ hero_image_url: urlInput.trim() }).eq('id', uploadVehicleId)
    setUploadDone(true); setUploading(false); loadVehicles()
    setTimeout(() => { closeUpload(); setUploadDone(false) }, 1500)
  }

  async function removePhoto(vid: string) {
    await supabase.from('vehicles').update({ hero_image_url: null }).eq('id', vid); loadVehicles()
  }

  const inp: React.CSSProperties = { width:'100%', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.375rem' }

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto' }}>

      {/* ── UPLOAD MODAL ── */}
      {uploadVehicleId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.85)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }} onClick={closeUpload}>
          <div style={{ background:'#243547', border:'2px solid #CC0000', borderRadius:'1.25rem', padding:'2rem', maxWidth:'460px', width:'100%', position:'relative' }} onClick={e => e.stopPropagation()}>

            {uploadDone ? (
              <div style={{ textAlign:'center', padding:'1rem' }}>
                <p style={{ fontSize:'4rem', marginBottom:'0.75rem' }}>✅</p>
                <p style={{ fontWeight:800, fontSize:'1.25rem', color:'#22c55e' }}>Photo Saved!</p>
              </div>
            ) : uploading ? (
              <div style={{ textAlign:'center', padding:'1rem' }}>
                <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>⬆️</p>
                <p style={{ fontWeight:600, marginBottom:'1.5rem' }}>Uploading your photo…</p>
                <div style={{ height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'9999px', overflow:'hidden' }}>
                  <div style={{ height:'100%', width:'70%', background:'linear-gradient(90deg, #CC0000, #FFD700)', borderRadius:'9999px', animation:'pulse 1.5s ease-in-out infinite' }} />
                </div>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem' }}>
                  <h2 style={{ fontWeight:900, fontSize:'1.2rem' }}>📸 Upload Car Photo</h2>
                  <button onClick={closeUpload} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.5)', fontSize:'1.75rem', cursor:'pointer', lineHeight:1, padding:'0.25rem' }}>×</button>
                </div>

                {/* Tab switcher */}
                <div style={{ display:'flex', background:'rgba(0,0,0,0.4)', borderRadius:'0.875rem', padding:'0.3rem', marginBottom:'1.5rem' }}>
                  <button onClick={() => setUploadTab('device')} style={{ flex:1, padding:'0.625rem', borderRadius:'0.625rem', border:'none', background: uploadTab==='device' ? '#CC0000':'transparent', color:'white', fontWeight: uploadTab==='device' ? 700:400, cursor:'pointer', fontSize:'0.875rem', transition:'all 0.15s' }}>
                    📱 Upload from Device
                  </button>
                  <button onClick={() => setUploadTab('url')} style={{ flex:1, padding:'0.625rem', borderRadius:'0.625rem', border:'none', background: uploadTab==='url' ? '#CC0000':'transparent', color:'white', fontWeight: uploadTab==='url' ? 700:400, cursor:'pointer', fontSize:'0.875rem', transition:'all 0.15s' }}>
                    🔗 Paste Photo URL
                  </button>
                </div>

                {uploadTab === 'device' ? (
                  <div>
                    <div onClick={() => fileRef.current?.click()} style={{ border:'3px dashed rgba(204,0,0,0.5)', borderRadius:'1rem', padding:'3rem 2rem', textAlign:'center', cursor:'pointer', background:'rgba(204,0,0,0.04)', marginBottom:'1rem', transition:'all 0.15s' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(204,0,0,0.1)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(204,0,0,0.8)' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='rgba(204,0,0,0.04)'; (e.currentTarget as HTMLElement).style.borderColor='rgba(204,0,0,0.5)' }}>
                      <p style={{ fontSize:'4rem', marginBottom:'0.75rem' }}>📷</p>
                      <p style={{ fontWeight:700, fontSize:'1.1rem', marginBottom:'0.5rem' }}>Click here to choose a photo</p>
                      <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', marginBottom:'1.25rem' }}>JPG, PNG, WEBP, HEIC — up to 15MB</p>
                      <div style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.75rem 2rem', borderRadius:'0.75rem', display:'inline-block', fontWeight:700, boxShadow:'0 4px 16px rgba(204,0,0,0.4)' }}>
                        Browse Files
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*,image/heic" style={{ display:'none' }} onChange={handleFile} />
                    <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', textAlign:'center' }}>Your photo is stored securely in your RevConnect-1 garage</p>
                  </div>
                ) : (
                  <div>
                    <label style={lbl}>Paste a photo URL from any website, Google Images, Instagram, or car sites</label>
                    <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="https://example.com/my-car.jpg" style={{ ...inp, marginBottom:'0.75rem' }} />
                    <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', marginBottom:'1.25rem' }}>Works with direct image links from any car forum, Instagram, Google, or personal site</p>
                    <button onClick={handleUrl} disabled={!urlInput.trim()} style={{ width:'100%', background: urlInput.trim() ? 'linear-gradient(135deg, #CC0000, #AA0000)':'rgba(255,255,255,0.1)', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, cursor: urlInput.trim() ? 'pointer':'default', fontSize:'1rem', boxShadow: urlInput.trim() ? '0 4px 16px rgba(204,0,0,0.4)':'none' }}>
                      Save Photo
                    </button>
                  </div>
                )}

                {uploadError && (
                  <div style={{ marginTop:'1rem', background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.25)', borderRadius:'0.625rem', padding:'0.75rem', fontSize:'0.8rem', color:'#FF6666' }}>
                    ⚠️ {uploadError}
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
          <div style={{ width:'80px', height:'80px', background:'rgba(204,0,0,0.12)', border:'2px solid rgba(204,0,0,0.3)', borderRadius:'1rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.5rem', flexShrink:0 }}>🚗</div>
          <div style={{ flex:1 }}>
            <h1 style={{ fontSize:'1.5rem', fontWeight:800 }}>{profile?.display_name ?? profile?.username ?? user?.email?.split('@')[0] ?? 'My Garage'}</h1>
            <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>@{profile?.username ?? '—'} · <span style={{ color:'#FFD700', textTransform:'capitalize' }}>{profile?.membership_tier ?? 'Cruiser'}</span></p>
            <div style={{ display:'flex', gap:'1.5rem', marginTop:'0.75rem' }}>
              <span style={{ fontSize:'0.875rem' }}><strong>{vehicles.length}</strong> <span style={{ color:'rgba(255,255,255,0.4)' }}>Vehicles</span></span>
              <span style={{ fontSize:'0.875rem' }}><strong style={{ color:'#FFD700' }}>{profile?.rev_points ?? 0}</strong> <span style={{ color:'rgba(255,255,255,0.4)' }}>Rev Points</span></span>
            </div>
          </div>
          {user && (
            <button onClick={() => setShowAdd(!showAdd)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'2rem' }}>
          <h2 style={{ fontWeight:700, marginBottom:'1.25rem' }}>Add a Vehicle</h2>
          <form onSubmit={addVehicle}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px, 1fr))', gap:'1rem', marginBottom:'1rem' }}>
              {[['year','Year *','2023',true],['make','Make *','Toyota',true],['model','Model *','Supra',true],['trim','Trim','GR Premium',false],['nickname','Nickname','The Beast',false],['mileage','Mileage','12500',false]].map(([k,l,p,req]) => (
                <div key={k as string}>
                  <label style={lbl}>{l as string}</label>
                  <input value={(form as any)[k as string]} onChange={e => setForm(v => ({...v,[k as string]:e.target.value}))} required={req as boolean} placeholder={p as string} style={inp} />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button type="submit" disabled={saving} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>{saving ? 'Saving…':'Save Vehicle'}</button>
              <button type="button" onClick={() => setShowAdd(false)} style={{ background:'transparent', color:'rgba(255,255,255,0.4)', border:'1px solid rgba(255,255,255,0.1)', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', cursor:'pointer' }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Not logged in */}
      {!user && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#243547', border:'1px dashed rgba(255,255,255,0.1)', borderRadius:'1rem' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚗</p>
          <h2 style={{ fontWeight:700, marginBottom:'0.5rem' }}>Sign in to access your garage</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'1.5rem' }}>Upload photos, track mods, and document your builds.</p>
          <div style={{ display:'flex', gap:'1rem', justifyContent:'center' }}>
            <Link href="/register" style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.75rem 1.5rem', borderRadius:'0.75rem', fontWeight:700 }}>Join Free</Link>
            <Link href="/login" style={{ background:'rgba(255,255,255,0.06)', color:'white', border:'1px solid rgba(255,255,255,0.1)', padding:'0.75rem 1.5rem', borderRadius:'0.75rem' }}>Sign In</Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {user && !loading && vehicles.length === 0 && (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'#243547', border:'1px dashed rgba(255,255,255,0.15)', borderRadius:'1rem' }}>
          <p style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🏎️</p>
          <h2 style={{ fontWeight:700, marginBottom:'0.5rem' }}>No vehicles yet</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'2rem' }}>Add your first vehicle, then you can upload photos of it.</p>
          <button onClick={() => setShowAdd(true)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.875rem 2rem', borderRadius:'0.875rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(204,0,0,0.35)', fontSize:'1rem' }}>
            + Add Your First Vehicle
          </button>
        </div>
      )}

      {/* Vehicle grid */}
      {vehicles.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.5rem' }}>
          {vehicles.map(v => (
            <div key={v.id} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', overflow:'hidden' }}>

              {/* Photo area with VERY prominent upload button */}
              <div style={{ height:'200px', background:'linear-gradient(135deg, rgba(204,0,0,0.08), #1B2A3E)', position:'relative', overflow:'hidden' }}>
                {v.hero_image_url ? (
                  <>
                    <img src={v.hero_image_url} alt={v.nickname ?? ''} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    {/* Change photo button — always visible */}
                    <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0)', display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'all 0.2s' }}
                      onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(0,0,0,0.5)'; el.style.opacity='1' }}
                      onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(0,0,0,0)'; el.style.opacity='0' }}>
                      <button onClick={() => openUpload(v.id)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.5rem', borderRadius:'0.875rem', fontWeight:700, cursor:'pointer', fontSize:'0.95rem', boxShadow:'0 4px 16px rgba(204,0,0,0.5)' }}>
                        📸 Change Photo
                      </button>
                    </div>
                    <button onClick={() => removePhoto(v.id)} style={{ position:'absolute', top:'0.625rem', right:'0.625rem', background:'rgba(204,0,0,0.8)', border:'none', color:'white', width:'28px', height:'28px', borderRadius:'50%', cursor:'pointer', fontSize:'0.875rem', lineHeight:1, display:'flex', alignItems:'center', justifyContent:'center' }} title="Remove photo">✕</button>
                  </>
                ) : (
                  /* No photo — giant upload CTA */
                  <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'0.75rem' }}>
                    <p style={{ fontSize:'2.5rem' }}>📷</p>
                    <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.875rem' }}>No photo yet</p>
                    <button onClick={() => openUpload(v.id)} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.625rem 1.5rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', fontSize:'0.875rem', boxShadow:'0 4px 16px rgba(204,0,0,0.4)', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      📸 Upload Photo
                    </button>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding:'1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.75rem' }}>
                  <div>
                    <h3 style={{ fontWeight:800, fontSize:'1.05rem' }}>{v.nickname ?? `${v.year} ${v.make} ${v.model}`}</h3>
                    {v.nickname && <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.8rem' }}>{v.year} {v.make} {v.model}</p>}
                  </div>
                </div>
                {v.mileage && <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem' }}>📍 {v.mileage.toLocaleString()} mi</p>}

                {/* Upload button — always visible at bottom of card */}
                <button onClick={() => openUpload(v.id)} style={{ width:'100%', background: v.hero_image_url ? 'rgba(255,255,255,0.04)':'rgba(204,0,0,0.1)', border:`1px solid ${v.hero_image_url ? 'rgba(255,255,255,0.1)':'rgba(204,0,0,0.3)'}`, color: v.hero_image_url ? 'rgba(255,255,255,0.6)':'#CC0000', padding:'0.625rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', fontSize:'0.875rem', display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', marginTop:'0.75rem' }}>
                  📸 {v.hero_image_url ? 'Change Car Photo' : 'Upload Car Photo'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
