import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; userId: string }> }
) {
  const { userId: actorId } = await auth();
  if (!actorId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug, userId } = await params;

  const { data: org } = await supabaseAdmin
    .from('organizations')
    .select('id')
    .eq('slug', slug)
    .single();

  if (!org) {
    return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
  }

  // Verify actor is admin
  const { data: membership } = await supabaseAdmin
    .from('organization_members')
    .select('role')
    .eq('org_id', org.id)
    .eq('user_id', actorId)
    .single();

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('organization_members')
    .delete()
    .eq('org_id', org.id)
    .eq('user_id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
