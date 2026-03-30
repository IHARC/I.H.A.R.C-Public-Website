'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import type { ContextCard } from '@/data/marketing-content';

type ContextCardsProps = {
  topics: ContextCard[];
};

export function ContextCards({ topics }: ContextCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={topic.href}
            className="group flex h-full flex-col justify-between border-t border-outline/18 pt-6 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            onClick={() => trackEvent('context_read_more', { topic: topic.id })}
          >
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Public context</p>
              <h3 className="font-heading text-3xl font-semibold leading-tight tracking-[-0.03em] text-on-surface text-balance">
                {topic.title}
              </h3>
              <p className="text-base leading-7 text-on-surface/78">{topic.description}</p>
            </div>
            <span className="mt-6 inline-flex items-center text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Read more
              <span aria-hidden className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        ))}
    </div>
  );
}
