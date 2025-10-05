'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
  const summary = buildSummary(data);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <p className="text-sm text-muted">{description}</p>}
        <span className="sr-only">{summary}</span>
      </CardHeader>
      <CardContent>
        <p className="mb-2 text-xs uppercase tracking-wide text-muted-subtle">{rangeLabel}</p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="trendArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} width={60} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgb(15 23 42 / 0.9)', borderRadius: '0.5rem', border: 'none' }}
                labelStyle={{ color: 'white' }}
                itemStyle={{ color: '#bfdbfe' }}
              />
              <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#trendArea)" />
            </AreaChart>
          </ResponsiveContainer>
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
