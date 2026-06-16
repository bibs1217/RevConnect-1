'use client'

import { useState } from 'react'

const MAKES = ['','Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mitsubishi','Nissan','Porsche','Subaru','Toyota','Volkswagen']

const RETAILERS = [
{ name:'AutoZone', logo:'🔴', color:'#E61A1A', url:(q:string) => `https://www.autozone.com/searchresult?searchText=${encodeURIComponent(q)}` },
{ name:"O'Reilly Auto", logo:'🟠', color:'#E87722', url:(q:string) => `https://www.oreillyauto.com/search?q=${encodeURIComponent(q)}` },
{ name:'Advance Auto', logo:'🟡', color:'#E8A400', url:(q:string) => `https://shop.advanceautoparts.com/find/searchresult?query=${encodeURIComponent(q)}` },
{ name:'NAPA Auto', logo:'🔵', color:'#003DA5', url:(q:string) => `https://www.napaonline.com/en/search?query=${encodeURIComponent(q)}` },
{ name:'Amazon Auto', logo:'📦', color:'#FF9900', url:(q:string) => `https://www.amazon.com/s?k=${encodeURIComponent(q+' auto parts')}&rh=n%3A15684181` },
{ name:'RockAuto', logo:'🪨', color:'#CC0000', url:(q:string) => `https://www.rockauto.com/en/catalog/?parttype=${encodeURIComponent(q)}` },
{ name:'Summit Racing', logo:'🏎️', color:'#003087', url:(q:string) => `https://www.summitracing.com/search?keyword=${encodeURIComponent(q)}` },
{ name:'JEGS', logo:'⚡', color:'#FFD700', url:(q:string) => `https://www.jegs.com/i/JEGS/900?ptype=searchresults&query=${encodeURIComponent(q)}` },
{ name:'CarParts.com', logo:'🚗', color:'#1539CC', url:(q:string) => `https://www.carparts.com/search?searchTerm=${encodeURIComponent(q)}` },
{ name:'PartsGeek', logo:'🔩', color:'#006633', url:(q:string) => `https://www.partsgeek.com/search?q=${encodeURIComponent(q)}` },
{ name:'1A Auto', logo:'1️⃣', color:'#CC0000', url:(q:string) => `https://www.1aauto.com/search?searchterm=${encodeURIComponent(q)}` },
{ name:'Walmart Auto', logo:'🛒', color:'#0071DC', url:(q:string) => `https://www.walmart.com/search?q=${encodeURIComponent(q+' auto parts')}` },
]

interface Part {
id: string; title: string; price: number | null; shipping: number
total_price: number; free_shipping: boolean; condition: string
image: string; url: string; seller: string; seller_feedback_score: number
seller_feedback_pct: string; location: string; is_auction: boolean
time_left: string; source: string; source_badge: string
part_number: string | null; brand: string | null
}

interface AiPart {
id: string; name: string; brand: string; price: number
location: string; seller: string; condition: string
compatibility: string; partNumber: string; description: string; url: string
}

interface PriceStats {
min: number; max: number; avg: number; median: number; count: number
}

interface Sources { ebay: number; marketcheck: number }

