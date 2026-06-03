import type { Metadata } from 'next'
import { Search, SlidersHorizontal, Car } from 'lucide-react'

export const metadata: Metadata = { title: 'Car Search' }

const MAKES = ['Any Make', 'Acura', 'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'Honda', 'Hyundai', 'Infiniti', 'Jeep', 'Kia', 'Lexus', 'Mazda', 'Mercedes-Benz', 'Mitsubishi', 'Nissan', 'Porsche', 'Subaru', 'Toyota', 'Volkswagen']

export default function CarSearchPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Car Search Engine</h1>
        <p className="text-gray-400 text-sm mt-1">Aggregated listings from dealers, Carvana, CarGurus, BaT, eBay, and more — all in one search</p>
      </div>

      {/* Search form */}
      <div className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
          <select className="bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-rev-red/40 transition-colors">
            {MAKES.map((m) => <option key={m}>{m}</option>)}
          </select>
          <input type="text" placeholder="Model" className="bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/40 transition-colors" />
          <div className="flex gap-2">
            <input type="number" placeholder="Year min" className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/40 transition-colors" />
            <input type="number" placeholder="Max" className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/40 transition-colors" />
          </div>
          <div className="flex gap-2">
            <input type="text" placeholder="$Min" className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/40 transition-colors" />
            <input type="text" placeholder="$Max" className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/40 transition-colors" />
          </div>
          <input type="text" placeholder="ZIP code" className="bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-rev-red/40 transition-colors" />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-wrap gap-3 flex-1">
            {['New', 'Used', 'CPO'].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-rev-red" defaultChecked={c === 'Used'} />
                <span className="text-xs text-gray-300">{c}</span>
              </label>
            ))}
          </div>
          <button className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-xl text-sm hover:border-white/20 transition-colors">
            <SlidersHorizontal className="w-4 h-4" /> More Filters
          </button>
          <button className="flex items-center gap-2 bg-rev-red hover:bg-red-600 text-white font-bold px-6 py-2 rounded-xl text-sm transition-colors">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
      </div>

      {/* Sources */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500">Searching across:</span>
        {['CarGurus', 'AutoTrader', 'Cars.com', 'Carvana', 'CarMax', 'BaT', 'Cars & Bids', 'eBay', 'TrueCar', 'Vroom', '+ more'].map((s) => (
          <span key={s} className="text-xs bg-white/5 border border-white/10 text-gray-400 px-2 py-1 rounded-full">{s}</span>
        ))}
      </div>

      {/* Empty state */}
      <div className="text-center py-20">
        <Car className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Search above to find your next vehicle</h3>
        <p className="text-gray-400 text-sm">We aggregate listings from every major source into one ranked feed.</p>
      </div>
    </div>
  )
}
