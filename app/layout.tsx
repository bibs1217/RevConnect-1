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
          body{background:#030B1A;color:white;font-family:system-ui,-apple-system,sans-serif}
          a{color:inherit;text-decoration:none}
          input,select,textarea,button{font-family:inherit}

          /* Scrollbar */
          ::-webkit-scrollbar{width:5px}
          ::-webkit-scrollbar-track{background:#071428}
          ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#FF4500,#FFD700);border-radius:3px}
          ::selection{background:#FF4500;color:white}

          /* Chrome shimmer animation */
          @keyframes chrome-shimmer {
            0%{background-position:200% center}
            100%{background-position:-200% center}
          }
          @keyframes sun-pulse {
            0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.3)}
            50%{box-shadow:0 0 40px rgba(255,215,0,0.6),0 0 60px rgba(255,69,0,0.2)}
          }
          @keyframes wave {
            0%,100%{transform:translateY(0)}
            50%{transform:translateY(-4px)}
          }

          .chrome-text {
            background: linear-gradient(90deg, #888 0%, #fff 20%, #C0C0C0 40%, #fff 60%, #888 80%, #fff 100%);
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: chrome-shimmer 4s linear infinite;
          }
          .chrome-border {
            border: 1px solid transparent;
            background: linear-gradient(#071428,#071428) padding-box,
                        linear-gradient(135deg,#888,#fff,#C0C0C0,#888) border-box;
          }
          .sun-glow { animation: sun-pulse 3s ease-in-out infinite; }
          .wave { animation: wave 3s ease-in-out infinite; }
        `}</style>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
