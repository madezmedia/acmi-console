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

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  const { data, error } = await supabaseAdmin
    .from('acmi_connections')
    .select('*')
    .eq('org_id', org.id)
    .single();

  if (error) {
    return NextResponse.json({ config: null });
  }

  return NextResponse.json({ config: data });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const body = await req.json();
  const { upstash_url, upstash_token, tenant_prefix } = body;

  // Verify admin
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
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data, error } = await supabaseAdmin
    .from('acmi_connections')
    .upsert({
      org_id: org.id,
      upstash_url,
      upstash_token,
      tenant_prefix: tenant_prefix || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ config: data });
}
