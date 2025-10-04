import { Badge } from '@/components/ui/badge';

export type TimelineActor = {
  displayName: string;
  organizationName?: string | null;
  positionTitle?: string | null;
};

export type IdeaTimelineEvent = {
  id: string;
  timestamp: string;
  type: 'created' | 'status' | 'official_response' | 'decision' | 'revision' | 'assignment';
  title: string;
  description?: string | null;
  status?: string;
  actor?: TimelineActor | null;
};

const TYPE_BADGE: Record<IdeaTimelineEvent['type'], { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  created: { label: 'Submitted', variant: 'secondary' },
  status: { label: 'Status', variant: 'outline' },
  official_response: { label: 'Official', variant: 'default' },
  decision: { label: 'Decision', variant: 'outline' },
  revision: { label: 'Revision requested', variant: 'outline' },
  assignment: { label: 'Assignment', variant: 'secondary' },
};

export function IdeaTimeline({ events }: { events: IdeaTimelineEvent[] }) {
  if (!events.length) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No recorded activity just yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {events.map((event, index) => {
        const isLast = index === events.length - 1;
        const badge = TYPE_BADGE[event.type];
        return (
          <li key={event.id} className="flex gap-3">
            <div className="relative flex flex-col items-center">
              <span className="mt-1 block h-2 w-2 rounded-full bg-brand"></span>
              {!isLast ? (
                <span className="mt-1 w-px flex-1 bg-slate-200 dark:bg-slate-800" aria-hidden />
              ) : null}
            </div>
            <div className="flex-1 space-y-1 rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <p className="font-medium text-slate-900 dark:text-slate-100">{event.title}</p>
                </div>
                <time className="text-xs text-slate-500 dark:text-slate-400" dateTime={event.timestamp}>
                  {new Date(event.timestamp).toLocaleString('en-CA')}
                </time>
              </div>
              {event.actor ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  by {event.actor.displayName}
                  {event.actor.positionTitle ? ` · ${event.actor.positionTitle}` : ''}
                  {event.actor.organizationName ? ` · ${event.actor.organizationName}` : ''}
                </p>
              ) : null}
              {event.description ? (
                <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{event.description}</p>
              ) : null}
              {event.type === 'status' && event.status ? (
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">New status: {event.status}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
