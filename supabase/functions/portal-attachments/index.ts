import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type AttachmentRequest = {
  path: string;
  name: string;
};

type AttachmentResponse = {
  path: string;
  name: string;
  signedUrl: string;
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for portal-attachments');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

serve(async (req) => {
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Missing bearer token' }, 401);
  }

  const accessToken = authHeader.slice('Bearer '.length);

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return jsonResponse({ error: 'Invalid token' }, 401);
  }

  let payload: { attachments?: unknown };
  try {
    payload = await req.json();
  } catch (error) {
    console.error('portal-attachments invalid JSON', error);
    return jsonResponse({ error: 'Invalid JSON payload' }, 400);
  }

  const attachments = Array.isArray(payload.attachments)
    ? (payload.attachments.filter((item): item is AttachmentRequest => {
        return typeof item?.path === 'string' && typeof item?.name === 'string';
      }) as AttachmentRequest[])
    : [];

  if (!attachments.length) {
    return jsonResponse({ attachments: [] });
  }

  const { data: profile, error: profileError } = await supabase
    .from('portal.profiles')
    .select('id, role')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return jsonResponse({ error: 'Profile not found for current user' }, 403);
  }

  const uniqueIdeaIds = new Set<string>();
  const parsedAttachments = attachments
    .map((attachment) => {
      const segments = attachment.path.split('/');
      if (segments.length < 2 || segments[0] !== 'idea') {
        return null;
      }
      const ideaId = segments[1];
      uniqueIdeaIds.add(ideaId);
      return { ...attachment, ideaId };
    })
    .filter((item): item is AttachmentRequest & { ideaId: string } => Boolean(item));

  if (!parsedAttachments.length) {
    return jsonResponse({ attachments: [] });
  }

  const ideaIds = Array.from(uniqueIdeaIds);
  const { data: ideas, error: ideasError } = await supabase
    .from('portal.ideas')
    .select('id, author_profile_id, publication_status')
    .in('id', ideaIds);

  if (ideasError) {
    console.error('portal-attachments failed to load ideas', ideasError);
    return jsonResponse({ error: 'Unable to load attachments' }, 500);
  }

  const ideaMap = new Map<string, { author_profile_id: string | null; publication_status: string }>();
  for (const idea of ideas ?? []) {
    ideaMap.set(idea.id, {
      author_profile_id: idea.author_profile_id,
      publication_status: idea.publication_status ?? 'draft',
    });
  }

  const results: AttachmentResponse[] = [];

  for (const attachment of parsedAttachments) {
    const idea = ideaMap.get(attachment.ideaId);
    if (!idea) {
      continue;
    }

    const isModerator = profile.role === 'moderator' || profile.role === 'admin';
    const isAuthor = idea.author_profile_id === profile.id;
    const isPublished = idea.publication_status === 'published';

    if (!(isModerator || isAuthor || isPublished)) {
      continue;
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from('portal-attachments')
      .createSignedUrl(attachment.path, 120);

    if (signedError || !signed?.signedUrl) {
      console.error('portal-attachments failed to sign object', attachment.path, signedError);
      continue;
    }

    results.push({
      path: attachment.path,
      name: attachment.name,
      signedUrl: signed.signedUrl,
    });
  }

  return jsonResponse({ attachments: results });
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    },
  });
}
