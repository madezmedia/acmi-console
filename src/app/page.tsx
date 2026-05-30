import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/login');
  }

  // Check if user has any organizations
  const { data: memberships } = await supabaseAdmin
    .from('organization_members')
    .select('org_id', { count: 'exact' })
    .eq('user_id', userId);

  if (!memberships || memberships.length === 0) {
    redirect('/create-org');
  }

  redirect('/admin');
}
