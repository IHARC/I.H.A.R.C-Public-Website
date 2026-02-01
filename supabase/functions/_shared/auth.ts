import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { requireEnv } from './env.ts';

const SUPABASE_URL = requireEnv('SUPABASE_URL');
const SB_PUBLISHABLE_KEY = requireEnv('SB_PUBLISHABLE_KEY');

type AuthResult =
  | { ok: true; accessToken: string; userId: string; userEmail: string | null }
  | { ok: false; error: string };

function parseBearerToken(req: Request): string | null {
  const authHeader = req.headers.get('authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  return token.length > 0 ? token : null;
}

export async function requireAuth(req: Request): Promise<AuthResult> {
  const accessToken = parseBearerToken(req);
  if (!accessToken) {
    return { ok: false, error: 'Missing bearer token' };
  }

  const authClient = createClient(SUPABASE_URL, SB_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });

  const {
    data: { user },
    error,
  } = await authClient.auth.getUser(accessToken);

  if (error || !user?.id) {
    return { ok: false, error: 'Invalid token' };
  }

  return { ok: true, accessToken, userId: user.id, userEmail: user.email ?? null };
}
