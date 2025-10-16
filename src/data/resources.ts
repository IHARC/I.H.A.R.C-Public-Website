export const RESOURCE_KIND_LABELS = {
  delegation: 'Delegation',
  report: 'Report',
  presentation: 'Presentation',
  policy: 'Policy Brief',
  press: 'Press',
  dataset: 'Dataset',
  other: 'Other Resource',
} as const;

type ResourceKindMap = typeof RESOURCE_KIND_LABELS;

export type ResourceKind = keyof ResourceKindMap;

export type ResourceAttachment = {
  label: string;
  url: string;
};

export type ResourceEmbed =
  | { type: 'google-doc'; url: string }
  | { type: 'pdf'; url: string }
  | { type: 'video'; url: string; provider: 'youtube' | 'vimeo' }
  | { type: 'external'; url: string; label?: string }
  | { type: 'html'; html: string };

export type Resource = {
  slug: string;
  title: string;
  kind: ResourceKind;
  datePublished: string;
  summary?: string;
  location?: string;
  tags: string[];
  embed: ResourceEmbed;
  attachments?: ResourceAttachment[];
  coverImage?: string;
};

export const resources: Resource[] = [
  {
    slug: 'northumberland-county-emergency-delegation-2024',
    title: 'Northumberland County Council Delegation — Coordinated Emergency Response Update',
    kind: 'delegation',
    datePublished: '2024-09-24',
    summary:
      'IHARC shared urgent overdose and housing response updates with County Council, outlining staffing, shelter, and outreach coordination needs for fall 2024.',
    location: 'Northumberland County Council Chambers',
    tags: ['council', 'emergency response', 'coordination'],
    embed: {
      type: 'google-doc',
      url: 'https://docs.google.com/document/d/e/2PACX-1vSVRUXOcDSBxPTsCkXbkqVKgfHBlC9ZwTe74MkRUYw35vj0IadB1iKsFcfoTmyaKOA1NV1McZV8IO4A/pub?embedded=true',
    },
    attachments: [
      {
        label: 'Download the speaking notes (PDF)',
        url: 'https://drive.google.com/file/d/1ExampleDelegationNotes/view?usp=sharing',
      },
    ],
  },
];

export function getResourceBySlug(slug: string) {
  return resources.find((resource) => resource.slug === slug);
}
