'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';

export function createSupabaseClient() {
  return createClientComponentClient<Database>();
}
