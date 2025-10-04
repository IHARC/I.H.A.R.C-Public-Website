import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { logAuditEvent } from '@/lib/audit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const METRIC_OPTIONS = [
  { key: 'outdoor_count', label: 'Outdoor Individuals' },
  { key: 'shelter_occupancy', label: 'Shelter Occupancy (%)' },
  { key: 'overdoses_reported', label: 'Overdoses Reported' },
  { key: 'narcan_distributed', label: 'Narcan Kits Distributed' },
  { key: 'encampment_count', label: 'Encampments Observed' },
  { key: 'warming_beds_available', label: 'Warming Beds Available' },
] as const;

export default async function CommandCenterAdminPage() {
  const supabase = createSupabaseRSCClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(user.id);
  if (!['moderator', 'admin'].includes(profile.role)) {
    redirect('/command-center');
  }

  const { data: recentMetrics } = await supabase
    .from('portal.metric_daily')
    .select('*')
    .order('metric_date', { ascending: false })
    .limit(12);

  async function uploadMetric(formData: FormData) {
    'use server';

    const supa = createSupabaseServiceClient();
    const metric_date = formData.get('metric_date') as string;
    const metric_key = formData.get('metric_key') as string;
    const value = Number(formData.get('value'));
    const source = (formData.get('source') as string) || null;
    const notes = (formData.get('notes') as string) || null;
    const actorProfileId = formData.get('actor_profile_id') as string;
    const actorUserId = formData.get('actor_user_id') as string;

    if (!metric_date || !metric_key || Number.isNaN(value)) {
      throw new Error('Missing required fields');
    }

    await supa.from('portal.metric_daily').upsert({
      metric_date,
      metric_key,
      value,
      source,
      notes,
    });

    await logAuditEvent({
      actorProfileId,
      actorUserId,
      action: 'metric_upsert',
      entityType: 'metric_daily',
      entityId: `${metric_date}:${metric_key}`,
      meta: { value, source, notes },
    });

    revalidatePath('/command-center');
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Upload daily metric</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={uploadMetric} className="grid gap-4">
            <input type="hidden" name="actor_profile_id" value={profile.id} />
            <input type="hidden" name="actor_user_id" value={user.id} />
            <div className="grid gap-2">
              <Label htmlFor="metric_date">Metric date</Label>
              <Input id="metric_date" name="metric_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="metric_key">Metric key</Label>
              <Select name="metric_key" defaultValue="outdoor_count" required>
                <SelectTrigger id="metric_key">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METRIC_OPTIONS.map((option) => (
                    <SelectItem key={option.key} value={option.key}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" name="value" type="number" step="0.1" required min="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input id="source" name="source" placeholder="Agency / dataset" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Context for this measurement" />
            </div>
            <Button type="submit" className="justify-self-start">
              Save metric
            </Button>
          </form>
        </CardContent>
      </Card>
      {recentMetrics?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Recent submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              {recentMetrics.map((item) => (
                <div key={`${item.metric_date}-${item.metric_key}`} className="flex items-center justify-between rounded border border-slate-100 p-2 dark:border-slate-800">
                  <div>
                    <p className="font-medium">{METRIC_OPTIONS.find((option) => option.key === item.metric_key)?.label ?? item.metric_key}</p>
                    <p className="text-xs text-slate-500">{item.metric_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{item.value}</p>
                    {item.source && <p className="text-xs text-slate-500">{item.source}</p>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
