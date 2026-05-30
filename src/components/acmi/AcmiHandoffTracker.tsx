'use client';

import type { AcmiEvent } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Placeholder: AcmiHandoffTracker
// ---------------------------------------------------------------------------

export interface AcmiHandoffTrackerProps {
  /** Handoff events to display */
  events: AcmiEvent[];
  /** Callback when a handoff is acknowledged */
  onAck?: (event: AcmiEvent) => void;
  /** Maximum items to display (default: 30) */
  maxItems?: number;
}

/**
 * Placeholder component for tracking handoffs between agents.
 * Will be implemented in a future PR.
 */
export function AcmiHandoffTracker({
  events,
  onAck: _onAck,
  maxItems = 30,
}: AcmiHandoffTrackerProps) {
  const displayEvents = events.slice(0, maxItems);

  if (displayEvents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-madez-bg-deep rounded-madez shadow-madez-soft text-madez-stroke-soft/40">
        <span className="text-2xl mb-2">{'\uD83E\uDD1D'}</span>
        <p className="text-sm">No handoffs</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-dashed border-madez-bg-mid/40 p-4">
      <p className="text-center text-xs text-madez-stroke-soft/50 mb-3">
        {displayEvents.length} handoff event{displayEvents.length !== 1 ? 's' : ''}
        {' \u2014 '}Coming Soon
      </p>
      <div className="space-y-1">
        {displayEvents.map((ev, idx) => (
          <div
            key={`${ev.correlationId}-${idx}`}
            className="flex items-center gap-2 px-3 py-1.5 rounded bg-madez-bg-mid/10 text-xs"
          >
            <span className="text-madez-accent-blue font-mono text-[9px] uppercase">
              {ev.kind}
            </span>
            <span className="text-madez-stroke-soft/70 truncate flex-1">
              {ev.summary}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AcmiHandoffTracker;
