'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AcmiNamespace, AcmiEvent, AcmiTimelineOptions } from '@/lib/acmi/acmi-types';
import { getTimeline } from '@/lib/acmi/client-functions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAcmiTimelineOptions extends AcmiTimelineOptions {
  /** Auto-refresh interval in ms (default: 0 = no auto-refresh) */
  refreshInterval?: number;
  /** Page size for loadMore increments (default: 20) */
  pageSize?: number;
}

export interface UseAcmiTimelineResult {
  /** Fetched timeline events */
  events: AcmiEvent[];
  /** Whether initial fetch is loading */
  isLoading: boolean;
  /** Whether a loadMore is in progress */
  isLoadingMore: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Whether there may be more events to load */
  hasMore: boolean;
  /** Fetch the next page of events */
  loadMore: () => void;
  /** Manually refetch from scratch */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAcmiTimeline — Fetch timeline events for an entity with pagination.
 *
 * Supports incremental "load more" pagination, time-window filtering via
 * `since` / `until`, and optional auto-refresh.
 *
 * @param namespace - ACMI namespace
 * @param id - Entity ID
 * @param options - Timeline options + pagination config
 *
 * @example
 * ```tsx
 * const { events, isLoading, hasMore, loadMore } = useAcmiTimeline('agent', 'folana', {
 *   limit: 50,
 *   reverse: true,
 *   pageSize: 20,
 * });
 * ```
 */
export function useAcmiTimeline(
  namespace: AcmiNamespace | string,
  id: string | null,
  options: UseAcmiTimelineOptions = {},
): UseAcmiTimelineResult {
  const {
    limit = 50,
    reverse = true,
    since,
    until,
    refreshInterval = 0,
    pageSize = 20,
  } = options;

  const [events, setEvents] = useState<AcmiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setEvents([]);
      setIsLoading(false);
      setHasMore(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await getTimeline(namespace as AcmiNamespace, id, {
        limit,
        reverse,
        since,
        until,
      });
      setEvents(result);
      setHasMore(result.length >= limit);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch timeline';
      setError(msg);
      console.warn(`[useAcmiTimeline] Error fetching ${namespace}:${id}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [namespace, id, limit, reverse, since, until]);

  const loadMore = useCallback(async () => {
    if (!id || isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      const currentCount = events.length;
      const result = await getTimeline(namespace as AcmiNamespace, id, {
        limit: currentCount + pageSize,
        reverse,
        since,
        until,
      });
      setEvents(result);
      setHasMore(result.length >= currentCount + pageSize);
    } catch (err) {
      console.warn(`[useAcmiTimeline] loadMore error:`, err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [id, isLoadingMore, hasMore, events.length, namespace, pageSize, reverse, since, until]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0 && id) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }
  }, [refreshInterval, id, fetchData]);

  return {
    events,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    loadMore,
    refetch: fetchData,
  };
}

export default useAcmiTimeline;
