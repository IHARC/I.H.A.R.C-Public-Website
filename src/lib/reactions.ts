import type { Database } from '@/types/supabase';

export type PortalReactionType = Database['portal']['Enums']['reaction_type'];
export type ReactionTone = 'positive' | 'neutral' | 'negative';

export interface ReactionDefinition {
  type: PortalReactionType;
  emoji: string;
  label: string;
  tone: ReactionTone;
}

export const REACTION_DEFINITIONS: readonly ReactionDefinition[] = [
  { type: 'like', emoji: '👍', label: 'Appreciate this', tone: 'positive' },
  { type: 'love', emoji: '❤️', label: 'This resonates deeply', tone: 'positive' },
  { type: 'hooray', emoji: '🎉', label: 'Celebrate this', tone: 'positive' },
  { type: 'rocket', emoji: '🚀', label: 'Ready to launch', tone: 'positive' },
  { type: 'eyes', emoji: '👀', label: 'Following closely', tone: 'positive' },
  { type: 'laugh', emoji: '😄', label: 'Brought some joy', tone: 'positive' },
  { type: 'confused', emoji: '😕', label: 'Needs more clarity', tone: 'neutral' },
  { type: 'sad', emoji: '😢', label: 'Feeling concerned', tone: 'negative' },
  { type: 'angry', emoji: '😡', label: 'This feels harmful', tone: 'negative' },
  { type: 'minus_one', emoji: '👎', label: 'Doesn’t fit', tone: 'negative' },
] as const;

export const REACTION_TYPES: readonly PortalReactionType[] = REACTION_DEFINITIONS.map((definition) => definition.type);

const REACTION_TYPE_SET = new Set<PortalReactionType>(REACTION_TYPES);

export const POSITIVE_REACTIONS: readonly PortalReactionType[] = REACTION_DEFINITIONS.filter(
  (definition) => definition.tone === 'positive',
).map((definition) => definition.type);

export const NEGATIVE_REACTIONS: readonly PortalReactionType[] = REACTION_DEFINITIONS.filter(
  (definition) => definition.tone === 'negative',
).map((definition) => definition.type);

export function isPortalReactionType(value: unknown): value is PortalReactionType {
  return typeof value === 'string' && REACTION_TYPE_SET.has(value as PortalReactionType);
}

export type ReactionSummary = Record<PortalReactionType, number>;

export function createReactionTally(initial?: Partial<ReactionSummary>): ReactionSummary {
  const tally = REACTION_TYPES.reduce((acc, type) => {
    acc[type] = 0;
    return acc;
  }, {} as ReactionSummary);

  if (initial) {
    for (const [key, value] of Object.entries(initial) as [PortalReactionType, number][]) {
      if (REACTION_TYPE_SET.has(key)) {
        tally[key] = Number.isFinite(value) ? value : 0;
      }
    }
  }

  return tally;
}

export function countSupportReactions(summary: Partial<ReactionSummary>): number {
  return POSITIVE_REACTIONS.reduce((total, type) => total + (summary[type] ?? 0), 0);
}
