import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAcmiClientForOrg } from '@/lib/acmi/proxy';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const orgId = searchParams.get('orgId');
  const keysParam = searchParams.get('keys'); // comma-separated "ns:id" pairs
  const limit = parseInt(searchParams.get('limit') || '20');

  if (!orgId || !keysParam) {
    return NextResponse.json({ error: 'orgId and keys are required' }, { status: 400 });
  }

  const client = await getAcmiClientForOrg(orgId);
  if (!client) {
    return NextResponse.json({ error: 'ACMI not configured' }, { status: 404 });
  }

  try {
    const pairs = keysParam.split(',').map(k => {
      const [ns, ...rest] = k.split(':');
      return { ns, id: rest.join(':') };
    });

    const results = await Promise.all(
      pairs.map(async ({ ns, id }) => {
        const events = await client.getTimeline(ns, id, limit);
        return { key: `${ns}:${id}`, events };
      })
    );

    // Merge all events sorted by ts descending
    const allEvents = results.flatMap(r => r.events);
    allEvents.sort((a, b) => b.ts - a.ts);
    const merged = allEvents.slice(0, limit);

    return NextResponse.json({ events: merged, streams: results });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
