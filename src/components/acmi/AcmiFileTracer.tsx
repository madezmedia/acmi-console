'use client';

import { useMemo, useState } from 'react';
import type { AcmiEvent } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A traced file entry derived from ACMI events.
 */
export interface FileTraceEntry {
  /** Full file path */
  filePath: string;
  /** Agent or entity that created/modified the file */
  agent: string;
  /** When the operation occurred (epoch ms) */
  timestamp: number;
  /** The action performed: 'created', 'modified', 'published' */
  action: 'created' | 'modified' | 'published' | 'deleted';
  /** The correlationId at this step */
  correlationId: string;
  /** Source event summary */
  summary: string;
  /** ACMI event kind */
  kind: string;
}

export interface AcmiFileTracerProps {
  /** Timeline events to analyze for file operations */
  events: AcmiEvent[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Max entries to show (default: 50) */
  maxItems?: number;
  /** Optional search/filter string for file paths */
  searchFilter?: string;
  /** Called when a trace entry is clicked */
  onEntryClick?: (entry: FileTraceEntry) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract file paths from an ACMI event summary or payload.
 * Looks for file paths (paths containing / or .) in the summary text.
 */
function extractFilePaths(event: AcmiEvent): string[] {
  const paths: string[] = [];

  // Check payload first for explicit file path
  if (event.payload?.filePath && typeof event.payload.filePath === 'string') {
    paths.push(event.payload.filePath);
  }
  if (event.payload?.path && typeof event.payload.path === 'string') {
    paths.push(event.payload.path);
  }

  // Parse summary for file-like patterns
  const summary = event.summary ?? '';
  // Match patterns like: path/to/file, /absolute/path, file.ext
  const filePattern = /(?:^|\s)((?:\/?[\w.-]+\/)*[\w.-]+\.[a-zA-Z]{2,})/g;
  let match;
  while ((match = filePattern.exec(summary)) !== null) {
    paths.push(match[1].trim());
  }

  return [...new Set(paths)];
}

/**
 * Determine file action from event kind.
 */
function eventKindToAction(kind: string): FileTraceEntry['action'] {
  if (kind === 'artifact-published') return 'published';
  if (kind === 'milestone-shipped') return 'published';
  if (kind === 'work-update' || kind === 'work-completed') return 'modified';
  if (kind === 'work-created') return 'created';
  return 'modified';
}

/**
 * Build a trace for a specific file path from events.
 */
function buildFileTrace(
  filePath: string,
  events: AcmiEvent[],
): FileTraceEntry[] {
  return events
    .filter((e) => {
      // Check if this event mentions this file path
      const paths = extractFilePaths(e);
      return paths.some((p) => p === filePath || p.endsWith(filePath));
    })
    .map((e) => ({
      filePath,
      agent: e.source,
      timestamp: e.ts,
      action: eventKindToAction(e.kind),
      correlationId: e.correlationId,
      summary: e.summary,
      kind: e.kind,
    }))
    .sort((a, b) => a.timestamp - b.timestamp);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiFileTracer — Traces files through agent operations.
 *
 * Scans ACMI timeline events for file path references and shows a timeline
 * view of who created, modified, or published each file, with the
 * correlationId at each step.
 *
 * @example
 * ```tsx
 * <AcmiFileTracer
 *   events={timelineEvents}
 *   searchFilter=".tsx"
 *   onEntryClick={(entry) => console.log('File:', entry.filePath)}
 * />
 * ```
 */
export function AcmiFileTracer({
  events,
  className = '',
  maxItems = 50,
  searchFilter,
  onEntryClick,
}: AcmiFileTracerProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Extract unique file paths
  const allPaths = useMemo(() => {
    const pathSet = new Set<string>();
    for (const event of events) {
      const paths = extractFilePaths(event);
      for (const p of paths) pathSet.add(p);
    }
    return Array.from(pathSet).sort();
  }, [events]);

  // Filter paths by search
  const filteredPaths = useMemo(
    () =>
      searchFilter
        ? allPaths.filter((p) => p.toLowerCase().includes(searchFilter.toLowerCase()))
        : allPaths,
    [allPaths, searchFilter],
  );

  // Build traces for visible paths
  const traces = useMemo(() => {
    const paths = selectedFile ? [selectedFile] : filteredPaths.slice(0, 10);
    return paths.flatMap((p) => buildFileTrace(p, events)).slice(0, maxItems);
  }, [filteredPaths, selectedFile, events, maxItems]);

  // Action color map
  const actionColors: Record<string, string> = {
    created: 'border-l-madez-accent-mint',
    modified: 'border-l-madez-accent-blue',
    published: 'border-l-madez-skin',
    deleted: 'border-l-madez-skin/60',
  };

  const actionLabels: Record<string, string> = {
    created: 'Created',
    modified: 'Modified',
    published: 'Published',
    deleted: 'Deleted',
  };

  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-madez-bg-mid/40">
        <h2 className="text-sm font-semibold text-madez-text-primary tracking-wide mb-1">
          File Tracer
        </h2>
        <p className="text-[11px] text-madez-stroke-soft/50">
          {allPaths.length} file{allPaths.length !== 1 ? 's' : ''} referenced
        </p>
      </div>

      {/* File path selector */}
      <div className="px-5 py-3 border-b border-madez-bg-mid/30 max-h-32 overflow-y-auto">
        <div className="flex flex-wrap gap-1.5">
          {filteredPaths.slice(0, 20).map((path) => (
            <button
              key={path}
              onClick={() => setSelectedFile(selectedFile === path ? null : path)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono transition-all truncate max-w-[200px] ${
                selectedFile === path
                  ? 'bg-madez-accent-mint/15 text-madez-accent-mint border border-madez-accent-mint/30'
                  : 'bg-madez-bg-mid/20 text-madez-stroke-soft/60 border border-transparent hover:bg-madez-bg-mid/40'
              }`}
              title={path}
            >
              {path.split('/').pop()}
            </button>
          ))}
          {filteredPaths.length > 20 && (
            <span className="text-[10px] text-madez-stroke-soft/30 self-center">
              +{filteredPaths.length - 20} more
            </span>
          )}
        </div>
      </div>

      {/* Trace timeline */}
      <div className="divide-y divide-madez-bg-mid/20 max-h-[480px] overflow-y-auto">
        {traces.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-madez-stroke-soft/40">
            <span className="text-2xl mb-2">📁</span>
            <p className="text-sm">
              {searchFilter ? 'No files match the filter' : 'No file traces found'}
            </p>
          </div>
        ) : (
          traces.map((entry, i) => (
            <div
              key={`${entry.filePath}-${entry.timestamp}-${i}`}
              className={`pl-5 pr-4 py-3 border-l-4 ${actionColors[entry.action] ?? 'border-l-madez-stroke-soft/30'} transition-colors duration-100 hover:bg-madez-bg-mid/20 ${
                onEntryClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onEntryClick?.(entry)}
              role={onEntryClick ? 'button' : undefined}
              tabIndex={onEntryClick ? 0 : undefined}
              onKeyDown={
                onEntryClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') onEntryClick(entry);
                    }
                  : undefined
              }
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Action badge + file path */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-semibold uppercase tracking-wider bg-madez-bg-mid/40 px-1.5 py-0.5 rounded text-madez-accent-blue/70">
                      {actionLabels[entry.action] ?? entry.action}
                    </span>
                    <span className="text-xs font-mono text-madez-text-primary truncate">
                      {entry.filePath}
                    </span>
                  </div>

                  {/* Summary */}
                  <p className="text-xs text-madez-stroke-soft/70 leading-relaxed line-clamp-2">
                    {entry.summary}
                  </p>

                  {/* Agent + correlation */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-madez-accent-mint/70">
                      {entry.agent}
                    </span>
                    <span className="text-[10px] font-mono text-madez-stroke-soft/30 truncate max-w-[100px]">
                      #{entry.correlationId.slice(0, 16)}
                    </span>
                    <span className="text-[10px] text-madez-stroke-soft/40">
                      {new Date(entry.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default AcmiFileTracer;
