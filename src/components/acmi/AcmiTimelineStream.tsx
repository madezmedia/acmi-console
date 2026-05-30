'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AcmiEvent, AcmiEventKind } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiTimelineStreamProps {
  /** Array of timeline events to display */
  events: AcmiEvent[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Maximum events to show per page (default: 20) */
  pageSize?: number;
  /** Whether to show timestamp as relative ("2h ago") vs absolute (default: relative) */
  relativeTime?: boolean;
  /** Optional callback when a filter pill is selected */
  onKindFilter?: (kind: string | null) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Format a timestamp (epoch ms) into a human-readable relative string.
 */
function relativeTimeStr(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

/**
 * Format a timestamp (epoch ms) as an absolute date-time string.
 */
function absoluteTimeStr(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Map event kinds to human-readable pill labels.
 */
const KIND_LABELS: Record<string, string> = {
  decision: 'Decision',
  'task-delegation': 'Delegation',
  'handoff-ack': 'Handoff',
  'milestone-shipped': 'Milestone',
  'work-created': 'Created',
  'work-update': 'Update',
  'work-completed': 'Completed',
  'work-ratified': 'Ratified',
  'incident-opened': 'Incident',
  'incident-update': 'Incident',
  'incident-resolved': 'Resolved',
  'scope-decision': 'Scope',
  'coord-note': 'Note',
  heartbeat: 'Heartbeat',
  'artifact-published': 'Artifact',
  'team-loop': 'Loop',
  'hitl-required': 'HITL',
  'hitl-resolved': 'HITL',
  journal_entry: 'Journal',
  spawn: 'Spawn',
};

/**
 * Get a user-friendly label for an event kind.
 */
function kindLabel(kind: string): string {
  return KIND_LABELS[kind] ?? kind;
}

/**
 * Extract the set of unique event kinds from an event list.
 */
function extractKinds(events: AcmiEvent[]): string[] {
  const seen = new Set<string>();
  const kinds: string[] = [];
  for (const e of events) {
    if (!seen.has(e.kind)) {
      seen.add(e.kind);
      kinds.push(e.kind);
    }
  }
  return kinds.sort();
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A single timeline event row.
 */
function TimelineEvent({
  event,
  relativeTime,
}: {
  event: AcmiEvent;
  relativeTime: boolean;
}) {
  return (
    <div className="group flex items-start gap-3 py-3 px-4 transition-colors duration-150 hover:bg-madez-bg-mid/30 rounded-lg">
      {/* Kind badge — vertical accent bar + label */}
      <div className="flex-shrink-0 w-20 text-right">
        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-madez-accent-blue/80 bg-madez-bg-deep/80 px-1.5 py-0.5 rounded">
          {kindLabel(event.kind)}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-madez-text-primary leading-relaxed break-words">
          {event.summary}
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-madez-stroke-soft/60">
          <span>{event.source}</span>
          {event.correlationId && (
            <span className="font-mono opacity-70" title={event.correlationId}>
              #{event.correlationId.slice(0, 24)}
              {event.correlationId.length > 24 ? '…' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Timestamp */}
      <div className="flex-shrink-0 text-[11px] text-madez-stroke-soft/50 whitespace-nowrap mt-0.5">
        {relativeTime ? relativeTimeStr(event.ts) : absoluteTimeStr(event.ts)}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiTimelineStream — Scrollable event feed with kind filter pills.
 *
 * Renders a vertically scrollable list of timeline events with clickable
 * filter pills to show only events of a selected kind. Supports pagination
 * and relative/absolute timestamp display.
 *
 * @example
 * ```tsx
 * <AcmiTimelineStream
 *   events={events}
 *   pageSize={10}
 *   relativeTime
 *   onKindFilter={(kind) => console.log('Filtered to:', kind)}
 * />
 * ```
 */
export function AcmiTimelineStream({
  events,
  className = '',
  pageSize = 20,
  relativeTime = true,
  onKindFilter,
}: AcmiTimelineStreamProps) {
  const [activeKind, setActiveKind] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(pageSize);

  // Extract unique event kinds for filter pills
  const allKinds = useMemo(() => extractKinds(events), [events]);

  // Filter events by active kind
  const filtered = useMemo(() => {
    if (!activeKind) return events;
    return events.filter((e) => e.kind === activeKind);
  }, [events, activeKind]);

  // Paginated slice
  const visible = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount],
  );

  const hasMore = visibleCount < filtered.length;

  /** Handle clicking a kind pill */
  const handleKindClick = useCallback(
    (kind: string) => {
      const next = activeKind === kind ? null : kind;
      setActiveKind(next);
      setVisibleCount(pageSize);
      onKindFilter?.(next);
    },
    [activeKind, pageSize, onKindFilter],
  );

  /** Load more events */
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + pageSize);
  }, [pageSize]);

  return (
    <div
      className={`flex flex-col bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-madez-bg-mid/40">
        <h2 className="text-sm font-semibold text-madez-text-primary tracking-wide">
          Timeline Stream
        </h2>
        <p className="text-[11px] text-madez-stroke-soft/50 mt-0.5">
          {filtered.length} event{filtered.length !== 1 ? 's' : ''}
          {activeKind ? ` · filtered by "${kindLabel(activeKind)}"` : ''}
        </p>
      </div>

      {/* Filter pills */}
      {allKinds.length > 1 && (
        <div className="flex flex-wrap gap-1.5 px-4 py-2.5 border-b border-madez-bg-mid/30 bg-madez-bg-deep/60">
          {allKinds.map((kind) => (
            <button
              key={kind}
              onClick={() => handleKindClick(kind)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150 ${
                activeKind === kind
                  ? 'bg-madez-accent-mint text-madez-bg-deep shadow-madez-glow-mint'
                  : 'bg-madez-bg-mid/50 text-madez-stroke-soft hover:bg-madez-bg-mid hover:text-madez-text-primary'
              }`}
            >
              {kindLabel(kind)}
            </button>
          ))}
          {activeKind && (
            <button
              onClick={() => handleKindClick('')}
              className="px-2 py-1 rounded-full text-[11px] font-medium bg-transparent text-madez-accent-blue/60 hover:text-madez-accent-blue transition-colors"
            >
              ✕ Clear
            </button>
          )}
        </div>
      )}

      {/* Scrollable event list */}
      <div className="flex-1 overflow-y-auto max-h-[480px] divide-y divide-madez-bg-mid/20">
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-madez-stroke-soft/40">
            <span className="text-2xl mb-2">∅</span>
            <p className="text-sm">No events to display</p>
          </div>
        ) : (
          visible.map((event, i) => (
            <TimelineEvent
              key={event.correlationId + event.ts + i}
              event={event}
              relativeTime={relativeTime}
            />
          ))
        )}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="px-4 py-3 border-t border-madez-bg-mid/30">
          <button
            onClick={handleLoadMore}
            className="w-full py-2 rounded-full text-xs font-medium text-madez-accent-mint bg-madez-bg-mid/30 hover:bg-madez-bg-mid/60 transition-colors"
          >
            Load {Math.min(pageSize, filtered.length - visibleCount)} more
          </button>
        </div>
      )}
    </div>
  );
}

export default AcmiTimelineStream;
