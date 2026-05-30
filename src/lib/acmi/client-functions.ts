// ============================================================================
// ACMI Client Function API — compatibility layer for React hooks
// ============================================================================
// Standalone functions that wrap fetch calls to the ACMI API proxy routes.
// These are what the React hooks import instead of the AcmiClient class.
// ============================================================================

import type {
  AcmiNamespace,
  AcmiProfile,
  AcmiSignals,
  AcmiEvent,
  AcmiWorkItem,
  AcmiTimelineOptions,
} from './acmi-types';

// ---------------------------------------------------------------------------
// Entity
// ---------------------------------------------------------------------------

/**
 * Fetch an entity's full context (profile + signals + recent timeline).
 * Calls the API proxy route /api/acmi/[ns]/[id].
 *
 * Used by: useAcmiEntity
 */
export async function getEntity(
  ns: AcmiNamespace | string,
  id: string,
  limit?: number,
): Promise<{ profile: AcmiProfile | null; signals: AcmiSignals | null; recentTimeline: AcmiEvent[] }> {
  const params = new URLSearchParams();
  params.set('slot', 'entity');
  if (limit != null) params.set('limit', String(limit));

  const response = await fetch(`/api/acmi/${encodeURIComponent(ns)}/${encodeURIComponent(id)}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch entity: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/**
 * Fetch timeline events for an entity with optional filtering.
 * Calls the API proxy route /api/acmi/[ns]/[id].
 *
 * Used by: useAcmiTimeline
 */
export async function getTimeline(
  ns: AcmiNamespace | string,
  id: string,
  options?: AcmiTimelineOptions,
): Promise<AcmiEvent[]> {
  const params = new URLSearchParams();
  params.set('slot', 'timeline');
  if (options?.limit != null) params.set('limit', String(options.limit));
  if (options?.reverse != null) params.set('reverse', String(options.reverse));
  if (options?.since != null) params.set('since', String(options.since));
  if (options?.until != null) params.set('until', String(options.until));

  const response = await fetch(`/api/acmi/${encodeURIComponent(ns)}/${encodeURIComponent(id)}?${params}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch timeline: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// ---------------------------------------------------------------------------
// Work items
// ---------------------------------------------------------------------------

/**
 * List all work item IDs in the 'work' namespace.
 * Returns an object with an `ids` array for the hook's consumption pattern.
 *
 * Used by: useAcmiWorkItems
 */
export async function listWorkItems(): Promise<{ ids: string[] }> {
  const response = await fetch('/api/acmi/work/list');
  if (!response.ok) {
    throw new Error(`Failed to list work items: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

/**
 * Fetch a single work item's full context (profile + signals + timeline).
 *
 * Used by: useAcmiWorkItems
 */
export async function getWorkItem(id: string): Promise<AcmiWorkItem> {
  const response = await fetch(`/api/acmi/work/${encodeURIComponent(id)}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch work item: ${response.status} ${response.statusText}`);
  }
  return response.json();
}
