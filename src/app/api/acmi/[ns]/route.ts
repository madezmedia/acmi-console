import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAcmiClientForOrg } from '@/lib/acmi/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ns: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ns } = await params;
  const orgId = req.nextUrl.searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId query parameter is required' }, { status: 400 });
  }

  const client = await getAcmiClientForOrg(orgId);
  if (!client) {
    return NextResponse.json({ error: 'ACMI not configured for this org' }, { status: 404 });
  }

  try {
    const ids = await client.listIds(ns);
    return NextResponse.json({ ids });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
