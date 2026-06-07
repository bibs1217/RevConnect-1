'use client'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────
interface Listing {
  id: string
  itemId: string
  title: string
  price: number
  location: string
  photo: string | null
  listing_url: string
  listing_type: string
  condition: string
  seller: string
  source: string
}

interface Filters {
  make: string; model: string
  yearMin: string; yearMax: string
  priceMin: string; priceMax: string
  mileageMax: string; zip: string; radius: string
}

interface SiteDef {
  name: string
  emoji: string
  color: string
  url: (f: Filters) => string
}

interface SiteCategory {
  label: string
  sites: SiteDef[]
}

// ── Colors ────────────────────────────────────────────────────────────────────
const BG     = '#1B2A3E'
const CARD   = '#152234'
const RED    = '#CC0000'
const BLUE2  = '#2255EE'
const GOLD   = '#FFD700'
const INPUT  = '#0E1825'
const BORDER = '#2A3F5A'
const TEXT   = '#E8EDF2'
const MUTED  = '#7A9BBD'

// ── URL helpers ───────────────────────────────────────────────────────────────
function qp(pairs: [string, string | undefined][]): string {
  return pairs
    .filter(([, v]) => v && v.trim() !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(v!.trim())}`)
    .join('&')
}

function slug(s: string) { return s.toLowerCase().replace(/\s+/g, '-') }
function lower(s: string) { return s.toLowerCase() }

// ── External site definitions ─────────────────────────────────────────────────
const SITE_CATEGORIES: SiteCategory[] = [
  {
    label: '🛒 Major Marketplaces',
    sites: [
      {
        name: 'CarGurus', emoji: '🔍', color: '#FF6600',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const parts = ['d2', 'listingType%3Dused']
          if (make)      parts.push(`make%3D${make}`)
          if (model)     parts.push(`model%3D${model}`)
          if (yearMin)   parts.push(`minYear%3D${yearMin}`)
          if (yearMax)   parts.push(`maxYear%3D${yearMax}`)
          if (priceMax)  parts.push(`maxPrice%3D${priceMax}`)
          if (mileageMax) parts.push(`maxMileage%3D${mileageMax}`)
          if (zip)       { parts.push(`zip%3D${zip}`); parts.push(`distance%3D${radius}`) }
          return `https://www.cargurus.com/Cars/new/nl#listing=${parts.join('%7C')}`
        },
      },
      {
        name: 'AutoTrader', emoji: '🚘', color: '#0066CC',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const base = make && model
            ? `https://www.autotrader.com/cars-for-sale/used-cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
            : 'https://www.autotrader.com/cars-for-sale/used-cars'
          const q = qp([['startYear', yearMin], ['endYear', yearMax], ['maxPrice', priceMax], ['maxMileage', mileageMax], ['zip', zip], ['searchRadius', zip ? radius : undefined]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'Cars.com', emoji: '🚗', color: '#00A651',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const parts: string[] = ['stock_type=used']
          if (make)      parts.push(`makes[]=${encodeURIComponent(lower(make))}`)
          if (model)     parts.push(`models[]=${encodeURIComponent(slug(`${make} ${model}`))}`)
          if (yearMin)   parts.push(`year_min=${yearMin}`)
          if (yearMax)   parts.push(`year_max=${yearMax}`)
          if (priceMax)  parts.push(`price_max=${priceMax}`)
          if (mileageMax) parts.push(`mileage_max=${mileageMax}`)
          if (zip)       { parts.push(`zip=${zip}`); parts.push(`maximum_distance=${radius}`) }
          return `https://www.cars.com/shopping/results/?${parts.join('&')}`
        },
      },
      {
        name: 'CarMax', emoji: '🏪', color: '#CC0000',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip }) => {
          const base = make && model
            ? `https://www.carmax.com/cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
            : 'https://www.carmax.com/cars'
          const q = qp([['year-min', yearMin], ['year-max', yearMax], ['price-max', priceMax], ['miles-max', mileageMax], ['zip', zip]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'Carvana', emoji: '🏎️', color: '#00A884',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip }) => {
          const base = make && model
            ? `https://www.carvana.com/cars/${encodeURIComponent(slug(`${make} ${model}`.trim()))}`.replace(/%20/g, '-')
            : 'https://www.carvana.com/cars'
          const q = qp([['year-min', yearMin], ['year-max', yearMax], ['price-max', priceMax], ['maximum-mileage', mileageMax], ['zip', zip]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'Vroom', emoji: '⚡', color: '#003087',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax }) => {
          const q = qp([['make', make], ['model', model], ['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['miles_max', mileageMax]])
          return `https://www.vroom.com/cars?${q}`
        },
      },
      {
        name: 'TrueCar', emoji: '✅', color: '#00A550',
        url: ({ make, model, yearMin, yearMax, priceMin, priceMax, mileageMax, zip }) => {
          const base = make && model
            ? `https://www.truecar.com/used-cars-for-sale/listings/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/`
            : 'https://www.truecar.com/used-cars-for-sale/listings/'
          const parts: string[] = []
          if (yearMin && yearMax) parts.push(`year[]=${yearMin}..${yearMax}`)
          else if (yearMin) parts.push(`year[]=${yearMin}..`)
          else if (yearMax) parts.push(`year[]=..${yearMax}`)
          if (priceMin && priceMax) parts.push(`price[]=${priceMin}..${priceMax}`)
          else if (priceMax) parts.push(`price[]=0..${priceMax}`)
          if (mileageMax) parts.push(`mileage[]=0..${mileageMax}`)
          if (zip) parts.push(`location=${zip}`)
          return parts.length ? `${base}?${parts.join('&')}` : base
        },
      },
      {
        name: 'Kelley Blue Book', emoji: '📖', color: '#005BAC',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip }) => {
          const base = make && model
            ? `https://www.kbb.com/cars-for-sale/used-cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/`
            : 'https://www.kbb.com/cars-for-sale/used-cars/'
          const q = qp([['zip', zip], ['mileage', mileageMax], ['maxPrice', priceMax], ['minYear', yearMin], ['maxYear', yearMax]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'Edmunds', emoji: '🏅', color: '#4A154B',
        url: ({ make, model, yearMin, yearMax, priceMax, zip, radius }) => {
          const base = make && model
            ? `https://www.edmunds.com/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/used/`
            : 'https://www.edmunds.com/used-cars-for-sale/'
          const q = qp([['zip', zip], ['radius', zip ? radius : undefined], ['price', priceMax], ['year_min', yearMin], ['year_max', yearMax]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'iSeeCars', emoji: '👁️', color: '#003366',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const base = make && model
            ? `https://www.iseecars.com/used-cars/used-${encodeURIComponent(slug(`${make} ${model}`))}-for-sale`
            : 'https://www.iseecars.com/used-cars-for-sale'
          const parts: string[] = []
          if (yearMin)   parts.push(`year_min=${yearMin}`)
          if (yearMax)   parts.push(`year_max=${yearMax}`)
          if (priceMax)  parts.push(`price_max=${priceMax}`)
          if (mileageMax) parts.push(`mileage_max=${mileageMax}`)
          if (zip)       { parts.push(`zip=${zip}`); parts.push(`radius=${radius}`) }
          return parts.length ? `${base}#${parts.join('&')}` : base
        },
      },
      {
        name: 'CarsDirect', emoji: '🎯', color: '#FF4500',
        url: ({ make, model, yearMin, yearMax, priceMax, zip }) => {
          const q = qp([['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['zip', zip]])
          const kw = [make, model].filter(Boolean).join('+')
          return `https://www.carsdirect.com/used-cars/${encodeURIComponent(kw)}?${q}`
        },
      },
      {
        name: 'AutoList', emoji: '📋', color: '#1565C0',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const q = qp([['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['mileage_max', mileageMax], ['zip', zip], ['radius', zip ? radius : undefined]])
          const kw = encodeURIComponent(`${make} ${model}`.trim())
          return `https://www.autolist.com/listings#query=${kw}&${q}`
        },
      },
      {
        name: 'OfferUp', emoji: '💬', color: '#00C853',
        url: ({ make, model, zip }) => {
          const q = qp([['q', [make, model].filter(Boolean).join(' ')], ['zip', zip]])
          return `https://offerup.com/search/?${q}`
        },
      },
      {
        name: 'Facebook Marketplace', emoji: '👥', color: '#1877F2',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const kw = encodeURIComponent(`${make} ${model}`.trim())
          const q = qp([['minYear', yearMin], ['maxYear', yearMax], ['maxPrice', priceMax], ['maxMileage', mileageMax], ['zip', zip], ['radius', zip ? radius : undefined]])
          return `https://www.facebook.com/marketplace/vehicles?query=${kw}&${q}`
        },
      },
      {
        name: 'Craigslist', emoji: '📌', color: '#6B4C9A',
        url: ({ make, model, yearMin, yearMax, mileageMax, priceMax }) => {
          const q = qp([['auto_make_model', [make, model].filter(Boolean).join(' ')], ['min_auto_year', yearMin], ['max_auto_year', yearMax], ['max_auto_miles', mileageMax], ['max_price', priceMax]])
          return `https://www.craigslist.org/search/cta?${q}`
        },
      },
      {
        name: 'AutoTempest', emoji: '🌪️', color: '#555555',
        url: ({ make, model, yearMin, yearMax, priceMax, mileageMax, zip, radius }) => {
          const q = qp([['make', make], ['model', model], ['zip', zip], ['radius', zip ? radius : undefined], ['minyear', yearMin], ['maxyear', yearMax], ['maxprice', priceMax], ['maxmiles', mileageMax]])
          return `https://www.autotempest.com/results?${q}`
        },
      },
    ],
  },
  {
    label: '🔨 Auctions',
    sites: [
      {
        name: 'Copart', emoji: '⚙️', color: '#003087',
        url: ({ make, model, yearMin, yearMax }) => {
          const q = qp([['free-form-search', [make, model].filter(Boolean).join(' ')], ['from-year', yearMin], ['to-year', yearMax]])
          return `https://www.copart.com/vehicleFinder/?${q}`
        },
      },
      {
        name: 'IAAI', emoji: '🔧', color: '#CC0000',
        url: ({ make, model, yearMin, yearMax }) => {
          const q = qp([['SearchParameters.YearFrom', yearMin], ['SearchParameters.YearTo', yearMax], ['SearchParameters.Query', [make, model].filter(Boolean).join(' ')]])
          return `https://www.iaai.com/Search?${q}`
        },
      },
      {
        name: 'Bring a Trailer', emoji: '🏁', color: '#1B7A3E',
        url: ({ make, model }) => {
          const s = encodeURIComponent([make, model].filter(Boolean).join(' '))
          return `https://bringatrailer.com/search/?s=${s}`
        },
      },
      {
        name: 'Cars and Bids', emoji: '🏆', color: '#FF6600',
        url: ({ make, model }) => {
          const q = encodeURIComponent([make, model].filter(Boolean).join(' '))
          return `https://carsandbids.com/search#q=${q}`
        },
      },
      {
        name: 'Mecum', emoji: '🎪', color: '#CC0000',
        url: ({ make, model }) => {
          const q = encodeURIComponent([make, model].filter(Boolean).join(' '))
          return `https://www.mecum.com/lots/search/?search=${q}`
        },
      },
      {
        name: 'AutoBidMaster', emoji: '💼', color: '#0066CC',
        url: ({ make, model, yearMin, yearMax }) => {
          const q = qp([['search', [make, model].filter(Boolean).join(' ')], ['year_from', yearMin], ['year_to', yearMax]])
          return `https://www.autobidmaster.com/carfinder/list/?${q}`
        },
      },
    ],
  },
  {
    label: '🏭 Manufacturer Certified Pre-Owned',
    sites: [
      {
        name: 'Ford CPO', emoji: '🔵', color: '#003087',
        url: ({ model, yearMin, yearMax, zip, radius }) => {
          const q = qp([['Make', 'Ford'], ['Model', model], ['Year_Min', yearMin], ['Year_Max', yearMax], ['Zip', zip], ['Radius', zip ? radius : undefined]])
          return `https://www.ford.com/buy/used-inventory/results/?${q}`
        },
      },
      {
        name: 'Chevrolet CPO', emoji: '🏅', color: '#C9A84C',
        url: ({ yearMin, yearMax, zip }) => {
          const q = qp([['zip', zip], ['modelYear[]', yearMin], ['modelYear[]', yearMax]])
          return `https://www.chevrolet.com/certified-pre-owned/search?${q}`
        },
      },
      {
        name: 'Toyota CPO', emoji: '🔴', color: '#CC0000',
        url: ({ model, zip, radius }) => {
          const q = qp([['zipcode', zip], ['distance', zip ? radius : undefined]])
          const m = model ? encodeURIComponent(lower(model)) : 'all'
          return `https://www.toyota.com/search-inventory/model/${m}?${q}`
        },
      },
      {
        name: 'Honda CPO', emoji: '🔴', color: '#CC0000',
        url: ({ model, zip }) => {
          const q = qp([['zip', zip], ['model', model]])
          return `https://www.honda.com/certified-inventory?${q}`
        },
      },
      {
        name: 'Nissan CPO', emoji: '🔴', color: '#CC0000',
        url: ({ zip }) => `https://www.nissanusa.com/certified-pre-owned.html${zip ? `#zip=${zip}` : ''}`,
      },
      {
        name: 'Hyundai CPO', emoji: '🔵', color: '#003087',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.hyundaiusa.com/us/en/certified-pre-owned?${q}`
        },
      },
      {
        name: 'Kia CPO', emoji: '🔴', color: '#CC0000',
        url: ({ model, zip }) => {
          const q = qp([['zip', zip], ['model', model]])
          return `https://www.kia.com/us/en/inventory/result?${q}`
        },
      },
      {
        name: 'Subaru CPO', emoji: '🔵', color: '#003087',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.subaru.com/shopping/build.html?${q}`
        },
      },
      {
        name: 'Mazda CPO', emoji: '🔴', color: '#CC0000',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.mazdausa.com/certified-pre-owned?${q}`
        },
      },
      {
        name: 'Dodge CPO', emoji: '🔴', color: '#CC0000',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.dodge.com/en/shopping/inventory.html?${q}`
        },
      },
      {
        name: 'Jeep CPO', emoji: '🟢', color: '#00A550',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.jeep.com/en/shopping/inventory.html?${q}`
        },
      },
      {
        name: 'Ram CPO', emoji: '🔴', color: '#CC0000',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.ramtrucks.com/en/shopping/inventory.html?${q}`
        },
      },
      {
        name: 'BMW CPO', emoji: '🔵', color: '#003087',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.bmwusa.com/certified-center-vehicles.html?${q}`
        },
      },
      {
        name: 'Mercedes CPO', emoji: '⭐', color: '#555555',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.mbusa.com/en/cpo?${q}`
        },
      },
      {
        name: 'Audi CPO', emoji: '🔘', color: '#333333',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.audiusa.com/us/web/en/models/certified-pre-owned.html?${q}`
        },
      },
      {
        name: 'Lexus CPO', emoji: '🏷️', color: '#333333',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.lexus.com/certified-pre-owned/?${q}`
        },
      },
      {
        name: 'Infiniti CPO', emoji: '♾️', color: '#222222',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.infinitiusa.com/certified-pre-owned?${q}`
        },
      },
      {
        name: 'Acura CPO', emoji: '🔴', color: '#8B0000',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.acura.com/certified-pre-owned?${q}`
        },
      },
      {
        name: 'Volvo CPO', emoji: '🔵', color: '#003087',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.volvocars.com/en-us/certified-pre-owned?${q}`
        },
      },
      {
        name: 'Porsche CPO', emoji: '🥇', color: '#C9A84C',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.porsche.com/usa/modelstart/all/?modelrange=all&${q}`
        },
      },
    ],
  },
  {
    label: '🏺 Specialty & Classic',
    sites: [
      {
        name: 'Hemmings', emoji: '🏛️', color: '#8B4513',
        url: ({ make, model, yearMin, yearMax, priceMax, zip, radius }) => {
          const base = make && model
            ? `https://www.hemmings.com/classifieds/cars-for-sale/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
            : 'https://www.hemmings.com/classifieds/cars-for-sale'
          const q = qp([['year1', yearMin], ['year2', yearMax], ['price2', priceMax], ['zip', zip], ['distance', zip ? radius : undefined]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'ClassicCars.com', emoji: '🚙', color: '#8B0000',
        url: ({ make, model, yearMin, yearMax, zip }) => {
          const base = make && model
            ? `https://classiccars.com/listings/find/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
            : 'https://classiccars.com/listings'
          const q = qp([['year_from', yearMin], ['year_to', yearMax], ['zip', zip]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'AutoZin', emoji: '🔎', color: '#0066CC',
        url: ({ make, model, yearMin, yearMax, priceMax, zip }) => {
          const base = make && model
            ? `https://www.autozin.com/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}/`
            : 'https://www.autozin.com/'
          const q = qp([['zip', zip], ['min_year', yearMin], ['max_year', yearMax], ['max_price', priceMax]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'CarBrain', emoji: '🧠', color: '#FF6600',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://carbrain.com/?${q}`
        },
      },
      {
        name: 'Peddle', emoji: '💰', color: '#00A550',
        url: ({ zip }) => {
          const q = qp([['zip', zip]])
          return `https://www.peddle.com/?${q}`
        },
      },
    ],
  },
  {
    label: '🏬 Dealer Networks',
    sites: [
      {
        name: 'AutoNation', emoji: '🏢', color: '#003087',
        url: ({ make, model, yearMin, yearMax, priceMax, zip, radius }) => {
          const q = qp([['make', make], ['model', model], ['yearMin', yearMin], ['yearMax', yearMax], ['priceMax', priceMax], ['zip', zip], ['radius', zip ? radius : undefined]])
          return `https://www.autonation.com/used-cars-for-sale?${q}`
        },
      },
      {
        name: 'DriveTime', emoji: '🏎️', color: '#FF6600',
        url: ({ make, model, yearMin, yearMax, priceMax, zip }) => {
          const base = make && model
            ? `https://www.drivetime.com/cars/${encodeURIComponent(lower(make))}/${encodeURIComponent(lower(model))}`
            : 'https://www.drivetime.com/cars'
          const q = qp([['zipCode', zip], ['maxYear', yearMax], ['minYear', yearMin], ['maxPrice', priceMax]])
          return q ? `${base}?${q}` : base
        },
      },
      {
        name: 'Hendrick Cars', emoji: '🏁', color: '#CC0000',
        url: ({ make, model, yearMin, yearMax, priceMax, zip, radius }) => {
          const q = qp([['make', make], ['model', model], ['year_min', yearMin], ['year_max', yearMax], ['price_max', priceMax], ['zip', zip], ['radius', zip ? radius : undefined]])
          return `https://www.hendrickcars.com/used-inventory/?${q}`
        },
      },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function CarSearchPage() {
  const [filters, setFilters] = useState<Filters>({
    make: '', model: '', yearMin: '', yearMax: '',
    priceMin: '', priceMax: '', mileageMax: '',
    zip: '', radius: '250',
  })
  const [listings, setListings]   = useState<Listing[]>([])
  const [total, setTotal]         = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage]           = useState(1)
  const [loading, setLoading]     = useState(false)
  const [searched, setSearched]   = useState(false)
  const [error, setError]         = useState('')
  const [geoLoading, setGeoLoading] = useState(false)
  const [lastFilters, setLastFilters] = useState<Filters | null>(null)

  function setF(k: keyof Filters, v: string) {
    setFilters(f => ({ ...f, [k]: v }))
  }

  async function runSearch(pageNum: number, filtersToUse?: Filters) {
    const f = filtersToUse ?? filters
    setLoading(true)
    setPage(pageNum)
    setError('')

    const p = new URLSearchParams()
    if (f.make)       p.set('make',       f.make.trim())
    if (f.model)      p.set('model',      f.model.trim())
    if (f.yearMin)    p.set('yearMin',    f.yearMin.replace(/\D/g, ''))
    if (f.yearMax)    p.set('yearMax',    f.yearMax.replace(/\D/g, ''))
    if (f.priceMin)   p.set('priceMin',   f.priceMin.replace(/\D/g, ''))
    if (f.priceMax)   p.set('priceMax',   f.priceMax.replace(/\D/g, ''))
    if (f.mileageMax) p.set('mileageMax', f.mileageMax.replace(/\D/g, ''))
    const cleanZip = f.zip.replace(/\D/g, '')
    if (cleanZip && f.radius !== 'nationwide') { p.set('zip', cleanZip); p.set('radius', f.radius) }
    p.set('page', String(pageNum))

    try {
      const res  = await fetch(`/api/car-search?${p}`, { cache: 'no-store' })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setListings([])
      } else {
        setListings(data.listings ?? [])
        setTotal(data.total ?? 0)
        setTotalPages(data.totalPages ?? 1)
        setPage(data.page ?? pageNum)
        setLastFilters({ ...f, zip: cleanZip })
        setSearched(true)
      }
    } catch {
      setError('Search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    runSearch(1)
  }

  async function useMyLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res  = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&localityLanguage=en`)
        const data = await res.json()
        if (data.postcode) setF('zip', data.postcode)
      } catch { /* ignore */ }
      finally { setGeoLoading(false) }
    }, () => setGeoLoading(false))
  }

  const monthly = (price: number) => price ? `$${Math.round(price / 60 * 1.05).toLocaleString()}/mo` : ''

  const inp: React.CSSProperties = {
    background: INPUT, border: `1px solid ${BORDER}`, borderRadius: 6,
    color: TEXT, padding: '8px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = {
    color: MUTED, fontSize: 11, marginBottom: 4, display: 'block',
    textTransform: 'uppercase', letterSpacing: 1,
  }

  // Build external site links from last searched filters
  const siteFilters: Filters = lastFilters ?? {
    make: filters.make, model: filters.model,
    yearMin: filters.yearMin.replace(/\D/g, ''),
    yearMax: filters.yearMax.replace(/\D/g, ''),
    priceMin: filters.priceMin.replace(/\D/g, ''),
    priceMax: filters.priceMax.replace(/\D/g, ''),
    mileageMax: filters.mileageMax.replace(/\D/g, ''),
    zip: filters.zip.replace(/\D/g, ''),
    radius: filters.radius,
  }

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Header ── */}
      <div style={{ background: '#0E1825', borderBottom: `1px solid ${BORDER}`, padding: '14px 24px' }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>
          <span style={{ color: RED }}>Rev</span>Connect Car Search
        </h1>
        <div style={{ color: MUTED, fontSize: 12, marginTop: 3 }}>
          Live listings from eBay Motors · Direct links to 50+ car sites
        </div>
      </div>

      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '20px 16px' }}>

        {/* ── Search form ── */}
        <form onSubmit={handleSearch}>
          <div style={{ background: CARD, borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={lbl}>Make</label>
                <input value={filters.make} onChange={e => setF('make', e.target.value)}
                  placeholder="Ford" style={inp} />
              </div>
              <div>
                <label style={lbl}>Model</label>
                <input value={filters.model} onChange={e => setF('model', e.target.value)}
                  placeholder="Mustang" style={inp} />
              </div>
              <div>
                <label style={lbl}>Year Min</label>
                <input value={filters.yearMin} onChange={e => setF('yearMin', e.target.value)}
                  placeholder="2011" style={inp} />
              </div>
              <div>
                <label style={lbl}>Year Max</label>
                <input value={filters.yearMax} onChange={e => setF('yearMax', e.target.value)}
                  placeholder="2024" style={inp} />
              </div>
              <div>
                <label style={lbl}>Price Min</label>
                <input value={filters.priceMin} onChange={e => setF('priceMin', e.target.value)}
                  placeholder="5000" style={inp} />
              </div>
              <div>
                <label style={lbl}>Price Max</label>
                <input value={filters.priceMax} onChange={e => setF('priceMax', e.target.value)}
                  placeholder="30000" style={inp} />
              </div>
              <div>
                <label style={lbl}>Max Miles</label>
                <input value={filters.mileageMax} onChange={e => setF('mileageMax', e.target.value)}
                  placeholder="80000" style={inp} />
              </div>
              <div>
                <label style={lbl}>ZIP Code</label>
                <div style={{ display: 'flex', gap: 5 }}>
                  <input value={filters.zip} onChange={e => setF('zip', e.target.value)}
                    placeholder="34698" maxLength={5} style={{ ...inp, flex: 1 }} />
                  <button type="button" onClick={useMyLocation} disabled={geoLoading}
                    style={{ background: INPUT, border: `1px solid ${BORDER}`, color: MUTED, borderRadius: 6, padding: '0 9px', cursor: 'pointer', fontSize: 14, flexShrink: 0 }}>
                    {geoLoading ? '…' : '📍'}
                  </button>
                </div>
              </div>
              <div>
                <label style={lbl}>Radius</label>
                <select value={filters.radius} onChange={e => setF('radius', e.target.value)} style={inp as React.CSSProperties}>
                  <option value="nationwide">Nationwide</option>
                  {['50','100','150','250','500'].map(r => <option key={r} value={r}>{r} mi</option>)}
                </select>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button type="submit" disabled={loading}
                style={{ background: loading ? BORDER : RED, color: '#fff', border: 'none', borderRadius: 8, padding: '10px 36px', fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Searching…' : 'Search eBay Motors'}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div style={{ background: '#3A1010', border: `1px solid ${RED}`, borderRadius: 8, padding: '12px 16px', marginBottom: 16, color: '#FF8080', fontSize: 14 }}>
            {error}
          </div>
        )}

        {/* ── eBay Results ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: MUTED }}>
            <div style={{ fontSize: 36, marginBottom: 10 }}>⏳</div>
            <div style={{ fontSize: 16 }}>Searching eBay Motors…</div>
          </div>
        )}

        {searched && !loading && (
          <div style={{ marginBottom: 28 }}>
            {/* Status bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{listings.length.toLocaleString()} eBay results</span>
              <span style={{ color: MUTED, fontSize: 13 }}>
                {total.toLocaleString()} total · Page {page} of {totalPages}
              </span>
              <span style={{ background: '#3A1A1A', color: '#FF8080', fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700 }}>
                eBay Motors
              </span>
            </div>

            {/* Cards */}
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: MUTED, background: CARD, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 16, color: TEXT, marginBottom: 6 }}>No eBay listings found</div>
                <div style={{ fontSize: 13 }}>Try adjusting your filters. Use the site buttons below to search elsewhere.</div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(270px,1fr))', gap: 14, marginBottom: 18 }}>
                {listings.map(l => (
                  <div key={l.id}
                    style={{ background: CARD, borderRadius: 10, overflow: 'hidden', border: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
                    {/* Photo */}
                    <div style={{ position: 'relative', height: 175, background: INPUT, flexShrink: 0 }}>
                      {l.photo ? (
                        <img src={l.photo} alt={l.title}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: MUTED, fontSize: 40 }}>🚗</div>
                      )}
                      {/* eBay badge */}
                      <span style={{ position: 'absolute', top: 8, left: 8, background: '#E43137', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                        eBay{l.listing_type === 'Auction' ? ' AUCTION' : ''}
                      </span>
                    </div>

                    {/* Info */}
                    <div style={{ padding: '10px 13px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: TEXT, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {l.title}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                        <span style={{ fontSize: 20, fontWeight: 700, color: l.price > 0 ? GOLD : MUTED }}>
                          {l.price > 0 ? `$${l.price.toLocaleString()}` : 'See listing'}
                        </span>
                        {l.price > 0 && <span style={{ color: MUTED, fontSize: 12 }}>{monthly(l.price)}</span>}
                      </div>

                      {l.condition && (
                        <div style={{ fontSize: 12, color: MUTED }}>{l.condition}</div>
                      )}

                      <div style={{ display: 'flex', gap: 10, fontSize: 12, color: MUTED, flexWrap: 'wrap' }}>
                        {l.location && <span>📍 {l.location}</span>}
                        {l.seller   && <span>👤 {l.seller}</span>}
                      </div>

                      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                        <a href={l.listing_url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'block', background: '#E43137', color: '#fff', padding: '7px 0', borderRadius: 6, textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>
                          View on eBay ↗
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '8px 0', marginBottom: 4 }}>
                <button
                  disabled={page <= 1 || loading}
                  onClick={() => runSearch(page - 1, lastFilters ?? filters)}
                  style={{ background: page <= 1 ? INPUT : BLUE2, color: page <= 1 ? MUTED : '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 22px', cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                  ← Previous
                </button>
                <span style={{ color: TEXT, fontWeight: 600, fontSize: 14 }}>Page {page} of {totalPages}</span>
                <button
                  disabled={page >= totalPages || loading}
                  onClick={() => runSearch(page + 1, lastFilters ?? filters)}
                  style={{ background: page >= totalPages ? INPUT : BLUE2, color: page >= totalPages ? MUTED : '#fff', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 22px', cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14 }}>
                  Next →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Search These Sites ── */}
        <div style={{ background: CARD, borderRadius: 12, padding: '18px 20px', border: `1px solid ${BORDER}` }}>
          <h2 style={{ margin: '0 0 6px 0', fontSize: 17, fontWeight: 700 }}>Search These Sites With Your Filters</h2>
          <p style={{ margin: '0 0 20px 0', color: MUTED, fontSize: 13 }}>
            {searched
              ? 'Each button opens that site in a new tab with your current search filters pre-filled.'
              : 'Enter filters above and search, or click any button to browse that site now.'}
          </p>

          {SITE_CATEGORIES.map(cat => (
            <div key={cat.label} style={{ marginBottom: 22 }}>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                {cat.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 8 }}>
                {cat.sites.map(site => {
                  let href = '#'
                  try { href = site.url(siteFilters) } catch { /* skip */ }
                  return (
                    <a
                      key={site.name}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '11px 13px',
                        background: `${site.color}16`,
                        border: `1px solid ${site.color}55`,
                        borderLeft: `3px solid ${site.color}`,
                        borderRadius: 8,
                        color: TEXT,
                        fontSize: 13,
                        fontWeight: 600,
                        textDecoration: 'none',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        minHeight: 44,
                      }}
                    >
                      <span style={{ fontSize: 16, flexShrink: 0 }}>{site.emoji}</span>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{site.name}</span>
                    </a>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ── Empty start state ── */}
        {!searched && !loading && (
          <div style={{ textAlign: 'center', padding: '36px 0 20px', color: MUTED }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>🔍</div>
            <div style={{ fontSize: 18, color: TEXT, marginBottom: 6 }}>Enter make and model to search eBay Motors</div>
            <div style={{ fontSize: 13 }}>Or scroll down and click any site button to browse directly.</div>
          </div>
        )}

      </div>
    </div>
  )
}
