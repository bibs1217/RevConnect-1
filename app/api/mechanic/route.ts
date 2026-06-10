import { NextRequest } from 'next/server'
import { VENDORS } from '@/lib/platform-data'

export const runtime = 'edge'

/* ────────────────────────────────────────────────────────────────────────
   VictoryRevConnect1 AI — Anthropic tool-use upgrade.
   Claude with 8 tools (7 platform tools + built-in web search).
   Tool results stream to the client both as model context AND as
   structured "rc_cards" SSE events rendered as inline chat cards.
   Client protocol unchanged: OpenAI-style text deltas + rc_cards/rc_status.
   ──────────────────────────────────────────────────────────────────────── */

export interface RCCard {
  type: 'part' | 'vehicle' | 'auction' | 'vendor' | 'event' | 'insurance' | 'carwash'
  id: string
  title: string
  subtitle?: string
  image?: string | null
  icon?: string
  priceLabel?: string
  meta?: string[]
  url?: string | null
  mapsUrl?: string | null
  description?: string
  badge?: string
  brand?: string | null
  price?: number | null
  source?: string
  fullPage: { label: string; href: string }
  detail?: Record<string, string>
}

const TOOLS: any[] = [
  {
    type: 'web_search_20250305',
    name: 'web_search',
    max_uses: 3,
  },
  {
    name: 'parts_search',
    description: 'Search for automotive parts by name, part number, or vehicle fitment. Returns live pricing from multiple retailers.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Part name, part number, or description' },
        vehicle: { type: 'string', description: 'Year make model, e.g. 2019 Ford Mustang GT' },
      },
      required: ['query'],
    },
  },
  {
    name: 'vendor_lookup',
    description: "Find vendors, performance shops, or service providers relevant to the user's repair or modification need.",
    input_schema: {
      type: 'object',
      properties: {
        service_type: { type: 'string', description: 'Type of service or specialty, e.g. turbo install, brake service, detailing' },
        location: { type: 'string', description: 'User location if provided' },
      },
      required: ['service_type'],
    },
  },
  {
    name: 'car_search',
    description: 'Search live vehicle listings from dealers and eBay Motors by make, model, year, price range, or keyword.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Make, model, year, trim, or keyword' },
        max_price: { type: 'number', description: 'Maximum price in USD' },
        location: { type: 'string', description: 'City or zip code' },
      },
      required: ['query'],
    },
  },
  {
    name: 'auction_search',
    description: 'Search current and upcoming vehicle auctions. Includes all-in cost calculator with buyer fees, transport, and taxes.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Make, model, year, or keyword' },
        budget: { type: 'number', description: 'Total all-in budget in USD' },
      },
      required: ['query'],
    },
  },
  {
    name: 'car_wash_lookup',
    description: 'Find car washes near the user, filtered by type — ceramic coating safe, PPF safe, touchless, hand wash.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City, zip code, or address' },
        wash_type: { type: 'string', description: 'Type of wash: ceramic, PPF, touchless, hand wash, any' },
      },
      required: ['location'],
    },
  },
  {
    name: 'insurance_lookup',
    description: 'Get insurance quotes for a vehicle from 30+ carriers including Hagerty and Grundy. Returns quote range and carrier options.',
    input_schema: {
      type: 'object',
      properties: {
        vehicle: { type: 'string', description: 'Year make model, e.g. 2003 Ford Mustang Cobra SVT' },
        coverage_type: { type: 'string', description: 'Type of coverage: agreed value, stated value, standard, classic car' },
      },
      required: ['vehicle'],
    },
  },
  {
    name: 'tire_search',
    description: 'Comparison-shop tires across all major sellers (Tire Rack, Discount Tire, SimpleTire, Costco, etc.) by tire size, brand, and type. Also computes size specs (diameter, sidewall). Size format: 245/40R18.',
    input_schema: {
      type: 'object',
      properties: {
        size: { type: 'string', description: 'Tire size, e.g. 245/40R18' },
        brand: { type: 'string', description: 'Tire brand, e.g. Michelin' },
        tire_type: { type: 'string', description: 'all-season, summer, winter, all-terrain, mud-terrain, touring, track' },
      },
      required: ['size'],
    },
  },
  {
    name: 'events_lookup',
    description: 'Find upcoming car meets, shows, track days, and enthusiast events near the user.',
    input_schema: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City, zip code, or region' },
        event_type: { type: 'string', description: 'Type of event: car meet, show, track day, cruise, any' },
        date_range: { type: 'string', description: 'e.g. this weekend, next 30 days' },
      },
      required: ['location'],
    },
  },
]

/* ── fallback data — used when live eBay/Marketcheck feeds return nothing ── */

