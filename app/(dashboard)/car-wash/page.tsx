import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Droplets, MapPin, AlertTriangle, Star } from 'lucide-react'

export const metadata: Metadata = { title: 'Car Wash Locator' }

export default async function CarWashPage() {
  const supabase = createClient()
  const { data: washes } = await supabase.from('car_washes').select('*').limit(12)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Car Wash Locator</h1>
        <p className="text-gray-400 text-sm mt-1">Find coating-safe washes near you — ceramic, PPF, and vinyl wrap safe flagged</p>
      </div>

      {/* Coating warning */}
      <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
        <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-yellow-400">Coating protection active</p>
          <p className="text-xs text-gray-400 mt-1">
            Incompatible wash types will be flagged for your vehicle&apos;s paint protection. Add your vehicle coating status in your garage profile.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Touchless', 'Hand Wash', 'Self-Service', 'Mobile Detailer', 'Full Detail', 'Ceramic Safe', 'PPF Safe'].map((f) => (
          <button key={f} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-gray-300 hover:border-rev-red/40 hover:text-rev-red transition-colors">
            {f}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="bg-rev-charcoal/50 border border-white/10 rounded-2xl h-56 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-rev-red mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Enable location for nearby results</p>
          <button className="mt-2 text-sm text-rev-red hover:underline">Use My Location</button>
        </div>
      </div>

      {/* Results */}
      {!washes || washes.length === 0 ? (
        <div className="text-center py-12">
          <Droplets className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No car washes found. Enable location to find nearby options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {washes.map((w) => (
            <div key={w.id} className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-5 hover:border-rev-red/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-bold text-white">{w.name}</h3>
                {w.rating && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star className="w-3 h-3 fill-current" /> {w.rating.toFixed(1)}
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                <MapPin className="w-3 h-3" /> {w.city}, {w.state} · {w.price_range ?? '—'}
              </p>
              <div className="flex flex-wrap gap-1">
                {w.is_ceramic_safe && <span className="text-xs bg-blue-500/15 text-blue-400 px-2 py-0.5 rounded-full">Ceramic Safe</span>}
                {w.is_ppf_safe && <span className="text-xs bg-purple-500/15 text-purple-400 px-2 py-0.5 rounded-full">PPF Safe</span>}
                {w.is_touchless && <span className="text-xs bg-green-500/15 text-green-400 px-2 py-0.5 rounded-full">Touchless</span>}
                {w.has_membership && <span className="text-xs bg-rev-orange/15 text-rev-orange px-2 py-0.5 rounded-full">Membership</span>}
              </div>
              <button className="w-full mt-4 bg-rev-red/15 hover:bg-rev-red/25 text-rev-red border border-rev-red/20 text-xs font-medium py-2 rounded-lg transition-colors">
                Get Directions
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
