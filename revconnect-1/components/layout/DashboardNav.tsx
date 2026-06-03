'use client'

import Link from 'next/link'
import { Bell, Search, User } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']

interface DashboardNavProps {
  user: SupabaseUser
  profile: Profile | null
}

export default function DashboardNav({ user, profile }: DashboardNavProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-rev-dark/95 backdrop-blur border-b border-white/10">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Logo */}
        <Link href="/garage" className="flex items-center gap-2">
          <span className="text-xl font-black">
            <span className="text-white">Rev</span>
            <span className="text-rev-red">Connect</span>
            <span className="text-rev-orange">-1</span>
          </span>
        </Link>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-2 w-80">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search cars, parts, events, builds..."
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none w-full"
          />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-white/10 transition-colors">
            <Bell className="w-5 h-5 text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rev-red rounded-full" />
          </button>

          <Link
            href="/garage"
            className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/10 transition-colors"
          >
            <div className="w-8 h-8 bg-rev-red/20 border border-rev-red/30 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-rev-red" />
            </div>
            <span className="hidden md:block text-sm font-medium text-white">
              {profile?.username ?? user.email?.split('@')[0]}
            </span>
          </Link>
        </div>
      </div>
    </header>
  )
}
