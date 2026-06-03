'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'

// Real product mockup photos from Unsplash + styled with RC-1 branding overlay
const PRODUCTS = [
  {
    id:'1', name:'RevConnect-1 Classic Tee', category:'Apparel',
    price:34.99, compareAt:null, isNew:true, isLimited:false, revPoints:35,
    description:'Premium 100% cotton tee. Embroidered RevConnect-1 logo on chest. Available Black & White.',
    sizes:['S','M','L','XL','2XL','3XL'],
    colors:['Black','White'],
    img:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&q=85',
    badge:'NEW',
    badgeColor:'#22c55e',
  },
  {
    id:'2', name:'RC-1 Snapback Cap', category:'Headwear',
    price:29.99, compareAt:null, isNew:true, isLimited:false, revPoints:30,
    description:'Structured snapback with flat brim. Embroidered RC-1 logo. One size fits most.',
    sizes:['One Size'],
    colors:['Black/Red','Navy/Gold','All Black'],
    img:'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&q=85',
    badge:'NEW',
    badgeColor:'#22c55e',
  },
  {
    id:'3', name:'Garage King Hoodie', category:'Apparel',
    price:64.99, compareAt:79.99, isNew:false, isLimited:false, revPoints:65,
    description:'Heavyweight 400gsm fleece hoodie. Front pocket, embroidered chest logo. Perfect for the shop.',
    sizes:['S','M','L','XL','2XL','3XL'],
    colors:['Black','Charcoal','Navy'],
    img:'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600&q=85',
    badge:'SALE',
    badgeColor:'#CC0000',
  },
  {
    id:'4', name:'RC-1 Dad Hat', category:'Headwear',
    price:24.99, compareAt:null, isNew:false, isLimited:false, revPoints:25,
    description:'Unstructured canvas dad hat with curved brim. Adjustable strap. Embroidered logo.',
    sizes:['One Size'],
    colors:['Khaki','Black','White'],
    img:'https://images.unsplash.com/photo-1533827432537-70133748f5c8?w=600&q=85',
    badge:null, badgeColor:'',
  },
  {
    id:'5', name:'Legend Drop Box — #/500', category:'Collectibles',
    price:149.99, compareAt:null, isNew:false, isLimited:true, revPoints:300,
    description:'Limited collectors box #/500. Includes exclusive tee, hat, sticker sheet, enamel pin & numbered certificate.',
    sizes:['One Size'],
    colors:['Box Set'],
    img:'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=85',
    badge:'LIMITED',
    badgeColor:'#FFD700',
  },
  {
    id:'6', name:'RC-1 Tumbler 30oz', category:'Drinkware',
    price:39.99, compareAt:null, isNew:false, isLimited:false, revPoints:40,
    description:'Double-wall insulated tumbler. Keeps drinks cold 24hrs, hot 12hrs. Laser-engraved RC-1 logo.',
    sizes:['30oz'],
    colors:['Black','Silver','Red'],
    img:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=85',
    badge:null, badgeColor:'',
  },
  {
    id:'7', name:'Shop Apron — Waxed Canvas', category:'Garage Gear',
    price:44.99, compareAt:null, isNew:true, isLimited:false, revPoints:45,
    description:'Heavy-duty waxed canvas shop apron. Multiple tool pockets, adjustable neck strap. Built for the garage.',
    sizes:['One Size'],
    colors:['Dark Brown','Black'],
    img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=85',
    badge:'NEW',
    badgeColor:'#22c55e',
  },
  {
    id:'8', name:'RC-1 License Plate Frame', category:'Vehicle Accessories',
    price:19.99, compareAt:null, isNew:false, isLimited:false, revPoints:20,
    description:'Powder-coated stainless steel. Universal fit. RC-1 branding top and bottom.',
    sizes:['Universal'],
    colors:['Black','Chrome','Red'],
    img:'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=85',
    badge:null, badgeColor:'',
  },
  {
    id:'9', name:'RC-1 Sticker Pack (10pc)', category:'Stickers',
    price:12.99, compareAt:null, isNew:false, isLimited:false, revPoints:13,
    description:'10-piece vinyl sticker pack. Logo, wordmarks, racing stripes, and limited holo sticker.',
    sizes:['One Size'],
    colors:['Assorted'],
    img:'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&q=85',
    badge:null, badgeColor:'',
  },
  {
    id:'10', name:'RC-1 Crewneck Sweatshirt', category:'Apparel',
    price:54.99, compareAt:null, isNew:true, isLimited:false, revPoints:55,
    description:'Midweight fleece crewneck. Relaxed fit. Embroidered logo left chest.',
    sizes:['S','M','L','XL','2XL'],
    colors:['Black','Navy','Heather Grey'],
    img:'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=600&q=85',
    badge:'NEW',
    badgeColor:'#22c55e',
  },
  {
    id:'11', name:'RC-1 Coffee Mug 15oz', category:'Drinkware',
    price:22.99, compareAt:null, isNew:false, isLimited:false, revPoints:23,
    description:'Ceramic mug with wrap-around RC-1 design. Dishwasher safe. Perfect for early morning wrenching.',
    sizes:['15oz'],
    colors:['Black','White'],
    img:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&q=85',
    badge:null, badgeColor:'',
  },
  {
    id:'12', name:'RC-1 Racing Jacket', category:'Outerwear',
    price:94.99, compareAt:119.99, isNew:false, isLimited:true, revPoints:150,
    description:'Lightweight bomber-style racing jacket. Embroidered patches, mesh lining. Show-ready.',
    sizes:['S','M','L','XL','2XL'],
    colors:['Black/Red','Navy/Gold'],
    img:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&q=85',
    badge:'LIMITED',
    badgeColor:'#FFD700',
  },
]

