'use client';

import type { AcmiEvent } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * ACK status values for handoffs, directives, and coordination events.
 */
export type AckStatus = 'pending' | 'acknowledged' | 'completed' | 'overdue';

export interface AcmiAcknowledgementBadgeProps {
  /** The current ACK status */
  status: AckStatus;
  /** Optional CSS classname to merge */
  className?: string;
  /** If true, show the label next to the dot (default: false) */
  showLabel?: boolean;
  /** Custom label override (defaults to status name) */
  label?: string;
  /** Optional size variant (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
}

// ---------------------------------------------------------------------------
// Style map
// ---------------------------------------------------------------------------

const ACK_STYLES: Record<AckStatus, { dot: string; bg: string; text: string; label: string }> = {
  pending: {
    dot: 'bg-madez-stroke-soft/50',
    bg: 'bg-madez-bg-mid/40 border-madez-bg-mid',
    text: 'text-madez-stroke-soft/70',
    label: 'Pending',
  },
  acknowledged: {
    dot: 'bg-madez-accent-blue shadow-madez-glow-blue',
    bg: 'bg-madez-accent-blue/10 border-madez-accent-blue/30',
    text: 'text-madez-accent-blue',
    label: 'ACKed',
  },
  completed: {
    dot: 'bg-madez-accent-mint shadow-madez-glow-mint',
    bg: 'bg-madez-accent-mint/10 border-madez-accent-mint/30',
    text: 'text-madez-accent-mint',
    label: 'Done',
  },
  overdue: {
    dot: 'bg-madez-skin',
    bg: 'bg-madez-skin/10 border-madez-skin/30',
    text: 'text-madez-skin',
    label: 'Overdue',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determine ACK status from a handoff-ack event.
 * Returns 'acknowledged' if a matching ack event exists,
 * 'overdue' if created > 24h ago with no ack,
 * 'pending' otherwise.
 */
export function deriveAckStatus(
  handoffEvent: AcmiEvent,
  ackEvents: AcmiEvent[],
): AckStatus {
  // Check for a matching acknowledgement
  const hasAck = ackEvents.some(
    (e) =>
      e.kind === 'handoff-ack' &&
      (e.correlationId === handoffEvent.correlationId ||
        e.parentCorrelationId === handoffEvent.correlationId),
  );

  if (hasAck) return 'acknowledged';

  // Check if completed
  const hasCompleted = ackEvents.some(
    (e) =>
      e.kind === 'work-completed' &&
      (e.correlationId === handoffEvent.correlationId ||
        e.parentCorrelationId === handoffEvent.correlationId),
  );

  if (hasCompleted) return 'completed';

  // Check for overdue (more than 24 hours old)
  const age = Date.now() - handoffEvent.ts;
  if (age > 24 * 60 * 60 * 1000) return 'overdue';

  return 'pending';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiAcknowledgementBadge — Small ACK status indicator for handoffs and directives.
 *
 * Renders a colored dot with optional label showing the acknowledgement
 * state of a coordination event. Supports pending, acknowledged, completed,
 * and overdue states using the Mad EZ v3 palette.
 *
 * @example
 * ```tsx
 * // Simple dot
 * <AcmiAcknowledgementBadge status="acknowledged" />
 *
 * // With label
 * <AcmiAcknowledgementBadge status="overdue" showLabel size="lg" />
 *
 * // Derive from events
 * <AcmiAcknowledgementBadge
 *   status={deriveAckStatus(handoffEvent, ackEvents)}
 *   showLabel
 * />
 * ```
 */
export function AcmiAcknowledgementBadge({
  status,
  className = '',
  showLabel = false,
  label,
  size = 'md',
}: AcmiAcknowledgementBadgeProps) {
  const styles = ACK_STYLES[status];
  const displayLabel = label ?? styles.label;

  const sizeClasses: Record<string, { dot: string; text: string }> = {
    sm: { dot: 'w-2 h-2', text: 'text-[9px]' },
    md: { dot: 'w-3 h-3', text: 'text-[10px]' },
    lg: { dot: 'w-3.5 h-3.5', text: 'text-xs' },
  };

  const { dot: dotSize, text: textSize } = sizeClasses[size];

  // Dot-only variant (tooltip-friendly)
  if (!showLabel) {
    return (
      <span
        className={`inline-block ${dotSize} rounded-full ${styles.dot} ${className}`}
        title={displayLabel}
        aria-label={`ACK status: ${displayLabel}`}
      />
    );
  }

  // Badge with label
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border ${styles.bg} ${styles.text} ${textSize} font-medium ${className}`}
      aria-label={`ACK status: ${displayLabel}`}
    >
      <span className={`${dotSize} rounded-full ${styles.dot}`} />
      {displayLabel}
    </span>
  );
}

export default AcmiAcknowledgementBadge;