const PART_RETAILERS = [
  { name: 'RockAuto',      logo: '🪨',  url: (q: string) => `https://www.rockauto.com/en/partsearch/?partname=${encodeURIComponent(q)}` },
  { name: 'AutoZone',      logo: '🔴', url: (q: string) => `https://www.autozone.com/searchresult?searchText=${encodeURIComponent(q)}` },
  { name: 'Summit Racing', logo: '🏎️', url: (q: string) => `https://www.summitracing.com/search?keyword=${encodeURIComponent(q)}` },
  { name: "O'Reilly Auto", logo: '🟠', url: (q: string) => `https://www.oreillyauto.com/search?q=${encodeURIComponent(q)}` },
  { name: 'Amazon Auto',   logo: '📦', url: (q: string) => `https://www.amazon.com/s?k=${encodeURIComponent(q + ' auto parts')}` },
  { name: 'NAPA Auto',     logo: '🔵', url: (q: string) => `https://www.napaonline.com/en/search?query=${encodeURIComponent(q)}` },
]

const CAR_SITES = [
  { name: 'AutoTrader', logo: '🚘', url: (mk: string, md: string, zip?: string) => `https://www.autotrader.com/cars-for-sale/${[mk, md].filter(Boolean).map(s => s.toLowerCase().replace(/\s+/g, '-')).join('/')}${zip ? `?zip=${zip}` : ''}` },
  { name: 'Cars.com',   logo: '🚗', url: (mk: string, md: string, zip?: string) => `https://www.cars.com/shopping/results/?makes[]=${mk.toLowerCase()}&models[]=${mk.toLowerCase()}-${md.toLowerCase().replace(/\s+/g, '_')}${zip ? `&zip=${zip}` : ''}` },
  { name: 'CarGurus',   logo: '🧭', url: (mk: string, md: string) => `https://www.cargurus.com/Cars/spt-${[mk, md].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-')}` },
  { name: 'Carvana',    logo: '🛻', url: (mk: string, md: string) => `https://www.carvana.com/cars/${[mk, md].filter(Boolean).join('-').toLowerCase().replace(/\s+/g, '-')}` },
  { name: 'eBay Motors',logo: '🏷️', url: (mk: string, md: string) => `https://www.ebay.com/sch/6001/i.html?_nkw=${encodeURIComponent([mk, md].filter(Boolean).join(' '))}` },
  { name: 'Facebook Marketplace', logo: '🛒', url: (mk: string, md: string) => `https://www.facebook.com/marketplace/category/vehicles?query=${encodeURIComponent([mk, md].filter(Boolean).join(' '))}` },
]

const AUCTION_SAMPLES = [
  { id:'s1', title:'2020 Toyota Supra GR', make:'Toyota', model:'Supra', mileage:14200, bid:52500, premium:5, img:'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=500&q=80', source:'Bring a Trailer', location:'California', condition:'Excellent', url:'https://bringatrailer.com/toyota/supra/' },
  { id:'s2', title:'2021 Ford Mustang Shelby GT500', make:'Ford', model:'Mustang', mileage:3400, bid:89000, premium:4.5, img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80', source:'Cars & Bids', location:'Texas', condition:'Like New', url:'https://carsandbids.com/search/ford%20mustang' },
  { id:'s3', title:'2018 BMW M3 Competition', make:'BMW', model:'M3', mileage:38200, bid:28500, premium:12, img:'https://images.unsplash.com/photo-1580274455152-f4af44f89116?w=500&q=80', source:'Copart', location:'Georgia', condition:'Repairable', url:'https://www.copart.com/lotSearchResults/?free=true&query=bmw%20m3' },
  { id:'s4', title:'2019 Porsche 911 Carrera', make:'Porsche', model:'911', mileage:8900, bid:105000, premium:0, img:'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500&q=80', source:'eBay Motors', location:'Florida', condition:'Excellent', url:'https://www.ebay.com/sch/6001/i.html?_nkw=porsche%20911&Auction=1' },
  { id:'s5', title:'1969 Chevrolet Camaro Z/28', make:'Chevrolet', model:'Camaro', mileage:87400, bid:72000, premium:10, img:'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=500&q=80', source:'Mecum', location:'Arizona', condition:'Restored', url:'https://www.mecum.com/search/?q=camaro' },
  { id:'s6', title:'1989 Ford Mustang GT Fox Body', make:'Ford', model:'Mustang', mileage:98000, bid:21500, premium:5, img:'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500&q=80', source:'Bring a Trailer', location:'Florida', condition:'Driver', url:'https://bringatrailer.com/ford/fox-body-mustang/' },
]

const money = (n: number | null | undefined) =>
  n == null || isNaN(Number(n)) ? null : `$${Math.round(Number(n)).toLocaleString()}`

const qs = (o: Record<string, string | undefined>) => {
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(o)) if (v) p.set(k, v)
  return p.toString()
}

async function getJSON(url: string, timeoutMs = 25000): Promise<any> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!res.ok) return null
    return await res.json()
  } catch { return null }
}

const mapsSearch = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

/* ── free-text parsers for tool args ── */

