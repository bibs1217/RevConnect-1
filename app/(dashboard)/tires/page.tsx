'use client'

import { useState } from 'react'

/* ────────────────────────────────────────────────────────────────────────
   VictoryRevConnect-1 — Tires
   1) Comparison shopping: search + filter bar, all matching sellers
   2) Size visualizer: side + front view rendered to scale, with the
      numbers that actually matter (diameter, sidewall, speedo error)
   ──────────────────────────────────────────────────────────────────────── */

const WIDTHS  = Array.from({ length: 21 }, (_, i) => 155 + i * 10)        // 155–355
const ASPECTS = Array.from({ length: 13 }, (_, i) => 25 + i * 5)          // 25–85
const RIMS    = Array.from({ length: 12 }, (_, i) => 13 + i)              // 13–24

const TIRE_TYPES = ['All Types', 'All-Season', 'Summer Performance', 'Winter / Snow', 'All-Terrain', 'Mud-Terrain', 'Touring', 'Track / Competition']
const BRANDS = ['All Brands', 'Michelin', 'Continental', 'Bridgestone', 'Goodyear', 'Pirelli', 'Yokohama', 'Toyo', 'Falken', 'Hankook', 'BFGoodrich', 'Nitto', 'Firestone', 'Cooper', 'General', 'Kumho']

interface TireSize { w: number; a: number; r: number }
const sizeStr = (t: TireSize) => `${t.w}/${t.a}R${t.r}`

interface Seller {
  id: string
  name: string
  logo: string
  color: string
  rating: number
  reviews: string
  perks: string[]
  brandOnly?: string
  url: (t: TireSize, brand: string) => string
}

const enc = encodeURIComponent

const SELLERS: Seller[] = [
  { id:'firestone', name:'Firestone', logo:'🔥', color:'#E61A1A', rating:4.6, reviews:'600K+', perks:['1,700+ stores', 'Installed pricing', 'Lifetime alignment plans'],
    url:(t) => `https://www.firestonecompleteautocare.com/tires/tire-size/${t.w}-${t.a}r${t.r}/` },
  { id:'tiresplus', name:'Tires Plus', logo:'➕', color:'#22c55e', rating:4.5, reviews:'350K+', perks:['Same-day install', 'Frequent rebates', 'Price match'],
    url:(t) => `https://www.tiresplus.com/tires/tire-size/${t.w}-${t.a}r${t.r}/` },
  { id:'bridgestone', name:'Bridgestone.com', logo:'🅱️', color:'#CC0000', rating:4.7, reviews:'400K+', perks:['Direct from manufacturer', 'DriveGuard & Potenza lines', 'Dealer locator'], brandOnly:'Bridgestone',
    url:(t) => `https://www.bridgestonetire.com/catalog/?tireSize=${t.w}%2F${t.a}R${t.r}` },
  { id:'tirerack', name:'Tire Rack', logo:'🏁', color:'#CC0000', rating:4.8, reviews:'1.2M+', perks:['Free road hazard', 'Test data & reviews', 'Mobile install network'],
    url:(t,b) => `https://www.tirerack.com/tires/TireSearchResults.jsp?width=${t.w}%2F&ratio=${t.a}&diameter=${t.r}${b !== 'All Brands' ? `&make=${enc(b)}` : ''}` },
  { id:'discount', name:'Discount Tire', logo:'🛞', color:'#E61A1A', rating:4.7, reviews:'900K+', perks:['1,100+ stores', 'Free rotation & balance', 'Price match'],
    url:(t) => `https://www.discounttire.com/buy-tires/size/${t.w}-${t.a}-${t.r}` },
  { id:'simpletire', name:'SimpleTire', logo:'⚡', color:'#3399FF', rating:4.5, reviews:'400K+', perks:['Ships to installer', 'Frequent coupons', 'Huge catalog'],
    url:(t,b) => `https://simpletire.com/tires-size-${t.w}-${t.a}r${t.r}${b !== 'All Brands' ? `?brand=${enc(b.toLowerCase())}` : ''}` },
  { id:'tirebuyer', name:'TireBuyer', logo:'🚚', color:'#FFD700', rating:4.4, reviews:'150K+', perks:['Fast free delivery', 'Installer network pricing'],
    url:(t) => `https://www.tirebuyer.com/tires/size/${t.w}-${t.a}r${t.r}` },
  { id:'priority', name:'Priority Tire', logo:'💰', color:'#22c55e', rating:4.6, reviews:'200K+', perks:['Deep discounts', 'Free shipping', 'Overstock deals'],
    url:(t,b) => `https://www.prioritytire.com/catalogsearch/result/?q=${enc(`${sizeStr(t)} ${b !== 'All Brands' ? b : ''}`.trim())}` },
  { id:'amazon', name:'Amazon Tires', logo:'📦', color:'#FF9900', rating:4.3, reviews:'2M+', perks:['Prime shipping', 'Easy returns'],
    url:(t,b) => `https://www.amazon.com/s?k=${enc(`${sizeStr(t)} tires ${b !== 'All Brands' ? b : ''}`.trim())}` },
  { id:'walmart', name:'Walmart Auto', logo:'🛒', color:'#0071DC', rating:4.2, reviews:'800K+', perks:['Budget friendly', 'In-store install'],
    url:(t,b) => `https://www.walmart.com/search?q=${enc(`${sizeStr(t)} tires ${b !== 'All Brands' ? b : ''}`.trim())}` },
  { id:'costco', name:'Costco Tires', logo:'🏬', color:'#005DAA', rating:4.7, reviews:'500K+', perks:['Member pricing', 'Lifetime rotation/balance', 'Nitrogen fill'],
    url:() => `https://tires.costco.com/` },
  { id:'goodyear', name:'Goodyear.com', logo:'🦶', color:'#FFD700', rating:4.5, reviews:'300K+', perks:['Direct from manufacturer', 'Rebates'], brandOnly:'Goodyear',
    url:(t) => `https://www.goodyear.com/en-US/tires/size?width=${t.w}&ratio=${t.a}&diameter=${t.r}` },
  { id:'michelin', name:'Michelin Dealers', logo:'🅼', color:'#3399FF', rating:4.8, reviews:'250K+', perks:['Direct from manufacturer', 'Dealer locator'], brandOnly:'Michelin',
    url:(t) => `https://www.michelinman.com/auto/search-results?searchText=${enc(sizeStr(t))}` },
]

