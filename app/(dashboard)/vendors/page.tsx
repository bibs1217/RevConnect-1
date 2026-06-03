import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Users, ExternalLink, Star } from 'lucide-react'

export const metadata: Metadata = { title: 'Vendor Marketplace' }

const VENDOR_CATEGORIES = [
  'All', 'Performance Parts', 'Wheels & Tires', 'Car Care', 'Audio & Electronics',
  'Insurance & Finance', 'Services', 'Clothing', 'Events', 'Fuel & Lubricants',
]

export default async function VendorsPage() {
  const supabase = createClient()
  const { data: vendors } = await supabase.from('vendors').select('*').order('is_featured', { ascending: false }).limit(20)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Vendor Marketplace</h1>
        <p className="text-gray-400 text-sm mt-1">Trusted brands and local shops — targeted to your build and location</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {VENDOR_CATEGORIES.map((c) => (
          <button key={c} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-gray-300 hover:border-rev-red/40 hover:text-rev-red transition-colors first:bg-rev-red/15 first:border-rev-red/30 first:text-rev-red">
            {c}
          </button>
        ))}
      </div>

      {!vendors || vendors.length === 0 ? (
        <div className="text-center py-16">
          <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Vendor listings coming soon</h3>
          <p className="text-gray-400 text-sm">Are you a vendor? <button className="text-rev-red hover:underline">Apply to advertise</button></p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {vendors.map((v) => (
            <div key={v.id} className={`bg-rev-charcoal/50 border rounded-2xl p-5 hover:border-rev-red/30 transition-colors ${v.is_featured ? 'border-rev-orange/30' : 'border-white/10'}`}>
              {v.is_featured && (
                <div className="flex items-center gap-1 text-xs text-rev-orange mb-3">
                  <Star className="w-3 h-3 fill-current" /> Featured Partner
                </div>
              )}
              <h3 className="font-bold text-white mb-1">{v.name}</h3>
              <p className="text-xs text-gray-400 mb-1">{v.category}</p>
              {v.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{v.description}</p>}
              {v.website && (
                <a href={v.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-rev-red hover:underline">
                  Visit Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
