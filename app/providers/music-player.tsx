'use client'

import { useEffect, useRef, useState } from 'react'

// Replace this URL with your uploaded audio file URL
// Upload your MP3/WAV to: Supabase Dashboard → Storage → audio → Upload
const AUDIO_URL = process.env.NEXT_PUBLIC_MUSIC_URL ?? ''

export default function MusicPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [playing, setPlaying] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [visible, setVisible] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!AUDIO_URL) return
    const audio = new Audio(AUDIO_URL)
    audio.loop = false
    audio.preload = 'metadata'
    audio.addEventListener('canplaythrough', () => setLoaded(true))
    audio.addEventListener('ended', () => { setPlaying(false); setProgress(0) })
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    })
    audioRef.current = audio
    return () => { audio.pause(); audio.src = '' }
  }, [])

  function toggle() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play().then(() => setPlaying(true)).catch(() => {}) }
  }

  // Don't render if no audio URL configured
  if (!AUDIO_URL) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 999,
      display: visible ? 'flex' : 'none',
      alignItems: 'center',
      gap: '0.75rem',
      background: 'rgba(13,30,48,0.92)',
      border: '1px solid rgba(204,0,0,0.35)',
      borderRadius: '9999px',
      padding: '0.5rem 1rem 0.5rem 0.625rem',
      backdropFilter: 'blur(12px)',
      boxShadow: playing ? '0 4px 24px rgba(204,0,0,0.4), 0 0 40px rgba(204,0,0,0.15)' : '0 4px 20px rgba(0,0,0,0.4)',
      transition: 'box-shadow 0.3s',
    }}>
      {/* Play/Pause button */}
      <button
        onClick={toggle}
        style={{
          width: '40px', height: '40px',
          borderRadius: '50%',
          border: 'none',
          background: playing
            ? 'linear-gradient(135deg, #CC0000, #AA0000)'
            : 'rgba(204,0,0,0.15)',
          color: 'white',
          fontSize: '1rem',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: playing ? '0 0 16px rgba(204,0,0,0.5)' : 'none',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        {playing ? '⏸' : '▶'}
      </button>

      {/* Info + progress */}
      <div style={{ minWidth: '120px' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', marginBottom: '0.25rem', whiteSpace: 'nowrap' }}>
          {playing ? '♪ Now Playing' : '🎵 VictoryRevConnect-1'}
        </p>
        {/* Progress bar */}
        <div style={{ height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '9999px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #CC0000, #FFD700)',
            borderRadius: '9999px',
            transition: 'width 0.1s linear',
          }} />
        </div>
      </div>

      {/* Equalizer animation when playing */}
      {playing && (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2px', height: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              width: '3px',
              background: '#CC0000',
              borderRadius: '2px',
              animation: `eq${i} 0.${4+i}s ease-in-out infinite alternate`,
            }} />
          ))}
          <style>{`
            @keyframes eq1{from{height:4px}to{height:14px}}
            @keyframes eq2{from{height:8px}to{height:6px}}
            @keyframes eq3{from{height:12px}to{height:4px}}
          `}</style>
        </div>
      )}

      {/* Close */}
      <button
        onClick={() => setVisible(false)}
        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, padding: '0 0.25rem' }}
      >
        ×
      </button>
    </div>
  )
}
