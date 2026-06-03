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
          body{background:#0E1825;color:white;font-family:system-ui,-apple-system,sans-serif}
          a{color:inherit;text-decoration:none}
          input,select,textarea,button{font-family:inherit}

          ::-webkit-scrollbar{width:5px}
          ::-webkit-scrollbar-track{background:#152234}
          ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#CC0000,#FFD700);border-radius:3px}
          ::selection{background:#CC0000;color:white}

          @keyframes chrome-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
          @keyframes sun-pulse{0%,100%{box-shadow:0 0 20px rgba(255,215,0,0.4),0 0 40px rgba(204,0,0,0.2)}50%{box-shadow:0 0 40px rgba(255,215,0,0.7),0 0 80px rgba(204,0,0,0.4)}}
          @keyframes chrome-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}
          @keyframes slide-up{0%{opacity:0;transform:translateY(20px)}100%{opacity:1;transform:translateY(0)}}

          .chrome-text{
            background:linear-gradient(90deg,#888 0%,#fff 20%,#C0C0C0 35%,#fff 50%,#C0C0C0 65%,#fff 80%,#888 100%);
            background-size:200% auto;
            -webkit-background-clip:text;
            -webkit-text-fill-color:transparent;
            background-clip:text;
            animation:chrome-shimmer 3s linear infinite;
          }
          .chrome-border{
            border:1px solid transparent !important;
            background:linear-gradient(#152234,#152234) padding-box,
                        linear-gradient(135deg,#666,#fff,#aaa,#fff,#666) border-box;
          }
          .chrome-border-light{
            border:1px solid transparent !important;
            background:linear-gradient(#0E1825,#0E1825) padding-box,
                        linear-gradient(135deg,#555,#ddd,#888,#ddd,#555) border-box;
          }
          .sun-glow{animation:sun-pulse 2.5s ease-in-out infinite}
          .slide-up{animation:slide-up 0.6s ease-out forwards}
          .mustang-card:hover{transform:translateY(-4px);box-shadow:0 12px 40px rgba(204,0,0,0.3)}
          .mustang-card{transition:all 0.25s ease}
          .nav-glow:hover{text-shadow:0 0 8px currentColor}
        `}</style>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
