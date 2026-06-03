'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Car, MapPin, ShoppingBag, Wrench, Droplets,
  Gavel, Shield, Store, Package, Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/garage', icon: Car, label: 'My Garage', category: 'personal' },
  { href: '/events', icon: MapPin, label: 'Events & Meets', category: 'discover' },
  { href: '/car-search', icon: ShoppingBag, label: 'Car Search', category: 'discover' },
  { href: '/parts', icon: Package, label: 'Parts Search', category: 'discover' },
  { href: '/mechanic', icon: Wrench, label: 'AI Mechanic', category: 'tools' },
  { href: '/car-wash', icon: Droplets, label: 'Car Wash', category: 'tools' },
  { href: '/auctions', icon: Gavel, label: 'Auctions', category: 'discover' },
  { href: '/insurance', icon: Shield, label: 'Insurance', category: 'tools' },
  { href: '/vendors', icon: Users, label: 'Vendors', category: 'community' },
  { href: '/store', icon: Store, label: 'Merch Store', category: 'community' },
]

export default function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:flex flex-col fixed left-0 top-16 bottom-0 w-64 bg-rev-charcoal/50 border-r border-white/10 overflow-y-auto">
      <nav className="p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-rev-red/15 text-rev-red border border-rev-red/20'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Rev Points widget */}
      <div className="mt-auto p-4">
        <div className="bg-gradient-to-br from-rev-red/20 to-rev-orange/10 border border-rev-red/20 rounded-xl p-4">
          <p className="text-xs text-gray-400 mb-1">Rev Points</p>
          <p className="text-2xl font-black text-white">0</p>
          <p className="text-xs text-rev-orange mt-1">Cruiser Tier</p>
        </div>
      </div>
    </aside>
  )
}
