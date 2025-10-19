import { NextRequest, NextResponse } from 'next/server';
import { getMetricDataset } from '@/data/metrics';

const RANGE_OPTIONS: Record<string, number> = {
  '7d': 7,
  '30d': 30,
};

export async function GET(req: NextRequest) {
  const rangeParam = req.nextUrl.searchParams.get('range');
  const days = RANGE_OPTIONS[rangeParam ?? ''] ?? 7;
  const dataset = await getMetricDataset(days, null);

  return NextResponse.json(dataset, {
    headers: {
      'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
    },
  });
}
