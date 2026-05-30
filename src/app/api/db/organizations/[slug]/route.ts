import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Verify membership
  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('org_id', data.id)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ organization: data });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json();

  // Check admin role
  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', userId)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden — admin required' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('organizations')
    .update(body)
    .eq('id', org.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ organization: data });
}
