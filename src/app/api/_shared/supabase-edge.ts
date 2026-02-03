import { NextResponse } from 'next/server';

type InvokeResult<T> = {
  data: T | null;
  status: number;
  headers: Headers;
};

function requirePublicEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

export async function invokeSupabaseEdgeFunction<T>(functionName: string, body: unknown): Promise<InvokeResult<T>> {
  const supabaseUrl = requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabasePublishableKey = requirePublicEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');

  const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: supabasePublishableKey,
      Authorization: `Bearer ${supabasePublishableKey}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const headers = response.headers;
  const status = response.status;

  let data: T | null = null;
  try {
    data = (await response.json()) as T;
  } catch {
    data = null;
  }

  return { data, status, headers };
}

export function jsonFromUpstream<T>(result: InvokeResult<T>) {
  return NextResponse.json(result.data ?? { error: 'Upstream did not return JSON' }, { status: result.status });
}
