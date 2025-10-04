import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for portal-moderate');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type IdeaStatus =
  | 'new'
  | 'under_review'
  | 'in_progress'
  | 'adopted'
  | 'not_feasible'
  | 'archived';

type ModeratePayload =
  | {
      action: 'update_status';
      idea_id: string;
      status: IdeaStatus;
      official_response?: {
        body: string;
        attachments?: unknown;
      };
    }
  | {
      action: 'resolve_flag';
      flag_id: string;
      status: 'resolved' | 'rejected';
      notes?: string;
    }
  | {
    action: 'archive_content';
    entity_type: 'idea' | 'comment';
    entity_id: string;
    reason?: string;
  };

const MODERATION_ROLES = new Set(['moderator', 'admin', 'org_rep']);

async function hashValue(value: string) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing bearer token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const accessToken = authHeader.slice('Bearer '.length);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(accessToken);

  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from('portal.profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Profile not found' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!MODERATION_ROLES.has(profile.role)) {
    return new Response(JSON.stringify({ error: 'Insufficient permissions' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: ModeratePayload;
  try {
    payload = await req.json();
  } catch (error) {
    console.error('Invalid moderation payload', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  const ua = req.headers.get('user-agent');
  const ipHash = ip ? await hashValue(ip) : null;

  async function logAudit(entry: { action: string; entity_type: string; entity_id: string | null; meta?: Record<string, unknown> }) {
    const meta = {
      ...(entry.meta ?? {}),
      ip_hash: ipHash,
      user_agent: ua ?? null,
    };

    await supabase.from('portal.audit_log').insert({
      actor_profile_id: profile.id,
      actor_user_id: user.id,
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      meta,
    });
  }

  try {
    switch (payload.action) {
      case 'update_status': {
        const { idea_id, status, official_response } = payload;
        const { error } = await supabase
          .from('portal.ideas')
          .update({ status })
          .eq('id', idea_id);
        if (error) throw error;

        if (official_response?.body?.trim()) {
          const responseBody = official_response.body.trim().slice(0, 5000);
          const insertResult = await supabase.from('portal.comments').insert({
            idea_id,
            author_profile_id: profile.id,
            body: responseBody,
            is_official: true,
          });
          if (insertResult.error) throw insertResult.error;
        }

        await logAudit({
          action: `idea_status_${status}`,
          entity_type: 'idea',
          entity_id: idea_id,
          meta: {
            status,
            official_response: Boolean(official_response?.body?.trim()),
          },
        });

        return new Response(JSON.stringify({ status: 'updated' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
     case 'resolve_flag': {
       const { flag_id, status, notes } = payload;
        const { error } = await supabase
          .from('portal.flags')
          .update({
            status,
            resolved_by_profile_id: profile.id,
            resolved_at: new Date().toISOString(),
          })
          .eq('id', flag_id);
        if (error) throw error;

        await logAudit({
          action: `flag_${status}`,
          entity_type: 'flag',
          entity_id: flag_id,
          meta: { notes: notes ?? null },
        });

        return new Response(JSON.stringify({ status: 'flag_updated' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      case 'archive_content': {
        const { entity_type, entity_id, reason } = payload;
        if (entity_type === 'idea') {
          const { error } = await supabase
            .from('portal.ideas')
            .update({ status: 'archived' })
            .eq('id', entity_id);
          if (error) throw error;
        } else {
          const sanitizedBody = '[removed by moderation]';
          const { error } = await supabase
            .from('portal.comments')
            .update({ body: sanitizedBody })
            .eq('id', entity_id);
          if (error) throw error;
        }

        await logAudit({
          action: 'archive_content',
          entity_type,
          entity_id,
          meta: { reason: reason ?? null },
        });

        return new Response(JSON.stringify({ status: 'archived' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      default:
        return new Response(JSON.stringify({ error: 'Unsupported action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Moderation error', error);
    return new Response(JSON.stringify({ error: 'Moderation action failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
