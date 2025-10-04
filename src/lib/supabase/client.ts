'use client';

import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vfavknkfiiclzgpjpntj.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? 'sb_publishable_DpKb92A7lPsPjK0Q3DHw0A_RtkRomXp';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseKey);
}
