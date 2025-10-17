'use server';

import { revalidatePath } from 'next/cache';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { logAuditEvent } from '@/lib/audit';
import {
  RESOURCE_KIND_LABELS,
  assertAllowedEmbedUrl,
  normalizeResourceSlug,
  type Resource,
} from '@/lib/resources';
import { sanitizeResourceHtml } from '@/lib/sanitize-resource-html';
import { sanitizeEmbedHtml } from '@/lib/sanitize-embed';

type ResourceAttachmentInput = {
  label: string;
  url: string;
};

export async function createResourcePage(formData: FormData) {
  const supa = await createSupabaseServerClient();
  const portalClient = supa.schema('portal');

  const actorProfileId = formData.get('actor_profile_id') as string | null;
  if (!actorProfileId) {
    throw new Error('Admin context is required.');
  }

  const {
    data: { user },
    error: userError,
  } = await supa.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error('Sign in to continue.');
  }

  const { data: actorProfile, error: actorProfileError } = await portalClient
    .from('profiles')
    .select('id, role, user_id')
    .eq('id', actorProfileId)
    .maybeSingle();

  if (actorProfileError || !actorProfile || actorProfile.user_id !== user.id || actorProfile.role !== 'admin') {
    throw new Error('Admin access is required to publish resources.');
  }

  const title = (formData.get('title') as string | null)?.trim() ?? '';
  if (!title) {
    throw new Error('Add a resource title.');
  }

  const slugInput = (formData.get('slug') as string | null)?.trim() ?? '';
  let slug = normalizeResourceSlug(slugInput || title);
  if (!slug) {
    slug = `resource-${Date.now()}`;
  }

  const kindInput = (formData.get('kind') as string | null)?.trim() ?? '';
  if (!kindInput || !Object.hasOwn(RESOURCE_KIND_LABELS, kindInput)) {
    throw new Error('Select a valid resource type.');
  }
  const kind = kindInput as Resource['kind'];

  const datePublished = (formData.get('date_published') as string | null)?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePublished)) {
    throw new Error('Enter the publication date in YYYY-MM-DD format.');
  }

  const summary = (formData.get('summary') as string | null)?.trim() || null;
  const location = (formData.get('location') as string | null)?.trim() || null;
  const tags = parseResourceTagsInput((formData.get('tags') as string | null) ?? '');
  const attachments = parseResourceAttachmentsInput((formData.get('attachments') as string | null) ?? '');

  const embedPayload = buildResourceEmbedPayload({
    type: (formData.get('embed_type') as string | null) ?? 'none',
    url: (formData.get('embed_url') as string | null) ?? '',
    provider: (formData.get('embed_provider') as string | null) ?? 'youtube',
    label: (formData.get('embed_label') as string | null) ?? '',
    html: (formData.get('embed_html') as string | null) ?? '',
  });

  const bodyHtmlRaw = (formData.get('body_html') as string | null) ?? '';
  const bodyHtml = sanitizeResourceHtml(bodyHtmlRaw);
  const isPublished = formData.get('is_published') === 'on';

  const { data: inserted, error: insertError } = await portalClient
    .from('resource_pages')
    .insert({
      slug,
      title,
      kind,
      date_published: datePublished,
      summary,
      location,
      tags,
      attachments,
      embed: embedPayload,
      body_html: bodyHtml,
      is_published: isPublished,
      created_by_profile_id: actorProfileId,
      updated_by_profile_id: actorProfileId,
    })
    .select('id, slug')
    .maybeSingle();

  if (insertError) {
    throw insertError;
  }

  await logAuditEvent(supa, {
    actorProfileId,
    action: 'resource_page_created',
    entityType: 'resource_page',
    entityId: inserted?.id ?? null,
    meta: {
      slug,
      kind,
      is_published: isPublished,
      tags,
    },
  });

  revalidatePath('/command-center/admin');
  revalidatePath('/resources');
  revalidatePath(`/resources/${slug}`);
  revalidatePath('/sitemap.xml');
}

