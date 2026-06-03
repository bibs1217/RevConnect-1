import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-rev-dark text-white">
      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-rev-red/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <div className="inline-flex items-center gap-2 bg-rev-red/10 border border-rev-red/30 rounded-full px-4 py-1.5 text-rev-red text-sm font-medium mb-6">
            🔥 Now in Early Access
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-6">
            <span className="text-white">Rev</span>
            <span className="text-rev-red">Connect</span>
            <span className="text-rev-orange">-1</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-4">
            The ultimate all-in-one platform for car enthusiasts.
          </p>
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-10">
            Community, commerce, AI-powered assistance, and real-world utility — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-rev-red hover:bg-red-600 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Join the Community
            </Link>
            <Link
              href="/login"
              className="border border-white/20 hover:border-white/40 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="max-w-6xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-4">Everything Enthusiasts Need</h2>
        <p className="text-gray-400 text-center mb-16">10 purpose-built AI agents, one seamless platform.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-rev-charcoal/50 border border-white/10 rounded-2xl p-6 hover:border-rev-red/30 transition-colors"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

const FEATURES = [
  {
    icon: '📍',
    title: 'Car Meets & Events',
    description: 'GPS-powered event discovery, club management, QR check-ins, and community voting.',
  },
  {
    icon: '🏪',
    title: 'Vendor Marketplace',
    description: 'Geo-targeted ads from performance shops, detailers, wheels brands, and more.',
  },
  {
    icon: '🔍',
    title: 'Car Search Engine',
    description: 'Aggregated listings from every source — dealers, Carvana, BaT, eBay, and more.',
  },
  {
    icon: '🔩',
    title: 'Parts Search',
    description: 'Price comparison across AutoZone, Summit, RockAuto, eBay, and peer-to-peer — fitment verified.',
  },
  {
    icon: '🔧',
    title: 'AI Mechanic',
    description: 'Your personal ASE master tech available 24/7. Step-by-step guides for every job.',
  },
  {
    icon: '🚿',
    title: 'Car Wash Locator',
    description: 'Find coating-safe washes near you with real community damage reports.',
  },
  {
    icon: '🏁',
    title: 'Auction Intelligence',
    description: 'Every public, dealer, and collector auction in one place with all-in cost calculator.',
  },
  {
    icon: '🛡️',
    title: 'Insurance Quotes',
    description: 'Real-time quotes from 30+ carriers including Hagerty, Grundy, and all standard carriers.',
  },
  {
    icon: '🚗',
    title: 'Digital Garage',
    description: 'Your complete build documentation, social hub, and community reputation home base.',
  },
  {
    icon: '👕',
    title: 'Official Merch Store',
    description: 'Rep RevConnect-1 with exclusive drops, custom gear, and the Rev Points loyalty program.',
  },
]
