import type { Metadata } from 'next';
import { getPublishedMythEntries } from '@/data/myths';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MYTH_STATUS_BADGE_STYLES, MYTH_STATUS_CONFIG, mythSourcesFromJson } from '@/lib/myth-busting';
import { CrisisNotice } from '@/components/site/CrisisNotice';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Myth busting — IHARC',
  description:
    'IHARC partners fact-check common myths about housing, substance use, and community safety in Northumberland County. Read the analysis, evidence, and next steps.',
  alternates: {
    canonical: '/myth-busting',
  },
};

export default async function MythBustingPage() {
  const entries = await getPublishedMythEntries();

  return (
    <article className="mx-auto w-full max-w-5xl space-y-12 px-4 py-16 text-on-surface">
      <header className="space-y-4 text-balance">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Myth busting</p>
        <h1 className="text-4xl font-bold tracking-tight">Facts neighbours and partners can trust</h1>
        <p className="text-base text-on-surface/80">
          The Integrated Homelessness and Addictions Response Centre shares compassionate fact checks so residents, agency partners, and local
          government act on shared evidence. Each entry captures what people are hearing, what the data shows, and where collaboration is already in motion.
        </p>
      </header>
      <CrisisNotice variant="card" />

      {entries.length ? (
        <Accordion
          type="multiple"
          className="divide-y divide-outline/20 overflow-hidden rounded-3xl border border-outline/20 bg-surface shadow-sm"
        >
          {entries.map((entry) => {
            const statusConfig = MYTH_STATUS_CONFIG[entry.status];
            const badgeStyle = MYTH_STATUS_BADGE_STYLES[entry.status];
            const sources = mythSourcesFromJson(entry.sources);
            const tags = entry.tags ?? [];
            const updatedAt = entry.updated_at
              ? new Date(entry.updated_at).toLocaleDateString('en-CA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : null;

            return (
              <AccordionItem
                key={entry.id}
                value={entry.slug ?? entry.id}
                className="border-outline/15 bg-surface data-[state=open]:bg-surface-container-low"
              >
                <AccordionTrigger className="px-6 text-left text-on-surface hover:no-underline">
                  <div className="flex w-full flex-col gap-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold tracking-tight">{entry.title}</h2>
                      <Badge variant={badgeStyle.variant} className={cn('whitespace-nowrap capitalize', badgeStyle.className)}>
                        {statusConfig?.label ?? 'Status'}
                      </Badge>
                    </div>
                    <p className="text-sm text-on-surface/70">{entry.myth_statement}</p>
                    {statusConfig?.helper ? (
                      <p className="text-xs uppercase tracking-wide text-on-surface/60">{statusConfig.helper}</p>
                    ) : null}
                    {updatedAt ? (
                      <p className="text-xs uppercase tracking-wide text-on-surface/60">Updated {updatedAt}</p>
                    ) : null}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6">
                  <div className="space-y-6 text-sm text-on-surface/80">
                    <section className="space-y-3 text-base">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface/70">Fact</h3>
                      <p className="whitespace-pre-wrap text-on-surface">{entry.fact_statement}</p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface/70">What we are seeing</h3>
                      <p className="whitespace-pre-wrap leading-relaxed text-on-surface/85">{entry.analysis}</p>
                    </section>

                    {sources.length ? (
                      <section className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface/70">Evidence shared by partners</h3>
                        <ul className="space-y-2">
                          {sources.map((source) => (
                            <li
                              key={`${source.label}-${source.url ?? 'no-link'}`}
                              className="rounded-2xl border border-outline/15 bg-surface-container-low px-4 py-3 text-on-surface"
                            >
                              {source.url ? (
                                <a
                                  href={source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-semibold text-primary underline-offset-4 hover:underline"
                                >
                                  {source.label}
                                </a>
                              ) : (
                                <span className="font-semibold">{source.label}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </section>
                    ) : null}

                    {tags.length ? (
                      <section className="space-y-2">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface/70">Focus areas</h3>
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-outline/40 bg-surface-container-low text-xs uppercase tracking-wide text-on-surface/70"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </section>
                    ) : null}

                    <p className="text-xs text-on-surface/60">
                      Need support or have evidence to add? Email{' '}
                      <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:outreach@iharc.ca">
                        outreach@iharc.ca
                      </a>{' '}
                      so the Integrated Homelessness and Addictions Response Centre can update this entry with you.
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      ) : (
        <div className="rounded-3xl border border-outline/20 bg-surface p-8 text-sm text-on-surface/80">
          <p>
            We are compiling myth busting notes alongside neighbours and agency partners. If you hear a claim that needs a fact check, email{' '}
            <a className="font-semibold text-primary underline-offset-4 hover:underline" href="mailto:outreach@iharc.ca">
              outreach@iharc.ca
            </a>{' '}
            and we will share the response here.
          </p>
        </div>
      )}
    </article>
  );
}
