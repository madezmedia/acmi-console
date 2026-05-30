import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getAcmiClientForOrg } from '@/lib/acmi/proxy';

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { ns, id, orgId, kind, summary, correlationId, source } = body;

  if (!orgId || !ns || !id || !kind || !summary) {
    return NextResponse.json({
      error: 'Missing required fields: orgId, ns, id, kind, summary',
    }, { status: 400 });
  }

  const client = await getAcmiClientForOrg(orgId);
  if (!client) {
    return NextResponse.json({ error: 'ACMI not configured for this org' }, { status: 404 });
  }

  try {
    await client.appendEvent(ns, id, {
      source: source || `user:${userId}`,
      kind,
      correlationId: correlationId || `${kind}-${Date.now()}`,
      summary,
    });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
