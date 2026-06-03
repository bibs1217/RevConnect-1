'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'

const PRODUCTS = [
  { id:'1', name:'RevConnect-1 Classic Tee', category:'Apparel', price:34.99, compareAt:null, img:'👕', sizes:['S','M','L','XL','2XL'], isNew:true, isLimited:false, revPoints:35, description:'Premium 100% cotton tee with embroidered RevConnect-1 logo. Available in Black and White.' },
  { id:'2', name:'RC-1 Snapback', category:'Headwear', price:29.99, compareAt:null, img:'🧢', sizes:['One Size'], isNew:true, isLimited:false, revPoints:30, description:'Structured snapback with flat brim and embroidered logo. Adjustable fit.' },
  { id:'3', name:'Garage King Hoodie', category:'Apparel', price:64.99, compareAt:79.99, img:'🧥', sizes:['S','M','L','XL','2XL'], isNew:false, isLimited:false, revPoints:65, description:'Heavyweight 400gsm hoodie. Front kangaroo pocket, embroidered chest logo.' },
  { id:'4', name:'RevConnect-1 Sticker Pack', category:'Stickers', price:12.99, compareAt:null, img:'🏷️', sizes:['One Size'], isNew:false, isLimited:false, revPoints:13, description:'10-piece sticker pack — logo, wordmarks, and limited holo sticker.' },
  { id:'5', name:'Legend Drop Box — Limited', category:'Collectibles', price:149.99, compareAt:null, img:'📦', sizes:['One Size'], isNew:false, isLimited:true, revPoints:300, description:'Limited edition collectors box. Includes exclusive tee, hat, sticker sheet, and enamel pin. #/500 numbered.' },
  { id:'6', name:'RC-1 Tumbler 30oz', category:'Drinkware', price:39.99, compareAt:null, img:'🥤', sizes:['One Size'], isNew:false, isLimited:false, revPoints:40, description:'Double-wall insulated 30oz tumbler. Keeps cold 24hrs, hot 12hrs. Laser-engraved logo.' },
  { id:'7', name:'Shop Apron — Canvas', category:'Garage Gear', price:44.99, compareAt:null, img:'🔧', sizes:['One Size'], isNew:true, isLimited:false, revPoints:45, description:'Heavy-duty waxed canvas shop apron. Multiple pockets, adjustable neck strap.' },
  { id:'8', name:'RevConnect-1 License Frame', category:'Vehicle Accessories', price:19.99, compareAt:null, img:'🚗', sizes:['One Size'], isNew:false, isLimited:false, revPoints:20, description:'Powder-coated stainless steel license plate frame. Universal fit.' },
]

const CATS = ['All','Apparel','Headwear','Stickers','Collectibles','Drinkware','Garage Gear','Vehicle Accessories']
const TIERS = { cruiser:{ mult:1, color:'#aaa' }, builder:{ mult:1.25, color:'#3b82f6' }, racer:{ mult:1.5, color:'#a855f7' }, legend:{ mult:2, color:'#F4A261' } }

