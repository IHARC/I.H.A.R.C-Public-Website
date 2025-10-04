import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export function createSupabaseServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are not configured');
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
    },
  });
}
