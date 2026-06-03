import { createClient } from '@/lib/supabase/server'
import type { Metadata } from 'next'
import { MapPin, Calendar, Plus, Filter } from 'lucide-react'

export const metadata: Metadata = { title: 'Events & Meets' }

export default async function EventsPage() {
  const supabase = createClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('starts_at', new Date().toISOString())
    .order('starts_at', { ascending: true })
    .limit(20)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Events & Car Meets</h1>
          <p className="text-gray-400 text-sm mt-1">Discover meets, shows, track days, and cruises near you</p>
        </div>
        <button className="flex items-center gap-2 bg-rev-red hover:bg-red-600 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors">
          <Plus className="w-4 h-4" /> Create Event
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {['All', 'Street Meet', 'Car Show', 'Track Day', 'Cruise', 'Drag', 'Autocross'].map((f) => (
          <button
            key={f}
            className="px-3 py-1.5 rounded-full text-sm border border-white/10 text-gray-300 hover:border-rev-red/40 hover:text-rev-red transition-colors first:bg-rev-red/15 first:border-rev-red/30 first:text-rev-red"
          >
            {f}
          </button>
        ))}
      </div>

      {/* Map placeholder */}
      <div className="bg-rev-charcoal/50 border border-white/10 rounded-2xl h-64 flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-rev-red mx-auto mb-2" />
          <p className="text-gray-400 text-sm">Interactive map — enable location to find nearby events</p>
          <button className="mt-3 text-sm text-rev-red hover:underline">Enable Location</button>
        </div>
      </div>

      {/* Events list */}
      {!events || events.length === 0 ? (
        <div className="text-center py-16">
          <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No upcoming events yet</h3>
          <p className="text-gray-400 text-sm">Be the first to create an event in your area.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((event) => (
            <div key={event.id} className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-5 hover:border-rev-red/30 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs px-2 py-1 rounded-full bg-rev-red/15 text-rev-red border border-rev-red/20 capitalize">
                  {event.event_type.replace('_', ' ')}
                </span>
                {event.entry_fee ? (
                  <span className="text-sm font-bold text-rev-orange">${event.entry_fee}</span>
                ) : (
                  <span className="text-xs text-green-400">Free</span>
                )}
              </div>
              <h3 className="font-bold text-white mb-1">{event.title}</h3>
              <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                <MapPin className="w-3 h-3" /> {event.city}, {event.state}
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Calendar className="w-3 h-3" />
                {new Date(event.starts_at).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </div>
              <div className="mt-4 flex gap-2">
                <button className="flex-1 bg-rev-red/15 hover:bg-rev-red/25 text-rev-red text-xs font-medium py-2 rounded-lg transition-colors border border-rev-red/20">
                  RSVP
                </button>
                <button className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs py-2 rounded-lg transition-colors">
                  Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
