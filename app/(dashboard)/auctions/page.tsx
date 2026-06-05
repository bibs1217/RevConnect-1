'use client'

import { useState, useMemo, useCallback } from 'react'

// ─── IN-PERSON AUCTION EVENTS (real upcoming events with dates/locations) ───
const IN_PERSON_EVENTS = [
  { id:'bj-scottsdale', name:'Barrett-Jackson Scottsdale', org:'Barrett-Jackson', type:'collector', date:'2027-01-11', end_date:'2027-01-19', city:'Scottsdale', state:'AZ', venue:'WestWorld of Scottsdale', address:'16601 N Pima Rd, Scottsdale, AZ 85260', phone:'480-421-6694', website:'https://www.barrett-jackson.com', entry_fee:30, consignment_fee:'6%', expected_lots:'1,800+', img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80', hot:true, description:'The World\'s Greatest Collector Car Auctions — annual flagship event in Scottsdale.' },
  { id:'mecum-kissimmee', name:'Mecum Kissimmee', org:'Mecum Auctions', type:'collector', date:'2027-01-08', end_date:'2027-01-19', city:'Kissimmee', state:'FL', venue:'Osceola Heritage Park', address:'1875 Silver Spur Ln, Kissimmee, FL 34744', phone:'262-275-5050', website:'https://www.mecum.com', entry_fee:20, consignment_fee:'5%', expected_lots:'3,000+', img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80', hot:true, description:'World\'s largest collector car auction — thousands of vehicles over two weeks.' },
  { id:'rm-monterey', name:'RM Sotheby\'s Monterey', org:'RM Sotheby\'s', type:'collector', date:'2026-08-21', end_date:'2026-08-23', city:'Monterey', state:'CA', venue:'Cannery Row / Portola Hotel', address:'2 Portola Plaza, Monterey, CA 93940', phone:'519-352-4575', website:'https://www.rmsothebys.com', entry_fee:50, consignment_fee:'12%', expected_lots:'150+', img:'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500&q=80', hot:true, description:'Premier consignment auction during Monterey Car Week. Ultra-rare collectibles.' },
  { id:'gooding-pebble', name:'Gooding & Company Pebble Beach', org:'Gooding & Company', type:'collector', date:'2026-08-15', end_date:'2026-08-16', city:'Pebble Beach', state:'CA', venue:'Pebble Beach Golf Links', address:'1700 17 Mile Dr, Pebble Beach, CA 93953', phone:'310-899-1960', website:'https://www.goodingco.com', entry_fee:75, consignment_fee:'12%', expected_lots:'100+', img:'https://images.unsplash.com/photo-1580274455152-f4af44f89116?w=500&q=80', hot:false, description:'World-class auction at Pebble Beach Concours. Finest motorcars in existence.' },
  { id:'bj-houston', name:'Barrett-Jackson Houston', org:'Barrett-Jackson', type:'collector', date:'2026-06-19', end_date:'2026-06-22', city:'Houston', state:'TX', venue:'NRG Center', address:'1 NRG Pkwy, Houston, TX 77054', phone:'480-421-6694', website:'https://www.barrett-jackson.com', entry_fee:20, consignment_fee:'6%', expected_lots:'500+', img:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80', hot:false, description:'Barrett-Jackson comes to Houston — hundreds of American muscle cars & collectibles.' },
  { id:'copart-dallas', name:'Copart Dallas Online Auction', org:'Copart', type:'salvage', date:'2026-06-10', end_date:'2026-06-10', city:'Dallas', state:'TX', venue:'Copart Dallas South', address:'2191 Eagle Pkwy, Fort Worth, TX 76177', phone:'972-387-3600', website:'https://www.copart.com', entry_fee:0, consignment_fee:'varies', expected_lots:'200+ weekly', img:'https://images.unsplash.com/photo-1494905998402-395d579af36f?w=500&q=80', hot:false, description:'Weekly salvage & clean title auctions. Pre-bid online, inspect in person. Register free.' },
  { id:'manheim-dallas', name:'Manheim Dallas Fort Worth', org:'Manheim (Cox)', type:'dealer', date:'2026-06-11', end_date:'2026-06-11', city:'Euless', state:'TX', venue:'Manheim DFW', address:'12101 Trinity Blvd, Euless, TX 76040', phone:'817-399-4000', website:'https://www.manheim.com', entry_fee:'Dealer Only', consignment_fee:'varies', expected_lots:'1,000+ weekly', img:'https://images.unsplash.com/photo-1555626906-fcf10d6851b4?w=500&q=80', hot:false, description:'Largest dealer-only wholesale auction in DFW. Requires dealer license.' },
  { id:'iaai-dallas', name:'IAA Insurance Auto Auctions', org:'IAA', type:'salvage', date:'2026-06-12', end_date:'2026-06-12', city:'Irving', state:'TX', venue:'IAA Irving', address:'3850 W Pioneer Dr, Irving, TX 75061', phone:'972-594-9400', website:'https://www.iaai.com', entry_fee:0, consignment_fee:'varies', expected_lots:'300+ weekly', img:'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=500&q=80', hot:false, description:'Insurance total loss & clean title vehicles. Open to licensed buyers and public.' },
  { id:'mecum-indy', name:'Mecum Indianapolis', org:'Mecum Auctions', type:'collector', date:'2026-05-14', end_date:'2026-05-24', city:'Indianapolis', state:'IN', venue:'Indiana State Fairgrounds', address:'1202 E 38th St, Indianapolis, IN 46205', phone:'262-275-5050', website:'https://www.mecum.com', entry_fee:20, consignment_fee:'5%', expected_lots:'2,500+', img:'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=500&q=80', hot:true, description:'Spring flagship — largest single-location auction in the world.' },
  { id:'hagerty-broad-arrow', name:'Hagerty Broad Arrow Amelia Island', org:'Hagerty Broad Arrow', type:'collector', date:'2026-03-06', end_date:'2026-03-08', city:'Amelia Island', state:'FL', venue:'Ritz-Carlton Amelia Island', address:'4750 Amelia Island Pkwy, Fernandina Beach, FL 32034', phone:'800-922-4050', website:'https://www.hagerty.com/broad-arrow', entry_fee:50, consignment_fee:'10%', expected_lots:'80+', img:'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=500&q=80', hot:false, description:'Curated collector car auction during Amelia Island Concours d\'Elegance weekend.' },
]

// ─── ONLINE AUCTION PLATFORMS ───
const ONLINE_PLATFORMS = [
  { name:'eBay Motors', logo:'🏁', color:'#E43137', url:(q:string) => `https://www.ebay.com/b/Cars-Trucks/6001/bn_1865290?_nkw=${encodeURIComponent(q)}&LH_Auction=1`, desc:'Millions of live auctions. Buy-it-now + bidding. Free to browse.', type:'auction', sellers:'Private & Dealer', fee:'No buyer fee' },
  { name:'Bring a Trailer', logo:'🔨', color:'#1539CC', url:(q:string) => `https://bringatrailer.com/search/?s=${encodeURIComponent(q)}`, desc:'Curated enthusiast vehicles. 7-day auctions. Strong community comments.', type:'auction', sellers:'Private Curated', fee:'5% buyer fee' },
  { name:'Cars & Bids', logo:'🚗', color:'#FFD700', url:(q:string) => `https://carsandbids.com/search/#?search=${encodeURIComponent(q)}`, desc:'Modern enthusiast cars 1980s-present. No reserve auctions.', type:'auction', sellers:'Private', fee:'4.5% buyer fee' },
  { name:'Copart Online', logo:'🔩', color:'#3399FF', url:(q:string) => `https://www.copart.com/vehicleFinderSection/?query=${encodeURIComponent(q)}`, desc:'Salvage & clean title. Register free to bid. 100k+ vehicles/week.', type:'salvage', sellers:'Insurance Co.', fee:'Varies by tier' },
  { name:'IAAI Online', logo:'⚡', color:'#F4A261', url:(q:string) => `https://www.iaai.com/Search?SearchVehicles=true&SearchText=${encodeURIComponent(q)}`, desc:'Insurance Auto Auctions. Clean, salvage & rebuilt titles nationwide.', type:'salvage', sellers:'Insurance Co.', fee:'Varies by tier' },
  { name:'AutoBidMaster', logo:'🌐', color:'#22c55e', url:(q:string) => `https://autobidmaster.com/search/?query=${encodeURIComponent(q)}`, desc:'Access Copart & IAAI without a dealer license. US & international shipping.', type:'broker', sellers:'Copart / IAAI', fee:'$79-199/win' },
  { name:'Manheim Online', logo:'🏢', color:'#a855f7', url:(q:string) => `https://www.manheim.com/content/manheim/en/search.html#q=${encodeURIComponent(q)}`, desc:'Largest dealer wholesale auction. Requires dealer license to buy.', type:'dealer', sellers:'Dealers Only', fee:'Dealer license req.' },
  { name:'Mecum Online Bidding', logo:'🏆', color:'#CC0000', url:(_:string) => 'https://www.mecum.com/bid-live', desc:'Bid live on Mecum\'s in-person auctions from anywhere in the world.', type:'collector', sellers:'Curated Collector', fee:'10% buyer fee' },
]

const ALL_MOCK = [
  { id:'1', title:'2020 Toyota Supra GR', source:'Bring a Trailer', year:2020, make:'Toyota', model:'Supra', mileage:14200, current_bid:52500, reserve_met:true, end_time:'2026-06-12T18:00:00', img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80', buyer_premium:5, location:'California', type:'online', condition:'Excellent', bid_count:23 },
  { id:'2', title:'2021 Ford Mustang Shelby GT500', source:'Cars & Bids', year:2021, make:'Ford', model:'Mustang', mileage:3400, current_bid:89000, reserve_met:false, end_time:'2026-06-14T20:00:00', img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80', buyer_premium:4.5, location:'Texas', type:'online', condition:'Like New', bid_count:41 },
  { id:'3', title:'2018 BMW M3 Competition', source:'Copart', year:2018, make:'BMW', model:'M3', mileage:38200, current_bid:28500, reserve_met:true, end_time:'2026-06-10T14:00:00', img:'https://images.unsplash.com/photo-1580274455152-f4af44f89116?w=500&q=80', buyer_premium:12, location:'Georgia', type:'salvage', condition:'Repairable', bid_count:18 },
  { id:'4', title:'2019 Porsche 911 Carrera', source:'eBay Motors', year:2019, make:'Porsche', model:'911', mileage:8900, current_bid:105000, reserve_met:true, end_time:'2026-06-16T21:00:00', img:'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500&q=80', buyer_premium:0, location:'Florida', type:'online', condition:'Excellent', bid_count:67 },
  { id:'5', title:'1969 Chevrolet Camaro Z/28', source:'Mecum', year:1969, make:'Chevrolet', model:'Camaro', mileage:87400, current_bid:72000, reserve_met:true, end_time:'2026-06-18T16:00:00', img:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80', buyer_premium:10, location:'Arizona', type:'collector', condition:'Restored', bid_count:15 },
  { id:'6', title:'2022 Subaru WRX Stage 2 Built', source:'Bring a Trailer', year:2022, make:'Subaru', model:'WRX', mileage:22000, current_bid:38000, reserve_met:null, end_time:'2026-06-22T12:00:00', img:'https://images.unsplash.com/photo-1567808291548-fc3ee04dbcf0?w=500&q=80', buyer_premium:5, location:'Illinois', type:'online', condition:'Modified', bid_count:29 },
]

const MAKES = ['All Makes','Acura','Audi','BMW','Chevrolet','Dodge','Ford','Honda','Hyundai','Infiniti','Jeep','Kia','Lexus','Mazda','Mercedes-Benz','Nissan','Porsche','Subaru','Tesla','Toyota','Volkswagen']
const SOURCE_COLORS: Record<string,string> = { 'Bring a Trailer':'#1539CC','Cars & Bids':'#FFD700','Copart':'#3399FF','eBay Motors':'#E43137','Mecum':'#22c55e','Barrett-Jackson':'#CC0000','IAAI':'#F4A261' }

function timeLeft(d: string) {
  const diff = new Date(d).getTime() - Date.now()
  if (diff < 0) return 'Ended'
  const days = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000)
  return days > 0 ? `${days}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US',{ weekday:'short', month:'short', day:'numeric', year:'numeric' })
}

export default function AuctionsPage() {
  const [tab, setTab] = useState<'online'|'inperson'|'search'>('online')
  const [search, setSearch] = useState('')
  const [liveQuery, setLiveQuery] = useState('')
  const [liveMake, setLiveMake] = useState('All Makes')
  const [liveZip, setLiveZip] = useState('')
  const [liveRadius, setLiveRadius] = useState('150')
  const [filters, setFilters] = useState({ type:'All', source:'All', make:'All Makes', priceMin:'', priceMax:'', yearMin:'', yearMax:'', reserveMet:'any', condition:'Any', sort:'ends-soon' })
  const [selected, setSelected] = useState<any>(null)
  const [selectedPhoto, setSelectedPhoto] = useState(0)
  const [bidInput, setBidInput] = useState('')
  const [liveResults, setLiveResults] = useState<any[]>([])
  const [liveTotal, setLiveTotal] = useState(0)
  const [liveSources, setLiveSources] = useState<{marketcheck:number,ebay:number}|null>(null)
  const [liveSourceFilter, setLiveSourceFilter] = useState<'all'|'Copart'|'IAAI'|'eBay Motors'>('all')
  const [liveLoading, setLiveLoading] = useState(false)
  const [liveSearched, setLiveSearched] = useState(false)
  const [liveError, setLiveError] = useState('')
  const [eventFilter, setEventFilter] = useState('All')

  const setF = (k:string,v:string) => setFilters(f => ({...f,[k]:v}))

  // Filter mock listings
  const filtered = useMemo(() => {
    let r = ALL_MOCK
    if (search) { const q=search.toLowerCase(); r=r.filter(a=>a.title.toLowerCase().includes(q)||a.make.toLowerCase().includes(q)||a.model.toLowerCase().includes(q)||a.source.toLowerCase().includes(q)||a.location.toLowerCase().includes(q)) }
    if (filters.type !== 'All') r = r.filter(a=>a.type===filters.type)
    if (filters.source !== 'All') r = r.filter(a=>a.source===filters.source)
    if (filters.make !== 'All Makes') r = r.filter(a=>a.make===filters.make)
    if (filters.priceMin) r = r.filter(a=>a.current_bid>=parseInt(filters.priceMin))
    if (filters.priceMax) r = r.filter(a=>a.current_bid<=parseInt(filters.priceMax))
    if (filters.yearMin) r = r.filter(a=>a.year>=parseInt(filters.yearMin))
    if (filters.yearMax) r = r.filter(a=>a.year<=parseInt(filters.yearMax))
    if (filters.reserveMet==='met') r = r.filter(a=>a.reserve_met===true)
    if (filters.reserveMet==='not-met') r = r.filter(a=>a.reserve_met===false)
    return [...r].sort((a,b) => filters.sort==='ends-soon' ? new Date(a.end_time).getTime()-new Date(b.end_time).getTime() : filters.sort==='bid-low' ? a.current_bid-b.current_bid : b.current_bid-a.current_bid)
  }, [search, filters])

  const filteredEvents = useMemo(() => {
    let r = IN_PERSON_EVENTS
    if (search) { const q=search.toLowerCase(); r=r.filter(e=>e.name.toLowerCase().includes(q)||e.city.toLowerCase().includes(q)||e.org.toLowerCase().includes(q)||e.state.toLowerCase().includes(q)) }
    if (eventFilter !== 'All') r = r.filter(e=>e.type===eventFilter)
    return [...r].sort((a,b)=>new Date(a.date).getTime()-new Date(b.date).getTime())
  }, [search, eventFilter])

  async function searchLive(e: React.FormEvent) {
    e.preventDefault()
    setLiveLoading(true); setLiveError(''); setLiveSourceFilter('all'); setSelectedPhoto(0)
    const p = new URLSearchParams({
      query:   liveQuery,
      make:    liveMake === 'All Makes' ? '' : liveMake,
      yearMin: filters.yearMin,
      yearMax: filters.yearMax,
      priceMax: filters.priceMax,
      zip:     liveZip,
      radius:  liveRadius,
    })
    try {
      const res = await fetch(`/api/auction-search?${p}`)
      const data = await res.json()
      if (data.error) setLiveError(data.error)
      setLiveResults(data.listings ?? [])
      setLiveTotal(data.total ?? 0)
      setLiveSources(data.sources ?? null)
      setLiveSearched(true)
    } catch { setLiveError('Search failed. Please try again.') }
    finally { setLiveLoading(false) }
  }

  function conditionColor(grade: string | null): string {
    if (!grade) return 'rgba(255,255,255,0.3)'
    const n = parseFloat(grade)
    if (n >= 4.0) return '#22c55e'
    if (n >= 3.0) return '#FFD700'
    if (n >= 2.0) return '#F4A261'
    return '#E63946'
  }

  function auctionCountdown(dateStr: string | null): string {
    if (!dateStr) return ''
    const diff = new Date(dateStr).getTime() - Date.now()
    if (diff < 0) return 'Ended'
    const days = Math.floor(diff / 86400000)
    const h = Math.floor((diff % 86400000) / 3600000)
    if (days > 0) return `${days}d ${h}h`
    const m = Math.floor((diff % 3600000) / 60000)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  const inp: React.CSSProperties = { background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.625rem', padding:'0.5rem 0.75rem', color:'white', fontSize:'0.8rem', outline:'none' }

  return (
    <div style={{ maxWidth:'1300px', margin:'0 auto' }}>
      <div style={{ marginBottom:'1.25rem' }}>
        <h1 style={{ fontSize:'1.75rem', fontWeight:800 }}>🏁 Auction Discovery</h1>
        <p style={{ color:'rgba(255,255,255,0.35)', marginTop:'0.25rem' }}>Online auctions + in-person events with times, locations, and contact info</p>
      </div>

      {/* Main tabs */}
      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.5rem', borderBottom:'2px solid rgba(255,255,255,0.06)', paddingBottom:'0.5rem' }}>
        {[['online','🌐 Online Auctions'],['inperson','📍 In-Person Events'],['search','🔩 Copart / IAAI']].map(([id,label]) => (
          <button key={id} onClick={() => setTab(id as any)} style={{ padding:'0.625rem 1.25rem', borderRadius:'0.625rem 0.625rem 0 0', border:'none', background: tab===id ? '#CC0000':'transparent', color: tab===id ? 'white':'rgba(255,255,255,0.45)', fontWeight: tab===id ? 700:400, cursor:'pointer', fontSize:'0.9rem', transition:'all 0.15s' }}>
            {label}
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.88)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }} onClick={() => setSelected(null)}>
          <div style={{ background:'#1B2A3E', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'1.25rem', padding:'1.75rem', maxWidth:'720px', width:'100%', maxHeight:'92vh', overflowY:'auto' }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'1rem' }}>
              <div>
                <h2 style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'0.25rem' }}>{selected.title ?? selected.name}</h2>
                {selected.source && (
                  <span style={{ fontSize:'0.75rem', background:`${selected.source_color ?? '#888'}18`, border:`1px solid ${selected.source_color ?? '#888'}35`, color: selected.source_color ?? 'rgba(255,255,255,0.5)', padding:'0.15rem 0.5rem', borderRadius:'9999px', fontWeight:600 }}>
                    {selected.source_badge} {selected.source}
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', fontSize:'1.5rem', cursor:'pointer', flexShrink:0 }}>×</button>
            </div>

            {/* Photo gallery for salvage/auction lots */}
            {selected.images?.length > 0 ? (
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ height:'260px', borderRadius:'0.875rem', overflow:'hidden', marginBottom:'0.5rem', background:'#0D1E30' }}>
                  <img src={selected.images[selectedPhoto]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).src = '' }} />
                </div>
                {selected.images.length > 1 && (
                  <div style={{ display:'flex', gap:'0.375rem', overflowX:'auto', paddingBottom:'0.25rem' }}>
                    {selected.images.map((img: string, i: number) => (
                      <div key={i} onClick={() => setSelectedPhoto(i)} style={{ width:'60px', height:'45px', borderRadius:'0.375rem', overflow:'hidden', flexShrink:0, cursor:'pointer', border:`2px solid ${selectedPhoto===i ? '#CC0000':'transparent'}`, opacity: selectedPhoto===i ? 1 : 0.6 }}>
                        <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : selected.img ? (
              <img src={selected.img} alt="" style={{ width:'100%', borderRadius:'0.875rem', marginBottom:'1.25rem', maxHeight:'260px', objectFit:'cover' }} />
            ) : null}

            {/* Salvage/Auction lot fields (Copart / IAAI / eBay) */}
            {selected.lot_number !== undefined && (
              <>
                {/* Damage + condition */}
                <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap', marginBottom:'1rem' }}>
                  {selected.condition_grade && (
                    <div style={{ background:`${conditionColor(selected.condition_grade)}18`, border:`1px solid ${conditionColor(selected.condition_grade)}35`, borderRadius:'0.5rem', padding:'0.5rem 0.875rem', textAlign:'center' }}>
                      <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase' }}>Grade</p>
                      <p style={{ fontWeight:900, fontSize:'1.25rem', color:conditionColor(selected.condition_grade) }}>{selected.condition_grade}</p>
                    </div>
                  )}
                  {selected.primary_damage && (
                    <div style={{ flex:1, background:'rgba(230,57,70,0.08)', border:'1px solid rgba(230,57,70,0.2)', borderRadius:'0.5rem', padding:'0.5rem 0.875rem' }}>
                      <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:'0.125rem' }}>Primary Damage</p>
                      <p style={{ fontWeight:700, color:'#E63946', fontSize:'0.9rem' }}>{selected.primary_damage}</p>
                    </div>
                  )}
                  {selected.secondary_damage && (
                    <div style={{ flex:1, background:'rgba(244,162,97,0.08)', border:'1px solid rgba(244,162,97,0.2)', borderRadius:'0.5rem', padding:'0.5rem 0.875rem' }}>
                      <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.4)', textTransform:'uppercase', marginBottom:'0.125rem' }}>Secondary Damage</p>
                      <p style={{ fontWeight:600, color:'#F4A261', fontSize:'0.875rem' }}>{selected.secondary_damage}</p>
                    </div>
                  )}
                </div>

                {/* Price row */}
                <div style={{ display:'flex', gap:'1rem', alignItems:'center', marginBottom:'1.25rem', flexWrap:'wrap' }}>
                  <div>
                    <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)' }}>CURRENT BID</p>
                    <p style={{ fontWeight:900, fontSize:'2rem', color:'#CC0000', lineHeight:1 }}>{selected.price ? `$${selected.price.toLocaleString()}` : '—'}</p>
                  </div>
                  {selected.buy_now_price && (
                    <div style={{ background:'rgba(34,197,94,0.1)', border:'1px solid rgba(34,197,94,0.25)', borderRadius:'0.625rem', padding:'0.625rem 1rem' }}>
                      <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)' }}>BUY NOW</p>
                      <p style={{ fontWeight:800, fontSize:'1.5rem', color:'#22c55e', lineHeight:1 }}>${selected.buy_now_price.toLocaleString()}</p>
                    </div>
                  )}
                  {selected.auction_date && (
                    <div style={{ background:'rgba(255,215,0,0.08)', border:'1px solid rgba(255,215,0,0.2)', borderRadius:'0.625rem', padding:'0.625rem 1rem' }}>
                      <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.35)' }}>AUCTION DATE</p>
                      <p style={{ fontWeight:700, fontSize:'0.9rem', color:'#FFD700' }}>{new Date(selected.auction_date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' })}</p>
                      <p style={{ fontSize:'0.7rem', color:'#FFD700' }}>⏱ {auctionCountdown(selected.auction_date)}</p>
                    </div>
                  )}
                </div>

                {/* Details grid */}
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.5rem', marginBottom:'1.25rem' }}>
                  {[
                    ['🔑','Keys', selected.keys ?? '—'],
                    ['📍','Location', selected.location || '—'],
                    ['🔢','Lot #', selected.lot_number ?? '—'],
                    ['🚘','Drivetrain', selected.drivetrain ?? '—'],
                    ['⛽','Fuel', selected.fuel_type ?? '—'],
                    ['🎨','Color', selected.color ?? '—'],
                    ['🔢','Mileage', selected.mileage ? `${Number(selected.mileage).toLocaleString()} mi` : '—'],
                    ['📋','Odometer', selected.odometer_status ?? '—'],
                    ['🔑','VIN', selected.vin ?? '—'],
                  ].map(([icon, label, val]) => (
                    <div key={label as string} style={{ background:'#0D1E30', borderRadius:'0.5rem', padding:'0.5rem 0.625rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize:'0.6rem', color:'rgba(255,255,255,0.3)' }}>{icon} {label as string}</p>
                      <p style={{ fontWeight:600, fontSize:'0.775rem', marginTop:'0.1rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{val as string}</p>
                    </div>
                  ))}
                </div>

                {selected.listing_url
                  ? <a href={selected.listing_url} target="_blank" rel="noopener" style={{ display:'block', background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, textAlign:'center', textDecoration:'none', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>
                      View on {selected.source} →
                    </a>
                  : null
                }
              </>
            )}

            {/* Classic auction listing (mock data) */}
            {selected.current_bid !== undefined && selected.lot_number === undefined && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
                  {[['📍','Location',selected.location],['⏱️','Time Left',timeLeft(selected.end_time)],['🏷️','Source',selected.source],['🏁','Reserve',selected.reserve_met===true?'✓ Met':selected.reserve_met===false?'Not Met':'Unknown'],['🔨','Bids',`${selected.bid_count} bids`],['📋','Condition',selected.condition]].map(([icon,label,val]) => (
                    <div key={label as string} style={{ background:'#0D1E30', borderRadius:'0.625rem', padding:'0.75rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>{icon} {label as string}</p>
                      <p style={{ fontWeight:600, fontSize:'0.9rem' }}>{val as string}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#0D1E30', borderRadius:'0.875rem', padding:'1.125rem', marginBottom:'1.25rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.625rem', textTransform:'uppercase' }}>Buyer Premium Calculator</p>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}><span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.45)' }}>Current bid</span><span style={{ fontWeight:700, color:'#CC0000' }}>${selected.current_bid.toLocaleString()}</span></div>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.375rem' }}><span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.45)' }}>Buyer premium ({selected.buyer_premium}%)</span><span style={{ color:'rgba(255,255,255,0.45)' }}>${Math.round(selected.current_bid*selected.buyer_premium/100).toLocaleString()}</span></div>
                  <div style={{ height:'1px', background:'rgba(255,255,255,0.06)', margin:'0.5rem 0' }} />
                  <div style={{ display:'flex', justifyContent:'space-between' }}><span style={{ fontWeight:700 }}>All-in estimate</span><span style={{ fontWeight:900, color:'#22c55e', fontSize:'1.1rem' }}>${Math.round(selected.current_bid*(1+selected.buyer_premium/100)).toLocaleString()}</span></div>
                  {bidInput && <div style={{ marginTop:'0.5rem', display:'flex', justifyContent:'space-between' }}><span style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.45)' }}>Your bid all-in</span><span style={{ fontWeight:700, color:'#FFD700' }}>${Math.round(parseInt(bidInput||'0')*(1+selected.buyer_premium/100)).toLocaleString()}</span></div>}
                </div>
                <input value={bidInput} onChange={e => setBidInput(e.target.value)} placeholder="Enter your max bid" type="number" style={{ ...inp, width:'100%', marginBottom:'0.875rem', fontSize:'0.95rem', padding:'0.75rem' }} />
                <a href={selected.url ?? '#'} target="_blank" rel="noopener" style={{ display:'block', background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.875rem', borderRadius:'0.875rem', fontWeight:700, textAlign:'center', textDecoration:'none', boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>View on {selected.source} →</a>
              </>
            )}

            {/* In-person event */}
            {selected.venue !== undefined && (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem', marginBottom:'1.25rem' }}>
                  {[['📅','Dates',`${formatDate(selected.date)} – ${formatDate(selected.end_date)}`],['📍','Venue',selected.venue],['🏙️','Location',`${selected.city}, ${selected.state}`],['🚗','Expected Lots',selected.expected_lots],['💵','Entry Fee',selected.entry_fee === 0 ? 'Free':selected.entry_fee === 'Dealer Only' ? 'Dealer License Required':`$${selected.entry_fee}`],['📊','Consignment',selected.consignment_fee]].map(([icon,label,val]) => (
                    <div key={label as string} style={{ background:'#0D1E30', borderRadius:'0.625rem', padding:'0.75rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                      <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)' }}>{icon} {label as string}</p>
                      <p style={{ fontWeight:600, fontSize:'0.85rem', lineHeight:1.4 }}>{val as string}</p>
                    </div>
                  ))}
                </div>
                <div style={{ background:'#0D1E30', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1.25rem', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.25rem' }}>📍 Full Address</p>
                  <p style={{ fontWeight:600 }}>{selected.address}</p>
                  <a href={`https://maps.google.com/?q=${encodeURIComponent(selected.address)}`} target="_blank" rel="noopener" style={{ fontSize:'0.75rem', color:'#3399FF', display:'block', marginTop:'0.375rem' }}>Open in Google Maps →</a>
                </div>
                <div style={{ display:'flex', gap:'0.75rem' }}>
                  <a href={`tel:${selected.phone}`} style={{ flex:1, background:'rgba(51,153,255,0.1)', border:'1px solid rgba(51,153,255,0.2)', color:'#3399FF', padding:'0.75rem', borderRadius:'0.75rem', textDecoration:'none', textAlign:'center', fontWeight:600, fontSize:'0.875rem' }}>📞 {selected.phone}</a>
                  <a href={selected.website} target="_blank" rel="noopener" style={{ flex:1, background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.75rem', borderRadius:'0.75rem', textDecoration:'none', textAlign:'center', fontWeight:700, boxShadow:'0 4px 16px rgba(204,0,0,0.35)' }}>Register Now →</a>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── ONLINE AUCTIONS TAB ── */}
      {tab === 'online' && (
        <div>
          {/* Search & filter */}
          <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1.125rem', marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
              <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.75rem', padding:'0.625rem 1rem' }}>
                <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search make, model, auction house, location…' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
                {search && <button onClick={() => setSearch('')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem' }}>×</button>}
              </div>
              <select value={filters.sort} onChange={e => setF('sort',e.target.value)} style={{ ...inp, cursor:'pointer', padding:'0.625rem 0.875rem' }}>
                <option value="ends-soon">Ending Soon</option>
                <option value="bid-low">Bid: Low → High</option>
                <option value="bid-high">Bid: High → Low</option>
              </select>
            </div>
            <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', alignItems:'center' }}>
              {['All','online','collector','salvage','dealer'].map(t => (
                <button key={t} onClick={() => setF('type',t)} style={{ padding:'0.3rem 0.625rem', borderRadius:'9999px', border:`1px solid ${filters.type===t ? '#CC0000':'rgba(255,255,255,0.1)'}`, background: filters.type===t ? 'rgba(204,0,0,0.1)':'transparent', color: filters.type===t ? '#CC0000':'rgba(255,255,255,0.4)', fontSize:'0.75rem', cursor:'pointer', fontWeight: filters.type===t ? 700:400 }}>
                  {t==='All' ? 'All Types' : t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
              <div style={{ display:'flex', gap:'0.5rem', marginLeft:'auto', flexWrap:'wrap' }}>
                <select value={filters.make} onChange={e => setF('make',e.target.value)} style={{ ...inp, cursor:'pointer' }}>{MAKES.map(m => <option key={m}>{m}</option>)}</select>
                <input value={filters.yearMin} onChange={e => setF('yearMin',e.target.value)} placeholder="Yr min" style={{ ...inp, width:'80px' }} />
                <input value={filters.yearMax} onChange={e => setF('yearMax',e.target.value)} placeholder="Yr max" style={{ ...inp, width:'80px' }} />
                <input value={filters.priceMin} onChange={e => setF('priceMin',e.target.value)} placeholder="$Min" style={{ ...inp, width:'80px' }} />
                <input value={filters.priceMax} onChange={e => setF('priceMax',e.target.value)} placeholder="$Max" style={{ ...inp, width:'80px' }} />
                <select value={filters.reserveMet} onChange={e => setF('reserveMet',e.target.value)} style={{ ...inp, cursor:'pointer' }}>
                  <option value="any">Any Reserve</option>
                  <option value="met">Reserve Met</option>
                  <option value="not-met">Reserve Not Met</option>
                </select>
                <button onClick={() => { setFilters({ type:'All', source:'All', make:'All Makes', priceMin:'', priceMax:'', yearMin:'', yearMax:'', reserveMet:'any', condition:'Any', sort:'ends-soon' }); setSearch('') }} style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.4)', padding:'0.3rem 0.625rem', borderRadius:'0.5rem', fontSize:'0.7rem', cursor:'pointer' }}>Clear</button>
              </div>
            </div>
          </div>

          {/* Platform links */}
          <div style={{ marginBottom:'1.5rem' }}>
            <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>🌐 Browse All Online Platforms</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'0.625rem' }}>
              {ONLINE_PLATFORMS.map(p => (
                <a key={p.name} href={search ? p.url([filters.make !== 'All Makes' ? filters.make:'', search].filter(Boolean).join(' ')) : p.url('cars')} target="_blank" rel="noopener"
                  style={{ background:'#243547', border:`1px solid ${p.color}20`, borderRadius:'0.875rem', padding:'0.875rem', textDecoration:'none', display:'flex', gap:'0.75rem', alignItems:'flex-start', transition:'all 0.15s' }}>
                  <span style={{ fontSize:'1.5rem', flexShrink:0 }}>{p.logo}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:700, color:'white', fontSize:'0.875rem' }}>{p.name}</p>
                    <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', marginTop:'0.1rem', lineHeight:1.4 }}>{p.desc}</p>
                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.375rem' }}>
                      <span style={{ fontSize:'0.65rem', background:`${p.color}15`, color:p.color, padding:'0.1rem 0.4rem', borderRadius:'9999px' }}>{p.type}</span>
                      <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>{p.fee}</span>
                    </div>
                  </div>
                  <span style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.875rem' }}>→</span>
                </a>
              ))}
            </div>
          </div>

          {/* Featured listings */}
          <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.875rem' }}>{filtered.length} featured listings{search ? ` matching "${search}"`:''}</p>
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem', background:'#243547', borderRadius:'1rem' }}>
              <p style={{ color:'rgba(255,255,255,0.4)' }}>No listings match. Try clearing filters or use the Live Search tab.</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'1.125rem' }}>
              {filtered.map(a => {
                const sc = SOURCE_COLORS[a.source]??'#888', tl = timeLeft(a.end_time), urgent = tl.includes('h')&&!tl.includes('d')
                return (
                  <div key={a.id} onClick={() => { setSelected(a); setBidInput('') }} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', overflow:'hidden', cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ height:'155px', position:'relative', overflow:'hidden' }}>
                      <img src={a.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,transparent 40%,rgba(36,53,71,0.95) 100%)' }} />
                      <span style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:`${sc}22`, border:`1px solid ${sc}44`, color:sc, padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>{a.source}</span>
                      <span style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background: urgent?'rgba(204,0,0,0.85)':'rgba(13,30,48,0.85)', color:'white', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight: urgent?700:400 }}>⏱ {tl}</span>
                      <span style={{ position:'absolute', bottom:'0.5rem', right:'0.5rem', background:'rgba(13,30,48,0.75)', color:'rgba(255,255,255,0.5)', padding:'0.15rem 0.4rem', borderRadius:'9999px', fontSize:'0.65rem' }}>🔨 {a.bid_count} bids</span>
                    </div>
                    <div style={{ padding:'0.875rem' }}>
                      <h3 style={{ fontWeight:700, fontSize:'0.9rem', marginBottom:'0.25rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{a.title}</h3>
                      <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)', marginBottom:'0.625rem' }}>📍 {a.location} · {a.mileage.toLocaleString()} mi · {a.condition}</p>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <div>
                          <p style={{ fontWeight:900, color:'#CC0000', fontSize:'1.2rem' }}>${a.current_bid.toLocaleString()}</p>
                          <p style={{ fontSize:'0.7rem', color:'#FFD700' }}>All-in ~${Math.round(a.current_bid*(1+a.buyer_premium/100)).toLocaleString()}</p>
                        </div>
                        <div style={{ textAlign:'right' }}>
                          {a.reserve_met===true && <span style={{ fontSize:'0.7rem', color:'#22c55e', display:'block' }}>✓ Reserve Met</span>}
                          {a.reserve_met===false && <span style={{ fontSize:'0.7rem', color:'#E63946', display:'block' }}>Reserve Not Met</span>}
                          <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>{a.buyer_premium}% premium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── IN-PERSON EVENTS TAB ── */}
      {tab === 'inperson' && (
        <div>
          <div style={{ display:'flex', gap:'0.75rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
            <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'0.875rem', padding:'0.625rem 1rem' }}>
              <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder='Search auction house, city, state… (e.g. "Barrett-Jackson", "Texas", "collector")' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.875rem', outline:'none' }} />
              {search && <button onClick={() => setSearch('')} style={{ background:'transparent', border:'none', color:'rgba(255,255,255,0.3)', cursor:'pointer', fontSize:'1rem' }}>×</button>}
            </div>
            <div style={{ display:'flex', gap:'0.375rem' }}>
              {['All','collector','salvage','dealer'].map(t => (
                <button key={t} onClick={() => setEventFilter(t)} style={{ padding:'0.4rem 0.75rem', borderRadius:'9999px', border:`1px solid ${eventFilter===t?'#CC0000':'rgba(255,255,255,0.1)'}`, background:eventFilter===t?'rgba(204,0,0,0.1)':'transparent', color:eventFilter===t?'#CC0000':'rgba(255,255,255,0.4)', fontSize:'0.8rem', cursor:'pointer' }}>
                  {t==='All'?'All Types':t.charAt(0).toUpperCase()+t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginBottom:'1rem' }}>{filteredEvents.length} upcoming events · Sorted by date</p>

          <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
            {filteredEvents.map(ev => {
              const isPast = new Date(ev.end_date) < new Date()
              const isThisMonth = new Date(ev.date).getMonth() === new Date().getMonth()
              return (
                <div key={ev.id} onClick={() => setSelected(ev)} style={{ background:'#243547', border:`1px solid ${ev.hot?'rgba(204,0,0,0.25)':'rgba(255,255,255,0.08)'}`, borderRadius:'1rem', overflow:'hidden', cursor:'pointer', display:'grid', gridTemplateColumns:'220px 1fr', opacity: isPast?0.5:1 }}>
                  <div style={{ position:'relative', overflow:'hidden', minHeight:'160px' }}>
                    <img src={ev.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', position:'absolute', inset:0 }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, transparent, rgba(36,53,71,0.6))' }} />
                    {ev.hot && <div style={{ position:'absolute', top:'0.625rem', left:'0.625rem', background:'#CC0000', color:'white', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:800 }}>🔥 MAJOR EVENT</div>}
                    {isThisMonth && !isPast && <div style={{ position:'absolute', bottom:'0.625rem', left:'0.625rem', background:'rgba(34,197,94,0.85)', color:'white', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>THIS MONTH</div>}
                  </div>
                  <div style={{ padding:'1.25rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem' }}>
                      <div>
                        <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.35)', marginBottom:'0.25rem', textTransform:'uppercase', letterSpacing:'0.5px' }}>{ev.org}</p>
                        <h3 style={{ fontWeight:800, fontSize:'1rem' }}>{ev.name}</h3>
                      </div>
                      <span style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.5)', padding:'0.2rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', textTransform:'capitalize' }}>{ev.type}</span>
                    </div>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.875rem' }}>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>📅 Dates</p>
                        <p style={{ fontSize:'0.825rem', fontWeight:600 }}>{formatDate(ev.date)}</p>
                        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>through {formatDate(ev.end_date)}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>📍 Location</p>
                        <p style={{ fontSize:'0.825rem', fontWeight:600 }}>{ev.city}, {ev.state}</p>
                        <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.4)' }}>{ev.venue}</p>
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>🚗 Expected</p>
                        <p style={{ fontSize:'0.825rem', fontWeight:600 }}>{ev.expected_lots} lots</p>
                      </div>
                      <div>
                        <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>💵 Entry</p>
                        <p style={{ fontSize:'0.825rem', fontWeight:600 }}>{ev.entry_fee===0?'Free':ev.entry_fee==='Dealer Only'?'Dealer Req.':`$${ev.entry_fee}`}</p>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'0.5rem' }}>
                      <a href={`tel:${ev.phone}`} onClick={e => e.stopPropagation()} style={{ flex:1, textAlign:'center', background:'rgba(51,153,255,0.1)', border:'1px solid rgba(51,153,255,0.2)', color:'#3399FF', padding:'0.5rem', borderRadius:'0.5rem', textDecoration:'none', fontSize:'0.775rem', fontWeight:600 }}>📞 {ev.phone}</a>
                      <a href={ev.website} target="_blank" rel="noopener" onClick={e => e.stopPropagation()} style={{ flex:1, textAlign:'center', background:'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', padding:'0.5rem', borderRadius:'0.5rem', textDecoration:'none', fontSize:'0.775rem', fontWeight:700, boxShadow:'0 2px 8px rgba(204,0,0,0.3)' }}>Register →</a>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── COPART / IAAI TAB ── */}
      {tab === 'search' && (
        <div>
          {/* Search form */}
          <div style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'1.5rem', marginBottom:'1.25rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1rem' }}>
              <div style={{ display:'flex', gap:'0.375rem' }}>
                {[{label:'🔩 Copart',c:'#3399FF'},{label:'⚡ IAAI',c:'#F4A261'},{label:'🏁 eBay',c:'#E43137'}].map(s => (
                  <span key={s.label} style={{ fontSize:'0.7rem', background:`${s.c}12`, border:`1px solid ${s.c}30`, color:s.c, padding:'0.2rem 0.5rem', borderRadius:'9999px', fontWeight:600 }}>{s.label}</span>
                ))}
              </div>
              <p style={{ fontSize:'0.75rem', color:'rgba(255,255,255,0.3)', marginLeft:'auto' }}>Powered by Marketcheck + eBay Motors</p>
            </div>
            <form onSubmit={searchLive}>
              <div style={{ display:'flex', gap:'0.75rem', marginBottom:'0.875rem' }}>
                <div style={{ flex:1, display:'flex', alignItems:'center', gap:'0.625rem', background:'#0D1E30', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'0.875rem', padding:'0.75rem 1rem' }}>
                  <span style={{ color:'rgba(255,255,255,0.3)' }}>🔍</span>
                  <input value={liveQuery} onChange={e => setLiveQuery(e.target.value)} placeholder='e.g. "Mustang GT500", "BMW M3", "Camaro" — or leave blank for make/model search' style={{ flex:1, background:'transparent', border:'none', color:'white', fontSize:'0.9rem', outline:'none' }} />
                </div>
                <button type="submit" disabled={liveLoading} style={{ background: liveLoading?'#1E3A5F':'linear-gradient(135deg, #CC0000, #AA0000)', color:'white', border:'none', padding:'0.75rem 1.75rem', borderRadius:'0.875rem', fontWeight:700, cursor: liveLoading?'default':'pointer', whiteSpace:'nowrap', boxShadow: liveLoading?'none':'0 4px 16px rgba(204,0,0,0.4)' }}>
                  {liveLoading ? 'Searching…' : 'Search Lots'}
                </button>
              </div>
              <div style={{ display:'flex', gap:'0.625rem', flexWrap:'wrap', alignItems:'flex-end' }}>
                <div>
                  <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.25rem' }}>Make</p>
                  <select value={liveMake} onChange={e => setLiveMake(e.target.value)} style={{ ...inp, cursor:'pointer' }}>{MAKES.map(m => <option key={m}>{m}</option>)}</select>
                </div>
                <div>
                  <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.25rem' }}>Year Min</p>
                  <input value={filters.yearMin} onChange={e => setF('yearMin',e.target.value)} placeholder="2015" style={{ ...inp, width:'85px' }} />
                </div>
                <div>
                  <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.25rem' }}>Year Max</p>
                  <input value={filters.yearMax} onChange={e => setF('yearMax',e.target.value)} placeholder="2024" style={{ ...inp, width:'85px' }} />
                </div>
                <div>
                  <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.25rem' }}>Max Price</p>
                  <input value={filters.priceMax} onChange={e => setF('priceMax',e.target.value)} placeholder="$25,000" style={{ ...inp, width:'105px' }} />
                </div>
                <div>
                  <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.25rem' }}>ZIP Code</p>
                  <input value={liveZip} onChange={e => setLiveZip(e.target.value)} placeholder="75201" style={{ ...inp, width:'95px' }} />
                </div>
                <div>
                  <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)', marginBottom:'0.25rem' }}>Radius</p>
                  <select value={liveRadius} onChange={e => setLiveRadius(e.target.value)} style={{ ...inp, width:'100px', cursor:'pointer' }}>
                    {['50','100','150','250','500'].map(r => <option key={r} value={r}>{r} mi</option>)}
                  </select>
                </div>
              </div>
            </form>
          </div>

          {liveError && <div style={{ background:'rgba(244,162,97,0.08)', border:'1px solid rgba(244,162,97,0.2)', borderRadius:'0.75rem', padding:'1rem', marginBottom:'1rem', color:'#F4A261', fontSize:'0.875rem' }}>⚠️ {liveError}</div>}

          {/* Results header + source filter */}
          {liveSearched && !liveLoading && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.625rem', marginBottom:'1rem', flexWrap:'wrap' }}>
              <p style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.4)' }}>{liveTotal} lots found</p>
              {liveSources && (
                <div style={{ display:'flex', gap:'0.375rem', marginLeft:'0.5rem' }}>
                  {([
                    ['all', 'All', liveTotal, '#CC0000'],
                    ['Copart', '🔩 Copart', liveSources.marketcheck, '#3399FF'],
                    ['IAAI', '⚡ IAAI', 0, '#F4A261'],
                    ['eBay Motors', '🏁 eBay', liveSources.ebay, '#E43137'],
                  ] as const).map(([key, label, count]) => (
                    (key === 'all' || count > 0) ? (
                      <button key={key} onClick={() => setLiveSourceFilter(key as any)}
                        style={{ background: liveSourceFilter===key ? 'rgba(204,0,0,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${liveSourceFilter===key ? 'rgba(204,0,0,0.35)':'rgba(255,255,255,0.1)'}`, color: liveSourceFilter===key ? '#FF4444':'rgba(255,255,255,0.5)', padding:'0.2rem 0.625rem', borderRadius:'9999px', fontSize:'0.75rem', fontWeight: liveSourceFilter===key ? 700:400, cursor:'pointer' }}>
                        {label} ({count})
                      </button>
                    ) : null
                  ))}
                </div>
              )}
            </div>
          )}

          {liveLoading && (
            <div style={{ textAlign:'center', padding:'3rem' }}>
              <p style={{ fontSize:'2.5rem', marginBottom:'0.75rem' }}>🔩</p>
              <p style={{ color:'rgba(255,255,255,0.4)' }}>Searching Copart, IAAI, and eBay Motors simultaneously…</p>
            </div>
          )}

          {/* Lot cards */}
          {!liveLoading && liveResults.length > 0 && (() => {
            const visible = liveSourceFilter === 'all' ? liveResults : liveResults.filter(r => r.source === liveSourceFilter)
            return (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(290px, 1fr))', gap:'1rem' }}>
                {visible.map(item => {
                  const countdown = auctionCountdown(item.auction_date)
                  const urgent = countdown && !countdown.includes('d') && countdown !== 'Ended' && countdown !== ''
                  return (
                    <div key={item.id}
                      onClick={() => { setSelected(item); setSelectedPhoto(0); setBidInput('') }}
                      style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', overflow:'hidden', cursor:'pointer', transition:'transform 0.1s, border-color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = item.source_color ?? '#CC0000'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.transform = 'translateY(0)' }}>

                      {/* Photo */}
                      <div style={{ height:'165px', background:'#0D1E30', position:'relative', overflow:'hidden' }}>
                        {item.images?.[0]
                          ? <img src={item.images[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { (e.target as HTMLImageElement).style.display='none' }} />
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'3rem', color:'rgba(255,255,255,0.1)' }}>🔩</div>
                        }
                        {/* Source badge */}
                        <span style={{ position:'absolute', top:'0.5rem', left:'0.5rem', background:'rgba(5,10,20,0.85)', border:`1px solid ${item.source_color}40`, color:item.source_color, padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight:700 }}>
                          {item.source_badge} {item.source}
                        </span>
                        {/* Condition grade */}
                        {item.condition_grade && (
                          <span style={{ position:'absolute', top:'0.5rem', right:'0.5rem', background:'rgba(5,10,20,0.9)', border:`1px solid ${conditionColor(item.condition_grade)}40`, color:conditionColor(item.condition_grade), padding:'0.15rem 0.5rem', borderRadius:'9999px', fontSize:'0.7rem', fontWeight:800 }}>
                            ★ {item.condition_grade}
                          </span>
                        )}
                        {/* Auction date countdown */}
                        {countdown && countdown !== 'Ended' && (
                          <span style={{ position:'absolute', bottom:'0.5rem', right:'0.5rem', background: urgent ? 'rgba(204,0,0,0.85)' : 'rgba(13,30,48,0.85)', color:'white', padding:'0.15rem 0.45rem', borderRadius:'9999px', fontSize:'0.65rem', fontWeight: urgent ? 700:400 }}>
                            ⏱ {countdown}
                          </span>
                        )}
                        {/* Photo count */}
                        {item.images?.length > 1 && (
                          <span style={{ position:'absolute', bottom:'0.5rem', left:'0.5rem', background:'rgba(0,0,0,0.6)', color:'rgba(255,255,255,0.7)', padding:'0.15rem 0.45rem', borderRadius:'9999px', fontSize:'0.65rem' }}>
                            📷 {item.images.length}
                          </span>
                        )}
                      </div>

                      {/* Card body */}
                      <div style={{ padding:'0.875rem' }}>
                        <p style={{ fontWeight:700, fontSize:'0.875rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis', marginBottom:'0.25rem' }}>{item.title}</p>
                        {/* Damage badge */}
                        {item.primary_damage && (
                          <p style={{ fontSize:'0.7rem', color:'#E63946', marginBottom:'0.375rem', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                            ⚠️ {item.primary_damage}
                          </p>
                        )}
                        <div style={{ display:'flex', gap:'0.375rem', flexWrap:'wrap', marginBottom:'0.625rem' }}>
                          {item.mileage && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.4)' }}>🔢 {Number(item.mileage).toLocaleString()} mi</span>}
                          {item.color && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.4)' }}>🎨 {item.color}</span>}
                          {item.lot_number && <span style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>Lot #{item.lot_number}</span>}
                        </div>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                          <div>
                            <p style={{ fontWeight:900, fontSize:'1.25rem', color:'#CC0000', lineHeight:1 }}>
                              {item.price ? `$${item.price.toLocaleString()}` : '—'}
                            </p>
                            {item.buy_now_price && (
                              <p style={{ fontSize:'0.75rem', color:'#22c55e', fontWeight:700 }}>Buy Now ${item.buy_now_price.toLocaleString()}</p>
                            )}
                          </div>
                          <div style={{ textAlign:'right' }}>
                            {item.auction_date && (
                              <p style={{ fontSize:'0.7rem', color:'#FFD700' }}>
                                📅 {new Date(item.auction_date).toLocaleDateString('en-US', { month:'short', day:'numeric' })}
                              </p>
                            )}
                            {item.location && <p style={{ fontSize:'0.65rem', color:'rgba(255,255,255,0.3)' }}>{item.location}</p>}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })()}

          {/* Empty state */}
          {!liveLoading && liveSearched && liveResults.length === 0 && !liveError && (
            <div style={{ textAlign:'center', padding:'3rem', background:'#243547', borderRadius:'1rem' }}>
              <p style={{ color:'rgba(255,255,255,0.4)' }}>No lots found — try a broader search or remove filters.</p>
            </div>
          )}
          {!liveSearched && !liveLoading && (
            <div style={{ textAlign:'center', padding:'4rem 2rem' }}>
              <p style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔩</p>
              <h2 style={{ fontSize:'1.1rem', fontWeight:700, marginBottom:'0.5rem' }}>Search Copart &amp; IAAI Lots</h2>
              <p style={{ color:'rgba(255,255,255,0.35)', maxWidth:'420px', margin:'0 auto', fontSize:'0.875rem' }}>
                Enter a make, model, or keyword above to pull live salvage and clean title lots with photos, condition grades, damage reports, and buy now prices.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
