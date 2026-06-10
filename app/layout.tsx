import type { Metadata } from 'next'
import { AuthProvider } from './providers/auth-provider'
import MusicPlayer from './providers/music-player'

export const metadata: Metadata = {
  title: { default: 'VictoryRevConnect-1', template: '%s | VictoryRevConnect-1' },
  description: 'The ultimate all-in-one platform for car enthusiasts.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <style>{`
          *{box-sizing:border-box;margin:0;padding:0}
          body{background:#1B2A3E;color:white;font-family:system-ui,-apple-system,sans-serif}
          a{color:inherit;text-decoration:none}
          input,select,textarea,button{font-family:inherit}
          ::-webkit-scrollbar{width:5px}
          ::-webkit-scrollbar-track{background:#243547}
          ::-webkit-scrollbar-thumb{background:linear-gradient(180deg,#CC0000,#FFD700);border-radius:3px}
          ::selection{background:#CC0000;color:white}
          @keyframes chrome-shimmer{0%{background-position:200% center}100%{background-position:-200% center}}
          @keyframes glow-pulse{0%,100%{opacity:0.7}50%{opacity:1}}
          .chrome-text{background:linear-gradient(90deg,#A0A0A0 0%,#FFFFFF 25%,#D0D0D0 45%,#FFFFFF 60%,#A0A0A0 80%,#FFFFFF 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:chrome-shimmer 2.5s linear infinite}
          .card-hover{transition:transform 0.2s,box-shadow 0.2s}
          .card-hover:hover{transform:translateY(-4px)}
          .chrome-pill{background:linear-gradient(135deg,rgba(192,192,192,0.15),rgba(255,255,255,0.08));border:1px solid rgba(255,255,255,0.2);backdrop-filter:blur(4px)}
        `}</style>
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <MusicPlayer />
      </body>
    </html>
  )
}
