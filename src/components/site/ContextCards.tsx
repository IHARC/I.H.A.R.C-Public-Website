'use client';

import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';

const TOPICS = [
  {
    id: 'housing',
    title: 'Housing shortage',
    description: 'Rents keep rising faster than incomes, leaving neighbours without stable options.',
  },
  {
    id: 'supply',
    title: 'Toxic drug supply',
    description: 'Unpredictable street supply drives overdose emergencies and long-term health risks.',
  },
  {
    id: 'justice',
    title: 'Justice churn',
    description: 'Frequent release and short stays create gaps in care and disrupt healing plans.',
  },
  {
    id: 'support',
    title: 'Fragmented support',
    description: 'Services are spread across agencies, making it hard to navigate help in real time.',
  },
] as const;

export function ContextCards() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4">
      <div className="grid gap-6 md:grid-cols-2">
        {TOPICS.map((topic) => (
          <Link
            key={topic.id}
            href={`/context#${topic.id}`}
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
