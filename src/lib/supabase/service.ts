import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const FALLBACK_SUPABASE_URL = 'https://iharc-portal.supabase.co';
const FALLBACK_SUPABASE_SERVICE_KEY = 'service-role-key-placeholder-iharc';

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? FALLBACK_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? FALLBACK_SUPABASE_SERVICE_KEY;

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}
