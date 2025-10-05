import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getHomelessnessBadgeLabel,
  getSubstanceUseBadgeLabel,
  type LivedExperienceStatus,
} from '@/lib/lived-experience';

export type LivedExperienceBadgesProps = {
  homelessness?: LivedExperienceStatus | null;
  substanceUse?: LivedExperienceStatus | null;
  className?: string;
};

export function LivedExperienceBadges({ homelessness, substanceUse, className }: LivedExperienceBadgesProps) {
  const badges: { key: string; label: string; tone: 'housing' | 'substance' }[] = [];

  const housingLabel = homelessness ? getHomelessnessBadgeLabel(homelessness) : null;
  if (housingLabel) {
    badges.push({ key: `housing-${homelessness}`, label: housingLabel, tone: 'housing' });
  }

  const substanceLabel = substanceUse ? getSubstanceUseBadgeLabel(substanceUse) : null;
  if (substanceLabel) {
    badges.push({ key: `substance-${substanceUse}`, label: substanceLabel, tone: 'substance' });
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap gap-1', className)}>
      {badges.map((badge) => (
        <Badge
          key={badge.key}
          variant="outline"
          className={cn(
            'border-transparent text-xs font-medium',
            badge.tone === 'housing'
              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100'
              : 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-100',
          )}
        >
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}
