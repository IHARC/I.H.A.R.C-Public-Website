import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { Database } from './src/types/supabase';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://vfavknkfiiclzgpjpntj.supabase.co';
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ?? 'sb_publishable_DpKb92A7lPsPjK0Q3DHw0A_RtkRomXp';

  if (!supabaseUrl || !supabaseKey) {
    console.warn('Supabase environment variables are not configured for middleware');
    return res;
  }

  const supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies) {
        cookies.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options });
        });
      },
    },
  });

  await supabase.auth.getSession();
  return res;
}

export const config = {
  matcher: ['/((?!.+\.[\w]+$|_next).*)', '/'],
};
