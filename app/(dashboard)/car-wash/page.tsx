'use client'
import { useState } from 'react'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const STATE_NAMES: Record<string,string> = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' }

const WASH_TYPES = [
  { value:'any',              label:'All Types' },
  { value:'mobile_detailer',  label:'Mobile Detailer' },
  { value:'hand_wash',        label:'Hand Wash' },
  { value:'tunnel_touchless', label:'Touchless Tunnel' },
  { value:'tunnel_soft',      label:'Soft Touch Tunnel' },
  { value:'self_serve',       label:'Self Serve' },
  { value:'full_detail',      label:'Full Detail Shop' },
]

const PRICE_COLOR: Record<string,string> = { '$':'#22c55e', '$$':'#FFD700', '$$$':'#f97316' }

const inp: React.CSSProperties = {
  background:'rgba(255,255,255,0.07)', border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:'0.5rem', color:'white', padding:'0.65rem 0.9rem',
  fontSize:'0.9rem', outline:'none', width:'100%', boxSizing:'border-box',
}
const lbl: React.CSSProperties = {
  fontSize:'0.65rem', color:'rgba(255,255,255,0.4)', display:'block',
  marginBottom:'0.3rem', textTransform:'uppercase', letterSpacing:'0.5px',
}

export default function CarWashPage() {
  const [city,      setCity]      = useState('')
  const [stateVal,  setStateVal]  = useState('FL')
  const [zip,       setZip]       = useState('')
  const [washType,  setWashType]  = useState('any')
  const [businesses, setBusinesses] = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false)
  const [error,     setError]     = useState('')

  async function handleSearch() {
    if (!city) { alert('Please enter a city.'); return }
    setLoading(true); setError(''); setBusinesses([])
    try {
      const params = new URLSearchParams({ city, state: stateVal, zip, wash_type: washType })
      const res = await fetch(`/api/car-wash-search?${params}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setBusinesses(data.businesses ?? [])
    } catch {
      setError('Search failed. Please try again.')
    }
    setLoading(false); setSearched(true)
  }

  /* platform links with pre-filled search */
  const searchQuery = encodeURIComponent(`${washType === 'mobile_detailer' ? 'mobile detailing' : washType === 'full_detail' ? 'auto detailing' : 'car wash'} ${city} ${stateVal}`)
  const platforms = [
    { name:'Google Maps',  emoji:'📍', url:`https://www.google.com/maps/search/${searchQuery}`,                                                                  desc:'Search on Google Maps' },
    { name:'Yelp',         emoji:'⭐', url:`https://www.yelp.com/search?find_desc=${encodeURIComponent(washType === 'mobile_detailer' ? 'mobile detailing' : 'car wash')}&find_loc=${encodeURIComponent(city + ' ' + stateVal)}`, desc:'Read reviews on Yelp' },
    { name:'Thumbtack',    emoji:'🔨', url:`https://www.thumbtack.com/k/mobile-car-detailing/near-me/?zip=${zip || ''}`,                                          desc:'Get quotes from detailers' },
    { name:'Angi',         emoji:'🔧', url:`https://www.angi.com/companylist/auto-detailing.htm?zip=${zip || ''}`,                                                desc:'Compare local detailers' },
  ]

  return (
    <div style={{ background:'#1B2A3E', minHeight:'100vh', color:'white', padding:'1.5rem', fontFamily:'system-ui,sans-serif' }}>

      {/* Header */}
      <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'0.4rem' }}>🚿 Car Wash Finder</h1>
      <p style={{ color:'rgba(255,255,255,0.4)', marginBottom:'1.75rem', fontSize:'0.9rem' }}>
        Find car washes and detailers near you — powered by AI
      </p>

      {/* Search Form */}
      <div style={{ background:'#243547', borderRadius:'1.25rem', padding:'1.5rem', marginBottom:'1.75rem', border:'1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(160px,1fr))', gap:'0.875rem', marginBottom:'1.1rem' }}>
          <div style={{ gridColumn:'span 2', minWidth:'160px' }}>
            <label style={lbl}>City *</label>
            <input style={inp} placeholder="Clearwater" value={city}
              onChange={e => setCity(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <div>
            <label style={lbl}>State</label>
            <select style={inp} value={stateVal} onChange={e => setStateVal(e.target.value)}>
              {US_STATES.map(s => <option key={s} value={s} style={{background:'#243547'}}>{s} — {STATE_NAMES[s]}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>ZIP Code</label>
            <input style={inp} placeholder="34698" value={zip} maxLength={5}
              onChange={e => setZip(e.target.value.replace(/\D/g,''))}
              onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          </div>
          <div>
            <label style={lbl}>Wash Type</label>
            <select style={inp} value={washType} onChange={e => setWashType(e.target.value)}>
              {WASH_TYPES.map(t => <option key={t.value} value={t.value} style={{background:'#243547'}}>{t.label}</option>)}
            </select>
          </div>
        </div>

        <button onClick={handleSearch} disabled={loading}
          style={{ background: loading ? 'rgba(204,0,0,0.5)' : '#CC0000', color:'white', border:'none', borderRadius:'0.875rem', padding:'0.8rem 2.5rem', fontWeight:700, fontSize:'1rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? '🔍 Searching...' : '🔍 Find Car Washes'}
        </button>
      </div>

      {/* Safety tip */}
      <div style={{ background:'rgba(255,215,0,0.05)', border:'1px solid rgba(255,215,0,0.12)', borderRadius:'0.875rem', padding:'0.8rem 1.1rem', marginBottom:'1.75rem', fontSize:'0.8rem', color:'rgba(255,255,255,0.45)' }}>
        💡 <strong style={{color:'#FFD700'}}>Coating tip:</strong> Soft-touch and brush tunnel washes can scratch ceramic coatings and PPF. Choose Touchless, Hand Wash, Mobile Detailer, or Full Detail if your car has any protective coating.
      </div>

      {/* Error */}
      {error && (
        <div style={{ background:'rgba(204,0,0,0.1)', border:'1px solid rgba(204,0,0,0.3)', borderRadius:'0.875rem', padding:'1rem', marginBottom:'1.5rem', color:'#f87171' }}>
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <>
          <div style={{ marginBottom:'1rem' }}>
            <h2 style={{ fontWeight:800, fontSize:'1.1rem', margin:0 }}>
              {businesses.length > 0
                ? `${businesses.length} results near ${city}, ${stateVal}`
                : `No results found near ${city}, ${stateVal}`}
            </h2>
            {businesses.length > 0 && (
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', marginTop:'0.25rem' }}>
                AI-generated list — verify details before visiting
              </p>
            )}
          </div>

          {businesses.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px,1fr))', gap:'1.1rem', marginBottom:'2.5rem' }}>
              {businesses.map((b, i) => (
                <div key={i} style={{ background:'#243547', borderRadius:'1rem', padding:'1.25rem', border:'1px solid rgba(255,255,255,0.07)' }}>
                  {/* Name + price */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.5rem', gap:'0.5rem' }}>
                    <h3 style={{ fontWeight:800, fontSize:'1rem', color:'white', margin:0, flex:1, lineHeight:1.3 }}>{b.name}</h3>
                    {b.price_range && (
                      <span style={{ fontWeight:800, color: PRICE_COLOR[b.price_range] ?? '#aaa', fontSize:'0.9rem', flexShrink:0 }}>
                        {b.price_range}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  {b.address && (
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.8rem', marginBottom:'0.25rem' }}>
                      📍 {b.address}{b.city && b.city !== city ? `, ${b.city}` : ''}, {b.state || stateVal}
                    </p>
                  )}

                  {/* Phone */}
                  {b.phone && (
                    <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.8rem', marginBottom:'0.25rem' }}>
                      📞 <a href={`tel:${b.phone}`} style={{ color:'#3399FF', textDecoration:'none' }}>{b.phone}</a>
                    </p>
                  )}

                  {/* Rating */}
                  {b.rating && (
                    <p style={{ color:'#FFD700', fontSize:'0.8rem', marginBottom:'0.6rem' }}>
                      ⭐ {b.rating} / 5
                    </p>
                  )}

                  {/* Description */}
                  {b.description && (
                    <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', lineHeight:1.5, marginBottom:'0.8rem' }}>
                      {b.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap' }}>
                    {b.website && b.website !== '' && (
                      <a href={b.website.startsWith('http') ? b.website : `https://${b.website}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ flex:1, background:'linear-gradient(135deg,#CC0000,#AA0000)', color:'white', padding:'0.55rem 0.75rem', borderRadius:'0.5rem', textDecoration:'none', textAlign:'center', fontWeight:700, fontSize:'0.8rem' }}>
                        Website →
                      </a>
                    )}
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(b.name + ' ' + (b.address || '') + ' ' + (b.city || city) + ' ' + (b.state || stateVal))}`}
                      target="_blank" rel="noopener noreferrer"
                      style={{ flex:1, background:'rgba(66,133,244,0.12)', color:'#4285f4', border:'1px solid rgba(66,133,244,0.2)', padding:'0.55rem 0.75rem', borderRadius:'0.5rem', textDecoration:'none', textAlign:'center', fontWeight:600, fontSize:'0.8rem' }}>
                      Google Maps
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Platform buttons */}
          <div style={{ marginBottom:'2rem' }}>
            <h2 style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'0.4rem' }}>🌐 Search These Platforms Too</h2>
            <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.78rem', marginBottom:'1rem' }}>
              Pre-filled with your search — opens in a new tab
            </p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:'0.875rem' }}>
              {platforms.map((p, i) => (
                <a key={i} href={p.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                  <div style={{ background:'#243547', borderRadius:'1rem', padding:'1.1rem', border:'1px solid rgba(255,255,255,0.07)', cursor:'pointer' }}>
                    <div style={{ fontSize:'1.5rem', marginBottom:'0.4rem' }}>{p.emoji}</div>
                    <p style={{ fontWeight:700, color:'white', fontSize:'0.9rem', margin:'0 0 0.2rem' }}>{p.name}</p>
                    <p style={{ color:'rgba(255,255,255,0.38)', fontSize:'0.75rem', margin:0 }}>{p.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Pre-search state */}
      {!searched && (
        <div style={{ textAlign:'center', padding:'3rem 1rem', background:'rgba(255,255,255,0.02)', borderRadius:'1.25rem', border:'1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize:'3rem', marginBottom:'1rem' }}>🚿</div>
          <h2 style={{ fontWeight:800, fontSize:'1.3rem', marginBottom:'0.5rem' }}>Find Car Washes Near You</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem', maxWidth:'420px', margin:'0 auto' }}>
            Enter your city and select a wash type to get an AI-powered list of real local businesses.
          </p>
        </div>
      )}
    </div>
  )
}
