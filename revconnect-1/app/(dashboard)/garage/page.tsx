import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus, Car, Settings, BarChart2 } from 'lucide-react'

export const metadata: Metadata = { title: 'My Garage' }

export default async function GaragePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: vehicles }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('vehicles').select('*').eq('owner_id', user.id).order('is_primary', { ascending: false }),
  ])

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Profile header */}
      <div className="relative bg-rev-charcoal/50 border border-white/10 rounded-2xl overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-rev-red/30 via-rev-orange/20 to-transparent" />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-4 -mt-10 mb-4">
            <div className="w-20 h-20 bg-rev-red/20 border-4 border-rev-dark rounded-2xl flex items-center justify-center text-3xl">
              🚗
            </div>
            <div className="pb-2">
              <h1 className="text-xl font-bold text-white">
                {profile?.display_name ?? profile?.username ?? 'My Garage'}
              </h1>
              <p className="text-sm text-gray-400">@{profile?.username ?? '—'}</p>
            </div>
          </div>

          <div className="flex gap-6 text-sm">
            <div>
              <span className="font-bold text-white">{vehicles?.length ?? 0}</span>
              <span className="text-gray-400 ml-1">Vehicles</span>
            </div>
            <div>
              <span className="font-bold text-white">{profile?.follower_count ?? 0}</span>
              <span className="text-gray-400 ml-1">Followers</span>
            </div>
            <div>
              <span className="font-bold text-white capitalize">{profile?.membership_tier ?? 'Cruiser'}</span>
              <span className="text-gray-400 ml-1">Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-white">My Vehicles</h2>
          <button className="flex items-center gap-2 bg-rev-red hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
            <Plus className="w-4 h-4" />
            Add Vehicle
          </button>
        </div>

        {!vehicles || vehicles.length === 0 ? (
          <div className="bg-rev-charcoal/30 border border-dashed border-white/20 rounded-2xl p-12 text-center">
            <Car className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No vehicles yet</h3>
            <p className="text-gray-400 text-sm mb-6">Add your first vehicle to start building your digital garage.</p>
            <button className="bg-rev-red hover:bg-red-600 text-white font-medium px-6 py-3 rounded-xl transition-colors">
              Add Your First Vehicle
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <div
                key={v.id}
                className="bg-rev-charcoal/50 border border-white/10 rounded-2xl overflow-hidden hover:border-rev-red/30 transition-colors group"
              >
                <div className="h-44 bg-gradient-to-br from-rev-red/10 to-transparent flex items-center justify-center">
                  {v.hero_image_url ? (
                    <img src={v.hero_image_url} alt={v.nickname ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl">🚗</span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-white">
                        {v.nickname ?? `${v.year} ${v.make} ${v.model}`}
                      </h3>
                      {v.nickname && (
                        <p className="text-sm text-gray-400">{v.year} {v.make} {v.model}</p>
                      )}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      v.status === 'active' ? 'bg-green-500/15 text-green-400' :
                      v.status === 'for_sale' ? 'bg-yellow-500/15 text-yellow-400' :
                      'bg-gray-500/15 text-gray-400'
                    }`}>
                      {v.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button className="flex-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <Settings className="w-3 h-3" /> Manage
                    </button>
                    <button className="flex-1 text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                      <BarChart2 className="w-3 h-3" /> Stats
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
