import { describe, it, expect } from 'vitest';
import { filterResources, normalizeFilters, isAllowedEmbedUrl } from '../src/lib/resources';
import { sanitizeEmbedHtml } from '../src/lib/sanitize-embed';
import type { Resource } from '../src/lib/resources';

const mockResources: Resource[] = [
  {
    id: 'resource-1',
    slug: 'delegation-a',
    title: 'Cobourg Delegation on Winter Shelter Expansion',
    kind: 'delegation',
    contentChannel: 'resources',
    datePublished: '2024-02-15',
    summary: 'Update to council on emergency shelter expansion plans.',
    location: 'Cobourg Council Chambers',
    tags: ['cobourg', 'emergency response'],
    attachments: [],
    embed: { type: 'external', url: 'https://iharc.ca/resources/delegation-a' },
    embedPlacement: 'above',
    bodyHtml: '<p>Delegation summary</p>',
    isPublished: true,
    coverImage: null,
    createdAt: '2024-02-10T10:00:00.000Z',
    updatedAt: '2024-02-16T10:00:00.000Z',
  },
  {
    id: 'resource-2',
    slug: 'report-b',
    title: 'Northumberland Housing Report 2023',
    kind: 'report',
    contentChannel: 'resources',
    datePublished: '2023-11-30',
    summary: 'Annual snapshot of coordinated housing work.',
    tags: ['housing', 'annual'],
    attachments: [],
    embed: { type: 'external', url: 'https://iharc.ca/resources/report-b' },
    embedPlacement: 'above',
    bodyHtml: '<p>Report summary</p>',
    isPublished: true,
    coverImage: null,
    createdAt: '2023-11-15T10:00:00.000Z',
    updatedAt: '2023-12-01T10:00:00.000Z',
  },
  {
    id: 'resource-3',
    slug: 'policy-c',
    title: 'Naloxone Policy Brief',
    kind: 'policy',
    contentChannel: 'resources',
    datePublished: '2022-06-12',
    tags: ['overdose response'],
    attachments: [],
    embed: { type: 'external', url: 'https://iharc.ca/resources/policy-c' },
    embedPlacement: 'above',
    summary: null,
    location: null,
    bodyHtml: '<p>Policy summary</p>',
    isPublished: true,
    coverImage: null,
    createdAt: '2022-06-01T10:00:00.000Z',
    updatedAt: '2022-06-13T10:00:00.000Z',
  },
];

describe('resource filtering', () => {
  it('filters by search term across title, summary, location, and tags', () => {
    const filtered = filterResources(mockResources, { q: 'Cobourg' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].slug).toBe('delegation-a');
  });

  it('filters by kind, tag, and year while sorting newest first', () => {
    const normalized = normalizeFilters({ kind: 'report', tag: 'HOUSING', year: '2023' });
    const filtered = filterResources(mockResources, normalized);
    expect(filtered).toHaveLength(1);
    expect(filtered[0].slug).toBe('report-b');

    const sorted = filterResources(mockResources, {});
    expect(sorted.map((resource) => resource.slug)).toEqual(['delegation-a', 'report-b', 'policy-c']);
  });

  it('ignores invalid filter values gracefully', () => {
    const normalized = normalizeFilters({ kind: 'unknown' as never, year: '20ab', tag: null });
    expect(normalized.kind).toBeNull();
    expect(normalized.year).toBeNull();
  });
});

describe('resource embed sanitization', () => {
  it('strips scripts and disallowed iframe hosts', () => {
    const dirty = `
      <div>
        <script>alert('xss')</script>
        <iframe src="https://evil.com/embed"></iframe>
        <iframe src="https://docs.google.com/document/d/e/example/pub?embedded=true"></iframe>
      </div>
    `;
    const clean = sanitizeEmbedHtml(dirty);
    expect(clean).not.toContain('script');
    expect(clean).not.toContain('evil.com');
    expect(clean).toContain('docs.google.com');
    expect(clean).toContain('loading="lazy"');
  });

  it('validates allowed embed hosts', () => {
    expect(isAllowedEmbedUrl('https://docs.google.com/document/d/abc/pub')).toBe(true);
    expect(isAllowedEmbedUrl('https://example.com/resource')).toBe(false);
  });
});
