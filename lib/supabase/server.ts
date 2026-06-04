import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODk5NjMsImV4cCI6MjA5NjA2NTk2M30.SnLIQX-Ntn0ba3Ap1lcfG8RULan15E3qGwRAMoDtrXo'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() { return cookieStore.getAll() },
      setAll(cookiesToSet) {
        try { cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)) } catch {}
      },
    },
  })
}

export function createAdminClient() {
  const cookieStore = cookies()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KE ?? KEY
  return createServerClient(URL, serviceKey, {
    cookies: { getAll() { return cookieStore.getAll() }, setAll() {} },
  })
}