// Rough street-price estimate per tire, by size + type
function estPrice(t: TireSize, type: string): [number, number] {
  let base = 62 + (t.r - 13) * 16 + Math.max(0, t.w - 185) * 0.55 + Math.max(0, 45 - t.a) * 1.6
  const mult: Record<string, number> = {
    'All Types': 1, 'All-Season': 1, 'Touring': 0.95, 'Winter / Snow': 1.18,
    'Summer Performance': 1.4, 'All-Terrain': 1.28, 'Mud-Terrain': 1.55, 'Track / Competition': 1.9,
  }
  base *= mult[type] ?? 1
  return [Math.round(base * 0.78 / 5) * 5, Math.round(base * 1.45 / 5) * 5]
}

/* ── size math ── */
function calc(t: TireSize) {
  const sidewallIn = (t.w * t.a / 100) / 25.4
  const diameter = t.r + 2 * sidewallIn
  const widthIn = t.w / 25.4
  const circ = Math.PI * diameter
  const revsPerMile = 63360 / circ
  return { sidewallIn, diameter, widthIn, circ, revsPerMile }
}

const fmt = (n: number, d = 1) => n.toFixed(d)

/* ── SVG: side view (overlaid, to scale) ── */
function SideView({ A, B }: { A: TireSize; B: TireSize }) {
  const a = calc(A), b = calc(B)
  const maxD = Math.max(a.diameter, b.diameter)
  const S = 300 / maxD // px per inch
  const cx = 170, cy = 170
  const ring = (d: number, rim: number, color: string, dash?: boolean) => (
    <>
      <circle cx={cx} cy={cy} r={d / 2 * S} fill="none" stroke={color} strokeWidth={3} strokeDasharray={dash ? '7 5' : undefined} opacity={0.95} />
      <circle cx={cx} cy={cy} r={rim / 2 * S} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray={dash ? '7 5' : undefined} opacity={0.55} />
    </>
  )
  return (
    <svg viewBox="0 0 340 340" style={{ width:'100%', maxWidth:'340px' }}>
      {/* ground line */}
      <line x1={15} y1={cy + a.diameter / 2 * S} x2={325} y2={cy + a.diameter / 2 * S} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      {/* tire A solid fill for realism */}
      <circle cx={cx} cy={cy} r={a.diameter / 2 * S} fill="rgba(20,20,24,0.9)" stroke="none" />
      <circle cx={cx} cy={cy} r={(a.diameter / 2 - a.sidewallIn) * S} fill="#1B2A3E" stroke="rgba(192,192,192,0.7)" strokeWidth={2} />
      {/* spokes */}
      {[0,72,144,216,288].map(deg => (
        <line key={deg}
          x1={cx + Math.cos(deg * Math.PI / 180) * (A.r / 2 * S * 0.25)}
          y1={cy + Math.sin(deg * Math.PI / 180) * (A.r / 2 * S * 0.25)}
          x2={cx + Math.cos(deg * Math.PI / 180) * (A.r / 2 * S * 0.92)}
          y2={cy + Math.sin(deg * Math.PI / 180) * (A.r / 2 * S * 0.92)}
          stroke="rgba(192,192,192,0.45)" strokeWidth={5} strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cy} r={6} fill="rgba(192,192,192,0.6)" />
      {ring(a.diameter, A.r, '#FF4444')}
      {ring(b.diameter, B.r, '#3399FF', true)}
      <text x={cx} y={20} textAnchor="middle" fill="#FF4444" fontSize="12" fontWeight="700">{sizeStr(A)} — {fmt(a.diameter)}&quot;</text>
      <text x={cx} y={335} textAnchor="middle" fill="#3399FF" fontSize="12" fontWeight="700">{sizeStr(B)} — {fmt(b.diameter)}&quot; (dashed)</text>
    </svg>
  )
}

/* ── SVG: front view (side by side, to scale) ── */
function FrontView({ A, B }: { A: TireSize; B: TireSize }) {
  const a = calc(A), b = calc(B)
  const maxD = Math.max(a.diameter, b.diameter)
  const S = 250 / maxD
  const draw = (t: TireSize, c: ReturnType<typeof calc>, x: number, color: string) => {
    const h = c.diameter * S
    const w = Math.max(c.widthIn * S, 18)
    const y = 290 - h
    const rimH = t.r * S
    const rimY = y + (h - rimH) / 2
    return (
      <g>
        <rect x={x - w / 2} y={y} width={w} height={h} rx={w * 0.32} fill="rgba(20,20,24,0.95)" stroke={color} strokeWidth={2.5} />
        {/* tread grooves */}
        {[0.3, 0.5, 0.7].map(f => (
          <line key={f} x1={x - w / 2 + w * f} y1={y + 6} x2={x - w / 2 + w * f} y2={y + h - 6} stroke="rgba(255,255,255,0.14)" strokeWidth={2} />
        ))}
        {/* rim visible band */}
        <rect x={x - w * 0.16} y={rimY} width={w * 0.32} height={rimH} rx={4} fill="rgba(192,192,192,0.35)" />
        <text x={x} y={y - 10} textAnchor="middle" fill={color} fontSize="12" fontWeight="700">{sizeStr(t)}</text>
        <text x={x} y={308} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="10">{fmt(c.widthIn)}&quot; wide · {fmt(c.diameter)}&quot; tall</text>
      </g>
    )
  }
  return (
    <svg viewBox="0 0 340 320" style={{ width:'100%', maxWidth:'340px' }}>
      <line x1={15} y1={290} x2={325} y2={290} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
      {draw(A, a, 110, '#FF4444')}
      {draw(B, b, 240, '#3399FF')}
    </svg>
  )
}

function SizePicker({ label, t, set, color }: { label: string; t: TireSize; set: (t: TireSize) => void; color: string }) {
  const sel = (v: number, key: 'w'|'a'|'r', opts: number[]) => (
    <select value={v} onChange={e => set({ ...t, [key]: Number(e.target.value) })}
      style={{ background:'#152234', border:`1px solid ${color}55`, borderRadius:'0.5rem', color:'white', padding:'0.45rem 0.5rem', fontSize:'0.85rem', outline:'none' }}>
      {opts.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  )
  return (
    <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', flexWrap:'wrap' }}>
      <span style={{ color, fontWeight:800, fontSize:'0.8rem', width:'52px' }}>{label}</span>
      {sel(t.w, 'w', WIDTHS)}<span style={{ color:'rgba(255,255,255,0.4)' }}>/</span>
      {sel(t.a, 'a', ASPECTS)}<span style={{ color:'rgba(255,255,255,0.4)' }}>R</span>
      {sel(t.r, 'r', RIMS)}
    </div>
  )
}

export default function TiresPage() {
  // shopping state
  const [size, setSize] = useState<TireSize>({ w: 245, a: 40, r: 18 })
  const [brand, setBrand] = useState('All Brands')
  const [type, setType] = useState('All Types')
  const [priceMax, setPriceMax] = useState('')
  const [searched, setSearched] = useState(false)

  // visualizer state
  const [tireA, setTireA] = useState<TireSize>({ w: 245, a: 40, r: 18 })
  const [tireB, setTireB] = useState<TireSize>({ w: 275, a: 35, r: 19 })

  const [lo, hi] = estPrice(size, type)
  const sellers = SELLERS.filter(s => {
    if (s.brandOnly && brand !== 'All Brands' && s.brandOnly !== brand) return false
    if (s.brandOnly && brand === 'All Brands') return true
    if (priceMax && lo > Number(priceMax)) return false
    return true
  })

  const a = calc(tireA), b = calc(tireB)
  const speedoAt60 = 60 * (b.diameter / a.diameter)
  const diffPct = ((b.diameter - a.diameter) / a.diameter) * 100

  const TH: React.CSSProperties = { textAlign:'left', padding:'0.5rem 0.75rem', color:'rgba(255,255,255,0.4)', fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.5px' }
  const TD: React.CSSProperties = { padding:'0.5rem 0.75rem', fontSize:'0.85rem', borderTop:'1px solid rgba(255,255,255,0.06)' }

  return (
    <div style={{ maxWidth:'1200px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.5rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🛞 Tires</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Comparison shop every major seller for your exact size — and see how a new size actually fits</p>
      </div>

      {/* ── search & filter bar ── */}
      <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'1rem 1.25rem', marginBottom:'1.5rem' }}>
        <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.6rem' }}>🔍 Find your tire</p>
        <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
          <SizePicker label="Size" t={size} set={setSize} color="#FFD700" />
          <select value={brand} onChange={e => setBrand(e.target.value)} style={{ background:'#0F1C2E', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'0.5rem', color:'white', padding:'0.45rem 0.6rem', fontSize:'0.85rem', outline:'none' }}>
            {BRANDS.map(x => <option key={x}>{x}</option>)}
          </select>
          <select value={type} onChange={e => setType(e.target.value)} style={{ background:'#0F1C2E', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'0.5rem', color:'white', padding:'0.45rem 0.6rem', fontSize:'0.85rem', outline:'none' }}>
            {TIRE_TYPES.map(x => <option key={x}>{x}</option>)}
          </select>
          <input value={priceMax} onChange={e => setPriceMax(e.target.value.replace(/\D/g,''))} placeholder="Max $/tire"
            style={{ width:'90px', background:'#0F1C2E', border:'1px solid rgba(255,255,255,0.12)', borderRadius:'0.5rem', color:'white', padding:'0.45rem 0.6rem', fontSize:'0.85rem', outline:'none' }} />
          <button onClick={() => setSearched(true)}
            style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.55rem 1.5rem', borderRadius:'0.6rem', fontWeight:800, fontSize:'0.9rem', cursor:'pointer', boxShadow:'0 2px 12px rgba(204,0,0,0.4)' }}>
            Search Sellers
          </button>
        </div>
        {searched && (
          <p style={{ marginTop:'0.75rem', fontSize:'0.8rem', color:'#FFD700' }}>
            {sellers.length} sellers match {sizeStr(size)}{brand !== 'All Brands' ? ` · ${brand}` : ''}{type !== 'All Types' ? ` · ${type}` : ''} — est. street price <strong>${lo}–${hi}/tire</strong>
          </p>
        )}
      </div>

      {/* ── seller results ── */}
      {searched && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'1rem', marginBottom:'2rem' }}>
          {sellers.map(s => {
            const [slo, shi] = estPrice(size, type)
            return (
              <div key={s.id} style={{ background:'#152234', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.1rem', display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                  <div style={{ width:'40px', height:'40px', background:`${s.color}22`, border:`1px solid ${s.color}55`, borderRadius:'0.6rem', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>{s.logo}</div>
                  <div>
                    <p style={{ fontWeight:800, fontSize:'0.95rem' }}>{s.name}</p>
                    <p style={{ fontSize:'0.72rem', color:'#FFD700' }}>{'★'.repeat(Math.round(s.rating))} {s.rating} · {s.reviews} reviews</p>
                  </div>
                </div>
                <p style={{ fontSize:'0.95rem', fontWeight:800, color:s.color }}>{sizeStr(size)} · est. ${slo}–${shi}/tire</p>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.3rem' }}>
                  {s.perks.map(p => <span key={p} style={{ fontSize:'0.62rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.55)', padding:'0.15rem 0.45rem', borderRadius:'9999px' }}>{p}</span>)}
                </div>
                <a href={s.url(size, brand)} target="_blank" rel="noopener noreferrer"
                  style={{ marginTop:'auto', textAlign:'center', background:`linear-gradient(135deg, ${s.color}, ${s.color}BB)`, color:'white', padding:'0.55rem', borderRadius:'0.6rem', fontWeight:800, fontSize:'0.8rem', textDecoration:'none' }}>
                  Shop {sizeStr(size)} at {s.name} ↗
                </a>
              </div>
            )
          })}
        </div>
      )}

      {/* ── size comparison visualizer ── */}
      <div style={{ background:'#152234', border:'1px solid #1E3A6E', borderRadius:'1rem', padding:'1.25rem', marginBottom:'2rem' }}>
        <h2 style={{ fontSize:'1.2rem', fontWeight:800, marginBottom:'0.25rem' }}>📐 Tire Size Comparison</h2>
        <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem', marginBottom:'1rem' }}>Enter two sizes and see them to scale — side profile and head-on — plus what the change does to your speedometer.</p>

        <div style={{ display:'flex', gap:'1.5rem', flexWrap:'wrap', marginBottom:'1.25rem' }}>
          <SizePicker label="Tire A" t={tireA} set={setTireA} color="#FF4444" />
          <SizePicker label="Tire B" t={tireB} set={setTireB} color="#3399FF" />
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(300px, 1fr))', gap:'1.25rem', alignItems:'start' }}>
          <div style={{ background:'#0F1C2E', borderRadius:'0.75rem', padding:'1rem', textAlign:'center' }}>
            <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem' }}>Side view (overlaid)</p>
            <SideView A={tireA} B={tireB} />
          </div>
          <div style={{ background:'#0F1C2E', borderRadius:'0.75rem', padding:'1rem', textAlign:'center' }}>
            <p style={{ fontSize:'0.72rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem' }}>Front view (to scale)</p>
            <FrontView A={tireA} B={tireB} />
          </div>
          <div style={{ background:'#0F1C2E', borderRadius:'0.75rem', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead><tr>
                <th style={TH}>Spec</th>
                <th style={{ ...TH, color:'#FF4444' }}>{sizeStr(tireA)}</th>
                <th style={{ ...TH, color:'#3399FF' }}>{sizeStr(tireB)}</th>
              </tr></thead>
              <tbody>
                <tr><td style={TD}>Overall diameter</td><td style={TD}>{fmt(a.diameter)}&quot;</td><td style={TD}>{fmt(b.diameter)}&quot;</td></tr>
                <tr><td style={TD}>Section width</td><td style={TD}>{fmt(a.widthIn)}&quot;</td><td style={TD}>{fmt(b.widthIn)}&quot;</td></tr>
                <tr><td style={TD}>Sidewall height</td><td style={TD}>{fmt(a.sidewallIn)}&quot;</td><td style={TD}>{fmt(b.sidewallIn)}&quot;</td></tr>
                <tr><td style={TD}>Circumference</td><td style={TD}>{fmt(a.circ)}&quot;</td><td style={TD}>{fmt(b.circ)}&quot;</td></tr>
                <tr><td style={TD}>Revs per mile</td><td style={TD}>{Math.round(a.revsPerMile)}</td><td style={TD}>{Math.round(b.revsPerMile)}</td></tr>
              </tbody>
            </table>
            <div style={{ padding:'0.75rem 0.875rem', borderTop:'1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ fontSize:'0.8rem', color: Math.abs(diffPct) > 3 ? '#FF4444' : '#22c55e', fontWeight:700 }}>
                Diameter difference: {diffPct >= 0 ? '+' : ''}{fmt(diffPct)}% {Math.abs(diffPct) > 3 ? '⚠️ over the ±3% safe range' : '✓ within ±3% safe range'}
              </p>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.5)', marginTop:'0.3rem' }}>
                With Tire B, when your speedometer reads 60 mph you&apos;re actually doing <strong style={{ color:'white' }}>{fmt(speedoAt60)} mph</strong>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <p style={{ textAlign:'center', fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', marginBottom:'1rem' }}>
        Price estimates are street-price guidance — click through to a seller for live pricing on your exact tire. Always verify load index and speed rating against your vehicle&apos;s door placard.
      </p>
    </div>
  )
}
