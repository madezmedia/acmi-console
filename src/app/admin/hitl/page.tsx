'use client';

import { useState, useEffect } from 'react';

export default function HitlPage() {
  const [requests, setRequests] = useState<Array<{ id: string; summary: string; ts: number }>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // HITL items live under the 'hitl' namespace in ACMI
    // For now show empty state — this gets wired when ACMI is configured
    setIsLoading(false);
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">HITL Queue</h1>
      <p className="mb-4 text-sm text-muted-foreground">
        Human-in-the-loop decisions pending your review.
      </p>
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-lg border border-dashed p-12 text-center">
          <div className="mb-2 text-3xl">✅</div>
          <h2 className="mb-1 text-lg font-medium">All Clear</h2>
          <p className="text-sm text-muted-foreground">No pending HITL requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div key={req.id} className="rounded-lg border p-4">
              <p>{req.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
