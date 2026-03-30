import { unstable_cache } from 'next/cache';
import type { Database } from '@/types/supabase';
import { getSupabasePublicClient } from '@/lib/supabase/public-client';
import { CACHE_TAGS } from '@/lib/cache/tags';
import { sanitizeResourceHtml } from '@/lib/sanitize-resource-html';

export const CONTROLLED_DOCUMENT_CATEGORY_LABELS = {
  governance: 'Governance',
  service_delivery: 'Service delivery',
  communications: 'Communications',
  data_privacy_records: 'Data privacy & records',
  finance_procurement: 'Finance & procurement',
  people_training_admin: 'People, training & administration',
  it_security: 'IT & security',
  quality_risk_compliance: 'Quality, risk & compliance',
  business_continuity_emergency: 'Business continuity & emergency',
  templates_reference: 'Templates reference',
} as const;

export type PublicDocumentCategory = keyof typeof CONTROLLED_DOCUMENT_CATEGORY_LABELS;
type ControlledDocumentType = Database['portal']['Enums']['controlled_document_type'];
type ControlledDocumentStatus = Database['portal']['Enums']['controlled_document_status'];
type ControlledDocumentPublicationStatus =
  Database['portal']['Enums']['controlled_document_publication_status'];
type PublicDocumentType = 'policy' | 'sop';

export type PublicDocument = {
  id: string;
  slug: string;
  title: string;
  documentType: PublicDocumentType;
  category: PublicDocumentCategory;
  shortSummary: string;
  bodyHtml: string;
  status: ControlledDocumentStatus;
  publicationStatus: ControlledDocumentPublicationStatus;
  effectiveDate: string | null;
  lastRevisedAt: string | null;
  nextReviewDate: string | null;
  createdAt: string;
  updatedAt: string;
};

type PublicDocumentSelectRow =
  Database['portal']['Tables']['controlled_documents']['Row'];

const PUBLIC_DOCUMENT_SELECT = `
  id,
  slug,
  title,
  document_type,
  category,
  short_summary,
  body_html,
  status,
  publication_status,
  effective_date,
  last_revised_at,
  next_review_date,
  created_at,
  updated_at
`;

const fetchPublishedPublicDocumentsCached = unstable_cache(
  async (): Promise<PublicDocument[]> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('controlled_documents')
      .select(PUBLIC_DOCUMENT_SELECT)
      .eq('status', 'active')
      .eq('publication_status', 'public')
      .in('document_type', ['policy', 'sop'])
      .order('category', { ascending: true })
      .order('title', { ascending: true });

    if (error) {
      throw error;
    }

  return (data as PublicDocumentSelectRow[] | null)?.map(mapPublicDocumentRow) ?? [];
  },
  ['publishedPublicDocuments'],
  { tags: [CACHE_TAGS.publicDocuments] },
);

export async function fetchPublishedPublicDocuments(): Promise<PublicDocument[]> {
  return fetchPublishedPublicDocumentsCached();
}

const fetchPublicDocumentBySlugCached = unstable_cache(
  async (slug: string): Promise<PublicDocument | null> => {
    const supabase = getSupabasePublicClient();
    const portal = supabase.schema('portal');

    const { data, error } = await portal
      .from('controlled_documents')
      .select(PUBLIC_DOCUMENT_SELECT)
      .eq('slug', slug)
      .eq('status', 'active')
      .eq('publication_status', 'public')
      .in('document_type', ['policy', 'sop'])
      .limit(1)
      .maybeSingle();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data ? mapPublicDocumentRow(data as PublicDocumentSelectRow) : null;
  },
  ['publicDocumentBySlug'],
  { tags: [CACHE_TAGS.publicDocuments] },
);

export async function getPublishedPublicDocumentBySlug(slug: string): Promise<PublicDocument | null> {
  return fetchPublicDocumentBySlugCached(slug);
}

function mapPublicDocumentRow(row: PublicDocumentSelectRow): PublicDocument {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    documentType: toPublicDocumentType(row.document_type),
    category: row.category,
    shortSummary: row.short_summary,
    bodyHtml: sanitizeResourceHtml(row.body_html ?? ''),
    status: row.status,
    publicationStatus: row.publication_status,
    effectiveDate: row.effective_date,
    lastRevisedAt: row.last_revised_at,
    nextReviewDate: row.next_review_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPublicDocumentType(
  documentType: ControlledDocumentType,
): PublicDocumentType {
  if (documentType === 'policy' || documentType === 'sop') {
    return documentType;
  }

  throw new Error('Encountered non-public document type for transparency collection.');
}