export async function updateResourcePage(formData: FormData) {
  const supa = await createSupabaseServerClient();
  const portalClient = supa.schema('portal');

  const actorProfileId = formData.get('actor_profile_id') as string | null;
  const resourceId = formData.get('resource_id') as string | null;
  const currentSlug = (formData.get('current_slug') as string | null)?.trim() ?? null;

  if (!actorProfileId || !resourceId) {
    throw new Error('Admin context is required.');
  }

  const {
    data: { user },
    error: userError,
  } = await supa.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error('Sign in to continue.');
  }

  const { data: actorProfile, error: actorProfileError } = await portalClient
    .from('profiles')
    .select('id, role, user_id')
    .eq('id', actorProfileId)
    .maybeSingle();

  if (actorProfileError || !actorProfile || actorProfile.user_id !== user.id || actorProfile.role !== 'admin') {
    throw new Error('Admin access is required to update resources.');
  }

  const { data: existing, error: existingError } = await portalClient
    .from('resource_pages')
    .select('slug')
    .eq('id', resourceId)
    .maybeSingle();

  if (existingError || !existing) {
    throw existingError ?? new Error('Resource not found.');
  }

  const title = (formData.get('title') as string | null)?.trim() ?? '';
  if (!title) {
    throw new Error('Add a resource title.');
  }

  const slugInput = (formData.get('slug') as string | null)?.trim() ?? '';
  let slug = normalizeResourceSlug(slugInput || title);
  if (!slug) {
    slug = existing.slug;
  }

  const kindInput = (formData.get('kind') as string | null)?.trim() ?? '';
  if (!kindInput || !Object.hasOwn(RESOURCE_KIND_LABELS, kindInput)) {
    throw new Error('Select a valid resource type.');
  }
  const kind = kindInput as Resource['kind'];

  const datePublished = (formData.get('date_published') as string | null)?.trim() ?? '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datePublished)) {
    throw new Error('Enter the publication date in YYYY-MM-DD format.');
  }

  const summary = (formData.get('summary') as string | null)?.trim() || null;
  const location = (formData.get('location') as string | null)?.trim() || null;
  const tags = parseResourceTagsInput((formData.get('tags') as string | null) ?? '');
  const attachments = parseResourceAttachmentsInput((formData.get('attachments') as string | null) ?? '');

  const embedPayload = buildResourceEmbedPayload({
    type: (formData.get('embed_type') as string | null) ?? 'none',
    url: (formData.get('embed_url') as string | null) ?? '',
    provider: (formData.get('embed_provider') as string | null) ?? 'youtube',
    label: (formData.get('embed_label') as string | null) ?? '',
    html: (formData.get('embed_html') as string | null) ?? '',
  });

  const bodyHtmlRaw = (formData.get('body_html') as string | null) ?? '';
  const bodyHtml = sanitizeResourceHtml(bodyHtmlRaw);
  const isPublished = formData.get('is_published') === 'on';

  const { error: updateError } = await portalClient
    .from('resource_pages')
    .update({
      slug,
      title,
      kind,
      date_published: datePublished,
      summary,
      location,
      tags,
      attachments,
      embed: embedPayload,
      body_html: bodyHtml,
      is_published: isPublished,
      updated_by_profile_id: actorProfileId,
    })
    .eq('id', resourceId);

  if (updateError) {
    throw updateError;
  }

  await logAuditEvent(supa, {
    actorProfileId,
    action: 'resource_page_updated',
    entityType: 'resource_page',
    entityId: resourceId,
    meta: {
      slug,
      kind,
      is_published: isPublished,
      tags,
    },
  });

  revalidatePath('/command-center/admin');
  revalidatePath('/resources');
  revalidatePath(`/resources/${slug}`);
  if (currentSlug && currentSlug !== slug) {
    revalidatePath(`/resources/${currentSlug}`);
  }
  revalidatePath('/sitemap.xml');
}

export async function deleteResourcePage(formData: FormData) {
  const supa = await createSupabaseServerClient();
  const portalClient = supa.schema('portal');

  const actorProfileId = formData.get('actor_profile_id') as string | null;
  const resourceId = formData.get('resource_id') as string | null;
  const resourceSlug = (formData.get('resource_slug') as string | null)?.trim() ?? null;

  if (!actorProfileId || !resourceId) {
    throw new Error('Admin context is required.');
  }

  const {
    data: { user },
    error: userError,
  } = await supa.auth.getUser();

  if (userError || !user) {
    throw userError ?? new Error('Sign in to continue.');
  }

  const { data: actorProfile, error: actorProfileError } = await portalClient
    .from('profiles')
    .select('id, role, user_id')
    .eq('id', actorProfileId)
    .maybeSingle();

  if (actorProfileError || !actorProfile || actorProfile.user_id !== user.id || actorProfile.role !== 'admin') {
    throw new Error('Admin access is required to remove resources.');
  }

  const { error: deleteError } = await portalClient.from('resource_pages').delete().eq('id', resourceId);
  if (deleteError) {
    throw deleteError;
  }

  await logAuditEvent(supa, {
    actorProfileId,
    action: 'resource_page_deleted',
    entityType: 'resource_page',
    entityId: resourceId,
    meta: {
      slug: resourceSlug,
    },
  });

  revalidatePath('/command-center/admin');
  revalidatePath('/resources');
  if (resourceSlug) {
    revalidatePath(`/resources/${resourceSlug}`);
  }
  revalidatePath('/sitemap.xml');
}

