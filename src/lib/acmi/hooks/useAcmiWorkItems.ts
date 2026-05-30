'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AcmiWorkItem, AcmiWorkStatus, AcmiWorkPriority } from '@/lib/acmi/acmi-types';
import { listWorkItems, getWorkItem } from '@/lib/acmi/client-functions';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkItemFilter {
  /** Filter by status (matches profile.status) */
  status?: AcmiWorkStatus | AcmiWorkStatus[];
  /** Filter by priority (matches profile.priority) */
  priority?: AcmiWorkPriority | AcmiWorkPriority[];
  /** Search string against title and description */
  search?: string;
  /** Filter by owner substring */
  owner?: string;
}

export interface UseAcmiWorkItemsOptions {
  /** Auto-refresh interval in ms (default: 0 = no auto-refresh) */
  refreshInterval?: number;
  /** Client-side filter to apply after fetching */
  filter?: WorkItemFilter;
}

export interface UseAcmiWorkItemsResult {
  /** All fetched work items (filtered applied if filter provided) */
  workItems: AcmiWorkItem[];
  /** Whether initial fetch is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Total count from the namespace (before filtering) */
  totalCount: number;
  /** Manually refetch all work items */
  refetch: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAcmiWorkItems — Fetch and optionally filter ACMI work items.
 *
 * Lists all work item IDs, hydrates each with full context (profile, signals,
 * timeline), and applies optional client-side filtering.
 *
 * @param options - Fetch config + client-side filter
 *
 * @example
 * ```tsx
 * const { workItems, isLoading } = useAcmiWorkItems({
 *   filter: { status: ['IN_PROGRESS', 'RATIFIED'], priority: 'P1' },
 *   refreshInterval: 60_000,
 * });
 * ```
 */
export function useAcmiWorkItems(
  options: UseAcmiWorkItemsOptions = {},
): UseAcmiWorkItemsResult {
  const { refreshInterval = 0, filter } = options;

  const [allItems, setAllItems] = useState<AcmiWorkItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const listResult = await listWorkItems();
      const hydrated = await Promise.all(
        listResult.ids.map((id) => getWorkItem(id).catch(() => null)),
      );
      const valid = hydrated.filter((item): item is AcmiWorkItem => item !== null);
      setAllItems(valid);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch work items';
      setError(msg);
      console.warn('[useAcmiWorkItems] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [refreshInterval, fetchData]);

  // Apply client-side filter
  const filtered = applyFilter(allItems, filter);

  return {
    workItems: filtered,
    isLoading,
    error,
    totalCount: allItems.length,
    refetch: fetchData,
  };
}

// ---------------------------------------------------------------------------
// Internal: client-side filter
// ---------------------------------------------------------------------------

function applyFilter(
  items: AcmiWorkItem[],
  filter?: WorkItemFilter,
): AcmiWorkItem[] {
  if (!filter) return items;

  return items.filter((item) => {
    const profile = item.profile;
    const signals = item.signals;

    // Status filter
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      const itemStatus = (profile?.status ?? signals?.status ?? 'DRAFT') as AcmiWorkStatus;
      if (!statuses.includes(itemStatus)) return false;
    }

    // Priority filter
    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      if (!profile?.priority || !priorities.includes(profile.priority)) return false;
    }

    // Search filter
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const title = (profile?.title ?? '').toLowerCase();
      const desc = (profile?.description ?? '').toLowerCase();
      if (!title.includes(q) && !desc.includes(q) && !item.id.toLowerCase().includes(q)) {
        return false;
      }
    }

    // Owner filter
    if (filter.owner) {
      const owner = (profile?.owner ?? '').toLowerCase();
      if (!owner.includes(filter.owner.toLowerCase())) return false;
    }

    return true;
  });
}

export default useAcmiWorkItems;
