import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { ShoppingCart, Tag, Zap, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export const metadata: Metadata = { title: 'Merch Store' }

const CATEGORIES = ['All', 'Apparel', 'Headwear', 'Outerwear', 'Drinkware', 'Garage Gear', 'Vehicle Accessories', 'Stickers', 'Collectibles', 'Digital Goods']

export default async function StorePage() {
  const supabase = createClient()
  const { data: products } = await supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(24)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-rev-red/20 via-rev-orange/10 to-transparent border border-white/10 rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-white">Official Merch Store</h1>
        <p className="text-gray-400 text-sm mt-1">Represent RevConnect-1 — exclusive drops, limited collabs, custom gear</p>
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-rev-orange" />
            <span className="text-gray-300">Earn Rev Points on every purchase</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-green-400" />
            <span className="text-gray-300">Free shipping for Legend tier</span>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button key={c} className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-gray-300 hover:border-rev-red/40 hover:text-rev-red transition-colors first:bg-rev-red/15 first:border-rev-red/30 first:text-rev-red">
            {c}
          </button>
        ))}
      </div>

      {!products || products.length === 0 ? (
        <div className="text-center py-16">
          <Store className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Store launching soon</h3>
          <p className="text-gray-400 text-sm">First drop drops when RevConnect-1 goes live. Stay tuned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => (
            <div key={p.id} className="bg-rev-charcoal/50 border border-white/10 rounded-2xl overflow-hidden hover:border-rev-red/30 transition-colors group cursor-pointer">
              <div className="h-48 bg-gradient-to-br from-rev-red/10 to-transparent flex items-center justify-center">
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl">👕</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-sm font-bold text-white mb-1 truncate">{p.name}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-rev-orange font-bold">{formatCurrency(p.base_price)}</span>
                    {p.compare_at_price && (
                      <span className="text-xs text-gray-500 line-through ml-2">{formatCurrency(p.compare_at_price)}</span>
                    )}
                  </div>
                  <button className="p-1.5 bg-rev-red/15 hover:bg-rev-red/25 border border-rev-red/20 rounded-lg transition-colors">
                    <ShoppingCart className="w-3.5 h-3.5 text-rev-red" />
                  </button>
                </div>
                {p.rev_points_earn > 0 && (
                  <p className="text-xs text-gray-500 mt-1">+{p.rev_points_earn} Rev Points</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