export function parseResourceTagsInput(input: string): string[] {
  return input
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => entry.toLowerCase())
    .slice(0, 20);
}

export function parseResourceAttachmentsInput(input: string): ResourceAttachmentInput[] {
  const lines = input
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const attachments: ResourceAttachmentInput[] = [];

  for (const line of lines) {
    const [labelPart, urlPart] = line.split('|').map((segment) => segment.trim());
    const urlCandidate = urlPart ?? labelPart ?? '';
    if (!urlCandidate) {
      continue;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = new URL(urlCandidate).toString();
    } catch (error) {
      throw new Error(`Attachment URL must be valid. Check: ${urlCandidate}`);
    }

    const label = labelPart && urlPart ? labelPart : normalizedUrl;
    attachments.push({ label: label.slice(0, 160), url: normalizedUrl });
  }

  return attachments.slice(0, 10);
}

export function buildResourceEmbedPayload(values: {
  type: string | null;
  url?: string | null;
  provider?: string | null;
  label?: string | null;
  html?: string | null;
}): Record<string, unknown> | null {
  const type = values.type ?? 'none';
  if (!type || type === 'none') {
    return null;
  }

  switch (type) {
    case 'google-doc':
    case 'pdf': {
      const url = values.url?.trim();
      if (!url) {
        throw new Error('Provide a URL for the embed.');
      }
      assertAllowedEmbedUrl(url, 'resource_embed');
      return { type, url };
    }
    case 'video': {
      const url = values.url?.trim();
      const provider = values.provider === 'vimeo' ? 'vimeo' : 'youtube';
      if (!url) {
        throw new Error('Provide a video URL to embed.');
      }
      assertAllowedEmbedUrl(url, 'resource_video_embed');
      return { type, url, provider };
    }
    case 'external': {
      const url = values.url?.trim();
      if (!url) {
        throw new Error('Provide the external resource URL.');
      }
      return { type, url, label: values.label?.trim() || undefined };
    }
    case 'html': {
      const html = values.html?.trim();
      if (!html) {
        throw new Error('Paste the HTML snippet you would like to embed.');
      }
      return { type, html: sanitizeEmbedHtml(html) };
    }
    default:
      return null;
  }
}

export function attachmentsToTextarea(attachments: ResourceAttachmentInput[]): string {
  if (!attachments.length) {
    return '';
  }

  return attachments.map((attachment) => `${attachment.label} | ${attachment.url}`).join('\n');
}

export function getResourceEmbedDefaults(resource: Resource): {
  type: string;
  url: string;
  provider: 'youtube' | 'vimeo';
  label: string;
  html: string;
} {
  const embed = resource.embed;
  if (!embed) {
    return {
      type: 'none',
      url: '',
      provider: 'youtube',
      label: '',
      html: '',
    };
  }

  switch (embed.type) {
    case 'google-doc':
    case 'pdf':
      return {
        type: embed.type,
        url: embed.url,
        provider: 'youtube',
        label: '',
        html: '',
      };
    case 'video':
      return {
        type: 'video',
        url: embed.url,
        provider: embed.provider,
        label: '',
        html: '',
      };
    case 'external':
      return {
        type: 'external',
        url: embed.url,
        provider: 'youtube',
        label: embed.label ?? '',
        html: '',
      };
    case 'html':
      return {
        type: 'html',
        url: '',
        provider: 'youtube',
        label: '',
        html: embed.html,
      };
    default:
      return {
        type: 'none',
        url: '',
        provider: 'youtube',
        label: '',
        html: '',
      };
  }
}
