'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { AcmiNamespace, AcmiProfile, AcmiSignals, AcmiEvent } from '@/lib/acmi/acmi-types';
import { getEntity } from '@/lib/acmi/client-functions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAcmiEntityOptions {
  /** Number of recent timeline events to fetch (default: 10) */
  timelineLimit?: number;
  /** Auto-refresh interval in ms (default: 0 = no auto-refresh) */
  refreshInterval?: number;
  /** If true, suppresses initial fetch until manually triggered */
  lazy?: boolean;
}

export interface UseAcmiEntityResult {
  /** The entity's profile, or null if not found */
  profile: AcmiProfile | null;
  /** Current signals KV, or null if none */
  signals: AcmiSignals | null;
  /** Recent timeline events */
  timeline: AcmiEvent[];
  /** Whether data is being fetched */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Manually refetch data */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAcmiEntity — Fetch an ACMI entity's full context (profile + signals + timeline).
 *
 * @param namespace - ACMI namespace (e.g. 'agent', 'user', 'work')
 * @param id - Entity ID within the namespace
 * @param options - Optional fetch config
 *
 * @example
 * ```tsx
 * const { profile, signals, timeline, isLoading } = useAcmiEntity('agent', 'claude-engineer', {
 *   timelineLimit: 20,
 *   refreshInterval: 30_000,
 * });
 * ```
 */
export function useAcmiEntity(
  namespace: AcmiNamespace | string,
  id: string | null,
  options: UseAcmiEntityOptions = {},
): UseAcmiEntityResult {
  const { timelineLimit = 10, refreshInterval = 0, lazy = false } = options;

  const [profile, setProfile] = useState<AcmiProfile | null>(null);
  const [signals, setSignals] = useState<AcmiSignals | null>(null);
  const [timeline, setTimeline] = useState<AcmiEvent[]>([]);
  const [isLoading, setIsLoading] = useState(!lazy);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    if (!id) {
      setProfile(null);
      setSignals(null);
      setTimeline([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const result = await getEntity(namespace as AcmiNamespace, id, timelineLimit);
      setProfile(result.profile);
      setSignals(result.signals);
      setTimeline(result.recentTimeline);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch ACMI entity';
      setError(msg);
      console.warn(`[useAcmiEntity] Error fetching ${namespace}:${id}:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [namespace, id, timelineLimit]);

  // Initial fetch
  useEffect(() => {
    if (!lazy) {
      fetchData();
    }
  }, [fetchData, lazy]);

  // Auto-refresh interval
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
    profile,
    signals,
    timeline,
    isLoading,
    error,
    refetch: fetchData,
  };
}

export default useAcmiEntity;
