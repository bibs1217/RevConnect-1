import type { Metadata } from 'next'
import { Search, Package, SlidersHorizontal, CheckCircle } from 'lucide-react'

export const metadata: Metadata = { title: 'Parts Search' }

const CATEGORIES = [
  'Engine & Drivetrain', 'Suspension & Steering', 'Brakes', 'Exhaust',
  'Electrical', 'Body & Exterior', 'Interior', 'Wheels & Tires',
  'Performance & FI', 'Cooling', 'Fuel System', 'Transmission',
]

const SOURCES = [
  'AutoZone', 'O\'Reilly', 'Advance', 'NAPA', 'Summit Racing',
  'JEGS', 'RockAuto', 'eBay Motors', 'Amazon', 'Turn 14',
]

export default function PartsPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Parts Search</h1>
        <p className="text-gray-400 text-sm mt-1">Compare prices across every retailer — fitment verified for your vehicle</p>
      </div>

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-rev-charcoal/50 border border-white/10 rounded-xl px-4 py-3 focus-within:border-rev-red/40 transition-colors">
          <Search className="w-5 h-5 text-gray-400 shrink-0" />
          <input
            type="text"
            placeholder='Search parts, part numbers, brands... (e.g. "K&N air filter", "34mm sway bar")'
            className="bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm"
          />
        </div>
        <button className="flex items-center gap-2 bg-white/5 border border-white/10 hover:border-white/20 text-gray-300 px-4 py-3 rounded-xl text-sm transition-colors">
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
        <button className="bg-rev-red hover:bg-red-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors">
          Search
        </button>
      </div>

      {/* Vehicle selector */}
      <div className="bg-rev-charcoal/50 border border-white/10 rounded-xl p-4 flex items-center gap-4">
        <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-white font-medium">Fitment verification active</p>
          <p className="text-xs text-gray-400">Results filtered for your saved vehicles. <button className="text-rev-red hover:underline">Change vehicle</button></p>
        </div>
        <button className="text-xs bg-white/5 border border-white/10 text-gray-300 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
          Add Vehicle
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar filters */}
        <div className="space-y-4">
          <div className="bg-rev-charcoal/50 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Category</h3>
            <div className="space-y-2">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="accent-rev-red" />
                  <span className="text-xs text-gray-300">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-rev-charcoal/50 border border-white/10 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Condition</h3>
            {['New OEM', 'New Aftermarket', 'Remanufactured', 'Used', 'Performance'].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer mb-2">
                <input type="checkbox" className="accent-rev-red" />
                <span className="text-xs text-gray-300">{c}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Results area */}
        <div className="lg:col-span-3">
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Search for parts above</h3>
            <p className="text-gray-400 text-sm">
              We&apos;ll compare prices from {SOURCES.join(', ')}, and more — all at once.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
