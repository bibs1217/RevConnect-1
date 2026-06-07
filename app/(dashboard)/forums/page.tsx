'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'

const FORUMS: Record<string, { name: string; url: string; vehicle: string; desc: string; members: string }[]> = {
  'American Muscle': [
    { name:'Mustang Forums',      url:'https://www.mustangforums.com',         vehicle:'Ford Mustang',          desc:'Largest Mustang community online',             members:'500K+' },
    { name:'SVT Performance',     url:'https://www.svtperformance.com',        vehicle:'Ford SVT',              desc:'Ford performance and SVT vehicles',            members:'200K+' },
    { name:'Camaro5',             url:'https://www.camaro5.com',               vehicle:'Chevy Camaro 5th Gen',  desc:'Fifth gen Camaro owners and enthusiasts',      members:'300K+' },
    { name:'Camaro6',             url:'https://www.camaro6.com',               vehicle:'Chevy Camaro 6th Gen',  desc:'Sixth gen Camaro community',                   members:'150K+' },
    { name:'Corvette Forum',      url:'https://www.corvetteforum.com',         vehicle:'Chevrolet Corvette',    desc:'The premier Corvette enthusiast community',    members:'400K+' },
    { name:'Challenger Talk',     url:'https://www.challengertalkforum.com',   vehicle:'Dodge Challenger',      desc:'Dodge Challenger owners forum',                members:'200K+' },
    { name:'Dodge Charger Forum', url:'https://www.dodgechargerforum.com',     vehicle:'Dodge Charger',         desc:'Charger owners and performance enthusiasts',   members:'150K+' },
    { name:'Hellcat Forum',       url:'https://www.hellcatforum.com',          vehicle:'Dodge Hellcat',         desc:'Hellcat and Demon owners community',           members:'100K+' },
    { name:'Ram Forumz',          url:'https://www.ramforumz.com',             vehicle:'Ram Trucks',            desc:'Ram truck owners and enthusiasts',             members:'200K+' },
    { name:'Viper Club',          url:'https://www.viperclub.org',             vehicle:'Dodge Viper',           desc:'Official Dodge Viper enthusiast club',         members:'50K+'  },
  ],
  'Ford': [
    { name:'F150 Forum',          url:'https://www.f150forum.com',             vehicle:'Ford F-150',            desc:'Largest F-150 community online',               members:'600K+' },
    { name:'Bronco6G',            url:'https://www.bronco6g.com',              vehicle:'Ford Bronco',           desc:'6th gen Ford Bronco owners',                   members:'200K+' },
    { name:'Focus ST Forum',      url:'https://www.focusst.org',               vehicle:'Ford Focus ST/RS',      desc:'Focus ST and RS performance community',        members:'100K+' },
    { name:'The Mustang Source',  url:'https://www.themustangsource.com',      vehicle:'Ford Mustang',          desc:'Mustang news, reviews and forums',             members:'300K+' },
  ],
  'Toyota / Lexus': [
    { name:'Supra Forums',        url:'https://www.supraforums.com',           vehicle:'Toyota Supra',          desc:'All generations of Toyota Supra',              members:'200K+' },
    { name:'FT86 Club',           url:'https://www.ft86club.com',              vehicle:'Toyota 86 / Subaru BRZ', desc:'Toyota 86 GR86 and Subaru BRZ community',    members:'300K+' },
    { name:'Tacoma World',        url:'https://www.tacomaworld.com',           vehicle:'Toyota Tacoma',         desc:'Largest Tacoma truck community',               members:'800K+' },
    { name:'4Runner.org',         url:'https://www.4runner.org',               vehicle:'Toyota 4Runner',        desc:'4Runner off-road and lifestyle community',     members:'400K+' },
    { name:'IH8MUD',              url:'https://www.ih8mud.com',                vehicle:'Toyota Land Cruiser',   desc:'Land Cruiser and FJ Cruiser community',        members:'500K+' },
    { name:'Tundra Headquarters', url:'https://www.tundraheadquarters.com',    vehicle:'Toyota Tundra',         desc:'Toyota Tundra owners forum',                   members:'200K+' },
    { name:'MR2 Owners Club',     url:'https://www.mr2oc.com',                 vehicle:'Toyota MR2',            desc:'Toyota MR2 enthusiast community',              members:'50K+'  },
  ],
  'Honda / Acura': [
    { name:'Honda Tech',          url:'https://www.honda-tech.com',            vehicle:'Honda',                 desc:'Honda performance and technical forums',       members:'400K+' },
    { name:'CivicX',              url:'https://www.civicx.com',                vehicle:'Honda Civic 10th Gen',  desc:'10th gen Honda Civic community',               members:'200K+' },
    { name:'NSX Prime',           url:'https://www.nsxprime.com',              vehicle:'Acura NSX',             desc:'The definitive NSX enthusiast resource',       members:'100K+' },
    { name:'S2Ki',                url:'https://www.s2ki.com',                  vehicle:'Honda S2000',           desc:'Honda S2000 owners and enthusiasts',           members:'300K+' },
    { name:'Club RSX',            url:'https://www.clubrsx.com',               vehicle:'Acura RSX',             desc:'Acura RSX and Integra DC5 community',          members:'150K+' },
  ],
  'Nissan / Infiniti': [
    { name:'The Z Board',         url:'https://www.thezboard.com',             vehicle:'Nissan Z',              desc:'All generations of Nissan Z cars',             members:'200K+' },
    { name:'GT-R Life',           url:'https://www.gtr-life.com',              vehicle:'Nissan GT-R',           desc:'Nissan GT-R R35 owners and enthusiasts',       members:'100K+' },
    { name:'Zilvia',              url:'https://www.zilvia.net',                vehicle:'Nissan 240SX / Silvia', desc:'Nissan 240SX S13 S14 and Silvia community',    members:'300K+' },
    { name:'MY350Z',              url:'https://www.my350z.com',                vehicle:'Nissan 350Z',           desc:'Nissan 350Z and 370Z community',               members:'200K+' },
    { name:'Nissan Frontier Forum', url:'https://www.nissanfrontier.org',      vehicle:'Nissan Frontier',       desc:'Nissan Frontier truck owners',                 members:'150K+' },
  ],
  'Subaru': [
    { name:'NASIOC',              url:'https://www.nasioc.com',                vehicle:'Subaru WRX / STI',      desc:'North American Subaru Impreza Owners Club',    members:'600K+' },
    { name:'Subaru Outback',      url:'https://www.subaruoutback.org',         vehicle:'Subaru Outback',        desc:'Subaru Outback and Legacy community',          members:'200K+' },
    { name:'Crosstrek Forum',     url:'https://www.crosstrektorum.com',        vehicle:'Subaru Crosstrek',      desc:'Subaru Crosstrek owners forum',                members:'100K+' },
  ],
  'Mitsubishi': [
    { name:'EvoM',                url:'https://www.evom.com',                  vehicle:'Mitsubishi Evo',        desc:'Mitsubishi Lancer Evolution community',        members:'200K+' },
    { name:'DSM Forums',          url:'https://www.dsmforums.com',             vehicle:'Mitsubishi Eclipse',    desc:'Eclipse Talon and DSM community',              members:'150K+' },
    { name:'3SI',                 url:'https://www.3si.org',                   vehicle:'Mitsubishi 3000GT',     desc:'3000GT and Stealth owners community',          members:'100K+' },
  ],
  'Mazda': [
    { name:'Miata.net',           url:'https://www.miata.net',                 vehicle:'Mazda Miata MX-5',     desc:'The original Miata community since 1990',      members:'400K+' },
    { name:'RX7 Club',            url:'https://www.rx7club.com',               vehicle:'Mazda RX-7',           desc:'Mazda RX-7 FC and FD enthusiasts',             members:'200K+' },
    { name:'RX8 Club',            url:'https://www.rx8club.com',               vehicle:'Mazda RX-8',           desc:'Mazda RX-8 owners and enthusiasts',            members:'150K+' },
    { name:'MX5 Nutz',            url:'https://www.mx5nutz.com',               vehicle:'Mazda MX-5',           desc:'UK based MX-5 Miata community',                members:'100K+' },
  ],
  'BMW': [
    { name:'Bimmerforums',        url:'https://www.bimmerforums.com',          vehicle:'BMW',                   desc:'Largest independent BMW forum',                members:'500K+' },
    { name:'Bimmerpost',          url:'https://www.bimmerpost.com',            vehicle:'BMW',                   desc:'BMW news forum and community',                 members:'400K+' },
    { name:'M3 Forum',            url:'https://www.m3forum.net',               vehicle:'BMW M3',                desc:'BMW M3 and M4 enthusiast community',           members:'200K+' },
    { name:'E46 Fanatics',        url:'https://www.e46fanatics.com',           vehicle:'BMW E46 3 Series',      desc:'BMW E46 3 Series dedicated forum',             members:'300K+' },
  ],
  'Mercedes-Benz': [
    { name:'MB World',            url:'https://www.mbworld.org',               vehicle:'Mercedes-Benz',         desc:'Mercedes-Benz owners community',               members:'300K+' },
    { name:'Benzworld',           url:'https://www.benzworld.org',             vehicle:'Mercedes-Benz',         desc:'Mercedes-Benz enthusiast forum',               members:'200K+' },
  ],
  'Porsche': [
    { name:'Rennlist',            url:'https://rennlist.com',                  vehicle:'Porsche',               desc:'The premier Porsche enthusiast community',     members:'400K+' },
    { name:'6SpeedOnline',        url:'https://www.6speedonline.com',          vehicle:'Porsche / Exotic',      desc:'Porsche and exotic car community',             members:'200K+' },
    { name:'Planet-9',            url:'https://www.planet-9.com',              vehicle:'Porsche Cayman / Boxster', desc:'Cayman Boxster and 718 community',          members:'100K+' },
  ],
  'Audi / Volkswagen': [
    { name:'AudiWorld',           url:'https://www.audiworld.com',             vehicle:'Audi',                  desc:'Audi owners and enthusiasts community',        members:'300K+' },
    { name:'VWVortex',            url:'https://www.vwvortex.com',              vehicle:'Volkswagen / Audi',     desc:'Largest VW and Audi community online',         members:'600K+' },
    { name:'GTI Forums',          url:'https://www.gtiforums.com',             vehicle:'VW Golf GTI',           desc:'Volkswagen GTI dedicated forum',               members:'200K+' },
    { name:'Audi TT Forum',       url:'https://www.audittforum.co.uk',         vehicle:'Audi TT',               desc:'Audi TT owners and enthusiasts',               members:'100K+' },
  ],
  'Jeep / Off-Road': [
    { name:'Jeep Forum',          url:'https://www.jeepforum.com',             vehicle:'Jeep',                  desc:'All Jeep models community',                    members:'600K+' },
    { name:'Wrangler Forum',      url:'https://www.wranglerforum.com',         vehicle:'Jeep Wrangler',         desc:'Jeep Wrangler dedicated community',            members:'400K+' },
    { name:'Gladiator Forum',     url:'https://www.gladiatorforum.com',        vehicle:'Jeep Gladiator',        desc:'Jeep Gladiator pickup truck community',        members:'100K+' },
  ],
  'Classic / Vintage': [
    { name:'Hemmings',            url:'https://www.hemmings.com/community',    vehicle:'Classic Cars',          desc:'Classic car buying selling and community',     members:'300K+' },
    { name:'Classic Cars Forum',  url:'https://www.classiccars.com/forums',    vehicle:'Classic Cars',          desc:'Classic car enthusiast forums',                members:'200K+' },
    { name:"The H.A.M.B.",        url:'https://www.jalopyjournal.com/forum',   vehicle:'Hot Rods / Customs',    desc:'Hot rod and custom car community',             members:'150K+' },
    { name:'Stovebolt',           url:'https://www.stovebolt.com',             vehicle:'Classic Chevy Trucks',  desc:'Classic Chevy truck community',                members:'100K+' },
  ],
  'General Enthusiast': [
    { name:'Reddit r/cars',       url:'https://www.reddit.com/r/cars',         vehicle:'All Vehicles',          desc:'General car enthusiast subreddit',             members:'2M+'   },
    { name:'Reddit r/Autos',      url:'https://www.reddit.com/r/autos',        vehicle:'All Vehicles',          desc:'Automotive news and discussion',               members:'500K+' },
    { name:'Motor Trend Forum',   url:'https://forums.motortrend.com',         vehicle:'All Vehicles',          desc:'Motor Trend magazine community forums',        members:'300K+' },
    { name:'Car Talk Community',  url:'https://community.cartalk.com',         vehicle:'All Vehicles',          desc:'Car advice and discussion community',          members:'200K+' },
    { name:'Automotive Forums',   url:'https://www.automotiveforums.com',      vehicle:'All Vehicles',          desc:'Multi-brand automotive community',             members:'400K+' },
    { name:'iRacing Forums',      url:'https://forums.iracing.com',            vehicle:'Racing Simulation',     desc:'iRacing sim racing community',                 members:'200K+' },
  ],
}

