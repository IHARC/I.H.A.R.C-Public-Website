import type { ReactNode } from 'react';
import Link from 'next/link';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import type { Resource } from '@/lib/resources';
import { assertAllowedEmbedUrl, getKindLabel } from '@/lib/resources';
import { sanitizeEmbedHtml } from '@/lib/sanitize-embed';

export function ResourceEmbed({ resource }: { resource: Resource }) {
  const { embed } = resource;

  if (!embed) {
    return null;
  }

  switch (embed.type) {
    case 'google-doc':
      assertAllowedEmbedUrl(embed.url, resource.slug);
      return (
        <EmbedContainer>
          <iframe
            src={embed.url}
            title={`${resource.title} — Google Document`}
            loading="lazy"
            className="h-[720px] w-full border-0"
            allow="clipboard-write"
          />
          <Actions>
            <Button asChild variant="outline">
              <Link href={embed.url} target="_blank" rel="noopener noreferrer">
                Open Google Doc in new tab
              </Link>
            </Button>
          </Actions>
        </EmbedContainer>
      );
    case 'pdf':
      assertAllowedEmbedUrl(embed.url, resource.slug);
      return (
        <EmbedContainer>
          <iframe
            src={embed.url}
            title={`${resource.title} — PDF viewer`}
            className="h-[720px] w-full border-0"
            loading="lazy"
          />
          <Actions>
            <Button asChild variant="outline">
              <Link href={embed.url} target="_blank" rel="noopener noreferrer">
                Download PDF
              </Link>
            </Button>
          </Actions>
        </EmbedContainer>
      );
    case 'video':
      assertAllowedEmbedUrl(embed.url, resource.slug);
      return (
        <EmbedContainer>
          <AspectRatio ratio={16 / 9}>
            <iframe
              src={embed.url}
              title={`${resource.title} — ${getKindLabel(resource.kind)}`}
              loading="lazy"
              className="h-full w-full rounded-3xl border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </AspectRatio>
          <Actions>
            <Button asChild variant="outline">
              <Link href={embed.url} target="_blank" rel="noopener noreferrer">
                Watch in new tab
              </Link>
            </Button>
          </Actions>
        </EmbedContainer>
      );
    case 'external':
      return (
        <EmbedContainer>
          <div className="flex flex-col items-start gap-4 rounded-3xl bg-surface-container p-8 text-on-surface">
            <p className="text-base font-medium text-on-surface/80">
              This resource opens in a new tab.
            </p>
            <Button asChild>
              <Link href={embed.url} target="_blank" rel="noopener noreferrer">
                {embed.label ?? 'Open resource'}
              </Link>
            </Button>
          </div>
        </EmbedContainer>
      );
    case 'html':
      return (
        <EmbedContainer>
          <div
            className="prose max-w-none rounded-3xl border border-outline/20 bg-surface p-6"
            dangerouslySetInnerHTML={{ __html: sanitizeEmbedHtml(embed.html) }}
          />
        </EmbedContainer>
      );
    default:
      return null;
  }
}

function EmbedContainer({ children }: { children: ReactNode }) {
  return <div className="space-y-4">{children}</div>;
}

function Actions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}
