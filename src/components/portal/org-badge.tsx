import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export function OrgBadge({ name, verified }: { name: string; verified?: boolean }) {
  return (
    <Badge variant="outline" className="inline-flex items-center gap-1 border-brand/30 text-brand">
      <CheckCircle className="h-3 w-3" aria-hidden="true" />
      <span>{name}</span>
      {verified && <span className="sr-only">Verified organization</span>}
    </Badge>
  );
}
