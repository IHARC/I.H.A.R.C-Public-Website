'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
