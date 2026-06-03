import Link from 'next/link'
export default function LoginPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ textDecoration: 'none', fontSize: '2rem', fontWeight: 900 }}>
            <span style={{ color: 'white' }}>Rev</span><span style={{ color: '#E63946' }}>Connect</span><span style={{ color: '#F4A261' }}>-1</span>
          </Link>
          <p style={{ color: '#777', marginTop: '0.5rem' }}>Sign in to your account</p>
        </div>
        <div style={{ background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '1rem', padding: '2rem' }}>
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Email</label>
              <input type="email" placeholder="you@example.com" style={{ width: '100%', background: '#0D0D0D', border: '1px solid #2a2a3e', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white', fontSize: '0.875rem', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#aaa', marginBottom: '0.5rem' }}>Password</label>
              <input type="password" placeholder="••••••••" style={{ width: '100%', background: '#0D0D0D', border: '1px solid #2a2a3e', borderRadius: '0.75rem', padding: '0.75rem 1rem', color: 'white', fontSize: '0.875rem', outline: 'none' }} />
            </div>
            <button type="submit" style={{ background: '#E63946', color: 'white', border: 'none', padding: '0.875rem', borderRadius: '0.75rem', fontWeight: 700, fontSize: '1rem', cursor: 'pointer' }}>Sign In</button>
          </form>
        </div>
        <p style={{ textAlign: 'center', color: '#666', marginTop: '1.5rem', fontSize: '0.875rem' }}>
          No account? <Link href="/register" style={{ color: '#E63946' }}>Join RevConnect-1</Link>
        </p>
      </div>
    </div>
  )
}
