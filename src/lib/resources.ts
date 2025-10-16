import { RESOURCE_KIND_LABELS, type Resource, type ResourceKind, resources } from '@/data/resources';

export const ALLOWED_EMBED_HOSTS = new Set([
  'docs.google.com',
  'drive.google.com',
  'www.youtube.com',
  'youtube.com',
  'youtu.be',
  'player.vimeo.com',
  'vimeo.com',
  'iharc.ca',
]);

export type ResourceFilters = {
  q?: string | null;
  kind?: ResourceKind | null;
  tag?: string | null;
  year?: string | null;
};

export function listResources(filters: ResourceFilters = {}): Resource[] {
  return filterResources(resources, filters);
}

export function filterResources(dataset: Resource[], filters: ResourceFilters = {}): Resource[] {
  const { q, kind, tag, year } = normalizeFilters(filters);
  const searchTerm = q?.trim().toLowerCase();
  const tagFilter = tag?.toLowerCase();

  const items = dataset
    .filter((resource) => {
      if (kind && resource.kind !== kind) {
        return false;
      }

      if (year && !resource.datePublished.startsWith(year)) {
        return false;
      }

      if (tagFilter && !resource.tags.some((entry) => entry.toLowerCase() === tagFilter)) {
        return false;
      }

      if (!searchTerm) {
        return true;
      }

      const haystack = [
        resource.title,
        resource.summary ?? '',
        resource.location ?? '',
        resource.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(searchTerm);
    })
    .sort((a, b) => new Date(b.datePublished).getTime() - new Date(a.datePublished).getTime());

  return items;
}

export function normalizeFilters(filters: ResourceFilters): Required<ResourceFilters> {
  const normalized = {
    q: filters.q?.toString().trim() || null,
    kind: filters.kind ?? null,
    tag: filters.tag?.toString().trim() || null,
    year: filters.year?.toString().trim() || null,
  } as Required<ResourceFilters>;

  if (normalized.kind && !Object.hasOwn(RESOURCE_KIND_LABELS, normalized.kind)) {
    normalized.kind = null;
  }

  if (normalized.year && !/^\d{4}$/.test(normalized.year)) {
    normalized.year = null;
  }

  if (normalized.tag) {
    normalized.tag = normalized.tag.toLowerCase();
  }

  return normalized;
}

export function getResourceYears(): string[] {
  const years = new Set<string>();
  for (const resource of resources) {
    if (resource.datePublished) {
      years.add(resource.datePublished.slice(0, 4));
    }
  }
  return Array.from(years).sort((a, b) => Number(b) - Number(a));
}

export function getResourceTags(): string[] {
  const tags = new Set<string>();
  for (const resource of resources) {
    for (const tag of resource.tags) {
      tags.add(tag.toLowerCase());
    }
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export function formatResourceDate(value: string) {
  return new Intl.DateTimeFormat('en-CA', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function isAllowedEmbedUrl(rawUrl: string | URL) {
  try {
    const parsed = rawUrl instanceof URL ? rawUrl : new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();
    return ALLOWED_EMBED_HOSTS.has(hostname);
  } catch (error) {
    return false;
  }
}

export function assertAllowedEmbedUrl(rawUrl: string, context: string) {
  if (!isAllowedEmbedUrl(rawUrl)) {
    throw new Error(`Blocked embed host for ${context}`);
  }
  return rawUrl;
}

export function getKindLabel(kind: ResourceKind) {
  return RESOURCE_KIND_LABELS[kind];
}