const CATS = ['All','Apparel','Headwear','Outerwear','Drinkware','Stickers','Collectibles','Garage Gear','Vehicle Accessories']
const TIERS = { cruiser:{mult:1,color:'rgba(255,255,255,0.4)'}, builder:{mult:1.25,color:'#3399FF'}, racer:{mult:1.5,color:'#a855f7'}, legend:{mult:2,color:'#FFD700'} }

export default function StorePage() {
  const { profile } = useAuth()
  const [cat, setCat] = useState('All')
  const [cart, setCart] = useState<Record<string,number>>({})
  const [selected, setSelected] = useState<typeof PRODUCTS[0] | null>(null)
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set())

  const tier = (profile?.membership_tier ?? 'cruiser') as keyof typeof TIERS
  const tierData = TIERS[tier] ?? TIERS.cruiser
  const filtered = cat === 'All' ? PRODUCTS : PRODUCTS.filter(p => p.category === cat)
  const cartCount = Object.values(cart).reduce((a,b) => a+b, 0)
  const cartTotal = Object.entries(cart).reduce((total,[id,qty]) => {
    const p = PRODUCTS.find(p => p.id === id)
    return total + (p?.price ?? 0) * qty
  }, 0)

  function addToCart(id: string) {
    setCart(c => ({ ...c, [id]:(c[id]??0)+1 }))
    setAddedIds(prev => {
      const n = new Set(prev); n.add(id)
      setTimeout(() => setAddedIds(p => { const m=new Set(p); m.delete(id); return m }), 2000)
      return n
    })
  }

  return (
    <div style={{ maxWidth:'1300px', margin:'0 auto' }}>
      {/* Product modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'2rem' }} onClick={() => setSelected(null)}>
          <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1.25rem', padding:'0', maxWidth:'700px', width:'100%', overflow:'hidden', display:'grid', gridTemplateColumns:'1fr 1fr' }} onClick={e => e.stopPropagation()}>
            {/* Photo */}
            <div style={{ position:'relative', background:'#0D1E30' }}>
              <img src={selected.img} alt={selected.name} style={{ width:'100%', height:'100%', objectFit:'cover', minHeight:'400px' }} />
              {/* RC-1 Brand overlay */}
              <div style={{ position:'absolute', bottom:0, left:0, right:0, background:'linear-gradient(transparent, rgba(13,30,48,0.9))', padding:'1.5rem 1rem 1rem' }}>
                <div style={{ display:'inline-flex', alignItems:'center', gap:'0.375rem', background:'rgba(204,0,0,0.85)', borderRadius:'0.375rem', padding:'0.25rem 0.625rem' }}>
                  <span style={{ color:'white', fontWeight:900, fontSize:'0.75rem', letterSpacing:'0.5px' }}>RevConnect-1</span>
                </div>
              </div>
              {selected.badge && <div style={{ position:'absolute', top:'0.875rem', left:'0.875rem', background:selected.badgeColor, color:'white', padding:'0.25rem 0.625rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:800 }}>{selected.badge}</div>}
            </div>
            {/* Details */}
            <div style={{ padding:'2rem', display:'flex', flexDirection:'column' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                <div>
                  <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.25rem' }}>{selected.category}</p>
                  <h2 style={{ fontWeight:800, fontSize:'1.2rem' }}>{selected.name}</h2>
                </div>
                <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'1.5rem', cursor:'pointer', lineHeight:1 }}>×</button>
              </div>

              <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.875rem', lineHeight:1.6, marginBottom:'1.25rem', flex:1 }}>{selected.description}</p>

              {/* Size */}
              {selected.sizes.length > 1 && (
                <div style={{ marginBottom:'1rem' }}>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem' }}>Size</label>
                  <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                    {selected.sizes.map(s => (
                      <button key={s} onClick={() => setSelectedSize(s)} style={{ padding:'0.375rem 0.75rem', borderRadius:'0.5rem', border:`1px solid ${selectedSize===s ? '#CC0000':'rgba(255,255,255,0.12)'}`, background: selectedSize===s ? 'rgba(204,0,0,0.12)':'transparent', color: selectedSize===s ? '#CC0000':'rgba(255,255,255,0.5)', fontSize:'0.8rem', cursor:'pointer' }}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* Color */}
              {selected.colors.length > 1 && (
                <div style={{ marginBottom:'1.25rem' }}>
                  <label style={{ display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem' }}>Color</label>
                  <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                    {selected.colors.map(c => (
                      <button key={c} onClick={() => setSelectedColor(c)} style={{ padding:'0.3rem 0.625rem', borderRadius:'0.5rem', border:`1px solid ${selectedColor===c ? '#CC0000':'rgba(255,255,255,0.12)'}`, background: selectedColor===c ? 'rgba(204,0,0,0.12)':'transparent', color: selectedColor===c ? '#CC0000':'rgba(255,255,255,0.5)', fontSize:'0.75rem', cursor:'pointer' }}>{c}</button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'1.25rem' }}>
                <div>
                  <p style={{ fontSize:'2rem', fontWeight:900, color:'#CC0000' }}>${selected.price}</p>
                  {selected.compareAt && <p style={{ fontSize:'0.875rem', color:'rgba(255,255,255,0.3)', textDecoration:'line-through' }}>${selected.compareAt}</p>}
                  <p style={{ fontSize:'0.75rem', color:tierData.color, marginTop:'0.125rem' }}>+{Math.round(selected.revPoints * tierData.mult)} Rev Points</p>
                </div>
              </div>

              <button onClick={() => { addToCart(selected.id); setSelected(null) }} style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, fontSize:'1rem', cursor:'pointer', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
                Add to Cart — ${selected.price}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ background:'linear-gradient(135deg, rgba(204,0,0,0.1), rgba(21,57,204,0.06))', border:'1px solid rgba(204,0,0,0.15)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'1rem' }}>
        <div>
          <h1 style={{ fontSize:'1.75rem', fontWeight:900 }}>👕 Official Merch Store</h1>
          <p style={{ color:'rgba(255,255,255,0.4)', marginTop:'0.25rem' }}>Rep RevConnect-1 · Earn {Math.round(tierData.mult*100)}% Rev Points on every purchase</p>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'1rem' }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)' }}>Your tier</p>
            <p style={{ fontWeight:700, color:tierData.color, textTransform:'capitalize' }}>{tier} ({tierData.mult}× points)</p>
          </div>
          {cartCount > 0 && (
            <div style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.625rem 1.25rem', borderRadius:'0.875rem', fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(204,0,0,0.35)', display:'flex', gap:'0.5rem', alignItems:'center' }}>
              🛒 {cartCount} · ${cartTotal.toFixed(2)}
            </div>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', marginBottom:'1.5rem' }}>
        {CATS.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding:'0.375rem 0.875rem', borderRadius:'9999px', border:`1px solid ${cat===c ? '#CC0000':'rgba(255,255,255,0.1)'}`, background: cat===c ? 'rgba(204,0,0,0.12)':'transparent', color: cat===c ? '#CC0000':'rgba(255,255,255,0.45)', fontSize:'0.8rem', cursor:'pointer', fontWeight: cat===c ? 700:400 }}>{c}</button>
        ))}
      </div>

      {/* Product grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'1.25rem' }}>
        {filtered.map(p => {
          const isAdded = addedIds.has(p.id)
          return (
            <div key={p.id} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', overflow:'hidden', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s' }}
              onClick={() => { setSelected(p); setSelectedSize(''); setSelectedColor('') }}>
              {/* Product image with RC-1 branding */}
              <div style={{ height:'220px', position:'relative', overflow:'hidden', background:'#0D1E30' }}>
                <img src={p.img} alt={p.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                {/* Brand watermark */}
                <div style={{ position:'absolute', bottom:'0.75rem', left:'0.75rem', background:'rgba(204,0,0,0.88)', borderRadius:'0.375rem', padding:'0.2rem 0.5rem', backdropFilter:'blur(4px)' }}>
                  <span style={{ color:'white', fontWeight:900, fontSize:'0.65rem', letterSpacing:'0.5px' }}>RevConnect-1</span>
                </div>
                {/* Badges */}
                {p.badge && (
                  <div style={{ position:'absolute', top:'0.75rem', left:'0.75rem', background:p.badgeColor, color: p.badgeColor === '#FFD700' ? '#000':'white', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:800 }}>{p.badge}</div>
                )}
                {p.compareAt && !p.badge && (
                  <div style={{ position:'absolute', top:'0.75rem', left:'0.75rem', background:'#CC0000', color:'white', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:800 }}>SALE</div>
                )}
              </div>

              <div style={{ padding:'1rem' }}>
                <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.25rem' }}>{p.category}</p>
                <h3 style={{ fontWeight:700, fontSize:'0.925rem', marginBottom:'0.625rem', lineHeight:1.3 }}>{p.name}</h3>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div>
                    <span style={{ fontWeight:900, color:'#CC0000', fontSize:'1.2rem' }}>${p.price}</span>
                    {p.compareAt && <span style={{ color:'rgba(255,255,255,0.25)', fontSize:'0.8rem', textDecoration:'line-through', marginLeft:'0.375rem' }}>${p.compareAt}</span>}
                    <p style={{ fontSize:'0.65rem', color:tierData.color, marginTop:'0.1rem' }}>+{Math.round(p.revPoints * tierData.mult)} pts</p>
                  </div>
                  <button onClick={e => { e.stopPropagation(); addToCart(p.id) }} style={{ background: isAdded ? 'rgba(34,197,94,0.12)':'rgba(204,0,0,0.1)', border:`1px solid ${isAdded ? 'rgba(34,197,94,0.25)':'rgba(204,0,0,0.2)'}`, color: isAdded ? '#22c55e':'#CC0000', padding:'0.4rem 0.75rem', borderRadius:'0.5rem', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', transition:'all 0.15s', whiteSpace:'nowrap' }}>
                    {isAdded ? '✓ Added' : '+ Cart'}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div style={{ textAlign:'center', marginTop:'2.5rem', padding:'1.5rem', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'0.875rem' }}>
        <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.8rem' }}>
          🎽 All items feature the official RevConnect-1 logo · Free shipping on orders over $75 · Legend members always ship free
        </p>
      </div>
    </div>
  )
}
