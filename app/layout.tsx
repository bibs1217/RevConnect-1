import type { Metadata } from 'next'
import { AuthProvider } from './providers/auth-provider'

export const metadata: Metadata = {
  title: { default: 'RevConnect-1', template: '%s | RevConnect-1' },
  description: 'The ultimate all-in-one platform for car enthusiasts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#050A14;color:white;font-family:system-ui,-apple-system,sans-serif}
          a{color:inherit;text-decoration:none}
          input,select,textarea{font-family:inherit}
          button{font-family:inherit;cursor:pointer}
          ::-webkit-scrollbar{width:6px}
          ::-webkit-scrollbar-track{background:#0D1B2A}
          ::-webkit-scrollbar-thumb{background:#E63946;border-radius:3px}
          ::selection{background:#E63946;color:white}
        `}</style>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
