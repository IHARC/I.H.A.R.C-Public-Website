'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

const FALLBACK_SUPABASE_URL = 'https://iharc-portal.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'public-anon-key-placeholder-iharc';

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? FALLBACK_SUPABASE_ANON_KEY;

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
