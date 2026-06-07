'use client'
import { useState } from 'react'

const YEARS = Array.from({ length: 37 }, (_, i) => String(2026 - i))

const MAKES = [
  'Acura','Alfa Romeo','Audi','BMW','Buick','Cadillac','Chevrolet','Chrysler',
  'Dodge','Ferrari','Fiat','Ford','Genesis','GMC','Honda','Hyundai','Infiniti',
  'Jaguar','Jeep','Kia','Lamborghini','Land Rover','Lexus','Lincoln','Maserati',
  'Mazda','Mercedes-Benz','MINI','Mitsubishi','Nissan','Porsche','Ram',
  'Rolls-Royce','Subaru','Tesla','Toyota','Volkswagen','Volvo','Other',
]

const COVERAGE_TYPES = [
  { value: 'liability',     label: 'Liability Only' },
  { value: 'full_coverage', label: 'Full Coverage'  },
  { value: 'agreed_value',  label: 'Agreed Value'   },
  { value: 'classic_car',   label: 'Classic Car'    },
  { value: 'modified',      label: 'Modified Vehicle' },
  { value: 'track_day',     label: 'Track Day'      },
]

const CREDIT_OPTIONS = [
  { value: 'excellent', label: 'Excellent (750+)'   },
  { value: 'good',      label: 'Good (670–749)'     },
  { value: 'fair',      label: 'Fair (580–669)'     },
  { value: 'poor',      label: 'Poor (below 580)'   },
]

const DIRECT_LINKS = [
  { name: 'State Farm',          emoji: '🏠', type: 'Standard',    url: 'https://www.statefarm.com/insurance/auto',                              phone: '800-782-8332' },
  { name: 'Geico',               emoji: '🦎', type: 'Standard',    url: 'https://www.geico.com/auto-insurance/',                                 phone: '800-207-7847' },
  { name: 'Progressive',         emoji: '💙', type: 'Standard',    url: 'https://www.progressive.com/auto/',                                     phone: '888-671-4405' },
  { name: 'Allstate',            emoji: '🤝', type: 'Standard',    url: 'https://www.allstate.com/auto-insurance',                               phone: '877-810-2920' },
  { name: 'Nationwide',          emoji: '🌐', type: 'Standard',    url: 'https://www.nationwide.com/lc/resources/auto-insurance/quote',          phone: '877-669-6877' },
  { name: 'Liberty Mutual',      emoji: '🗽', type: 'Standard',    url: 'https://www.libertymutual.com/auto-insurance',                          phone: '800-290-8711' },
  { name: 'Travelers',           emoji: '☂️',  type: 'Standard',    url: 'https://www.travelers.com/auto-insurance',                              phone: '800-842-5075' },
  { name: 'Farmers',             emoji: '🌾', type: 'Standard',    url: 'https://www.farmers.com/auto/',                                         phone: '888-327-6335' },
  { name: 'Erie Insurance',      emoji: '🦅', type: 'Standard',    url: 'https://www.erieinsurance.com/auto-insurance',                          phone: '800-458-0811' },
  { name: 'USAA',                emoji: '🎖️', type: 'Military',    url: 'https://www.usaa.com/inet/wc/auto-insurance-products-overview',         phone: '800-531-8722' },
  { name: 'Root Insurance',      emoji: '📱', type: 'Online',      url: 'https://www.joinroot.com/',                                             phone: '866-980-9431' },
  { name: 'Hagerty',             emoji: '🏁', type: 'Enthusiast',  url: 'https://www.hagerty.com/insurance',                                     phone: '800-922-4050' },
  { name: 'Grundy',              emoji: '🔑', type: 'Enthusiast',  url: 'https://www.grundy.com/',                                               phone: '888-338-1175' },
  { name: 'American Collectors', emoji: '🏆', type: 'Collector',   url: 'https://www.americancollectors.com/',                                   phone: '800-360-2277' },
  { name: 'Heacock Classic',     emoji: '🚗', type: 'Collector',   url: 'https://www.heacockclassic.com/',                                       phone: '800-678-5027' },
  { name: 'JC Taylor',           emoji: '🔧', type: 'Collector',   url: 'https://www.jctaylor.com/',                                             phone: '800-345-8290' },
  { name: 'Condon Skelly',       emoji: '🏅', type: 'Collector',   url: 'https://www.condonskelly.com/',                                         phone: '800-257-9496' },
  { name: 'National General',    emoji: '⚡', type: 'Specialty',   url: 'https://www.nationalgeneral.com/',                                      phone: '888-293-5108' },
  { name: 'K&K Insurance',       emoji: '🏎️', type: 'Specialty',   url: 'https://www.kandkinsurance.com/',                                       phone: '888-554-4636' },
]

