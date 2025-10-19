'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartDatum } from '@/lib/pit/public';

type BreakdownChartProps = {
  title: string;
  description?: string;
  data: ChartDatum[];
};

type ChartPoint = ChartDatum & {
  chartValue: number;
  displayValue: string;
};

export function BreakdownChart({ title, description, data }: BreakdownChartProps) {
  const points = buildChartPoints(data);
  const primaryColor = 'rgb(var(--md-sys-color-primary) / 1)';
  const primaryMuted = 'rgb(var(--md-sys-color-primary) / 0.16)';
  const axisColor = 'rgb(var(--md-sys-color-on-surface-variant) / 0.72)';
  const tooltipBackground = 'rgb(var(--md-sys-color-surface-container-highest) / 0.92)';
  const tooltipBorder = 'rgb(var(--md-sys-color-outline-variant) / 0.6)';
  const tooltipText = 'rgb(var(--md-sys-color-on-surface) / 0.94)';
  const longLabels = hasLongLabel(points);

  return (
    <Card>
      <CardHeader className="gap-2 pb-3">
        <CardTitle className="text-base font-semibold leading-tight text-on-surface">{title}</CardTitle>
        {description ? <p className="text-sm text-on-surface-variant">{description}</p> : null}
        <span className="sr-only">{buildSummary(points)}</span>
      </CardHeader>
      <CardContent>
        <div className="h-64" role="img" aria-label={`${title} bar chart`}>
          {points.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points} margin={{ left: 8, right: 8, top: 12, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  stroke={axisColor}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  height={longLabels ? 64 : 40}
                  angle={longLabels ? -20 : 0}
                  textAnchor={longLabels ? 'end' : 'middle'}
                />
                <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={48} />
                <Tooltip
                  formatter={(_, __, item) => [item.payload.displayValue, item.payload.label]}
                  contentStyle={{
                    backgroundColor: tooltipBackground,
                    border: `1px solid ${tooltipBorder}`,
                    borderRadius: 'var(--md-sys-shape-corner-small)',
                    color: tooltipText,
                    boxShadow: 'var(--shadow-level-1)',
                  }}
                  labelStyle={{ color: tooltipText }}
                  itemStyle={{ color: tooltipText }}
                />
                <Bar
                  dataKey="chartValue"
                  radius={12}
                  fill={primaryColor}
                  background={{ fill: primaryMuted, radius: 12 }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center rounded-[var(--md-sys-shape-corner-medium)] border border-dashed border-outline-variant/60 bg-surface-container text-sm text-on-surface-variant">
              Data will appear as soon as a count is underway.
            </div>
          )}
        </div>
        <dl className="mt-6 space-y-3 text-sm">
          {points.map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-4">
              <dt className="flex-1 text-on-surface-variant">{item.label}</dt>
              <dd className="text-right font-semibold text-on-surface">
                {item.suppressed ? 'Not publicly shown (<3 neighbours)' : item.displayValue}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}

function buildChartPoints(data: ChartDatum[]): ChartPoint[] {
  return data.map((item) => {
    if (item.value === null || Number.isNaN(item.value)) {
      return {
        ...item,
        chartValue: 0,
        displayValue: item.suppressedReason ?? 'Not publicly shown (<3 neighbours)',
      } satisfies ChartPoint;
    }

    const display = item.value.toLocaleString('en-CA');
    const withPercentage = typeof item.percentage === 'number' ? `${display} (${item.percentage}% )` : display;

    return {
      ...item,
      chartValue: item.value,
      displayValue: withPercentage,
    } satisfies ChartPoint;
  });
}

function buildSummary(data: ChartPoint[]): string {
  if (!data.length) return 'No responses recorded yet.';
  const visible = data.filter((entry) => entry.chartValue > 0);
  if (!visible.length) return 'Responses are present but suppressed to protect privacy.';
  const pairs = visible
    .map((entry) => `${entry.displayValue} for ${entry.label}`)
    .join(', ');
  return `Reported counts: ${pairs}.`;
}

function hasLongLabel(data: ChartPoint[]): boolean {
  return data.some((entry) => entry.label.length > 16);
}
