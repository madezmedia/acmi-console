'use client';

import { useMemo, useState } from 'react';
import type { AcmiEvent } from '@/lib/acmi/acmi-types';
import { AcmiAcknowledgementBadge, deriveAckStatus } from './AcmiAcknowledgementBadge';
import type { AckStatus } from './AcmiAcknowledgementBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface AcmiHandoffTrackerProps {
  /** All timeline events to analyze for handoffs */
  events: AcmiEvent[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Called when the user clicks a handoff to view details */
  onHandoffClick?: (handoff: AcmiEvent) => void;
  /** Called when the user ACKs an unhandled handoff */
  onAck?: (handoff: AcmiEvent) => void;
  /** Max handoffs to show (default: 50) */
  maxItems?: number;
}

// ---------------------------------------------------------------------------
// Handoff extraction helpers
// ---------------------------------------------------------------------------

/**
 * Extract handoff events from a timeline (task-delegation kind).
 */
function extractHandoffs(events: AcmiEvent[]): AcmiEvent[] {
  return events
    .filter((e) => e.kind === 'task-delegation')
    .sort((a, b) => b.ts - a.ts);
}

/**
 * Extract ACK events for matching handoffs.
 */
function extractAckEvents(events: AcmiEvent[]): AcmiEvent[] {
  return events.filter((e) => e.kind === 'handoff-ack' || e.kind === 'work-completed');
}

/**
 * Extract a recipient from a handoff summary if it matches the fleet convention.
 * Fleet convention: `[<kind-tag> @<recipient> ...] <description>`
 */
function extractRecipient(summary: string): string | null {
  const match = summary.match(/@(\S+)/);
  return match ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiHandoffTracker — Track handoffs between agents.
 *
 * Scans timeline events for `task-delegation` kind, shows who handed off to
 * whom, when, and the ACK status. Visualizes the correlation chain and
 * provides ACK actions for pending handoffs.
 *
 * @example
 * ```tsx
 * <AcmiHandoffTracker
 *   events={timelineEvents}
 *   onHandoffClick={(h) => console.log('Handoff:', h)}
 *   onAck={(h) => console.log('ACK:', h.correlationId)}
 * />
 * ```
 */
export function AcmiHandoffTracker({
  events,
  className = '',
  onHandoffClick,
  onAck,
  maxItems = 50,
}: AcmiHandoffTrackerProps) {
  const [filterStatus, setFilterStatus] = useState<AckStatus | 'all'>('all');

  // Extract handoffs
  const handoffs = useMemo(() => extractHandoffs(events), [events]);
  const ackEvents = useMemo(() => extractAckEvents(events), [events]);

  // Derive status for each handoff
  const enrichedHandoffs = useMemo(
    () =>
      handoffs.map((h) => ({
        event: h,
        status: deriveAckStatus(h, ackEvents),
        recipient: extractRecipient(h.summary),
      })),
    [handoffs, ackEvents],
  );

  // Filter
  const filtered = useMemo(
    () =>
      filterStatus === 'all'
        ? enrichedHandoffs
        : enrichedHandoffs.filter((h) => h.status === filterStatus),
    [enrichedHandoffs, filterStatus],
  );

  // Stats
  const stats = useMemo(() => {
    const total = enrichedHandoffs.length;
    const acked = enrichedHandoffs.filter((h) => h.status === 'acknowledged').length;
    const completed = enrichedHandoffs.filter((h) => h.status === 'completed').length;
    const pending = enrichedHandoffs.filter((h) => h.status === 'pending').length;
    const overdue = enrichedHandoffs.filter((h) => h.status === 'overdue').length;
    return { total, acked, completed, pending, overdue };
  }, [enrichedHandoffs]);

  // Filter button config
  const filterButtons: { label: string; value: AckStatus | 'all' }[] = [
    { label: 'All', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Overdue', value: 'overdue' },
    { label: 'ACKed', value: 'acknowledged' },
    { label: 'Done', value: 'completed' },
  ];

  const headerColor =
    stats.overdue > 0
      ? 'border-l-4 border-l-madez-skin'
      : stats.pending > 0
        ? 'border-l-4 border-l-madez-accent-blue'
        : 'border-l-4 border-l-madez-accent-mint';

  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className={`px-5 pt-4 pb-3 border-b border-madez-bg-mid/40 ${headerColor}`}>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-madez-text-primary tracking-wide">
            Handoff Tracker
          </h2>
          <span className="text-[10px] text-madez-stroke-soft/40 font-mono">
            {stats.total} handoff{stats.total !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Summary bar */}
        <div className="flex gap-3 text-[10px] text-madez-stroke-soft/60 mb-2">
          <span>✓ {stats.completed} done</span>
          <span>↗ {stats.acked} ACKed</span>
          <span>○ {stats.pending} pending</span>
          {stats.overdue > 0 && (
            <span className="text-madez-skin font-semibold">⚠ {stats.overdue} overdue</span>
          )}
        </div>

        {/* Filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilterStatus(btn.value)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                filterStatus === btn.value
                  ? 'bg-madez-accent-mint/15 text-madez-accent-mint'
                  : 'bg-madez-bg-mid/20 text-madez-stroke-soft/50 hover:text-madez-stroke-soft/70'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Handoff list */}
      <div className="divide-y divide-madez-bg-mid/20 max-h-[500px] overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-madez-stroke-soft/40">
            <span className="text-2xl mb-2">🤝</span>
            <p className="text-sm">No handoffs match this filter</p>
          </div>
        ) : (
          filtered.slice(0, maxItems).map(({ event, status, recipient }) => (
            <div
              key={event.correlationId}
              className="px-5 py-3 transition-colors duration-100 hover:bg-madez-bg-mid/20 cursor-pointer"
              onClick={() => onHandoffClick?.(event)}
              role={onHandoffClick ? 'button' : undefined}
              tabIndex={onHandoffClick ? 0 : undefined}
              onKeyDown={
                onHandoffClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onHandoffClick(event);
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* From/To */}
                  <div className="flex items-center gap-2 text-xs text-madez-stroke-soft/70 mb-1">
                    <span className="font-medium text-madez-accent-blue">
                      {event.source}
                    </span>
                    {recipient && (
                      <>
                        <span className="text-madez-stroke-soft/40">→</span>
                        <span className="font-medium text-madez-accent-mint">
                          {recipient}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Summary */}
                  <p className="text-sm text-madez-text-primary leading-relaxed">
                    {event.summary}
                  </p>

                  {/* Timestamp and correlation ID */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-madez-stroke-soft/40">
                      {new Date(event.ts).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span className="text-[10px] font-mono text-madez-stroke-soft/30 truncate max-w-[120px]">
                      #{event.correlationId.slice(0, 20)}
                    </span>
                  </div>
                </div>

                {/* ACK badge + button */}
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <AcmiAcknowledgementBadge status={status} showLabel size="sm" />
                  {onAck && status === 'pending' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAck(event);
                      }}
                      className="px-2 py-0.5 rounded text-[9px] font-medium bg-madez-accent-blue/10 text-madez-accent-blue hover:bg-madez-accent-blue/20 transition-colors"
                    >
                      ACK
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AcmiHandoffTracker;
