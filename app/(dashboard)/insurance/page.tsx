'use client'

import { useState } from 'react'

const CARRIERS = [
  { name:'Hagerty', type:'Enthusiast', badge:'⭐ Best for Mods', monthly:127, agreed:true, mods:true, track:true, rating:'A', am_best:'A+' },
  { name:'Grundy', type:'Enthusiast', badge:'Collector Specialist', monthly:142, agreed:true, mods:true, track:false, rating:'A', am_best:'A' },
  { name:'Progressive', type:'Standard', badge:'🏆 Most Popular', monthly:189, agreed:false, mods:false, track:false, rating:'A+', am_best:'A+' },
  { name:'State Farm', type:'Standard', badge:null, monthly:204, agreed:false, mods:false, track:false, rating:'A++', am_best:'A++' },
  { name:'Geico', type:'Standard', badge:null, monthly:176, agreed:false, mods:false, track:false, rating:'A++', am_best:'A++' },
  { name:'USAA', type:'Military', badge:'Veterans Only', monthly:158, agreed:false, mods:true, track:false, rating:'A++', am_best:'A++' },
  { name:'American Collectors', type:'Collector', badge:null, monthly:98, agreed:true, mods:true, track:false, rating:'A-', am_best:'A-' },
  { name:'Heacock Classic', type:'Collector', badge:null, monthly:112, agreed:true, mods:true, track:true, rating:'A', am_best:'A' },
]

