import type { Metadata } from 'next'
import { Shield, CheckCircle, TrendingDown } from 'lucide-react'

export const metadata: Metadata = { title: 'Insurance Quotes' }

const CARRIERS = [
  { name: 'Hagerty', type: 'Enthusiast', badge: '⭐ Best for Builds' },
  { name: 'Grundy', type: 'Enthusiast', badge: null },
  { name: 'State Farm', type: 'Standard', badge: null },
  { name: 'Progressive', type: 'Standard', badge: '🏆 Most Popular' },
  { name: 'Geico', type: 'Standard', badge: null },
  { name: 'USAA', type: 'Military', badge: null },
  { name: 'American Collectors', type: 'Collector', badge: null },
  { name: 'Heacock Classic', type: 'Collector', badge: null },
]

export default function InsurancePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Insurance Quotes</h1>
        <p className="text-gray-400 text-sm mt-1">Real-time quotes from 30+ carriers — including enthusiast specialists for your modified vehicle</p>
      </div>

      {/* Enthusiast warning */}
      <div className="flex items-start gap-3 bg-rev-red/10 border border-rev-red/20 rounded-xl p-4">
        <Shield className="w-5 h-5 text-rev-red shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-red-400">Standard policies may not cover your mods</p>
          <p className="text-xs text-gray-400 mt-1">
            If your vehicle has modifications, agreed-value or enthusiast coverage from carriers like Hagerty or Grundy ensures your full build investment is protected.
          </p>
        </div>
      </div>

      {/* Quote form */}
      <div className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-bold text-white">Get Your Quotes</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">Select Vehicle</label>
            <select className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-rev-red/40 transition-colors">
              <option>— Choose from your garage —</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">Primary Use</label>
            <select className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-rev-red/40 transition-colors">
              <option>Daily Driver</option>
              <option>Pleasure / Weekend</option>
              <option>Show Car</option>
              <option>Track Use</option>
              <option>Collector / Stored</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">Annual Mileage</label>
            <input type="number" placeholder="e.g. 12000" className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-rev-red/40 transition-colors" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-400 block mb-2">Garage ZIP Code</label>
            <input type="text" placeholder="e.g. 90210" className="w-full bg-rev-dark border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-rev-red/40 transition-colors" />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-400 block mb-2">Coverage Preferences</label>
          <div className="flex flex-wrap gap-3">
            {['Agreed Value', 'Modification Coverage', 'Track Day Coverage', 'Roadside Assistance', 'Diminished Value'].map((c) => (
              <label key={c} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="accent-rev-red" />
                <span className="text-xs text-gray-300">{c}</span>
              </label>
            ))}
          </div>
        </div>

        <button className="w-full bg-rev-red hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors">
          Get Quotes from All Carriers
        </button>
      </div>

      {/* Carrier preview */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 mb-3">We&apos;ll quote from these carriers and more:</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {CARRIERS.map((c) => (
            <div key={c.name} className="bg-rev-charcoal/50 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-sm font-medium text-white">{c.name}</p>
              <p className="text-xs text-gray-500">{c.type}</p>
              {c.badge && <p className="text-xs text-rev-orange mt-1">{c.badge}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
