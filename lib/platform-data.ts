// Shared platform datasets usable on both server (API routes) and client.

export interface Vendor {
  id: string
  name: string
  category: string
  sub: string
  description: string
  website: string
  featured: boolean
  verified: boolean
  discount: string | null
  logo: string
  local?: boolean
  city?: string
}

export const VENDORS: Vendor[] = [
  { id:'1', name:'Mishimoto', category:'Performance Parts', sub:'Cooling & Intakes', description:'Premium cooling, intake, and drivetrain components. OEM-quality aftermarket parts with lifetime warranty.', website:'https://www.mishimoto.com', featured:true, verified:true, discount:'10% off with code REVCONNECT', logo:'🔧' },
  { id:'2', name:'Enkei Wheels', category:'Wheels & Tires', sub:'Wheel Manufacturer', description:'World-renowned lightweight forged and cast wheels for performance and show applications.', website:'https://www.enkei.com', featured:true, verified:true, discount:null, logo:'⭕' },
  { id:'3', name:'Chemical Guys', category:'Car Care', sub:'Detailing Products', description:'Professional-grade car care products. Washes, waxes, coatings, and interior cleaners trusted by detailers worldwide.', website:'https://www.chemicalguys.com', featured:true, verified:true, discount:'15% off with code RC15', logo:'🧴' },
  { id:'4', name:'KW Suspensions', category:'Performance Parts', sub:'Suspension & Coilovers', description:'German-engineered suspension systems. From street to race, KW covers every application.', website:'https://www.kwsuspensions.net', featured:false, verified:true, discount:null, logo:'⚙️' },
  { id:'5', name:'Hagerty Insurance', category:'Insurance & Finance', sub:'Enthusiast Insurance', description:'Agreed-value insurance for collector cars, modified vehicles, and daily drivers with agreed-value options.', website:'https://www.hagerty.com', featured:true, verified:true, discount:'Free quote for VictoryRevConnect members', logo:'🛡️' },
  { id:'6', name:'Titan Motorsports', category:'Automotive Services', sub:'Performance Shop', description:'Full-service performance shop. Engine builds, turbo kits, suspension, dyno tuning, and fabrication.', website:'https://www.titanmotorsports.com', featured:false, verified:true, discount:null, logo:'🏁', local:true, city:'Orlando, FL' },
  { id:'7', name:'Yokohama Tires', category:'Wheels & Tires', sub:'Tire Manufacturer', description:'High-performance tires from ADVAN to Avid. Track-proven compound technology for street and race.', website:'https://www.yokohamatire.com', featured:false, verified:true, discount:null, logo:'🔘' },
  { id:'8', name:'Alpine Electronics', category:'Audio & Electronics', sub:'Car Audio', description:'Premium car audio equipment. Head units, amplifiers, speakers, and DSP for the ultimate audio build.', website:'https://www.alpine-usa.com', featured:false, verified:true, discount:'Free installation guide with any purchase', logo:'🔊' },
]
