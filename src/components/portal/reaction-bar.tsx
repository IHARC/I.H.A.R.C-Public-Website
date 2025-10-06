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
  positive: 'border-primary bg-primary text-on-primary',
  neutral: 'border-secondary bg-secondary text-secondary-foreground',
  negative: 'border-inverse-surface bg-inverse-surface text-inverse-on-surface',
};

const IDLE_STYLES: Record<string, string> = {
  positive:
    'border-outline bg-surface text-on-surface hover:border-primary hover:text-primary hover:bg-primary/5',
  neutral:
    'border-outline bg-surface text-on-surface hover:border-secondary hover:text-secondary-foreground hover:bg-secondary-container/60',
  negative:
    'border-outline bg-surface text-on-surface hover:border-inverse-surface hover:text-inverse-on-surface hover:bg-inverse-surface/10',
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
              <p className="font-semibold text-on-surface">{definition.label}</p>
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