export default function StorePage() {
  const { profile } = useAuth()
  const [cat, setCat] = useState('All')
  const [cart, setCart] = useState<Record<string,number>>({})
  const [selected, setSelected] = useState<typeof PRODUCTS[0] | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const tier = (profile?.membership_tier ?? 'cruiser') as keyof typeof TIERS
  const tierData = TIERS[tier] ?? TIERS.cruiser

  const filtered = cat === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat)
  const cartCount = Object.values(cart).reduce((a,b) => a+b, 0)
  const cartTotal = Object.entries(cart).reduce((total, [id, qty]) => {
    const p = PRODUCTS.find(p => p.id === id)
    return total + (p?.price ?? 0) * qty
  }, 0)

  function addToCart(id: string) {
    setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 }))
    setAddedIds(prev => { const n = new Set(prev); n.add(id); setTimeout(() => setAddedIds(p => { const m = new Set(p); m.delete(id); return m }), 2000); return n })
  }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, rgba(230,57,70,0.12), rgba(244,162,97,0.06))', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>👕 Official Merch Store</h1>
          <p style={{ color:'#aaa', marginTop:'0.25rem' }}>Represent RevConnect-1 · Earn Rev Points on every purchase</p>
        </div>
        <div style={{ display:'flex', gap:'1rem', alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'0.7rem', color:'#666' }}>Your tier</p>
            <p style={{ fontWeight:700, color:tierData.color, textTransform:'capitalize', fontSize:'0.9rem' }}>{tier} ({tierData.mult}× points)</p>
          </div>
          {cartCount > 0 && (
            <div style={{ background:'#E63946', color:'white', padding:'0.5rem 1rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer', display:'flex', gap:'0.5rem', alignItems:'center' }}>
              🛒 {cartCount} · ${cartTotal.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:`1px solid ${cat===c ? '#E63946' : '#2a2a3e'}`, background: cat===c ? 'rgba(230,57,70,0.1)' : 'transparent', color: cat===c ? '#E63946' : '#aaa', fontSize:'0.8rem', cursor:'pointer' }}>{c}</button>
        ))}
      </div>

      {/* Product detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }} onClick={() => setSelected(null)}>
          <div style={{ background:'#1a1a2e', border:'1px solid #2a2a3e', borderRadius:'1.25rem', padding:'2rem', maxWidth:'600px', width:'100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'1.25rem' }}>
              <h2 style={{ fontWeight:800, fontSize:'1.25rem' }}>{selected.name}</h2>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'#555', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
            </div>
            <div style={{ height:'200px', background:'linear-gradient(135deg, rgba(230,57,70,0.08), transparent)', borderRadius:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', marginBottom:'1.25rem' }}>{selected.img}</div>
            <p style={{ color:'#888', fontSize:'0.875rem', lineHeight:1.6, marginBottom:'1rem' }}>{selected.description}</p>
            {selected.sizes.length > 1 && (
              <div style={{ marginBottom:'1rem' }}>
                <label style={{ display:'block', fontSize:'0.75rem', color:'#aaa', marginBottom:'0.5rem' }}>Size</label>
                <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                  {selected.sizes.map(s => (
                    <button key={s} onClick={() => setSelectedSize(s)} style={{ padding:'0.375rem 0.875rem', borderRadius:'0.5rem', border:`1px solid ${selectedSize===s ? '#E63946' : '#2a2a3e'}`, background: selectedSize===s ? 'rgba(230,57,70,0.1)' : 'transparent', color: selectedSize===s ? '#E63946' : '#aaa', fontSize:'0.8rem', cursor:'pointer' }}>{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
              <div>
                <p style={{ fontSize:'1.75rem', fontWeight:900, color:'#E63946' }}>${selected.price}</p>
                <p style={{ fontSize:'0.75rem', color:tierData.color }}>+{Math.round(selected.revPoints * tierData.mult)} Rev Points</p>
              </div>
              {selected.isLimited && <span style={{ background:'rgba(230,57,70,0.1)', border:'1px solid rgba(230,57,70,0.2)', color:'#E63946', padding:'0.25rem 0.75rem', borderRadius:'9999px', fontSize:'0.8rem', fontWeight:600 }}>Limited Drop</span>}
            </div>
            <button onClick={() => { addToCart(selected.id); setSelected(null) }} style={{ width:'100%', background:'#E63946', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, fontSize:'1rem', cursor:'pointer' }}>
              Add to Cart — ${selected.price}
            </button>
          </div>
        </div>
      )}

      {/* Products grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1.25rem' }}>
        {filtered.map(p => {
          const isAdded = addedIds.has(p.id)
          return (
            <div key={p.id} style={{ background:'#1a1a2e', border:`1px solid ${p.isLimited ? 'rgba(230,57,70,0.3)' : '#2a2a3e'}`, borderRadius:'1rem', overflow:'hidden', cursor:'pointer' }} onClick={() => { setSelected(p); setSelectedSize('') }}>
              <div style={{ height:'180px', background:'linear-gradient(135deg, rgba(230,57,70,0.06), transparent)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'5rem', position:'relative' }}>
                {p.img}
                <div style={{ position:'absolute', top:'0.625rem', left:'0.625rem', display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
                  {p.isNew && <span style={{ background:'#22c55e', color:'white', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>NEW</span>}
                  {p.isLimited && <span style={{ background:'#E63946', color:'white', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>LIMITED</span>}
                </div>
              </div>
              <div style={{ padding:'1rem' }}>
                <p style={{ fontSize:'0.7rem', color:'#555', marginBottom:'0.25rem' }}>{p.category}</p>
                <h3 style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.625rem', lineHeight:1.3 }}>{p.name}</h3>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <span style={{ fontWeight:800, color:'#E63946', fontSize:'1.1rem' }}>${p.price}</span>
                    {p.compareAt && <span style={{ color:'#555', fontSize:'0.8rem', textDecoration:'line-through', marginLeft:'0.375rem' }}>${p.compareAt}</span>}
                    <p style={{ fontSize:'0.7rem', color:tierData.color, marginTop:'0.125rem' }}>+{Math.round(p.revPoints * tierData.mult)} pts</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); addToCart(p.id) }} style={{ background: isAdded ? 'rgba(34,197,94,0.15)' : 'rgba(230,57,70,0.1)', border:`1px solid ${isAdded ? 'rgba(34,197,94,0.3)' : 'rgba(230,57,70,0.2)'}`, color: isAdded ? '#22c55e' : '#E63946', padding:'0.4rem 0.625rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:600, cursor:'pointer', transition:'all 0.15s' }}>
                    {isAdded ? '✓ Added' : '+ Cart'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
