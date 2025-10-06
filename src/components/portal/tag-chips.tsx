'use client';

import { Badge } from '@/components/ui/badge';

export function TagChips({ tags }: { tags: string[] }) {
  if (!tags?.length) return null;

  return (
    <div className="flex flex-wrap gap-2" aria-label="Idea tags">
      {tags.slice(0, 6).map((tag) => (
        <Badge
          key={tag}
          variant="secondary"
          className="border-outline/40 bg-surface-container-high text-on-surface/80"
        >
          #{tag.trim()}
        </Badge>
      ))}
      {tags.length > 6 && (
        <Badge variant="outline" className="text-xs text-muted-subtle">
          +{tags.length - 6} more
        </Badge>
      )}
    </div>
  );
}
