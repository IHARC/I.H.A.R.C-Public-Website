import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createSupabaseRSCClient } from '@/lib/supabase/rsc';
import { ensurePortalProfile } from '@/lib/profile';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const dynamic = 'force-dynamic';

export default async function PortalProfilePage() {
  const supabase = createSupabaseRSCClient();
  const portal = supabase.schema('portal');
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await ensurePortalProfile(user.id);
  const { data: organizations } = await portal
    .from('organizations')
    .select('id, name, verified')
    .order('name', { ascending: true });

  async function updateProfile(formData: FormData) {
    'use server';

    const supa = createSupabaseServiceClient();
    const portalClient = supa.schema('portal');
    const displayName = formData.get('display_name') as string;
    const organizationId = (formData.get('organization_id') as string) || null;

    if (!displayName || displayName.length < 2) {
      throw new Error('Display name is required');
    }

    await portalClient
      .from('profiles')
      .update({ display_name: displayName, organization_id: organizationId })
      .eq('id', profile.id);

    revalidatePath('/solutions/profile');
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">Portal profile</h1>
      <form action={updateProfile} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="display_name">Display name</Label>
          <Input id="display_name" name="display_name" defaultValue={profile.display_name} required maxLength={80} />
          <p className="text-xs text-slate-500">Shown publicly unless you choose to post anonymously.</p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="organization_id">Organization affiliation</Label>
          <Select name="organization_id" defaultValue={profile.organization_id ?? ''}>
            <SelectTrigger id="organization_id">
              <SelectValue placeholder="Community member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Independent community member</SelectItem>
              {(organizations ?? []).map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit">Save profile</Button>
      </form>
    </div>
  );
}