export default function InsurancePage() {
  const [step, setStep] = useState<'form'|'results'>('form')
  const [form, setForm] = useState({ vehicle:'', use:'pleasure', mileage:'5000', zip:'', mods:'false', track:'false', agreed:'false' })
  const [compare, setCompare] = useState<string[]>([])

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const sorted = [...CARRIERS].sort((a,b) => a.monthly - b.monthly)
  const filtered = sorted.filter(c => {
    if (form.mods === 'true' && !c.mods) return false
    if (form.track === 'true' && !c.track) return false
    if (form.agreed === 'true' && !c.agreed) return false
    return true
  })

  const TYPE_COLORS: Record<string,string> = { Enthusiast:'#E63946', Standard:'#3b82f6', Military:'#22c55e', Collector:'#F4A261' }

  return (
    <div style={{ maxWidth:'1000px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🛡️ Insurance Quotes</h1>
        <p style={{ color:'#666', marginTop:'0.25rem' }}>Real-time quotes from 30+ carriers — including Hagerty, Grundy, and all standard insurers</p>
      </div>

      <div style={{ background:'rgba(230,57,70,0.06)', border:'1px solid rgba(230,57,70,0.15)', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1.5rem', display:'flex', gap:'0.75rem' }}>
        <span style={{ color:'#E63946', fontSize:'1.25rem', flexShrink:0 }}>🛡️</span>
        <div>
          <p style={{ fontSize:'0.875rem', fontWeight:600, color:'#E63946' }}>Standard policies may not cover your mods</p>
          <p style={{ fontSize:'0.8rem', color:'#666' }}>If your vehicle has modifications, agreed-value coverage from Hagerty or Grundy protects your full build investment.</p>
        </div>
      </div>

      {step === 'form' ? (
        <div style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'1rem', padding:'2rem' }}>
          <h2 style={{ fontWeight:700, marginBottom:'1.5rem' }}>Get Your Quotes</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:'1rem', marginBottom:'1.5rem' }}>
            {[['vehicle','Vehicle','Select from your garage'],['zip','Garage ZIP','e.g. 75201'],['mileage','Annual Mileage','e.g. 5000']].map(([k,l,p]) => (
              <div key={k as string}>
                <label style={{ display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }}>{l as string}</label>
                <input value={(form as any)[k as string]} onChange={e => set(k as string, e.target.value)} placeholder={p as string} style={{ width:'100%', background:'#0D0D0D', border:'1px solid #2a2a3e', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }} />
              </div>
            ))}
            <div>
              <label style={{ display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.375rem' }}>Primary Use</label>
              <select value={form.use} onChange={e => set('use', e.target.value)} style={{ width:'100%', background:'#0D0D0D', border:'1px solid #2a2a3e', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }}>
                {['daily','pleasure','show','track','collector'].map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase()+u.slice(1)}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
            {[['mods','Vehicle has modifications'],['track','Include track day coverage'],['agreed','Agreed value coverage only']].map(([k,l]) => (
              <label key={k as string} style={{ display:'flex', alignItems:'center', gap:'0.5rem', cursor:'pointer', fontSize:'0.875rem', color: (form as any)[k as string] === 'true' ? '#E63946' : '#aaa' }}>
                <input type="checkbox" checked={(form as any)[k as string] === 'true'} onChange={e => set(k as string, e.target.checked.toString())} style={{ accentColor:'#E63946' }} />
                {l as string}
              </label>
            ))}
          </div>
          <button onClick={() => setStep('results')} style={{ background:'#E63946', color:'white', border:'none', padding:'0.875rem 2rem', borderRadius:'0.875rem', fontWeight:700, fontSize:'1rem', cursor:'pointer' }}>
            Get Quotes from All Carriers
          </button>
        </div>
      ) : (
        <div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem' }}>
            <p style={{ color:'#666', fontSize:'0.875rem' }}>{filtered.length} carriers matched your requirements</p>
            <button onClick={() => setStep('form')} style={{ background:'transparent', border:'1px solid #2a2a3e', color:'#aaa', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>← Edit Filters</button>
          </div>

          {compare.length >= 2 && (
            <div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.875rem', padding:'0.875rem 1rem', marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <p style={{ fontSize:'0.875rem', color:'#22c55e' }}>Comparing {compare.length} carriers</p>
              <button onClick={() => setCompare([])} style={{ background:'transparent', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', padding:'0.3rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.8rem', cursor:'pointer' }}>Clear</button>
            </div>
          )}

          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {filtered.map((c, i) => {
              const isComparing = compare.includes(c.name)
              const isBest = i === 0
              return (
                <div key={c.name} style={{ background:'#1a1a2e', border:`1px solid ${isBest ? 'rgba(34,197,94,0.3)' : '#2a2a3e'}`, borderRadius:'1rem', padding:'1.25rem', display:'flex', alignItems:'center', gap:'1.25rem' }}>
                  {isBest && <span style={{ position:'absolute', fontSize:'0.7rem' }} />}
                  <div style={{ minWidth:'120px' }}>
                    <p style={{ fontWeight:800, fontSize:'1rem' }}>{c.name}</p>
                    <span style={{ background:`${TYPE_COLORS[c.type] ?? '#aaa'}15`, color: TYPE_COLORS[c.type] ?? '#aaa', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', border:`1px solid ${TYPE_COLORS[c.type] ?? '#aaa'}25` }}>{c.type}</span>
                    {c.badge && <p style={{ fontSize:'0.7rem', color:'#F4A261', marginTop:'0.25rem' }}>{c.badge}</p>}
                  </div>
                  <div style={{ flex:1, display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                    {[['Agreed Value', c.agreed],['Mod Coverage', c.mods],['Track Day', c.track]].map(([label, val]) => (
                      <div key={label as string} style={{ textAlign:'center' }}>
                        <p style={{ fontSize:'0.7rem', color:'#555', marginBottom:'0.2rem' }}>{label as string}</p>
                        <p style={{ fontSize:'0.85rem', color: val ? '#22c55e' : '#555' }}>{val ? '✓' : '—'}</p>
                      </div>
                    ))}
                    <div style={{ textAlign:'center' }}>
                      <p style={{ fontSize:'0.7rem', color:'#555', marginBottom:'0.2rem' }}>AM Best</p>
                      <p style={{ fontSize:'0.85rem', fontWeight:700, color:'#F4A261' }}>{c.am_best}</p>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', minWidth:'100px' }}>
                    <p style={{ fontSize:'1.5rem', fontWeight:900, color:isBest ? '#22c55e' : '#E63946' }}>${c.monthly}</p>
                    <p style={{ fontSize:'0.75rem', color:'#666' }}>/month est.</p>
                    {isBest && <p style={{ fontSize:'0.7rem', color:'#22c55e', fontWeight:600 }}>Best Rate</p>}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    <button style={{ background:'#E63946', color:'white', border:'none', padding:'0.5rem 1rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', whiteSpace:'nowrap' }}>Get Quote</button>
                    <button onClick={() => setCompare(prev => prev.includes(c.name) ? prev.filter(x=>x!==c.name) : prev.length < 4 ? [...prev, c.name] : prev)} style={{ background: isComparing ? 'rgba(34,197,94,0.1)' : 'transparent', border:`1px solid ${isComparing ? 'rgba(34,197,94,0.3)' : '#2a2a3e'}`, color: isComparing ? '#22c55e' : '#aaa', padding:'0.375rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.75rem', cursor:'pointer', whiteSpace:'nowrap' }}>
                      {isComparing ? '✓ Comparing' : 'Compare'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
