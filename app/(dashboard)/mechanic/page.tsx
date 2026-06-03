import type { Metadata } from 'next'
import { Wrench, Send, BookOpen, AlertTriangle } from 'lucide-react'

export const metadata: Metadata = { title: 'AI Mechanic' }

const QUICK_PROMPTS = [
  'How do I replace my brake pads?',
  'Walk me through a coilover install',
  'Help me diagnose a check engine light',
  'How do I install a short throw shifter?',
  'What tools do I need for a clutch job?',
  'Guide me through a head unit install',
]

export default function MechanicPage() {
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      {/* Header */}
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-rev-red/20 border border-rev-red/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Wrench className="w-8 h-8 text-rev-red" />
        </div>
        <h1 className="text-2xl font-bold text-white">AI Mechanic</h1>
        <p className="text-gray-400 text-sm mt-1">
          Your personal 30-year ASE master tech — available 24/7 for any job on any vehicle
        </p>
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-rev-charcoal/30 border border-white/10 rounded-2xl p-6 overflow-y-auto mb-4 space-y-4">
        {/* Welcome message */}
        <div className="flex gap-3">
          <div className="w-8 h-8 bg-rev-red/20 border border-rev-red/30 rounded-xl flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4 text-rev-red" />
          </div>
          <div className="bg-rev-charcoal/50 border border-white/10 rounded-xl rounded-tl-sm p-4 max-w-lg">
            <p className="text-white text-sm font-medium mb-2">RevConnect AI Mechanic</p>
            <p className="text-gray-300 text-sm">
              Hey! I&apos;m your personal master mechanic. Tell me your vehicle and what you want to work on,
              and I&apos;ll walk you through every step — with torque specs, wiring diagrams, and everything you need.
            </p>
          </div>
        </div>

        {/* Quick prompts */}
        <div className="ml-11">
          <p className="text-xs text-gray-500 mb-3">Common jobs — tap to start:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                className="text-xs bg-white/5 border border-white/10 hover:border-rev-red/30 hover:text-rev-red text-gray-300 px-3 py-2 rounded-full transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-3 bg-rev-charcoal/50 border border-white/10 rounded-xl px-4 py-3 focus-within:border-rev-red/40 transition-colors">
          <input
            type="text"
            placeholder="Ask me anything about your vehicle... (e.g. 'My 2015 WRX needs new brake pads')"
            className="bg-transparent text-white placeholder-gray-500 outline-none w-full text-sm"
          />
        </div>
        <button className="bg-rev-red hover:bg-red-600 text-white p-3 rounded-xl transition-colors">
          <Send className="w-5 h-5" />
        </button>
      </div>

      <p className="text-center text-xs text-gray-600 mt-3">
        Always verify safety-critical work with a professional. RevConnect AI is for guidance only.
      </p>
    </div>
  )
}