const KNOWN_MAKES = ['acura','audi','bmw','chevrolet','chevy','dodge','ford','honda','hyundai','infiniti','jeep','kia','lexus','mazda','mercedes','mercedes-benz','mitsubishi','nissan','porsche','subaru','tesla','toyota','volkswagen','vw','shelby','pontiac','plymouth','buick','cadillac','gmc','ram','mini','volvo','jaguar','ferrari','lamborghini','corvette']
const MAKE_ALIASES: Record<string, string> = { chevy: 'Chevrolet', vw: 'Volkswagen', 'mercedes-benz': 'Mercedes-Benz', shelby: 'Ford', corvette: 'Chevrolet' }
const MODEL_HINTS: Record<string, { make: string; model: string }> = {
  'fox body': { make: 'Ford', model: 'Mustang' },
  'foxbody': { make: 'Ford', model: 'Mustang' },
  'cobra': { make: 'Ford', model: 'Mustang' },
  'gt500': { make: 'Ford', model: 'Mustang' },
  'gt350': { make: 'Ford', model: 'Mustang' },
  'corvette': { make: 'Chevrolet', model: 'Corvette' },
  'supra': { make: 'Toyota', model: 'Supra' },
  'wrx': { make: 'Subaru', model: 'WRX' },
}

function parseVehicle(s: string): { year: string; make: string; model: string; raw: string } {
  const raw = (s ?? '').trim()
  const lower = raw.toLowerCase()
  const yearMatch = lower.match(/\b(19|20)\d{2}\b/)
  const year = yearMatch ? yearMatch[0] : ''
  let make = '', model = ''
  for (const [hint, v] of Object.entries(MODEL_HINTS)) {
    if (lower.includes(hint)) { make = v.make; model = v.model; break }
  }
  if (!make) {
    const tokens = lower.replace(/[,]/g, ' ').split(/\s+/).filter(Boolean)
    const mi = tokens.findIndex(t => KNOWN_MAKES.includes(t))
    if (mi >= 0) {
      make = MAKE_ALIASES[tokens[mi]] ?? tokens[mi].charAt(0).toUpperCase() + tokens[mi].slice(1)
      const rest = tokens.slice(mi + 1).filter(t => !/^(19|20)\d{2}$/.test(t))
      model = rest.slice(0, 2).join(' ')
    }
  }
  return { year, make, model, raw }
}

function parseLocation(s: string): { city: string; state: string; zip: string; raw: string } {
  const raw = (s ?? '').trim()
  if (/^\d{5}$/.test(raw)) return { city: '', state: '', zip: raw, raw }
  const m = raw.match(/^(.*?)[,\s]+([A-Za-z]{2})(?:\s+\d{5})?$/)
  if (m && m[1].trim()) return { city: m[1].trim(), state: m[2].toUpperCase(), zip: (raw.match(/\d{5}/) ?? [''])[0], raw }
  return { city: raw, state: '', zip: '', raw }
}

/* ── tool execution: each tool wired to the same data source as its page ── */

