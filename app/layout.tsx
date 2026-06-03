import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: { default: 'RevConnect-1', template: '%s | RevConnect-1' },
  description: 'The ultimate all-in-one platform for car enthusiasts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`*{box-sizing:border-box;margin:0;padding:0}body{background:#0D0D0D;color:white;font-family:system-ui,-apple-system,sans-serif}a{color:inherit}input{font-family:inherit}`}</style>
      </head>
      <body>{children}</body>
    </html>
  )
}
