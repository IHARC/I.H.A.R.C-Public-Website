'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { ContextCard } from '@/data/marketing-content';

type ContextCardsProps = {
  topics: ContextCard[];
};

export function ContextCards({ topics }: ContextCardsProps) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="grid gap-6 md:grid-cols-2">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={topic.href}
            className="group flex h-full flex-col justify-between rounded-3xl border border-outline/20 bg-surface p-6 transition hover:-translate-y-1 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => trackEvent('context_read_more', { topic: topic.id })}
          >
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/70">How we got here</p>
              <h3 className="text-2xl font-semibold text-on-surface">{topic.title}</h3>
              <p className="text-sm text-on-surface/80">{topic.description}</p>
            </div>
            <span className="mt-4 inline-flex items-center text-sm font-semibold text-primary">
              Read more
              <span aria-hidden className="ml-2 transition group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