async function execTool(name: string, args: any, origin: string): Promise<{ cards: RCCard[]; model: string }> {
  const a = args ?? {}
  try {
    switch (name) {
      case 'parts_search': {
        const pv = parseVehicle(a.vehicle ?? '')
        const data = await getJSON(`${origin}/api/parts-search?${qs({ query: a.query, year: pv.year, make: pv.make, model: pv.model, sortBy: 'price-asc' })}`)
        const items: any[] = (data?.listings ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((p: any, i: number) => ({
          type: 'part', id: String(p.id ?? i),
          title: p.title ?? 'Part',
          subtitle: [p.brand, p.seller || p.source].filter(Boolean).join(' · '),
          image: p.image || null, icon: '🔩',
          price: p.total_price ?? p.price ?? null,
          priceLabel: money(p.total_price ?? p.price) ?? 'See price',
          brand: p.brand ?? null, source: p.source ?? p.seller ?? '',
          meta: [p.condition, p.free_shipping ? 'Free shipping' : (p.shipping ? `+${money(p.shipping)} ship` : null), p.location].filter(Boolean) as string[],
          url: p.url ?? null,
          fullPage: { label: 'Open in Parts', href: '/parts' },
          detail: { Condition: p.condition ?? '-', Seller: p.seller ?? '-', Source: p.source ?? '-', Location: p.location ?? '-', 'Part #': p.part_number ?? '-' },
        }))
        if (cards.length) return { cards, model: JSON.stringify(cards.map(c => ({ title: c.title, price: c.priceLabel, retailer: c.source }))) }
        const kw = [pv.raw, a.query].filter(Boolean).join(' ')
        const fbCards: RCCard[] = PART_RETAILERS.map((r, i) => ({
          type: 'part', id: `fb_${i}`,
          title: `${a.query} — ${r.name}`,
          subtitle: r.name,
          icon: r.logo,
          priceLabel: 'See live prices',
          source: r.name,
          meta: [pv.raw ? `Fits: ${pv.raw}` : 'All vehicles'],
          url: r.url(kw),
          fullPage: { label: 'Open in Parts', href: '/parts' },
          detail: { Retailer: r.name, Search: kw, Note: 'Opens a pre-filled live search at the retailer.' },
        }))
        return { cards: fbCards, model: `fallback:true — live listing feeds returned nothing, so pre-filled retailer search cards for "${kw}" were rendered (${PART_RETAILERS.map(r => r.name).join(', ')}). Present these as the best places to buy with live prices.` }
      }
      case 'vendor_lookup': {
        const q = (a.service_type ?? '').toLowerCase()
        const tokens = q.split(/[\s,/]+/).filter((t: string) => t.length > 2)
        let items = VENDORS.filter(v => {
          const hay = `${v.name} ${v.category} ${v.sub} ${v.description}`.toLowerCase()
          return tokens.some((t: string) => hay.includes(t))
        })
        if (!items.length) items = VENDORS.filter(v => v.featured)
        items = items.sort((x, y) => (y.featured ? 1 : 0) - (x.featured ? 1 : 0)).slice(0, 6)
        const cards: RCCard[] = items.map(v => ({
          type: 'vendor', id: v.id,
          title: v.name, subtitle: `${v.category} · ${v.sub}`,
          icon: v.logo,
          badge: v.discount ?? undefined,
          meta: [v.verified ? '✓ Verified' : null, v.city ?? null].filter(Boolean) as string[],
          description: v.description,
          url: v.website,
          fullPage: { label: 'Open in Vendors', href: '/vendors' },
          detail: { Category: v.category, Specialty: v.sub, Discount: v.discount ?? '-', Location: v.city ?? 'Nationwide / Online', Verified: v.verified ? 'Yes' : 'No' },
        }))
        return { cards, model: JSON.stringify(items.map(v => ({ name: v.name, specialty: v.sub, discount: v.discount, location: v.city ?? 'online' }))) }
      }
      case 'car_search': {
        const pv = parseVehicle(a.query ?? '')
        const loc = parseLocation(a.location ?? '')
        const priceMax = a.max_price ? String(Math.round(Number(a.max_price))) : ''
        const data = await getJSON(`${origin}/api/car-search?${qs({ make: pv.make, model: pv.model, yearMin: pv.year, priceMax, zip: loc.zip })}`)
        const items: any[] = (data?.listings ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((l: any, i: number) => ({
          type: 'vehicle', id: String(l.id ?? i),
          title: l.title ?? 'Vehicle',
          image: l.photo || null, icon: '🚗',
          price: l.price ?? null, priceLabel: money(l.price) ?? 'See price',
          source: l.source ?? 'eBay',
          meta: [l.condition, l.location].filter(Boolean) as string[],
          url: l.listing_url ?? null,
          fullPage: { label: 'Open in Buy a Car', href: '/car-search' },
          detail: { Condition: l.condition ?? '-', Seller: l.seller ?? '-', Location: l.location ?? '-', Source: l.source ?? 'eBay' },
        }))
        if (cards.length) return { cards, model: JSON.stringify(cards.map(c => ({ title: c.title, price: c.priceLabel }))) }
        const desc = [pv.year, pv.make, pv.model].filter(Boolean).join(' ') || a.query
        const fbCards: RCCard[] = CAR_SITES.map((s, i) => ({
          type: 'vehicle', id: `fb_${i}`,
          title: `${desc} for sale — ${s.name}`,
          subtitle: s.name,
          icon: s.logo,
          priceLabel: priceMax ? `Under ${money(Number(priceMax))}` : 'See live listings',
          source: s.name,
          meta: [loc.raw ? `Near ${loc.raw}` : 'Nationwide'],
          url: s.url(pv.make || a.query, pv.model, loc.zip || undefined),
          fullPage: { label: 'Open in Buy a Car', href: '/car-search' },
          detail: { Marketplace: s.name, Search: desc, Note: 'Opens a pre-filled live search on this marketplace.' },
        }))
        return { cards: fbCards, model: `fallback:true — live feed returned nothing; pre-filled marketplace search cards for "${desc}" were rendered (${CAR_SITES.map(s => s.name).join(', ')}).` }
      }
      case 'auction_search': {
        const pv = parseVehicle(a.query ?? '')
        const priceMax = a.budget ? String(Math.round(Number(a.budget))) : ''
        const data = await getJSON(`${origin}/api/auction-search?${qs({ query: pv.make ? '' : a.query, make: pv.make, model: pv.model, yearMin: pv.year, priceMax })}`)
        const items: any[] = (data?.listings ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((l: any, i: number) => {
          const bid = l.price ?? l.current_bid ?? l.buy_now_price ?? null
          const allIn = bid ? Math.round(Number(bid) * 1.12 + 450) : null
          return {
            type: 'auction', id: String(l.id ?? i),
            title: l.title ?? 'Auction lot',
            subtitle: l.source ?? '',
            image: (l.images && l.images[0]) || l.image || null, icon: '🏁',
            price: bid, priceLabel: bid ? `Bid ${money(bid)}` : 'No bid yet',
            badge: allIn ? `All-In Est: ${money(allIn)}` : undefined,
            source: l.source ?? '',
            meta: [l.mileage ? `${Number(l.mileage).toLocaleString()} mi` : null, l.primary_damage ? `Damage: ${l.primary_damage}` : null, l.location].filter(Boolean) as string[],
            url: l.listing_url ?? null,
            fullPage: { label: 'Open in Auctions', href: '/auctions' },
            detail: { Source: l.source ?? '-', VIN: l.vin ?? '-', 'Primary damage': l.primary_damage ?? '-', 'Buy now': money(l.buy_now_price) ?? '-', Location: l.location ?? '-' },
          }
        })
        if (cards.length) return { cards, model: JSON.stringify(cards.map(c => ({ title: c.title, bid: c.priceLabel, allIn: c.badge }))) }
        const ql = (a.query ?? '').toLowerCase()
        let pool = AUCTION_SAMPLES.filter(s => !ql.trim() || ql.includes(s.make.toLowerCase()) || ql.includes(s.model.toLowerCase()) || s.title.toLowerCase().includes(ql.trim()) || (pv.make && s.make.toLowerCase() === pv.make.toLowerCase()))
        if (a.budget) pool = pool.filter(s => Math.round(s.bid * (1 + s.premium / 100) + 450) <= Number(a.budget))
        if (!pool.length) pool = AUCTION_SAMPLES
        const fbCards: RCCard[] = pool.map(s => {
          const allIn = Math.round(s.bid * (1 + s.premium / 100) + 450)
          return {
            type: 'auction', id: s.id,
            title: s.title,
            subtitle: s.source,
            image: s.img, icon: '🏁',
            price: s.bid, priceLabel: `Bid ${money(s.bid)}`,
            badge: `All-In Est: ${money(allIn)}`,
            source: s.source,
            meta: [`${s.mileage.toLocaleString()} mi`, s.condition, s.location],
            url: s.url,
            fullPage: { label: 'Open in Auctions', href: '/auctions' },
            detail: { Source: s.source, Condition: s.condition, Mileage: `${s.mileage.toLocaleString()} mi`, 'Current bid': money(s.bid) ?? '-', 'Buyer premium': `${s.premium}%`, 'All-in estimate': money(allIn) ?? '-', Location: s.location },
          }
        })
        return { cards: fbCards, model: `fallback:true — live salvage/eBay auction feeds returned nothing; featured platform lots were rendered with all-in estimates (bid + buyer premium + ~$450 transport): ${pool.map(p => `${p.title} all-in ~${money(Math.round(p.bid * (1 + p.premium / 100) + 450))}`).join('; ')}.` }
      }
      case 'car_wash_lookup': {
        const loc = parseLocation(a.location ?? '')
        const wt = (a.wash_type ?? 'any').toLowerCase()
        const washType = wt.includes('touchless') ? 'tunnel_touchless' : (wt.includes('hand') || wt.includes('ceramic') || wt.includes('ppf')) ? 'hand_wash' : wt.includes('detail') ? 'full_detail' : wt.includes('self') ? 'self_serve' : 'any'
        const data = await getJSON(`${origin}/api/car-wash-search?${qs({ city: loc.city, state: loc.state, zip: loc.zip, wash_type: washType })}`, 35000)
        const items: any[] = (data?.businesses ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((w: any, i: number) => ({
          type: 'carwash', id: String(i),
          title: w.name ?? 'Car wash',
          subtitle: w.price_range ?? '',
          icon: '🚿',
          priceLabel: w.rating ? `★ ${w.rating}` : undefined,
          meta: [[w.address, w.city, w.state].filter(Boolean).join(', '), w.phone].filter(Boolean) as string[],
          description: w.description ?? '',
          url: w.website || null,
          mapsUrl: mapsSearch([w.name, w.address, w.city, w.state].filter(Boolean).join(' ')),
          fullPage: { label: 'Open in Car Wash', href: '/car-wash' },
          detail: { Address: [w.address, w.city, w.state].filter(Boolean).join(', '), Phone: w.phone ?? '-', Rating: w.rating ? `${w.rating} / 5` : '-', Price: w.price_range ?? '-' },
        }))
        return { cards, model: cards.length ? JSON.stringify(items.map((w: any) => ({ name: w.name, rating: w.rating, price: w.price_range }))) : `No washes found near ${loc.raw}. Ask the user for a nearby city and 2-letter state.` }
      }
      case 'insurance_lookup': {
        const pv = parseVehicle(a.vehicle ?? '')
        const ct = (a.coverage_type ?? '').toLowerCase()
        const coverage = ct.includes('agreed') || ct.includes('stated') ? 'agreed_value' : ct.includes('classic') ? 'classic_car' : ct.includes('track') ? 'track_day' : ct.includes('mod') ? 'modified' : 'full_coverage'
        const data = await getJSON(`${origin}/api/insurance-search?${qs({ year: pv.year, make: pv.make, model: pv.model, coverage })}`, 35000)
        const items: any[] = (data?.carriers ?? []).slice(0, 6)
        const cards: RCCard[] = items.map((c: any, i: number) => ({
          type: 'insurance', id: String(i),
          title: c.name ?? 'Carrier',
          subtitle: [c.type, c.am_best ? `AM Best ${c.am_best}` : null].filter(Boolean).join(' · '),
          icon: c.logo ?? '🛡️',
          priceLabel: c.monthly ? `~${money(c.monthly)}/mo` : 'Quote varies',
          badge: c.recommended ? '★ Recommended' : undefined,
          meta: [c.annual ? `${money(c.annual)}/yr` : null, c.agreed_value ? 'Agreed value' : null, c.mods_covered ? 'Mods covered' : null].filter(Boolean) as string[],
          description: c.notes ?? '',
          url: c.website || null,
          fullPage: { label: 'Open in Insurance', href: '/insurance' },
          detail: { Type: c.type ?? '-', Coverage: c.coverage ?? '-', Monthly: money(c.monthly) ?? '-', Annual: money(c.annual) ?? '-', 'AM Best': c.am_best ?? '-', Phone: c.phone ?? '-', 'Agreed value': c.agreed_value ? 'Yes' : 'No' },
        }))
        return { cards, model: cards.length ? JSON.stringify(items.map((c: any) => ({ carrier: c.name, monthly: c.monthly, recommended: c.recommended, notes: c.notes }))) : 'Quote engine returned nothing - suggest the /insurance page.' }
      }
      case 'events_lookup': {
        const loc = parseLocation(a.location ?? '')
        if (!loc.city || !loc.state) return { cards: [], model: `Could not resolve "${loc.raw}" into a city + 2-letter state. Ask the user for their city and state (e.g. "Tampa, FL"), then call events_lookup again.` }
        const et = (a.event_type ?? 'any').toLowerCase()
        const type = et.includes('meet') ? 'street_meet' : et.includes('show') ? 'car_show' : et.includes('track') ? 'track_day' : et.includes('cruise') ? 'cruise' : et.includes('drag') ? 'drag' : 'all'
        const data = await getJSON(`${origin}/api/events-search?${qs({ city: loc.city, state: loc.state, type })}`, 30000)
        const ai: any[] = data?.aiEvents ?? []
        const eb: any[] = data?.eventbriteResults ?? []
        const cards: RCCard[] = [
          ...ai.slice(0, 5).map((e: any, i: number): RCCard => ({
            type: 'event', id: `ai_${i}`,
            title: e.name ?? 'Event',
            subtitle: e.schedule ?? '',
            icon: '📍',
            meta: [[e.location, e.city, e.state].filter(Boolean).join(', ')].filter(Boolean) as string[],
            description: e.description ?? '',
            url: e.website || null,
            mapsUrl: mapsSearch([e.location, e.city, e.state].filter(Boolean).join(' ')),
            fullPage: { label: 'Open in Events', href: '/events' },
            detail: { Schedule: e.schedule ?? '-', Venue: e.location ?? '-', City: `${e.city ?? loc.city}, ${e.state ?? loc.state}`, Type: (e.type ?? '-').replace(/_/g, ' ') },
          })),
          ...eb.slice(0, 3).map((e: any, i: number): RCCard => ({
            type: 'event', id: `eb_${i}`,
            title: e.title ?? 'Event',
            subtitle: e.date ? new Date(e.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '',
            image: e.image || null, icon: '🎟️',
            meta: [[e.venue, e.city, e.state].filter(Boolean).join(', '), e.isFree ? 'Free' : null].filter(Boolean) as string[],
            url: e.url || null,
            mapsUrl: mapsSearch([e.venue, e.city, e.state].filter(Boolean).join(' ')),
            fullPage: { label: 'Open in Events', href: '/events' },
            detail: { Date: e.date ?? '-', Venue: e.venue ?? '-', City: `${e.city ?? loc.city}, ${e.state ?? loc.state}`, Source: 'Eventbrite' },
          })),
        ]
        return { cards, model: cards.length ? JSON.stringify(cards.map(c => ({ name: c.title, when: c.subtitle, where: c.meta?.[0] }))) + (a.date_range ? ` (user asked for: ${a.date_range} — filter your recommendations accordingly)` : '') : `No events found near ${loc.city}, ${loc.state}.` }
      }
      case 'tire_search': {
        const m = (a.size ?? '').match(/(\d{3})\s*[\/-]\s*(\d{2})\s*[rR]?\s*(\d{2})/)
        if (!m) return { cards: [], model: `Could not parse tire size "${a.size}". Ask the user for a size like 245/40R18.` }
        const w = Number(m[1]), asp = Number(m[2]), rim = Number(m[3])
        const sizeLabel = `${w}/${asp}R${rim}`
        const brand = a.brand ?? ''
        const sidewall = (w * asp / 100) / 25.4
        const diameter = rim + 2 * sidewall
        const TIRE_SELLERS = [
          { name: 'Firestone', logo: '🔥', rating: 4.6, url: `https://www.firestonecompleteautocare.com/tires/tire-size/${w}-${asp}r${rim}/` },
          { name: 'Tires Plus', logo: '➕', rating: 4.5, url: `https://www.tiresplus.com/tires/tire-size/${w}-${asp}r${rim}/` },
          { name: 'Bridgestone', logo: '🅱️', rating: 4.7, url: `https://www.bridgestonetire.com/catalog/?tireSize=${w}%2F${asp}R${rim}` },
          { name: 'Tire Rack', logo: '🏁', rating: 4.8, url: `https://www.tirerack.com/tires/TireSearchResults.jsp?width=${w}%2F&ratio=${asp}&diameter=${rim}` },
          { name: 'Discount Tire', logo: '🛞', rating: 4.7, url: `https://www.discounttire.com/buy-tires/size/${w}-${asp}-${rim}` },
          { name: 'SimpleTire', logo: '⚡', rating: 4.5, url: `https://simpletire.com/tires-size-${w}-${asp}r${rim}` },
          { name: 'Priority Tire', logo: '💰', rating: 4.6, url: `https://www.prioritytire.com/catalogsearch/result/?q=${encodeURIComponent(`${sizeLabel} ${brand}`.trim())}` },
          { name: 'Amazon Tires', logo: '📦', rating: 4.3, url: `https://www.amazon.com/s?k=${encodeURIComponent(`${sizeLabel} tires ${brand}`.trim())}` },
          { name: 'Costco Tires', logo: '🏬', rating: 4.7, url: 'https://tires.costco.com/' },
        ]
        let base = 62 + (rim - 13) * 16 + Math.max(0, w - 185) * 0.55 + Math.max(0, 45 - asp) * 1.6
        const tt = (a.tire_type ?? '').toLowerCase()
        if (tt.includes('summer')) base *= 1.4; else if (tt.includes('track')) base *= 1.9; else if (tt.includes('winter')) base *= 1.18; else if (tt.includes('mud')) base *= 1.55; else if (tt.includes('terrain')) base *= 1.28
        const lo = Math.round(base * 0.78 / 5) * 5, hi = Math.round(base * 1.45 / 5) * 5
        const cards: RCCard[] = TIRE_SELLERS.map((sl, i) => ({
          type: 'part', id: `tire_${i}`,
          title: `${sizeLabel}${brand ? ' ' + brand : ''} tires — ${sl.name}`,
          subtitle: `${sl.name} · ★ ${sl.rating}`,
          icon: sl.logo,
          priceLabel: `~$${lo}–$${hi}/tire`,
          source: sl.name,
          meta: [`${diameter.toFixed(1)}" overall · ${sidewall.toFixed(1)}" sidewall`, a.tire_type ?? 'all types'],
          url: sl.url,
          fullPage: { label: 'Open in Tires', href: '/tires' },
          detail: { Size: sizeLabel, 'Overall diameter': `${diameter.toFixed(1)}"`, Sidewall: `${sidewall.toFixed(1)}"`, 'Est. street price': `$${lo}-$${hi}/tire`, Seller: sl.name, Note: 'Opens a pre-filled size search at this seller. The /tires page also has a side/front size visualizer.' },
        }))
        return { cards, model: `Rendered ${sizeLabel} seller cards (est $${lo}-$${hi}/tire, overall diameter ${diameter.toFixed(1)} in). Sellers: ${TIRE_SELLERS.map(s => s.name).join(', ')}. Mention the /tires page has a size comparison visualizer if the user is changing sizes.` }
      }
      default:
        return { cards: [], model: `Unknown tool ${name}` }
    }
  } catch (e: any) {
    return { cards: [], model: `Tool ${name} failed: ${e?.message ?? 'error'}` }
  }
}

/* ── POST: Anthropic Messages API with streaming tool-use loop ── */

const RC_STATUS_NAMES: Record<string, string> = {
  parts_search: 'search_parts', vendor_lookup: 'search_vendors', car_search: 'search_cars',
  auction_search: 'search_auctions', car_wash_lookup: 'search_car_washes',
  insurance_lookup: 'get_insurance_quotes', events_lookup: 'search_events', web_search: 'web_search',
}

export async function POST(req: NextRequest) {
  const { messages, vehicleContext } = await req.json()

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'Anthropic API key not configured. Add ANTHROPIC_API_KEY to Vercel environment variables.' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    })
  }

  const origin = new URL(req.url).origin

  let systemPrompt = `You are the VictoryRevConnect1 AI — a 30-year ASE master technician and car culture expert with live access to the entire VictoryRevConnect1 platform. You can search for parts with real-time pricing from 15+ retailers, find vendors and performance shops, search live vehicle listings and auctions, locate car washes, pull insurance quotes from 30+ carriers, and surface upcoming car meets and events. You also have live web search for anything else. When a user asks a question, proactively search for live results across whatever platform features are relevant and include specific recommendations, prices, and links in your response. You can run multiple searches in a single response. Never tell the user you can't look something up. Always be direct, knowledgeable, and enthusiast-friendly.`

  if (vehicleContext) systemPrompt += `\n\nThe user's current vehicle: ${vehicleContext}`

  systemPrompt += `\n\nUI behavior (important): platform tool results are rendered as visual cards inside the chat automatically — do not repeat listing details, prices, or URLs from platform tools in your text, and never paste raw links. After results arrive, give a short expert take (2-4 sentences): which option you'd pick and why, what to watch out for. If a tool result says "fallback:true", the cards are pre-filled live searches or featured platform lots — present them naturally as the best places to look; never apologize or mention feeds being down.`

  const convo: any[] = [...messages]
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: any) => {
        const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
        controller.enqueue(encoder.encode(`data: ${body}\n\n`))
      }
      const sendText = (text: string) => send({ choices: [{ delta: { content: text } }] })

      try {
        for (let round = 0; round < 5; round++) {
          const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': process.env.ANTHROPIC_API_KEY!,
              'anthropic-version': '2023-06-01',
              'content-type': 'application/json',
            },
            body: JSON.stringify({
              model: 'claude-sonnet-4-5',
              max_tokens: 2048,
              system: systemPrompt,
              messages: convo,
              tools: TOOLS,
              stream: true,
            }),
          })

          if (!res.ok || !res.body) {
            const err = await res.text().catch(() => '')
            sendText(`\n[!] AI service error (${res.status}). ${err.slice(0, 160)}`)
            break
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buf = ''
          let stopReason: string | null = null
          // Accumulate assistant content blocks for the tool loop
          const blocks: any[] = []

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += decoder.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() ?? ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const data = line.slice(6).trim()
              if (!data) continue
              let ev: any
              try { ev = JSON.parse(data) } catch { continue }

              if (ev.type === 'content_block_start') {
                const cb = ev.content_block
                if (cb.type === 'tool_use') {
                  blocks[ev.index] = { type: 'tool_use', id: cb.id, name: cb.name, _json: '' }
                } else if (cb.type === 'text') {
                  blocks[ev.index] = { type: 'text', text: '' }
                } else {
                  blocks[ev.index] = { type: cb.type, _skip: true }
                }
              } else if (ev.type === 'content_block_delta') {
                const d = ev.delta
                const blk = blocks[ev.index]
                if (d.type === 'text_delta') {
                  if (blk && blk.type === 'text') blk.text += d.text
                  send({ choices: [{ delta: { content: d.text } }] })
                } else if (d.type === 'input_json_delta' && blk && blk.type === 'tool_use') {
                  blk._json += d.partial_json
                }
              } else if (ev.type === 'message_delta') {
                if (ev.delta?.stop_reason) stopReason = ev.delta.stop_reason
              }
            }
          }

          const toolUses = blocks.filter(b => b && b.type === 'tool_use')

          if (stopReason !== 'tool_use' || toolUses.length === 0) break

          send({ rc_status: toolUses.map(t => RC_STATUS_NAMES[t.name] ?? t.name) })

          // Reconstruct the assistant turn (text + tool_use blocks only)
          const assistantContent: any[] = []
          for (const b of blocks) {
            if (!b || b._skip) continue
            if (b.type === 'text' && b.text) assistantContent.push({ type: 'text', text: b.text })
            if (b.type === 'tool_use') {
              let input: any = {}
              try { input = JSON.parse(b._json || '{}') } catch {}
              b._input = input
              assistantContent.push({ type: 'tool_use', id: b.id, name: b.name, input })
            }
          }
          convo.push({ role: 'assistant', content: assistantContent })

          const results = await Promise.all(toolUses.map(async (tu) => {
            const r = await execTool(tu.name, tu._input ?? {}, origin)
            return { tu, r }
          }))

          const toolResults: any[] = []
          for (const { tu, r } of results) {
            if (r.cards.length) send({ rc_cards: r.cards, rc_tool: RC_STATUS_NAMES[tu.name] ?? tu.name })
            toolResults.push({ type: 'tool_result', tool_use_id: tu.id, content: r.model })
          }
          convo.push({ role: 'user', content: toolResults })
        }
      } catch {
        sendText('\n[!] Connection issue - please try again.')
      }

      send('[DONE]')
      controller.close()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  })
}