function getDealLabel(price: number, stats: PriceStats): { label: string; color: string; bg: string } {
const pct = ((stats.avg - price) / stats.avg) * 100
if (pct >= 25) return { label: `🔥 ${Math.round(pct)}% below avg`, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
if (pct >= 12) return { label: `👍 ${Math.round(pct)}% below avg`, color: '#4ade80', bg: 'rgba(74,222,128,0.08)' }
if (pct >= 0) return { label: `✓ Near avg`, color: '#94a3b8', bg: 'rgba(148,163,184,0.08)' }
return { label: `⬆ ${Math.round(-pct)}% above avg`, color: '#f87171', bg: 'rgba(248,113,113,0.08)' }
}

function pricePos(price: number, min: number, max: number) {
if (max === min) return 50
return Math.round(((price - min) / (max - min)) * 100)
}

export default function PartsPage() {
const [query, setQuery] = useState('')
const [vehicle, setVehicle] = useState({ year:'', make:'', model:'' })
const [filters, setFilters] = useState({ priceMax:'', condition:'', sortBy:'price-asc' })
const [parts, setParts] = useState<Part[]>([])
const [aiParts, setAiParts] = useState<AiPart[]>([])
const [total, setTotal] = useState(0)
const [stats, setStats] = useState<PriceStats | null>(null)
const [sources, setSources] = useState<Sources | null>(null)
const [loading, setLoading] = useState(false)
const [aiLoading, setAiLoading] = useState(false)
const [searched, setSearched] = useState(false)
const [error, setError] = useState('')
const [aiError, setAiError] = useState('')
const [selected, setSelected] = useState<Part | null>(null)
const [sourceFilter, setSourceFilter] = useState<'all' | 'ebay' | 'marketcheck'>('all')

const setV = (k: string, v: string) => setVehicle(prev => ({ ...prev, [k]: v }))
const setF = (k: string, v: string) => setFilters(prev => ({ ...prev, [k]: v }))

async function fetchAIParts(q: string, v: typeof vehicle, f: typeof filters) {
setAiLoading(true)
setAiError('')
const params = new URLSearchParams({ query: q, ...v })
if (f.priceMax) params.set('priceMax', f.priceMax)
if (f.condition) params.set('condition', f.condition)
try {
const res = await fetch(`/api/ai-parts-search?${params}`)
const data = await res.json()
setAiParts(data.listings ?? [])
} catch {
setAiError('AI search unavailable')
setAiParts([])
} finally {
setAiLoading(false)
}
}

async function handleSearch(e: React.FormEvent) {
e.preventDefault()
if (!query.trim()) { setError('Enter a part name to search'); return }
setLoading(true); setError(''); setSelected(null); setSourceFilter('all')
const params = new URLSearchParams({ query, ...vehicle, ...filters })
fetchAIParts(query, vehicle, filters)
try {
const res = await fetch(`/api/parts-search?${params}`)
const data = await res.json()
if (data.error && !data.listings?.length) { setError(data.error); setParts([]); setTotal(0) }
else {
setParts(data.listings ?? [])
setTotal(data.total ?? 0)
setStats(data.stats ?? null)
setSources(data.sources ?? null)
if (data.error) setError(data.error)
}
setSearched(true)
} catch { setError('Search failed. Please try again.') }
finally { setLoading(false) }
}

const inp: React.CSSProperties = { width:'100%', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.625rem 0.875rem', color:'white', fontSize:'0.875rem', outline:'none' }
const lbl: React.CSSProperties = { display:'block', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.375rem' }

const visibleParts = sourceFilter === 'all' ? parts
: sourceFilter === 'ebay' ? parts.filter(p => p.source === 'eBay Motors')
: parts.filter(p => p.source === 'Marketcheck')

const cheapest = visibleParts.find(p => p.total_price === Math.min(...visibleParts.filter(p => p.total_price > 0).map(p => p.total_price)))

const fullKeyword = [vehicle.year, vehicle.make, vehicle.model, query].filter(Boolean).join(' ')

return (
<div style={{ maxWidth:'1200px', margin:'0 auto' }}>
<div style={{ marginBottom:'1.5rem' }}>
<h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🔩 Parts Search</h1>
<p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Live prices from eBay Motors + Marketcheck · AI-powered results · Direct links to 12 retailers</p>
</div>

{/* Vehicle row */}
<div style={{ background:'rgba(21,57,204,0.06)', border:'1px solid rgba(21,57,204,0.15)', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1rem', display:'flex', gap:'1rem', flexWrap:'wrap', alignItems:'flex-end' }}>
<div style={{ flex:'1 1 90px' }}>
<label style={lbl}>Year</label>
<input value={vehicle.year} onChange={e => setV('year', e.target.value)} placeholder="2022" style={inp} />
</div>
<div style={{ flex:'1 1 130px' }}>
<label style={lbl}>Make</label>
<select value={vehicle.make} onChange={e => setV('make', e.target.value)} style={{ ...inp, cursor:'pointer' }}>
{MAKES.map(m => <option key={m} value={m}>{m || 'Any Make'}</option>)}
</select>
</div>
<div style={{ flex:'1 1 130px' }}>
<label style={lbl}>Model</label>
<input value={vehicle.model} onChange={e => setV('model', e.target.value)} placeholder="Mustang GT" style={inp} />
</div>
<p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.25)', flex:'2 1 180px' }}>Vehicle info prefills search across all sources</p>
</div>

{/* Search bar */}
<form onSubmit={handleSearch} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.5rem' }}>
<div style={{ display:'flex', gap:'0.75rem', marginBottom:'1rem' }}>
<div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.75rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
<span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
<input value={query} onChange={e => setQuery(e.target.value)}
placeholder='"brake pads", "coilovers", "K&N filter", "headers", "spark plugs"'
style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }} />
</div>
<button type="submit" disabled={loading || aiLoading} style={{ background: (loading || aiLoading) ? '#1E3A5F' : 'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.75rem', borderRadius:'0.875rem', fontWeight:700, cursor: (loading || aiLoading) ? 'default':'pointer', whiteSpace:'nowrap', boxShadow: (loading || aiLoading) ? 'none':'0 4px 16px rgba(204,0,0,0.4)' }}>
{(loading || aiLoading) ? 'Searching…' : 'Compare Prices'}
</button>
</div>
<div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap', alignItems:'center' }}>
<div>
<label style={lbl}>Max Price</label>
<input value={filters.priceMax} onChange={e => setF('priceMax', e.target.value)} placeholder="$500" style={{ ...inp, width:'110px' }} />
</div>
<div>
<label style={lbl}>Condition</label>
<select value={filters.condition} onChange={e => setF('condition', e.target.value)} style={{ ...inp, width:'150px', cursor:'pointer' }}>
<option value="">Any</option>
<option value="new_oem">New</option>
<option value="used">Used</option>
<option value="remanufactured">Remanufactured</option>
</select>
</div>
<div>
<label style={lbl}>Sort</label>
<select value={filters.sortBy} onChange={e => setF('sortBy', e.target.value)} style={{ ...inp, width:'160px', cursor:'pointer' }}>
<option value="price-asc">Price: Low → High</option>
<option value="price-desc">Price: High → Low</option>
</select>
</div>
<div style={{ marginLeft:'auto', display:'flex', gap:'0.375rem', flexWrap:'wrap' }}>
{['Brake Pads','Air Filter','Coilovers','Oil Filter','Spark Plugs','Rotors','Headers','Shocks'].map(s => (
<button key={s} type="button" onClick={() => setQuery(s)}
style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.45)', padding:'0.3rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', cursor:'pointer' }}>
{s}
</button>
))}
</div>
</div>
</form>

{error && (
<div style={{ background:'rgba(244,162,97,0.08)', border:'1px solid rgba(244,162,97,0.2)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#F4A261', fontSize:'0.875rem' }}>
⚠️ {error}
</div>
)}

{/* ── AI-Powered Parts ── */}
{(aiLoading || (searched && aiParts.length > 0) || aiError) && (
<div style={{ marginBottom:'1.5rem' }}>
<div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1rem' }}>
<span style={{ fontSize:'1.1rem' }}>🤖</span>
<span style={{ fontSize:'1rem', fontWeight:700 }}>AI-Matched Parts</span>
<span style={{ background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.3)', color:'#FFD700', fontSize:'0.65rem', padding:'0.1rem 0.5rem', borderRadius:'9999px', fontWeight:700 }}>
AI AGENT
</span>
{aiLoading && <span style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem' }}>Generating personalized results…</span>}
</div>

{aiLoading && (
<div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'1rem', padding:'2rem', textAlign:'center' }}>
<p style={{ fontSize:'1.5rem', marginBottom:'0.5rem' }}>⚙️</p>
<p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.875rem' }}>AI agent searching for matching parts…</p>
</div>
)}

{aiError && !aiLoading && (
<div style={{ background:'rgba(244,162,97,0.08)', border:'1px solid rgba(244,162,97,0.2)', borderRadius:'0.75rem', padding:'0.75rem 1rem', color:'#F4A261', fontSize:'0.8rem' }}>
⚠️ {aiError}
</div>
)}

{!aiLoading && aiParts.length > 0 && (
<div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
{aiParts.map(p => (
<div key={p.id}
style={{ background:'#1E2E40', border:'1px solid rgba(255,215,0,0.15)', borderRadius:'0.875rem', padding:'0.875rem', display:'flex', gap:'0.875rem', alignItems:'flex-start' }}>
{/* Icon */}
<div style={{ width:'60px', height:'60px', flexShrink:0, borderRadius:'0.5rem', background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>
🔩
</div>
{/* Info */}
<div style={{ flex:1, minWidth:0 }}>
<div style={{ display:'flex', alignItems:'center', gap:'0.375rem', marginBottom:'0.25rem', flexWrap:'wrap' }}>
<span style={{ fontSize:'0.65rem', background:'rgba(255,215,0,0.1)', border:'1px solid rgba(255,215,0,0.25)', color:'#FFD700', padding:'0.1rem 0.4rem', borderRadius:'9999px', fontWeight:700 }}>
🤖 AI
</span>
{p.brand && <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)', fontWeight:600 }}>{p.brand}</span>}
{p.partNumber && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>#{p.partNumber}</span>}
<span style={{ fontSize:'0.65rem', background:'rgba(255,255,255,0.05)', padding:'0.1rem 0.4rem', borderRadius:'9999px', color:'rgba(255,255,255,0.4)' }}>{p.condition}</span>
</div>
<p style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.25rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{p.name}</p>
<p style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.5)', marginBottom:'0.375rem', lineHeight:1.4 }}>{p.description}</p>
{p.compatibility && (
<p style={{ fontSize:'0.72rem', color:'rgba(100,180,255,0.7)', marginBottom:'0.375rem' }}>
🔧 Fits: {p.compatibility}
</p>
)}
<div style={{ display:'flex', gap:'1rem', fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', flexWrap:'wrap' }}>
{p.location && <span>📍 {p.location}</span>}
{p.seller && <span>🏪 {p.seller}</span>}
</div>
</div>
{/* Price + CTA */}
<div style={{ textAlign:'right', flexShrink:0, minWidth:'110px' }}>
<p style={{ fontWeight:900, fontSize:'1.3rem', color:'#FFD700', marginBottom:'0.25rem' }}>
{p.price > 0 ? `$${p.price.toFixed(2)}` : 'Call'}
</p>
<a href={p.url} target="_blank" rel="noopener"
style={{ display:'block', background:'linear-gradient(135deg, #FFD700, #E6B800)', color:'#000', padding:'0.4rem 0.75rem', borderRadius:'0.5rem', textDecoration:'none', fontSize:'0.75rem', fontWeight:700, textAlign:'center', marginTop:'0.375rem' }}>
View →
</a>
</div>
</div>
))}
</div>
)}
</div>
)}

{/* Retailer shortcuts */}
{(searched || query.trim().length > 2) && (
<div style={{ marginBottom:'1.5rem' }}>
<p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.625rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>
🛒 Also check {RETAILERS.length} retailers {query ? `— "${fullKeyword || query}"` : ''}
</p>
<div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(145px, 1fr))', gap:'0.5rem' }}>
{RETAILERS.map(r => (
<a key={r.name} href={fullKeyword ? r.url(fullKeyword) : '#'} target="_blank" rel="noopener"
onClick={e => { if (!fullKeyword) { e.preventDefault(); setError('Enter a part name first') } }}
style={{ display:'flex', alignItems:'center', gap:'0.5rem', background:'#243547', border:`1px solid ${r.color}20`, borderRadius:'0.625rem', padding:'0.5rem 0.75rem', textDecoration:'none', position:'relative', overflow:'hidden' }}>
<div style={{ position:'absolute', left:0, top:0, bottom:0, width:'3px', background:r.color, opacity:0.7 }} />
<span style={{ fontSize:'1.1rem' }}>{r.logo}</span>
<span style={{ fontSize:'0.78rem', color:'rgba(255,255,255,0.6)', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{r.name}</span>
</a>
))}
</div>
</div>
)}

{/* Empty state */}
{!searched && query.trim().length <= 2 && (
<div style={{ textAlign:'center', padding:'3rem 2rem' }}>
<p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔩</p>
<h2 style={{ fontSize:'1.25rem', fontWeight:700, marginBottom:'0.5rem' }}>Compare prices instantly</h2>
<p style={{ color:'rgba(255,255,255,0.3)', maxWidth:'480px', margin:'0 auto' }}>
Search any part to see live prices from eBay Motors + Marketcheck, AI-matched results, and one-click links to major retailers.
</p>
</div>
)}

{loading && (
<div style={{ textAlign:'center', padding:'3rem' }}>
<p style={{ fontSize:'2rem', marginBottom:'0.75rem' }}>⚙️</p>
<p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'0.5rem' }}>Fetching live prices from eBay Motors + Marketcheck…</p>
<div style={{ width:'200px', height:'3px', background:'rgba(255,255,255,0.06)', borderRadius:'9999px', margin:'0.75rem auto 0', overflow:'hidden' }}>
<div style={{ height:'100%', width:'60%', background:'linear-gradient(90deg, #CC0000, #FFD700)', borderRadius:'9999px', animation:'shimmer 1.2s ease-in-out infinite' }} />
</div>
</div>
)}

{/* ── Results ─────────────────────────────────────────── */}
{searched && !loading && !selected && (
<div>
{/* Price comparison header */}
{stats && parts.length > 0 && (
<div style={{ background:'linear-gradient(135deg, rgba(21,57,204,0.08), rgba(204,0,0,0.06))', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1rem 1.25rem', marginBottom:'1rem' }}>
<div style={{ display:'flex', gap:'2rem', flexWrap:'wrap', alignItems:'center', marginBottom:'0.875rem' }}>
<div style={{ textAlign:'center' }}>
<p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Lowest</p>
<p style={{ fontSize:'1.4rem', fontWeight:900, color:'#22c55e' }}>${stats.min.toFixed(2)}</p>
</div>
<div style={{ flex:1, minWidth:'120px' }}>
<div style={{ height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'9999px', position:'relative', marginBottom:'0.375rem' }}>
<div style={{ position:'absolute', left:'0', right:'0', top:0, bottom:0, background:'linear-gradient(90deg, #22c55e, #FFD700, #CC0000)', borderRadius:'9999px', opacity:0.5 }} />
<div style={{ position:'absolute', top:'-3px', width:'12px', height:'12px', borderRadius:'50%', background:'#FFD700', border:'2px solid #1B2A3E', left:`calc(${pricePos(stats.median, stats.min, stats.max)}% - 6px)`, zIndex:1 }} />
</div>
<div style={{ display:'flex', justifyContent:'space-between', fontSize:'0.65rem', color:'rgba(255,255,255,0.25)' }}>
<span>min</span>
<span style={{ color:'#FFD700' }}>median ${stats.median.toFixed(0)}</span>
<span>max</span>
</div>
</div>
<div style={{ textAlign:'center' }}>
<p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Average</p>
<p style={{ fontSize:'1.4rem', fontWeight:900, color:'#FFD700' }}>${stats.avg.toFixed(2)}</p>
</div>
<div style={{ textAlign:'center' }}>
<p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>Highest</p>
<p style={{ fontSize:'1.4rem', fontWeight:900, color:'#CC0000' }}>${stats.max.toFixed(2)}</p>
</div>
</div>
<div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
<span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.3)', marginRight:'0.25rem' }}>Sources:</span>
{([['all','All', parts.length],['ebay','🏁 eBay Motors', sources?.ebay ?? 0],['marketcheck','🏪 Marketcheck', sources?.marketcheck ?? 0]] as const).map(([key, label, count]) => (
count > 0 || key === 'all' ? (
<button key={key} onClick={() => setSourceFilter(key as any)}
style={{ background: sourceFilter === key ? 'rgba(21,57,204,0.2)':'rgba(255,255,255,0.04)', border:`1px solid ${sourceFilter === key ? 'rgba(21,57,204,0.4)':'rgba(255,255,255,0.1)'}`, color: sourceFilter === key ? '#2255EE':'rgba(255,255,255,0.5)', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight: sourceFilter===key ? 700:400, cursor:'pointer' }}>
{label} ({count})
</button>
) : null
))}
</div>
</div>
)}

{/* Best price banner */}
{cheapest && cheapest.price && (
<div style={{ background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.15)', borderRadius:'0.75rem', padding:'0.75rem 1rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
<span style={{ fontSize:'1.1rem' }}>🏆</span>
<div style={{ flex:1 }}>
<span style={{ fontSize:'0.875rem', fontWeight:700, color:'#22c55e' }}>Best price: ${cheapest.total_price.toFixed(2)} shipped</span>
<span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginLeft:'0.75rem' }}>{cheapest.source_badge} {cheapest.source}</span>
</div>
{stats && <span style={{ fontSize:'0.75rem', color:'#22c55e', fontWeight:600 }}>
{Math.round(((stats.avg - cheapest.total_price) / stats.avg) * 100)}% below avg
</span>}
</div>
)}

{visibleParts.length === 0 ? (
<div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.06)', borderRadius:'1rem', padding:'2rem', textAlign:'center' }}>
<p style={{ color:'rgba(255,255,255,0.4)' }}>No listings found — try the retailer links above.</p>
</div>
) : (
<div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
{visibleParts.map(p => {
const isBest = cheapest?.id === p.id
const deal = stats && p.total_price > 0 ? getDealLabel(p.total_price, stats) : null
const pos = stats && p.total_price > 0 ? pricePos(p.total_price, stats.min, stats.max) : null
return (
<div key={p.id} onClick={() => setSelected(p)}
style={{ background:'#243547', border:`1px solid ${isBest ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius:'0.875rem', padding:'0.875rem', cursor:'pointer', transition:'border-color 0.15s, transform 0.1s' }}
onMouseEnter={e => { e.currentTarget.style.borderColor = isBest ? 'rgba(34,197,94,0.5)' : 'rgba(21,57,204,0.35)'; e.currentTarget.style.transform = 'translateX(2px)' }}
onMouseLeave={e => { e.currentTarget.style.borderColor = isBest ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateX(0)' }}>
<div style={{ display:'flex', gap:'0.875rem', alignItems:'center' }}>
<div style={{ width:'68px', height:'68px', flexShrink:0, borderRadius:'0.5rem', overflow:'hidden', background:'#0D1E30', display:'flex', alignItems:'center', justifyContent:'center' }}>
{p.image ? <img src={p.image} alt="" style={{ width:'100%', height:'100%', objectFit:'contain' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} /> : <span style={{ fontSize:'1.5rem' }}>🔩</span>}
</div>
<div style={{ flex:1, minWidth:0 }}>
<p style={{ fontWeight:600, fontSize:'0.875rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:'0.25rem' }}>{p.title}</p>
<div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', alignItems:'center', marginBottom:'0.375rem' }}>
<span style={{ fontSize:'0.65rem', background: p.source === 'eBay Motors' ? 'rgba(228,49,55,0.1)':'rgba(21,57,204,0.1)', border:`1px solid ${p.source === 'eBay Motors' ? 'rgba(228,49,55,0.2)':'rgba(21,57,204,0.2)'}`, color: p.source === 'eBay Motors' ? '#E43137':'#2255EE', padding:'0.1rem 0.4rem', borderRadius:'9999px', fontWeight:600 }}>
{p.source_badge} {p.source}
</span>
<span style={{ fontSize:'0.65rem', background:'rgba(255,255,255,0.05)', padding:'0.1rem 0.4rem', borderRadius:'9999px', color:'rgba(255,255,255,0.4)' }}>{p.condition}</span>
{p.free_shipping && <span style={{ fontSize:'0.65rem', color:'#22c55e' }}>✓ Free Ship</span>}
{p.is_auction && <span style={{ fontSize:'0.65rem', color:'#FFD700' }}>🏁 Auction</span>}
{p.part_number && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>#{p.part_number}</span>}
{isBest && <span style={{ fontSize:'0.65rem', background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', padding:'0.1rem 0.4rem', borderRadius:'9999px', fontWeight:700 }}>🏆 BEST</span>}
</div>
{pos !== null && stats && (
<div style={{ position:'relative', height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'9999px', maxWidth:'200px' }}>
<div style={{ position:'absolute', left:0, right:0, top:0, bottom:0, background:'linear-gradient(90deg, #22c55e 0%, #FFD700 50%, #CC0000 100%)', borderRadius:'9999px', opacity:0.3 }} />
<div style={{ position:'absolute', top:'-4px', width:'10px', height:'10px', borderRadius:'50%', background: pos < 33 ? '#22c55e' : pos < 66 ? '#FFD700' : '#CC0000', border:'2px solid #243547', left:`calc(${pos}% - 5px)`, zIndex:1 }} />
</div>
)}
</div>
<div style={{ textAlign:'right', flexShrink:0 }}>
<p style={{ fontWeight:900, fontSize:'1.2rem', color: isBest ? '#22c55e' : '#CC0000' }}>
{p.price ? `$${p.price.toFixed(2)}` : 'Bid'}
</p>
<p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', fontWeight:600 }}>
${p.total_price.toFixed(2)} total
</p>
{deal && (
<span style={{ fontSize:'0.65rem', color:deal.color, background:deal.bg, padding:'0.1rem 0.375rem', borderRadius:'9999px', fontWeight:600 }}>
{deal.label}
</span>
)}
</div>
</div>
</div>
)
})}
</div>
)}
</div>
)}

{/* ── Detail view ─────────────────────────────────────── */}
{selected && (
<div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'2rem' }}>
<button onClick={() => setSelected(null)} style={{ background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.5)', padding:'0.4rem 0.875rem', borderRadius:'0.5rem', marginBottom:'1.5rem', fontSize:'0.8rem', cursor:'pointer' }}>← Back to Results</button>
<div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:'2rem' }}>
<div>
<div style={{ background:'#0D1E30', borderRadius:'0.75rem', height:'220px', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', marginBottom:'0.75rem' }}>
{selected.image ? <img src={selected.image} alt="" style={{ maxWidth:'100%', maxHeight:'100%', objectFit:'contain' }} /> : <span style={{ fontSize:'4rem' }}>🔩</span>}
</div>
{stats && selected.total_price > 0 && (
<div style={{ background:'#0D1E30', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.75rem', padding:'1rem' }}>
<p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:'0.75rem' }}>💰 Price Comparison</p>
{[
['This listing', selected.total_price, (() => { const d = getDealLabel(selected.total_price, stats); return d.color })()],
['Lowest found', stats.min, '#22c55e'],
['Average', stats.avg, '#FFD700'],
['Highest found',stats.max, '#CC0000'],
].map(([label, val, color]) => (
<div key={label as string} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
<span style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{label as string}</span>
<span style={{ fontSize:'0.875rem', fontWeight: label === 'This listing' ? 800 : 600, color: label === 'This listing' ? 'white' : color as string }}>
${(val as number).toFixed(2)}
</span>
</div>
))}
<div style={{ marginTop:'0.75rem', position:'relative', height:'6px', background:'rgba(255,255,255,0.06)', borderRadius:'9999px' }}>
<div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, #22c55e, #FFD700, #CC0000)', borderRadius:'9999px', opacity:0.4 }} />
<div style={{ position:'absolute', top:'-5px', width:'14px', height:'14px', borderRadius:'50%', background:'white', border:'3px solid #1539CC', left:`calc(${pricePos(selected.total_price, stats.min, stats.max)}% - 7px)`, zIndex:1, boxShadow:'0 2px 6px rgba(0,0,0,0.5)' }} />
</div>
<div style={{ display:'flex', justifyContent:'space-between', marginTop:'0.375rem', fontSize:'0.6rem', color:'rgba(255,255,255,0.2)' }}>
<span>Cheapest</span><span>Most Expensive</span>
</div>
{(() => {
const d = getDealLabel(selected.total_price, stats)
return (
<div style={{ marginTop:'0.75rem', background:d.bg, border:`1px solid ${d.color}30`, borderRadius:'0.5rem', padding:'0.5rem 0.75rem', textAlign:'center' }}>
<p style={{ fontSize:'0.8rem', fontWeight:700, color:d.color }}>{d.label}</p>
<p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginTop:'0.125rem' }}>vs {stats.count} listings found</p>
</div>
)
})()}
</div>
)}
</div>

<div>
<div style={{ display:'flex', gap:'0.5rem', marginBottom:'0.625rem', flexWrap:'wrap' }}>
<span style={{ fontSize:'0.75rem', background: selected.source === 'eBay Motors' ? 'rgba(228,49,55,0.1)':'rgba(21,57,204,0.1)', border:`1px solid ${selected.source === 'eBay Motors' ? 'rgba(228,49,55,0.25)':'rgba(21,57,204,0.25)'}`, color: selected.source === 'eBay Motors' ? '#E43137':'#2255EE', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontWeight:600 }}>
{selected.source_badge} {selected.source}
</span>
<span style={{ fontSize:'0.75rem', background:'rgba(255,255,255,0.05)', padding:'0.2rem 0.625rem', borderRadius:'9999px', color:'rgba(255,255,255,0.5)' }}>{selected.condition}</span>
</div>
<h2 style={{ fontWeight:800, fontSize:'1rem', marginBottom:'1rem', lineHeight:1.45 }}>{selected.title}</h2>

<p style={{ fontSize:'2.25rem', fontWeight:900, color:'#CC0000', marginBottom:'0.25rem' }}>{selected.price ? `$${selected.price.toFixed(2)}` : 'Bid'}</p>
{!selected.free_shipping && selected.shipping > 0 && <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.875rem' }}>+ ${selected.shipping.toFixed(2)} shipping</p>}
<p style={{ color:'#22c55e', fontWeight:700, fontSize:'1rem', marginBottom:'1.25rem' }}>Total: ${selected.total_price.toFixed(2)}</p>

<div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'1.25rem' }}>
{[
['Seller', selected.seller],
['Feedback', `${selected.seller_feedback_pct}%`],
selected.part_number ? ['Part #', selected.part_number] : null,
selected.brand ? ['Brand', selected.brand] : null,
selected.location ? ['Ships from', selected.location] : null,
selected.is_auction ? ['Type', 'Auction 🏁'] : ['Type', 'Buy Now'],
].filter(Boolean).map(row => (
<div key={row![0]} style={{ background:'#0D1E30', borderRadius:'0.5rem', padding:'0.5rem 0.625rem', border:'1px solid rgba(255,255,255,0.06)' }}>
<p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>{row![0]}</p>
<p style={{ fontSize:'0.8rem', fontWeight:600, marginTop:'0.125rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{row![1]}</p>
</div>
))}
</div>

<div style={{ display:'flex', flexDirection:'column', gap:'0.625rem' }}>
{selected.url
? <a href={selected.url} target="_blank" rel="noopener"
style={{ display:'block', background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, textAlign:'center', textDecoration:'none', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
{selected.is_auction ? '🏁 Bid on eBay Motors →' : `Buy on ${selected.source} →`}
</a>
: <button style={{ background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.875rem', borderRadius:'0.75rem', fontWeight:700, cursor:'pointer' }}>Contact Seller</button>
}
<p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.25)', marginTop:'0.25rem' }}>Also check on:</p>
<div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.375rem' }}>
{RETAILERS.slice(0,6).map(r => {
const q = [vehicle.year, vehicle.make, vehicle.model, selected.title.slice(0,40)].filter(Boolean).join(' ')
return (
<a key={r.name} href={r.url(q)} target="_blank" rel="noopener"
style={{ display:'flex', alignItems:'center', gap:'0.375rem', background:'#0D1E30', border:`1px solid ${r.color}20`, borderRadius:'0.5rem', padding:'0.4rem 0.625rem', textDecoration:'none', fontSize:'0.72rem', color:'rgba(255,255,255,0.55)' }}>
<span>{r.logo}</span>{r.name}
</a>
)
})}
</div>
</div>
</div>
</div>
</div>
)}
</div>
)
}
