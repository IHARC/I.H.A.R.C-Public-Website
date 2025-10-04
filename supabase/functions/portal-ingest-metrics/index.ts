import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const PORTAL_INGEST_SECRET = Deno.env.get('PORTAL_INGEST_SECRET');

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Supabase credentials are not configured for portal-ingest-metrics');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type MetricRecord = {
  metric_date: string;
  metric_key:
    | 'outdoor_count'
    | 'shelter_occupancy'
    | 'overdoses_reported'
    | 'narcan_distributed'
    | 'encampment_count'
    | 'warming_beds_available';
  value: number;
  source?: string;
  notes?: string;
};

function isMetricRecord(candidate: unknown): candidate is MetricRecord {
  if (!candidate || typeof candidate !== 'object') return false;
  const record = candidate as Record<string, unknown>;
  const { metric_date, metric_key, value } = record;
  const allowedKeys: MetricRecord['metric_key'][] = [
    'outdoor_count',
    'shelter_occupancy',
    'overdoses_reported',
    'narcan_distributed',
    'encampment_count',
    'warming_beds_available',
  ];

  return (
    typeof metric_date === 'string' &&
    typeof metric_key === 'string' &&
    allowedKeys.includes(metric_key as MetricRecord['metric_key']) &&
    typeof value === 'number'
  );
}

deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('authorization') || '';
  const inboundSecret = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : authHeader;

  if (!PORTAL_INGEST_SECRET || inboundSecret !== PORTAL_INGEST_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let payload: unknown;

  try {
    payload = await req.json();
  } catch (error) {
    console.error('Failed to parse payload', error);
    return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const records: MetricRecord[] = Array.isArray(payload)
    ? (payload.filter(isMetricRecord) as MetricRecord[])
    : isMetricRecord(payload)
      ? [payload]
      : [];

  if (records.length === 0) {
    return new Response(JSON.stringify({ error: 'Payload must include at least one valid metric record' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const upsertPayload = records.map((entry) => ({
    metric_date: entry.metric_date,
    metric_key: entry.metric_key,
    value: entry.value,
    source: entry.source ?? null,
    notes: entry.notes ?? null,
  }));

  const { error } = await supabase
    .from('portal.metric_daily')
    .upsert(upsertPayload, { onConflict: 'metric_date,metric_key' });

  if (error) {
    console.error('Failed to upsert metric record(s)', error);
    return new Response(JSON.stringify({ error: 'Database error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(
    JSON.stringify({ status: 'ok', count: upsertPayload.length }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
});
