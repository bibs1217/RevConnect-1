import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { Gavel, Clock, DollarSign, ExternalLink } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Auctions' }

const AUCTION_TYPES = ['All', 'Public', 'Collector', 'Online', 'Dealer', 'Specialty']

export default async function AuctionsPage() {
  const supabase = await createClient()
  const { data: auctions } = await supabase
    .from('auctions')
    .select('*')
    .order('ends_at', { ascending: true })
    .limit(20)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Auction Discovery</h1>
        <p className="text-gray-400 text-sm mt-1">Every public, dealer, and collector auction — with all-in cost calculator</p>
      </div>

      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {AUCTION_TYPES.map((t) => (
          <button key={t} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-gray-300 hover:border-rev-red/40 hover:text-rev-red transition-colors first:bg-rev-red/15 first:border-rev-red/30 first:text-rev-red">
            {t}
          </button>
        ))}
      </div>

      {/* Featured sources */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {['Barrett-Jackson', 'Bring a Trailer', 'Cars & Bids', 'Copart', 'IAAI', 'eBay Motors', 'Mecum', 'Hagerty'].map((s) => (
          <button key={s} className="bg-rev-charcoal/50 border border-white/10 hover:border-rev-red/30 rounded-xl p-3 text-center text-xs text-gray-300 hover:text-white transition-colors">
            {s}
          </button>
        ))}
      </div>

      {/* Listings */}
      {!auctions || auctions.length === 0 ? (
        <div className="text-center py-16">
          <Gavel className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No auctions loaded yet</h3>
          <p className="text-gray-400 text-sm">Auction data syncs from connected sources. Check back soon.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {auctions.map((a) => (
            <div key={a.id} className="bg-rev-charcoal/50 border border-white/10 rounded-2xl overflow-hidden hover:border-rev-red/30 transition-colors">
              <div className="h-40 bg-gradient-to-br from-rev-red/10 to-transparent flex items-center justify-center">
                {a.images?.[0] ? (
                  <img src={a.images[0]} alt={a.title} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">🏎️</span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white text-sm leading-tight">{a.title}</h3>
                  <span className="text-xs px-2 py-0.5 bg-rev-charcoal border border-white/10 rounded-full text-gray-400 shrink-0 ml-2">
                    {a.source}
                  </span>
                </div>
                {a.current_bid && (
                  <div className="flex items-center gap-1 text-rev-orange font-bold text-sm mb-1">
                    <DollarSign className="w-3 h-3" />
                    Current: {formatCurrency(a.current_bid)}
                    {a.reserve_met === false && <span className="text-xs text-red-400 font-normal ml-1">Reserve not met</span>}
                  </div>
                )}
                {a.ends_at && (
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    Ends {new Date(a.ends_at).toLocaleDateString()}
                  </div>
                )}
                <a
                  href={a.auction_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 w-full flex items-center justify-center gap-1 bg-rev-red/15 hover:bg-rev-red/25 text-rev-red border border-rev-red/20 text-xs font-medium py-2 rounded-lg transition-colors"
                >
                  View Auction <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
