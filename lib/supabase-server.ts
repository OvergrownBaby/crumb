import { createClient } from '@supabase/supabase-js'

// Server-side client with the secret key. Never import from client components.
export function supabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const secret = process.env.SUPABASE_SECRET_KEY
  if (!url || !secret) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY')
  }
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
