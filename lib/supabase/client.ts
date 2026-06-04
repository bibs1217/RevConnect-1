import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vthpgqhlhihnoeawjdyc.supabase.co'
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0aHBncWhsaGlobm9lYXdqZHljIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0ODk5NjMsImV4cCI6MjA5NjA2NTk2M30.SnLIQX-Ntn0ba3Ap1lcfG8RULan15E3qGwRAMoDtrXo'

export function createClient() {
  return createBrowserClient(URL, KEY)
}