const TYPE_COLORS: Record<string,string> = {
  Enthusiast: '#CC0000', Collector: '#FFD700', Standard: '#3399FF',
  Military: '#22c55e', Online: '#a855f7', Specialty: '#F4A261',
}
const AM_COLORS: Record<string,string> = {
  'A++': '#22c55e', 'A+': '#22c55e', 'A': '#86efac', 'A-': '#FFD700', 'B+': '#F4A261',
}

const inp: React.CSSProperties = {
  width: '100%', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '0.5rem', color: 'white', padding: '0.65rem 0.9rem',
  fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box',
}
const lbl: React.CSSProperties = {
  fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', display: 'block',
  marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.5px',
}
const card: React.CSSProperties = {
  background: '#243547', borderRadius: '1rem', padding: '1.25rem',
  border: '1px solid rgba(255,255,255,0.07)',
}
const secHead: React.CSSProperties = {
  fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)',
  textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem', margin: '0 0 1rem',
}

export default function InsurancePage() {
  // Vehicle
  const [year,      setYear]      = useState('2020')
  const [make,      setMake]      = useState('')
  const [model,     setModel]     = useState('')
  const [vin,       setVin]       = useState('')
  const [mileage,   setMileage]   = useState('')
  const [use,       setUse]       = useState('pleasure')
  const [ownership, setOwnership] = useState('owned')
  const [modsValue, setModsValue] = useState('0')
  // Driver
  const [zip,        setZip]        = useState('')
  const [age,        setAge]        = useState('')
  const [experience, setExperience] = useState('')
  const [accidents,  setAccidents]  = useState(false)
  const [tickets,    setTickets]    = useState(false)
  const [credit,     setCredit]     = useState('good')
  // Coverage
  const [coverage, setCoverage] = useState('full_coverage')
  // Results
  const [carriers,  setCarriers]  = useState<any[]>([])
  const [loading,   setLoading]   = useState(false)
  const [searched,  setSearched]  = useState(false)
  const [error,     setError]     = useState('')
  const [compare,   setCompare]   = useState<string[]>([])
  const [selected,  setSelected]  = useState<any>(null)

  async function handleSearch() {
    if (!make) { alert('Please select a vehicle make'); return }
    if (!model) { alert('Please enter a vehicle model'); return }
    if (!zip) { alert('Please enter your ZIP code'); return }
    setLoading(true); setError(''); setCarriers([]); setCompare([])
    try {
      const params = new URLSearchParams({
        year, make, model, vin,
        mileage:    mileage    || '5000',
        use, ownership,
        mods_value: modsValue  || '0',
        zip,
        age:        age        || '35',
        experience: experience || '10',
        accidents:  String(accidents),
        tickets:    String(tickets),
        credit, coverage,
      })
      const res = await fetch(`/api/insurance-search?${params}`)
      const data = await res.json()
      if (data.error) setError(data.error)
      else setCarriers(data.carriers ?? [])
    } catch {
      setError('Search failed. Please try again.')
    }
    setLoading(false); setSearched(true)
  }

  const compareCarriers = carriers.filter(c => compare.includes(c.name))

  return (
    <div style={{ background: '#1B2A3E', minHeight: '100vh', color: 'white', padding: '1.5rem', fontFamily: 'system-ui,sans-serif' }}>

      {/* Header */}
      <h1 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.4rem' }}>🛡️ Insurance Quote Finder</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', marginBottom: '1.75rem', fontSize: '0.9rem' }}>
        AI-powered quotes from enthusiast specialists + all major carriers
      </p>

      {/* Modified vehicle warning */}
      <div style={{ background: 'rgba(204,0,0,0.06)', border: '1px solid rgba(204,0,0,0.15)', borderRadius: '0.875rem', padding: '0.875rem 1rem', marginBottom: '1.75rem', display: 'flex', gap: '0.75rem' }}>
        <span style={{ color: '#CC0000', flexShrink: 0 }}>⚠️</span>
        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          <strong style={{ color: '#CC0000' }}>Modified vehicles need enthusiast coverage.</strong>{' '}
          Standard policies (Geico, Progressive, State Farm) typically exclude aftermarket mods from claims. Hagerty, Grundy, and Heacock Classic offer agreed-value coverage that protects your full build investment.
        </p>
      </div>

      {/* ── FORM ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '1.75rem' }}>

        {/* Vehicle Information */}
        <div style={card}>
          <p style={secHead}>🚗 Vehicle Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '0.875rem' }}>
            <div>
              <label style={lbl}>Year</label>
              <select style={inp} value={year} onChange={e => setYear(e.target.value)}>
                {YEARS.map(y => <option key={y} value={y} style={{ background: '#243547' }}>{y}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Make *</label>
              <select style={inp} value={make} onChange={e => setMake(e.target.value)}>
                <option value="" style={{ background: '#243547' }}>Select make…</option>
                {MAKES.map(m => <option key={m} value={m} style={{ background: '#243547' }}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Model *</label>
              <input style={inp} placeholder="e.g. Camaro SS" value={model} onChange={e => setModel(e.target.value)} />
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={lbl}>VIN (optional)</label>
              <input style={inp} placeholder="17-character VIN" value={vin} onChange={e => setVin(e.target.value)} maxLength={17} />
            </div>
            <div>
              <label style={lbl}>Annual Mileage</label>
              <input style={inp} placeholder="5000" value={mileage}
                onChange={e => setMileage(e.target.value.replace(/\D/g, ''))} />
            </div>
            <div>
              <label style={lbl}>Primary Use</label>
              <select style={inp} value={use} onChange={e => setUse(e.target.value)}>
                <option value="daily"     style={{ background: '#243547' }}>Daily Driver</option>
                <option value="pleasure"  style={{ background: '#243547' }}>Pleasure / Weekend</option>
                <option value="show"      style={{ background: '#243547' }}>Show Only</option>
                <option value="track"     style={{ background: '#243547' }}>Track Use</option>
                <option value="collector" style={{ background: '#243547' }}>Collector / Stored</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Ownership</label>
              <select style={inp} value={ownership} onChange={e => setOwnership(e.target.value)}>
                <option value="owned"    style={{ background: '#243547' }}>Owned Outright</option>
                <option value="financed" style={{ background: '#243547' }}>Financed / Leased</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Modifications Value ($)</label>
              <input style={inp} placeholder="0" value={modsValue}
                onChange={e => setModsValue(e.target.value.replace(/\D/g, ''))} />
            </div>
          </div>
        </div>

        {/* Driver Information */}
        <div style={card}>
          <p style={secHead}>👤 Driver Information</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: '0.875rem', marginBottom: '1.1rem' }}>
            <div>
              <label style={lbl}>ZIP Code *</label>
              <input style={inp} placeholder="34698" value={zip}
                onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))} />
            </div>
            <div>
              <label style={lbl}>Age</label>
              <input style={inp} placeholder="35" value={age}
                onChange={e => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </div>
            <div>
              <label style={lbl}>Years of Experience</label>
              <input style={inp} placeholder="10" value={experience}
                onChange={e => setExperience(e.target.value.replace(/\D/g, '').slice(0, 2))} />
            </div>
            <div>
              <label style={lbl}>Credit Score Range</label>
              <select style={inp} value={credit} onChange={e => setCredit(e.target.value)}>
                {CREDIT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ background: '#243547' }}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Accidents toggle */}
            <div>
              <label style={lbl}>Accidents in Last 3 Years</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ val: false, label: 'No' }, { val: true, label: 'Yes' }].map(opt => (
                  <button key={String(opt.val)} onClick={() => setAccidents(opt.val)}
                    style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: accidents === opt.val ? (opt.val ? '#CC0000' : '#22c55e') : 'rgba(255,255,255,0.08)', color: 'white' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            {/* Tickets toggle */}
            <div>
              <label style={lbl}>Tickets in Last 3 Years</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[{ val: false, label: 'No' }, { val: true, label: 'Yes' }].map(opt => (
                  <button key={String(opt.val)} onClick={() => setTickets(opt.val)}
                    style={{ padding: '0.5rem 1.5rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', border: 'none', background: tickets === opt.val ? (opt.val ? '#CC0000' : '#22c55e') : 'rgba(255,255,255,0.08)', color: 'white' }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Coverage Type */}
        <div style={card}>
          <p style={secHead}>🛡️ Coverage Type</p>
          <div style={{ display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
            {COVERAGE_TYPES.map(ct => (
              <button key={ct.value} onClick={() => setCoverage(ct.value)}
                style={{ padding: '0.55rem 1.1rem', borderRadius: '9999px', fontWeight: coverage === ct.value ? 700 : 400, fontSize: '0.875rem', cursor: 'pointer', border: `1px solid ${coverage === ct.value ? '#CC0000' : 'rgba(255,255,255,0.12)'}`, background: coverage === ct.value ? 'rgba(204,0,0,0.15)' : 'transparent', color: coverage === ct.value ? '#CC0000' : 'rgba(255,255,255,0.6)' }}>
                {ct.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Button */}
        <button onClick={handleSearch} disabled={loading}
          style={{ background: loading ? 'rgba(204,0,0,0.5)' : 'linear-gradient(135deg,#CC0000,#AA0000)', color: 'white', border: 'none', borderRadius: '0.875rem', padding: '1rem 2.5rem', fontWeight: 800, fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: loading ? 'none' : '0 4px 20px rgba(204,0,0,0.35)', alignSelf: 'flex-start' }}>
          {loading ? '🔍 Getting Quotes…' : '🛡️ Get Insurance Quotes'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.3)', borderRadius: '0.875rem', padding: '1rem', marginBottom: '1.5rem', color: '#f87171' }}>
          ⚠️ {error}
        </div>
      )}

      {/* ── COMPARE PANEL ───────────────────────────────────── */}
      {compare.length >= 2 && (
        <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '1rem', padding: '1.25rem', marginBottom: '1.5rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontWeight: 700, color: '#22c55e', margin: 0 }}>⚖️ Comparing {compare.length} Carriers</h3>
            <button onClick={() => setCompare([])} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', padding: '0.3rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.75rem' }}>Clear</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${compareCarriers.length},1fr)`, gap: '1rem', minWidth: '560px' }}>
            {compareCarriers.map(c => (
              <div key={c.name} style={{ background: '#0D1E30', borderRadius: '0.75rem', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontWeight: 800, fontSize: '1rem', margin: '0 0 0.25rem' }}>{c.logo} {c.name}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 900, color: '#CC0000', margin: '0 0 0.15rem' }}>${c.monthly}/mo</p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', margin: '0 0 0.75rem' }}>~${c.annual}/yr</p>
                <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {[
                    ['Coverage',     c.coverage],
                    ['Agreed Value', c.agreed_value  ? '✓ Yes' : '✗ No'],
                    ['Mods Covered', c.mods_covered  ? '✓ Yes' : '✗ No'],
                    ['Track Day',    c.track_day     ? '✓ Yes' : '✗ No'],
                    ['AM Best',      c.am_best],
                  ].map(([label, val]) => (
                    <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}>{label as string}</span>
                      <span style={{ color: String(val).startsWith('✓') ? '#22c55e' : String(val).startsWith('✗') ? '#E63946' : AM_COLORS[String(val)] ?? '#aaa', fontWeight: 600, textAlign: 'right' }}>{val as string}</span>
                    </div>
                  ))}
                </div>
                <a href={c.website} target="_blank" rel="noopener"
                  style={{ display: 'block', marginTop: '0.875rem', background: 'rgba(204,0,0,0.1)', border: '1px solid rgba(204,0,0,0.2)', color: '#CC0000', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none' }}>
                  Get Quote →
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RESULTS ─────────────────────────────────────────── */}
      {searched && !loading && (
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0 }}>
              {carriers.length > 0
                ? `${carriers.length} quote estimates for your ${year} ${make} ${model}`
                : 'No quotes returned — verify ANTHROPIC_API_KEY is set in Vercel'}
            </h2>
            {carriers.length > 0 && (
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginTop: '0.25rem' }}>
                AI-generated estimates — contact each carrier for a binding official quote · click a card for full details
              </p>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {carriers.map((c, i) => {
              const isComparing = compare.includes(c.name)
              const isRec = !!c.recommended
              return (
                <div key={c.name + i} onClick={() => setSelected(c)}
                  style={{ background: '#243547', border: `1px solid ${isRec ? 'rgba(34,197,94,0.3)' : isComparing ? 'rgba(204,0,0,0.3)' : 'rgba(255,255,255,0.07)'}`, borderRadius: '1rem', padding: '1.25rem', cursor: 'pointer', display: 'flex', gap: '1.25rem', alignItems: 'center', position: 'relative' }}>
                  {isRec && (
                    <div style={{ position: 'absolute', top: '-1px', left: '1.5rem', background: '#22c55e', color: '#000', padding: '0.15rem 0.75rem', borderRadius: '0 0 0.5rem 0.5rem', fontSize: '0.65rem', fontWeight: 800 }}>
                      RECOMMENDED
                    </div>
                  )}

                  {/* Logo */}
                  <div style={{ width: '60px', textAlign: 'center', flexShrink: 0, marginTop: isRec ? '0.6rem' : 0 }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>{c.logo}</div>
                    <span style={{ background: `${TYPE_COLORS[c.type] ?? '#888'}18`, color: TYPE_COLORS[c.type] ?? '#888', padding: '0.1rem 0.375rem', borderRadius: '9999px', fontSize: '0.6rem', border: `1px solid ${TYPE_COLORS[c.type] ?? '#888'}25` }}>
                      {c.type}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0, marginTop: isRec ? '0.6rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0 }}>{c.name}</p>
                      <span style={{ background: `${AM_COLORS[c.am_best] ?? '#888'}18`, color: AM_COLORS[c.am_best] ?? '#888', padding: '0.1rem 0.4rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 700 }}>
                        AM Best: {c.am_best}
                      </span>
                    </div>
                    <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)', margin: '0 0 0.4rem' }}>{c.coverage}</p>
                    {c.notes && (
                      <p style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.3)', margin: '0 0 0.6rem', lineHeight: 1.4 }}>{c.notes}</p>
                    )}
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      {c.agreed_value
                        ? <span style={{ background: 'rgba(34,197,94,0.08)',  color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)',  padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem' }}>✓ Agreed Value</span>
                        : <span style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem' }}>ACV</span>}
                      {c.mods_covered
                        ? <span style={{ background: 'rgba(34,197,94,0.08)',  color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)',  padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem' }}>✓ Mods Covered</span>
                        : <span style={{ background: 'rgba(204,0,0,0.06)',    color: '#f87171', border: '1px solid rgba(204,0,0,0.15)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem' }}>✗ No Mod Coverage</span>}
                      {c.track_day && (
                        <span style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.65rem' }}>✓ Track Day</span>
                      )}
                    </div>
                  </div>

                  {/* Contact */}
                  <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '120px', marginTop: isRec ? '0.6rem' : 0 }}>
                    {c.phone && (
                      <a href={`tel:${c.phone}`} onClick={e => e.stopPropagation()}
                        style={{ display: 'block', fontSize: '0.75rem', color: '#3399FF', marginBottom: '0.3rem', textDecoration: 'none', fontWeight: 600 }}>
                        📞 {c.phone}
                      </a>
                    )}
                    <a href={c.website} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}
                      style={{ display: 'block', fontSize: '0.75rem', color: '#CC0000', textDecoration: 'none', fontWeight: 600 }}>
                      🌐 Get Quote
                    </a>
                  </div>

                  {/* Rate + compare */}
                  <div style={{ textAlign: 'right', flexShrink: 0, marginTop: isRec ? '0.6rem' : 0 }}>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: isRec ? '#22c55e' : '#CC0000', lineHeight: 1, margin: 0 }}>${c.monthly}</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', margin: '0.1rem 0' }}>/month est.</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'rgba(255,255,255,0.4)', margin: '0 0 0.5rem' }}>~${c.annual}/yr</p>
                    <button onClick={e => { e.stopPropagation(); setCompare(prev => prev.includes(c.name) ? prev.filter(x => x !== c.name) : prev.length < 4 ? [...prev, c.name] : prev) }}
                      style={{ background: isComparing ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isComparing ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.08)'}`, color: isComparing ? '#22c55e' : 'rgba(255,255,255,0.4)', padding: '0.25rem 0.625rem', borderRadius: '0.375rem', fontSize: '0.7rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      {isComparing ? '✓ Comparing' : '+ Compare'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── CARRIER DETAIL MODAL ────────────────────────────── */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }} onClick={() => setSelected(null)}>
          <div style={{ background: '#243547', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.25rem', padding: '2rem', maxWidth: '500px', width: '100%' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                <div style={{ fontSize: '2.5rem' }}>{selected.logo}</div>
                <div>
                  <h2 style={{ fontWeight: 800, fontSize: '1.2rem', margin: '0 0 0.25rem' }}>{selected.name}</h2>
                  <span style={{ background: `${TYPE_COLORS[selected.type] ?? '#888'}18`, color: TYPE_COLORS[selected.type] ?? '#888', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.7rem', border: `1px solid ${TYPE_COLORS[selected.type] ?? '#888'}30` }}>
                    {selected.type}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>×</button>
            </div>

            <div style={{ background: 'rgba(204,0,0,0.06)', border: '1px solid rgba(204,0,0,0.15)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', margin: 0 }}>Estimated Monthly</p>
                <p style={{ fontSize: '2rem', fontWeight: 900, color: '#CC0000', margin: 0 }}>
                  ${selected.monthly}<span style={{ fontSize: '0.875rem', fontWeight: 400, color: 'rgba(255,255,255,0.4)' }}>/mo</span>
                </p>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>~${selected.annual}/year · actual rate may vary</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', margin: 0 }}>AM Best</p>
                <p style={{ fontSize: '1.75rem', fontWeight: 900, color: AM_COLORS[selected.am_best] ?? '#aaa', margin: 0 }}>{selected.am_best}</p>
              </div>
            </div>

            {selected.notes && (
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.25rem', lineHeight: 1.5 }}>{selected.notes}</p>
            )}

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
              {selected.agreed_value
                ? <span style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>✓ Agreed Value</span>
                : <span style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.08)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>ACV Only</span>}
              {selected.mods_covered
                ? <span style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>✓ Mods Covered</span>
                : <span style={{ background: 'rgba(204,0,0,0.06)', color: '#f87171', border: '1px solid rgba(204,0,0,0.15)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>✗ No Mod Coverage</span>}
              {selected.track_day && (
                <span style={{ background: 'rgba(34,197,94,0.08)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.2)', padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem' }}>✓ Track Day</span>
              )}
            </div>

            {selected.phone && (
              <p style={{ fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                📞 <a href={`tel:${selected.phone}`} style={{ color: '#3399FF', textDecoration: 'none', fontWeight: 700 }}>{selected.phone}</a>
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.625rem' }}>
              <a href={selected.website} target="_blank" rel="noopener"
                style={{ flex: 1, background: 'linear-gradient(135deg,#CC0000,#AA0000)', color: 'white', padding: '0.875rem', borderRadius: '0.875rem', fontWeight: 700, textAlign: 'center', textDecoration: 'none', fontSize: '0.95rem', boxShadow: '0 4px 16px rgba(204,0,0,0.35)' }}>
                Get Quote Online →
              </a>
              {selected.phone && (
                <a href={`tel:${selected.phone}`}
                  style={{ background: 'rgba(51,153,255,0.1)', border: '1px solid rgba(51,153,255,0.25)', color: '#3399FF', padding: '0.875rem 1.25rem', borderRadius: '0.875rem', textDecoration: 'none', fontWeight: 600, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  📞 Call
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── DIRECT QUOTE LINKS ──────────────────────────────── */}
      <div>
        <h2 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '0.4rem' }}>🌐 Get Quotes Directly from All Carriers</h2>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem', marginBottom: '1.25rem' }}>
          Click any card to open that carrier's official quote page — opens in a new tab
        </p>
        {['Standard','Military','Online','Enthusiast','Collector','Specialty'].map(type => {
          const links = DIRECT_LINKS.filter(l => l.type === type)
          if (!links.length) return null
          return (
            <div key={type} style={{ marginBottom: '1.25rem' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: TYPE_COLORS[type] ?? '#aaa', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 0.625rem' }}>
                {type} Carriers
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '0.75rem' }}>
                {links.map((l, i) => (
                  <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                    <div style={{ background: '#243547', borderRadius: '1rem', padding: '1.1rem', border: `1px solid ${TYPE_COLORS[l.type] ?? '#888'}20`, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.4rem' }}>
                        <span style={{ fontSize: '1.4rem' }}>{l.emoji}</span>
                        <p style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem', margin: 0 }}>{l.name}</p>
                      </div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.72rem', margin: '0 0 0.35rem' }}>📞 {l.phone}</p>
                      <p style={{ color: TYPE_COLORS[l.type] ?? '#aaa', fontSize: '0.72rem', fontWeight: 700, margin: 0 }}>Get Quote →</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', marginTop: '2rem' }}>
        AI-generated estimates are for comparison only. Actual rates depend on your full driver profile, vehicle condition, location, and driving history. Contact each carrier for an official binding quote.
      </p>
    </div>
  )
}
