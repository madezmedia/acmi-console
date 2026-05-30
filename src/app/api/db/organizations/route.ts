import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from('organization_members')
    .select('organizations(*)')
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const orgs = data?.map(d => d.organizations).filter(Boolean) || [];
  return NextResponse.json({ organizations: orgs });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { name, slug } = body;

  if (!name || !slug) {
    return NextResponse.json({ error: 'name and slug are required' }, { status: 400 });
  }

  // Create org via Clerk API first, or directly in Supabase
  const { data: org, error: orgError } = await supabaseAdmin
    .from('organizations')
    .insert({ name, slug, acmi_tenant_id: slug })
    .select()
    .single();

  if (orgError) {
    return NextResponse.json({ error: orgError.message }, { status: 500 });
  }

  // Add creator as owner
  await supabaseAdmin
    .from('organization_members')
    .insert({ org_id: org.id, user_id: userId, role: 'owner' });

  return NextResponse.json({ organization: org }, { status: 201 });
}
