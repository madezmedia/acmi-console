'use client';

import type { AcmiWorkItem, AcmiWorkStatus, AcmiWorkSignals } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Status display mapping
// ---------------------------------------------------------------------------

/** Display-friendly status names mapped from canonical ACMI work statuses */
const STATUS_LABELS: Record<AcmiWorkStatus, string> = {
  DRAFT: 'Backlog',
  RATIFIED: 'Backlog',
  IN_PROGRESS: 'Active',
  SHIPPED: 'Done',
  CANCELLED: 'Cancelled',
};

/** Tailwind classes for each status badge */
const STATUS_STYLES: Record<AcmiWorkStatus, { badge: string; dot: string }> = {
  DRAFT: {
    badge: 'bg-madez-bg-mid/60 text-madez-stroke-soft border-madez-bg-mid',
    dot: 'bg-madez-stroke-soft',
  },
  RATIFIED: {
    badge: 'bg-madez-accent-blue/15 text-madez-accent-blue border-madez-accent-blue/30',
    dot: 'bg-madez-accent-blue',
  },
  IN_PROGRESS: {
    badge: 'bg-madez-accent-mint/15 text-madez-accent-mint border-madez-accent-mint/30',
    dot: 'bg-madez-accent-mint',
  },
  SHIPPED: {
    badge: 'bg-madez-accent-mint/20 text-madez-accent-mint border-madez-accent-mint/40',
    dot: 'bg-madez-accent-mint',
  },
  CANCELLED: {
    badge: 'bg-madez-skin/10 text-madez-skin/60 border-madez-skin/20',
    dot: 'bg-madez-skin/50',
  },
};

/** Human-readable status display name (maps BACKLOG/ACTIVE/REVIEW/DONE) */
function statusDisplayName(status?: AcmiWorkStatus): string {
  if (!status) return 'Backlog';
  return STATUS_LABELS[status] ?? status;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiWorkItemCardProps {
  /** The ACMI work item to display */
  workItem: AcmiWorkItem;
  /** Optional CSS classname to merge */
  className?: string;
  /** Optional click handler */
  onClick?: (workItem: AcmiWorkItem) => void;
  /** If true, show a compact variant without timeline preview */
  compact?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a formatted date string from work signals or fallback to profile.
 */
function lastActivity(signals: AcmiWorkSignals | null): string {
  const ts = signals?.last_activity_ts;
  if (typeof ts === 'number') {
    const diff = Date.now() - ts;
    if (diff < 60_000) return 'moments ago';
    if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  }
  return '—';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiWorkItemCard — Task/project card with status badge.
 *
 * Displays a work item from the ACMI system with its title, description,
 * owner, priority, status badge (Backlog/Active/Done/Cancelled), progress
 * bar, blockers, and timeline preview count.
 *
 * @example
 * ```tsx
 * <AcmiWorkItemCard
 *   workItem={{
 *     id: 'my-task-1',
 *     profile: { title: 'Build feature X', owner: 'agent:claude', status: 'IN_PROGRESS', priority: 'P1' },
 *     signals: { progress_pct: 65, blockers: [] },
 *     timeline: [],
 *   }}
 *   onClick={(w) => console.log('Selected:', w.id)}
 * />
 * ```
 */
export function AcmiWorkItemCard({
  workItem,
  className = '',
  onClick,
  compact = false,
}: AcmiWorkItemCardProps) {
  const { profile, signals, timeline } = workItem;

  const status: AcmiWorkStatus = (profile?.status ??
    signals?.status ??
    'DRAFT') as AcmiWorkStatus;
  const statusStyle = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const progressPct =
    typeof signals?.progress_pct === 'number' ? signals.progress_pct : 0;
  const blockers: string[] = Array.isArray(signals?.blockers)
    ? signals.blockers!
    : [];

  const handleClick = () => {
    onClick?.(workItem);
  };

  return (
    <div
      className={`relative bg-madez-bg-deep rounded-madez shadow-madez-soft p-5 font-sans transition-all duration-200 hover:shadow-madez-glow-blue ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') handleClick();
            }
          : undefined
      }
    >
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-madez-text-primary truncate">
            {profile?.title ?? workItem.id}
          </h3>
          {profile?.description && !compact && (
            <p className="text-xs text-madez-stroke-soft/70 mt-0.5 line-clamp-2">
              {profile.description}
            </p>
          )}
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${statusStyle.badge}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
          {statusDisplayName(status)}
        </span>
      </div>

      {/* Meta row: owner, priority, activity */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-madez-stroke-soft/60 mb-3">
        {profile?.owner && (
          <span className="flex items-center gap-1">
            <span className="opacity-60">→</span>
            {profile.owner}
          </span>
        )}
        {profile?.priority && (
          <span
            className={`font-mono font-semibold ${
              profile.priority === 'P0'
                ? 'text-madez-skin'
                : profile.priority === 'P1'
                  ? 'text-madez-accent-blue'
                  : 'text-madez-stroke-soft/70'
            }`}
          >
            {profile.priority}
          </span>
        )}
        <span>{lastActivity(signals ?? null)}</span>
      </div>

      {/* Progress bar */}
      {!compact && (
        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-madez-stroke-soft/50 uppercase tracking-wider">
              Progress
            </span>
            <span className="text-[10px] font-semibold text-madez-accent-mint tabular-nums">
              {progressPct}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-madez-bg-mid rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-madez-accent-mint to-madez-accent-blue transition-all duration-500"
              style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
            />
          </div>
        </div>
      )}

      {/* Blockers */}
      {blockers.length > 0 && !compact && (
        <div className="mb-2">
          <div className="flex items-center gap-1 text-[10px] text-madez-skin/70 mb-1">
            <span>⚠</span>
            <span className="uppercase tracking-wider">
              {blockers.length} blocker{blockers.length > 1 ? 's' : ''}
            </span>
          </div>
          <ul className="space-y-0.5">
            {blockers.slice(0, 2).map((b, i) => (
              <li
                key={i}
                className="text-[11px] text-madez-skin/50 pl-3 border-l border-madez-skin/20 truncate"
              >
                {b}
              </li>
            ))}
            {blockers.length > 2 && (
              <li className="text-[10px] text-madez-stroke-soft/40 pl-3">
                +{blockers.length - 2} more
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Footer: timeline count */}
      <div className="flex items-center justify-between pt-2 border-t border-madez-bg-mid/30 text-[10px] text-madez-stroke-soft/40">
        <span>
          {timeline.length} timeline event{timeline.length !== 1 ? 's' : ''}
        </span>
        {profile?.deliverables && profile.deliverables.length > 0 && (
          <span>{profile.deliverables.length} deliverable(s)</span>
        )}
      </div>
    </div>
  );
}

export default AcmiWorkItemCard;
