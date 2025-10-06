'use client';

import { useState, useTransition } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  countSupportReactions,
  createReactionTally,
  REACTION_DEFINITIONS,
  type PortalReactionType,
  type ReactionSummary,
} from '@/lib/reactions';
import { trackClientEvent } from '@/lib/telemetry';

interface ReactionBarProps {
  endpoint: string;
  initialActiveReaction: PortalReactionType | null;
  initialTotals: ReactionSummary;
  ariaLabel: string;
  disabledReason?: string;
  size?: 'sm' | 'md';
  className?: string;
  supportSummaryLabel?: string;
  showSupportSummary?: boolean;
  telemetryEvent?: string;
  telemetryContext?: Record<string, unknown>;
}

const ACTIVE_STYLES: Record<string, string> = {
  positive: 'border-brand bg-brand text-white dark:border-brand',
  neutral: 'border-amber-500 bg-amber-500 text-white dark:border-amber-500',
  negative: 'border-rose-500 bg-rose-500 text-white dark:border-rose-400/90',
};

const IDLE_STYLES: Record<string, string> = {
  positive:
    'border-slate-200 bg-white text-slate-700 hover:border-brand/70 hover:text-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-brand/80 dark:hover:text-brand',
  neutral:
    'border-slate-200 bg-white text-slate-700 hover:border-amber-400/80 hover:text-amber-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-amber-400 dark:hover:text-amber-400',
  negative:
    'border-slate-200 bg-white text-slate-700 hover:border-rose-400/80 hover:text-rose-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:border-rose-400 dark:hover:text-rose-300',
};

const SIZE_STYLES: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-1 text-xs',
  md: 'px-3 py-1.5 text-sm',
};

const EMOJI_STYLES: Record<'sm' | 'md', string> = {
  sm: 'text-sm',
  md: 'text-base',
};

export function ReactionBar({
  endpoint,
  initialActiveReaction,
  initialTotals,
  ariaLabel,
  disabledReason,
  size = 'md',
  className,
  supportSummaryLabel = 'Supporters',
  showSupportSummary = true,
  telemetryEvent,
  telemetryContext,
}: ReactionBarProps) {
  const [activeReaction, setActiveReaction] = useState<PortalReactionType | null>(initialActiveReaction);
  const [totals, setTotals] = useState<ReactionSummary>(() => createReactionTally(initialTotals));
  const [supportCount, setSupportCount] = useState(() => countSupportReactions(initialTotals));
  const [isPending, startTransition] = useTransition();

  const disabled = Boolean(disabledReason);

  const handleSelect = (reaction: PortalReactionType) => {
    if (disabled || isPending) return;

    const nextReaction = activeReaction === reaction ? null : reaction;

    if (telemetryEvent) {
      trackClientEvent(telemetryEvent, {
        reaction,
        nextReaction,
        previousReaction: activeReaction,
        endpoint,
        ...telemetryContext,
      });
    }

    startTransition(async () => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reaction: nextReaction }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          throw new Error(payload.error || 'Unable to update reaction');
        }

        const payload = await response.json();
        const nextActiveReaction = (payload.activeReaction ?? null) as PortalReactionType | null;
        const nextTotals = createReactionTally(payload.reactionTotals ?? {});
        const nextSupport =
          typeof payload.supportCount === 'number' ? payload.supportCount : countSupportReactions(nextTotals);

        setActiveReaction(nextActiveReaction);
        setTotals(nextTotals);
        setSupportCount(nextSupport);
      } catch (error) {
        console.error(error);
        toast({
          title: 'Reaction failed',
          description: error instanceof Error ? error.message : 'Try again shortly.',
          variant: 'destructive',
        });
      }
    });
  };

  const tooltipExtra = disabledReason ? (
    <p className="mt-1 text-xs text-muted">{disabledReason}</p>
  ) : null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label={ariaLabel}
      aria-disabled={disabled}
    >
      {REACTION_DEFINITIONS.map((definition) => {
        const count = totals[definition.type] ?? 0;
        const isActive = activeReaction === definition.type;
        const toneKey = definition.tone;
        const buttonClasses = cn(
          'inline-flex items-center gap-1 rounded-full border font-medium transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
          SIZE_STYLES[size],
          isActive ? ACTIVE_STYLES[toneKey] : IDLE_STYLES[toneKey],
          isPending ? 'opacity-80' : null,
        );

        const ariaDescription = `${definition.label}. ${count} reactions`;

        return (
          <Tooltip key={definition.type} delayDuration={100} disableHoverableContent={false}>
            <TooltipTrigger asChild>
              <button
                type="button"
                className={buttonClasses}
                disabled={disabled}
                onClick={() => handleSelect(definition.type)}
                aria-pressed={isActive}
                aria-label={ariaDescription}
              >
                <span aria-hidden className={EMOJI_STYLES[size]}>{definition.emoji}</span>
                <span className="font-semibold leading-none">{count}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="center" className="max-w-xs text-center text-xs">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{definition.label}</p>
              {tooltipExtra}
            </TooltipContent>
          </Tooltip>
        );
      })}
      {showSupportSummary ? (
        <span className="ml-1 text-xs font-semibold uppercase tracking-wide text-muted" aria-live="polite">
          {supportSummaryLabel}: {supportCount}
        </span>
      ) : null}
    </div>
  );
}