const FEATURED = [
  { name:'Reddit r/cars',  url:'https://www.reddit.com/r/cars',      members:'2M+',   vehicle:'All Vehicles',    emoji:'🚗' },
  { name:'Tacoma World',   url:'https://www.tacomaworld.com',         members:'800K+', vehicle:'Toyota Tacoma',   emoji:'🛻' },
  { name:'F150 Forum',     url:'https://www.f150forum.com',           members:'600K+', vehicle:'Ford F-150',      emoji:'🚛' },
  { name:'Jeep Forum',     url:'https://www.jeepforum.com',           members:'600K+', vehicle:'Jeep',            emoji:'🚙' },
  { name:'NASIOC',         url:'https://www.nasioc.com',              members:'600K+', vehicle:'Subaru WRX / STI', emoji:'⚡' },
  { name:'VWVortex',       url:'https://www.vwvortex.com',            members:'600K+', vehicle:'VW / Audi',       emoji:'🏁' },
]

const CAT_COLOR: Record<string, string> = {
  'American Muscle':    '#CC0000',
  'Ford':               '#3399FF',
  'Toyota / Lexus':     '#CC0000',
  'Honda / Acura':      '#CC0000',
  'Nissan / Infiniti':  '#CC0000',
  'Subaru':             '#1539CC',
  'Mitsubishi':         '#CC0000',
  'Mazda':              '#CC0000',
  'BMW':                '#1C6DB5',
  'Mercedes-Benz':      '#22c55e',
  'Porsche':            '#CC0000',
  'Audi / Volkswagen':  '#CC0000',
  'Jeep / Off-Road':    '#22c55e',
  'Classic / Vintage':  '#FFD700',
  'General Enthusiast': '#3399FF',
}

