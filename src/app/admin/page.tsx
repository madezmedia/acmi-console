import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const { data: memberships } = await supabaseAdmin
    .from('organization_members')
    .select('org_id, role, organizations(slug, name)')
    .eq('user_id', userId);

  return (
    <div className="p-6">
      <h1 className="mb-6 text-2xl font-bold">Fleet Dashboard</h1>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Your Organizations</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {memberships?.map((m: Record<string, unknown>) => {
            const org = m.organizations as Record<string, unknown>;
            return (
              <div key={m.org_id as string} className="rounded-lg border p-4">
                <h3 className="font-medium">{org?.name as string}</h3>
                <p className="text-muted-foreground text-sm">Role: {m.role as string}</p>
                <p className="text-muted-foreground text-sm">Slug: {org?.slug as string}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground mb-4">
          ACMI agent data will appear here once connected.
        </p>
        <p className="text-sm">
          Go to Settings to configure your ACMI Redis connection.
        </p>
      </div>
    </div>
  );
}
