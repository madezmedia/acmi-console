import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAcmiClientForOrg } from '@/lib/acmi/proxy';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ns: string; id: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { ns, id } = await params;
  const searchParams = req.nextUrl.searchParams;
  const slot = searchParams.get('slot') || 'profile';
  const limit = parseInt(searchParams.get('limit') || '10');
  const orgId = searchParams.get('orgId');

  if (!orgId) {
    return NextResponse.json({ error: 'orgId query parameter is required' }, { status: 400 });
  }

  const client = await getAcmiClientForOrg(orgId);
  if (!client) {
    return NextResponse.json({ error: 'ACMI not configured for this org' }, { status: 404 });
  }

  try {
    switch (slot) {
      case 'profile':
        return NextResponse.json(await client.getProfile(ns, id));
      case 'signals':
        return NextResponse.json(await client.getSignals(ns, id));
      case 'timeline':
        return NextResponse.json(await client.getTimeline(ns, id, limit));
      default:
        return NextResponse.json(await client.getEntity(ns, id, limit));
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
