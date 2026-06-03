import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'RevConnect-1 | The Ultimate Car Enthusiast Platform',
    template: '%s | RevConnect-1',
  },
  description: 'The all-in-one platform for car enthusiasts — community, commerce, AI-powered assistance, and real-world utility.',
  keywords: ['car meets', 'car shows', 'automotive', 'car community', 'car parts', 'garage', 'builds'],
  authors: [{ name: 'RevConnect-1' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'RevConnect-1',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: 'RevConnect-1',
    title: 'RevConnect-1 | The Ultimate Car Enthusiast Platform',
    description: 'The all-in-one platform for car enthusiasts',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RevConnect-1',
    description: 'The all-in-one platform for car enthusiasts',
    images: ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  themeColor: '#E63946',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
