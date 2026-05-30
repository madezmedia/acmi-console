'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AcmiEvent, AcmiCatResult } from '@/lib/acmi/acmi-types';
import { catTimeline } from '@/lib/acmi/client-functions';
import { AcmiTimelineStream } from './AcmiTimelineStream';

// ---------------------------------------------------------------------------
// Source descriptor
// ---------------------------------------------------------------------------

/**
 * A single stream source for the bus feed.
 */
export interface BusFeedSource {
  /** Display label for this source */
  label: string;
  /** ACMI namespace */
  namespace: string;
  /** Entity ID */
  id: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiBusFeedProps {
  /** Stream sources to merge */
  sources: BusFeedSource[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Time window for the "since" filter (default: '24h') */
  defaultSince?: string;
  /** Maximum events to display (default: 50) */
  maxEvents?: number;
  /** Whether timestamps show as relative (default: true) */
  relativeTime?: boolean;
  /** Page size for pagination (default: 20) */
  pageSize?: number;
  /** If true, deduplicate events with the same correlationId across streams */
  deduplicate?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiBusFeed — Real-time view of all ACMI events across the fleet.
 *
 * Merges timeline events from multiple entities (agents, threads, projects)
 * sorted by timestamp. Supports filtering by source and time window.
 * Wraps the `acmi_cat` multi-stream merge pattern.
 *
 * @example
 * ```tsx
 * <AcmiBusFeed
 *   sources={[
 *     { label: 'Claude Engineer', namespace: 'agent', id: 'claude-engineer' },
 *     { label: 'Folana', namespace: 'agent', id: 'folana' },
 *     { label: 'Coordination', namespace: 'thread', id: 'agent-coordination' },
 *   ]}
 *   maxEvents={100}
 *   deduplicate
 * />
 * ```
 */
export function AcmiBusFeed({
  sources,
  className = '',
  defaultSince = '24h',
  maxEvents = 50,
  relativeTime = true,
  pageSize = 20,
  deduplicate = false,
}: AcmiBusFeedProps) {
  const [since, setSince] = useState(defaultSince);
  const [events, setEvents] = useState<AcmiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSources, setActiveSources] = useState<Set<string>>(
    () => new Set(sources.map((s) => `${s.namespace}:${s.id}`)),
  );

  /** Build the key list from active sources */
  const activeKeys = useMemo(
    () =>
      sources.filter((s) => activeSources.has(`${s.namespace}:${s.id}`)),
    [sources, activeSources],
  );

  /** Fetch merged events */
  const fetchFeed = useCallback(async () => {
    if (activeKeys.length === 0) {
      setEvents([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const result: AcmiCatResult = await catTimeline(
        activeKeys.map((s) => ({ namespace: s.namespace, id: s.id })),
        {
          since,
          limit: maxEvents,
          deduplicate,
        },
      );

      setEvents(result.events);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch bus feed';
      setError(msg);
      console.warn('[AcmiBusFeed] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeKeys, since, maxEvents, deduplicate]);

  /** Toggle a source on/off */
  const toggleSource = useCallback(
    (sourceKey: string) => {
      setActiveSources((prev) => {
        const next = new Set(prev);
        if (next.has(sourceKey)) {
          next.delete(sourceKey);
        } else {
          next.add(sourceKey);
        }
        return next;
      });
    },
    [],
  );

  /** Time window presets */
  const timePresets = [
    { label: '30m', value: '30m' },
    { label: '1h', value: '1h' },
    { label: '24h', value: '24h' },
    { label: '7d', value: '7d' },
  ];

  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-madez-bg-mid/40">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-madez-text-primary tracking-wide">
            Fleet Event Bus
          </h2>
          <button
            onClick={fetchFeed}
            disabled={isLoading}
            className="px-3 py-1 rounded-full text-[10px] font-medium bg-madez-accent-mint/10 text-madez-accent-mint hover:bg-madez-accent-mint/20 transition-colors disabled:opacity-50"
          >
            {isLoading ? '…' : '\u27F3 Refresh'}
          </button>
        </div>

        {/* Source pills */}
        {sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sources.map((s) => {
              const key = `${s.namespace}:${s.id}`;
              const isActive = activeSources.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleSource(key)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                    isActive
                      ? 'bg-madez-accent-blue/15 text-madez-accent-blue border border-madez-accent-blue/30'
                      : 'bg-madez-bg-mid/30 text-madez-stroke-soft/50 border border-transparent hover:text-madez-stroke-soft/70'
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Time window presets */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {timePresets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => setSince(preset.value)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-all ${
                since === preset.value
                  ? 'bg-madez-accent-mint/15 text-madez-accent-mint'
                  : 'bg-madez-bg-mid/20 text-madez-stroke-soft/50 hover:text-madez-stroke-soft/70'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="px-5 py-3 bg-madez-skin/5 border-b border-madez-skin/20">
          <p className="text-xs text-madez-skin/70">⚠ {error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && events.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-madez-stroke-soft/40">
          <span className="inline-block w-6 h-6 border-2 border-madez-accent-mint/30 border-t-madez-accent-mint rounded-full animate-spin mb-3" />
          <p className="text-sm">Loading bus feed…</p>
        </div>
      )}

      {/* No sources selected */}
      {activeKeys.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-madez-stroke-soft/40">
          <span className="text-2xl mb-2">{'\uD83D\uDD0C'}</span>
          <p className="text-sm">Select at least one source above</p>
        </div>
      )}

      {/* Timeline stream */}
      {activeKeys.length > 0 && events.length > 0 && (
        <div className="max-h-[600px] overflow-y-auto">
          <AcmiTimelineStream
            events={events}
            pageSize={pageSize}
            relativeTime={relativeTime}
          />
        </div>
      )}

      {/* Empty state after load */}
      {activeKeys.length > 0 && !isLoading && events.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-madez-stroke-soft/40">
          <span className="text-2xl mb-2">{'\u2205'}</span>
          <p className="text-sm">No events in the selected time window</p>
        </div>
      )}
    </div>
  );
}

export default AcmiBusFeed;
