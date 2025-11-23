'use client';

import * as React from 'react';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type TrendPoint = {
  date: string;
  value: number;
};

export function TrendChart({
  title,
  description,
  data,
  rangeLabel,
}: {
  title: string;
  description?: string;
  data: TrendPoint[];
  rangeLabel: string;
}) {
  const gradientId = React.useId().replace(/:/g, '-');
  const summary = buildSummary(data);
  const primaryColor = 'rgb(var(--md-sys-color-primary) / 1)';
  const primaryTransparent = 'rgb(var(--md-sys-color-primary) / 0.08)';
  const axisColor = 'rgb(var(--md-sys-color-on-surface-variant) / 0.72)';
  const tooltipBackground = 'rgb(var(--md-sys-color-surface-container-highest) / 0.92)';
  const tooltipBorder = 'rgb(var(--md-sys-color-outline-variant) / 0.6)';
  const tooltipText = 'rgb(var(--md-sys-color-on-surface) / 0.94)';
  const csvContent = React.useMemo(() => buildCsv(data), [data]);

  return (
    <Card>
      <CardHeader className="gap-2 pb-3">
        <CardTitle className="text-base font-semibold leading-tight text-on-surface">{title}</CardTitle>
        {description ? (
          <p className="text-sm text-on-surface-variant">{description}</p>
        ) : null}
        <span className="sr-only">{summary}</span>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs uppercase tracking-wide text-on-surface-variant/80">{rangeLabel}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id={`trend-area-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.24} />
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke={axisColor} fontSize={12} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBackground,
                  borderRadius: 'var(--md-sys-shape-corner-small)',
                  border: `1px solid ${tooltipBorder}`,
                  color: tooltipText,
                  boxShadow: 'var(--shadow-level-1)',
                }}
                labelStyle={{ color: tooltipText }}
                itemStyle={{ color: tooltipText }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={primaryColor}
                strokeWidth={2}
                fill={`url(#trend-area-${gradientId})`}
                fillOpacity={1}
                activeDot={{ r: 5, strokeWidth: 2, fill: primaryTransparent, stroke: primaryColor }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => downloadCsv(csvContent, title)}
              className="inline-flex items-center rounded-[var(--md-sys-shape-corner-small)] border border-outline/40 bg-surface px-3 py-2 text-xs font-semibold text-on-surface transition hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              Download CSV
            </button>
            <span className="text-xs text-on-surface-variant">Data table included for keyboard and screen-reader use.</span>
          </div>
          <div className="overflow-auto rounded-[var(--md-sys-shape-corner-medium)] border border-outline/20 bg-surface-container-low">
            <table className="min-w-full text-left text-xs text-on-surface">
              <thead className="bg-surface-container-high text-on-surface-variant">
                <tr>
                  <th scope="col" className="px-3 py-2 font-semibold">Date</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Value</th>
                </tr>
              </thead>
              <tbody>
                {data.map((point, index) => (
                  <tr
                    key={`${point.date}-${index}`}
                    className={cn(index % 2 === 0 ? 'bg-surface' : 'bg-surface-container')}
                  >
                    <td className="px-3 py-2 text-on-surface/80">{point.date}</td>
                    <td className="px-3 py-2 font-semibold text-on-surface">{point.value}</td>
                  </tr>
                ))}
                {!data.length ? (
                  <tr>
                    <td colSpan={2} className="px-3 py-3 text-on-surface-variant">
                      No reported values for this range yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function buildSummary(data: TrendPoint[]): string {
  if (!data.length) return 'No data available for the selected range.';

  const first = data[0];
  const last = data[data.length - 1];
  const delta = last.value - first.value;
  const direction = delta > 0 ? 'increased' : delta < 0 ? 'decreased' : 'remained steady';

  return `Trend summary: value ${direction} from ${first.value} on ${first.date} to ${last.value} on ${last.date}.`;
}

function buildCsv(data: TrendPoint[]): string {
  const header = 'date,value';
  const rows = data.map((point) => `${point.date},${point.value}`);
  return [header, ...rows].join('\n');
}

function downloadCsv(content: string, title: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${title.replace(/\s+/g, '-').toLowerCase()}-trend.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}
