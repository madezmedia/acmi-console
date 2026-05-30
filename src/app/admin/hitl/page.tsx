'use client';

import { useState, useEffect } from 'react';
import { useOrg } from '@/lib/acmi/acmi-context';
import { getTimeline } from '@/lib/acmi/client-functions';
import type { AcmiEvent } from '@/lib/acmi/acmi-types';

export default function HitlPage() {
  const { activeOrg } = useOrg();
  const [requests, setRequests] = useState<AcmiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeOrg) {
      setIsLoading(false);
      setRequests([]);
      return;
    }

    setIsLoading(true);
    // Fetch HITL events from the coordination thread
    getTimeline('thread', 'agent-coordination', { limit: 20 })
      .then((events) => {
        const hitlEvents = events.filter(
          (e) => e.kind === 'hitl-required' || e.kind === 'decision'
        );
        setRequests(hitlEvents);
      })
      .catch(() => {
        // ACMI not configured yet — empty state is fine
      })
      .finally(() => setIsLoading(false));
  }, [activeOrg]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">HITL Queue</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Human-in-the-loop decisions pending your review.
      </p>
      {activeOrg && (
        <p className="mb-4 text-xs text-muted-foreground">
          Org: <strong>{activeOrg.name}</strong>
        </p>
      )}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mb-2 text-3xl">✅</div>
          <h2 className="mb-1 text-lg font-medium">All Clear</h2>
          <p className="text-sm text-muted-foreground">
            {activeOrg
              ? 'No pending HITL requests.'
              : 'Select an organization to view HITL requests.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.correlationId} className="rounded-lg border p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                  {req.kind}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(req.ts).toLocaleString()}
                </span>
              </div>
              <p className="text-sm">{req.summary}</p>
              {req.source && (
                <p className="mt-1 text-xs text-muted-foreground">From: {req.source}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
