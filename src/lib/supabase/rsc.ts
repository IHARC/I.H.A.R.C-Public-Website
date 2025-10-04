import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase';

export function createSupabaseRSCClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vfavknkfiiclzgpjpntj.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? 'sb_publishable_DpKb92A7lPsPjK0Q3DHw0A_RtkRomXp';

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  const cookieStore = cookies();

  return createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });
}