const inp: React.CSSProperties = {
  background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.12)',
  borderRadius:'0.875rem', color:'white', padding:'0.75rem 1.1rem',
  fontSize:'1rem', outline:'none', width:'100%', boxSizing:'border-box',
}

export default function ForumsPage() {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return FORUMS
    const result: typeof FORUMS = {}
    for (const [cat, forums] of Object.entries(FORUMS)) {
      const matches = forums.filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.vehicle.toLowerCase().includes(q) ||
        f.desc.toLowerCase().includes(q) ||
        cat.toLowerCase().includes(q)
      )
      if (matches.length > 0) result[cat] = matches
    }
    return result
  }, [search])

  const totalResults = Object.values(filtered).reduce((n, arr) => n + arr.length, 0)
  const totalForums  = Object.values(FORUMS).reduce((n, arr) => n + arr.length, 0)

  return (
    <div style={{ maxWidth:'1100px', margin:'0 auto', color:'white', fontFamily:'system-ui,sans-serif' }}>

      {/* ── HEADER ── */}
      <div style={{ background:'linear-gradient(135deg, #1B2A3E, #0D1E30)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'1rem', padding:'2rem', marginBottom:'2rem', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #CC0000, #FFD700, #1539CC)' }} />
        <h1 style={{ fontSize:'2rem', fontWeight:900, marginBottom:'0.4rem' }}>🏁 Automotive Forums Directory</h1>
        <p style={{ color:'rgba(255,255,255,0.45)', fontSize:'0.95rem', marginBottom:'1.25rem' }}>
          Connect with owners and enthusiasts for your exact vehicle — {totalForums} forums across {Object.keys(FORUMS).length} categories
        </p>
        {/* Search */}
        <div style={{ position:'relative', maxWidth:'560px' }}>
          <span style={{ position:'absolute', left:'1rem', top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.35)', pointerEvents:'none' }}>🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by vehicle, make, or forum name…"
            style={{ ...inp, paddingLeft:'2.75rem' }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position:'absolute', right:'0.875rem', top:'50%', transform:'translateY(-50%)', background:'transparent', border:'none', color:'rgba(255,255,255,0.4)', cursor:'pointer', fontSize:'1.1rem', lineHeight:1 }}>×</button>
          )}
        </div>
        {search && (
          <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem', marginTop:'0.625rem' }}>
            {totalResults} forum{totalResults !== 1 ? 's' : ''} match "{search}"
          </p>
        )}
      </div>

      {/* ── FEATURED (only when not searching) ── */}
      {!search && (
        <div style={{ marginBottom:'2.5rem' }}>
          <h2 style={{ fontWeight:800, fontSize:'1.1rem', marginBottom:'1rem', color:'rgba(255,255,255,0.7)', textTransform:'uppercase', letterSpacing:'0.5px', fontSize:'0.75rem' }}>
            ⭐ Featured Communities
          </h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px, 1fr))', gap:'0.875rem' }}>
            {FEATURED.map((f, i) => (
              <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none' }}>
                <div style={{ background:'linear-gradient(135deg, rgba(204,0,0,0.1), rgba(21,57,204,0.07))', border:'1px solid rgba(255,215,0,0.15)', borderRadius:'1rem', padding:'1.25rem', display:'flex', alignItems:'center', gap:'1rem', transition:'all 0.15s', cursor:'pointer' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.border='1px solid rgba(255,215,0,0.4)'; el.style.background='linear-gradient(135deg, rgba(204,0,0,0.18), rgba(21,57,204,0.12))' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.border='1px solid rgba(255,215,0,0.15)'; el.style.background='linear-gradient(135deg, rgba(204,0,0,0.1), rgba(21,57,204,0.07))' }}>
                  <div style={{ fontSize:'2rem', flexShrink:0 }}>{f.emoji}</div>
                  <div>
                    <p style={{ fontWeight:800, color:'white', fontSize:'0.95rem', margin:'0 0 0.2rem' }}>{f.name}</p>
                    <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.75rem', margin:'0 0 0.3rem' }}>{f.vehicle}</p>
                    <span style={{ background:'rgba(255,215,0,0.12)', color:'#FFD700', fontSize:'0.7rem', fontWeight:700, padding:'0.15rem 0.5rem', borderRadius:'9999px', border:'1px solid rgba(255,215,0,0.2)' }}>
                      {f.members} members
                    </span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── CATEGORY SECTIONS ── */}
      {Object.keys(filtered).length === 0 ? (
        <div style={{ textAlign:'center', padding:'4rem 2rem', background:'rgba(255,255,255,0.02)', borderRadius:'1.25rem', border:'1px solid rgba(255,255,255,0.06)' }}>
          <p style={{ fontSize:'3rem', marginBottom:'1rem' }}>🔍</p>
          <h2 style={{ fontWeight:800, marginBottom:'0.5rem' }}>No forums match "{search}"</h2>
          <p style={{ color:'rgba(255,255,255,0.4)', fontSize:'0.9rem' }}>Try searching a make like "Ford", "Toyota", or a model like "Mustang", "Supra"</p>
        </div>
      ) : (
        Object.entries(filtered).map(([category, forums]) => {
          const color = CAT_COLOR[category] ?? '#CC0000'
          return (
            <div key={category} style={{ marginBottom:'2.5rem' }}>
              {/* Category header */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', marginBottom:'1rem' }}>
                <div style={{ width:'4px', height:'28px', background:color, borderRadius:'9999px', flexShrink:0 }} />
                <h2 style={{ fontWeight:900, fontSize:'1.2rem', margin:0 }}>{category}</h2>
                <span style={{ background:'rgba(255,255,255,0.06)', color:'rgba(255,255,255,0.4)', fontSize:'0.7rem', fontWeight:700, padding:'0.2rem 0.6rem', borderRadius:'9999px' }}>
                  {forums.length} forum{forums.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Forum cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'1rem' }}>
                {forums.map((f, i) => (
                  <div key={i} style={{ background:'#243547', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'1rem', padding:'1.25rem', display:'flex', flexDirection:'column', gap:'0.625rem' }}>
                    {/* Name + members */}
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
                      <a href={f.url} target="_blank" rel="noopener noreferrer"
                        style={{ fontWeight:800, fontSize:'1rem', color:color, textDecoration:'none', lineHeight:1.3, flex:1 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.textDecoration='underline' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.textDecoration='none' }}>
                        {f.name}
                      </a>
                      <span style={{ background:`${color}18`, color:color, fontSize:'0.65rem', fontWeight:800, padding:'0.2rem 0.5rem', borderRadius:'9999px', border:`1px solid ${color}33`, flexShrink:0, whiteSpace:'nowrap' }}>
                        {f.members}
                      </span>
                    </div>

                    {/* Vehicle */}
                    <p style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.78rem', margin:0, fontWeight:600 }}>
                      🚗 {f.vehicle}
                    </p>

                    {/* Description */}
                    <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem', lineHeight:1.5, margin:0, flex:1 }}>
                      {f.desc}
                    </p>

                    {/* Actions */}
                    <div style={{ display:'flex', gap:'0.5rem', marginTop:'0.25rem' }}>
                      <a href={f.url} target="_blank" rel="noopener noreferrer"
                        style={{ flex:2, background:`linear-gradient(135deg, ${color}, ${color}CC)`, color:'white', padding:'0.55rem 0.75rem', borderRadius:'0.625rem', textDecoration:'none', textAlign:'center', fontWeight:700, fontSize:'0.8rem', boxShadow:`0 2px 10px ${color}33` }}>
                        Visit Forum →
                      </a>
                      <Link href="/garage"
                        style={{ flex:1, background:'rgba(255,255,255,0.05)', color:'rgba(255,255,255,0.55)', border:'1px solid rgba(255,255,255,0.1)', padding:'0.55rem 0.5rem', borderRadius:'0.625rem', textDecoration:'none', textAlign:'center', fontWeight:600, fontSize:'0.75rem' }}>
                        + Garage
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
