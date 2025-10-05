import { Badge } from '@/components/ui/badge';

export type IdeaMetricDisplay = {
  id: string;
  label: string;
  definition?: string | null;
  baseline?: string | null;
  target?: string | null;
};

export function IdeaMetricsList({ metrics }: { metrics: IdeaMetricDisplay[] }) {
  if (!metrics.length) {
    return null;
  }

  return (
    <div className="space-y-3">
      {metrics.map((metric) => {
        const hasBaseline = Boolean(metric.baseline);
        const hasTarget = Boolean(metric.target);
        return (
          <div
            key={metric.id}
            className="space-y-2 rounded-md border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">{metric.label}</h3>
              {hasTarget ? (
                <Badge variant="secondary" className="whitespace-nowrap">
                  Target: {metric.target}
                </Badge>
              ) : null}
            </div>
            {metric.definition ? (
              <p className="text-sm text-muted">{metric.definition}</p>
            ) : null}
            {(hasBaseline || hasTarget) && (
              <div className="flex flex-wrap gap-4 text-xs text-muted">
                {hasBaseline ? <span>Baseline: {metric.baseline}</span> : null}
                {hasTarget ? <span>Goal: {metric.target}</span> : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
