'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AcmiEvent, AcmiThread } from '@/lib/acmi/acmi-types';
import { AcmiProfileCard } from './AcmiProfileCard';
import { AcmiAcknowledgementBadge, deriveAckStatus } from './AcmiAcknowledgementBadge';
import type { AckStatus } from './AcmiAcknowledgementBadge';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A round table participant with their current decision and ACK status.
 */
export interface RoundTableParticipant {
  /** Entity ID */
  id: string;
  /** Display name */
  name: string;
  /** Actor type */
  actorType?: string;
  /** Current decision or position */
  decision?: string;
  /** Whether they have acknowledged the current agenda item */
  acked?: boolean;
  /** Optional status override */
  status?: 'present' | 'absent' | 'pending';
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiRoundTableProps {
  /** The thread entity backing this round table */
  thread: AcmiThread;
  /** Participants in the round table */
  participants: RoundTableParticipant[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Current agenda item being discussed */
  currentAgenda?: string;
  /** Called when the user ACKs the current item */
  onAck?: () => void;
  /** Called when the user adds a decision note */
  onDecision?: (participantId: string, decision: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiRoundTable — Multi-agent roundtable discussion view.
 *
 * Shows all agents in a roundtable-style layout with their decisions, ACKs,
 * and pending items. Provides a visual seating chart and decision status
 * tracking for coordination threads.
 *
 * @example
 * ```tsx
 * <AcmiRoundTable
 *   thread={threadData}
 *   participants={[
 *     { id: 'claude-engineer', name: 'Claude Engineer', actorType: 'agent', decision: 'Approved' },
 *     { id: 'folana', name: 'Folana', actorType: 'agent', decision: 'Pending review' },
 *   ]}
 *   currentAgenda="Q4 episode arc planning"
 *   onAck={() => console.log('ACK')}
 * />
 * ```
 */
export function AcmiRoundTable({
  thread,
  participants,
  className = '',
  currentAgenda,
  onAck,
  onDecision,
}: AcmiRoundTableProps) {
  const { profile, timeline } = thread;

  const threadName = profile?.name ?? thread.id;

  // Derive ACK status from timeline events
  const ackEvents: AcmiEvent[] = useMemo(
    () => timeline.filter((e) => e.kind === 'handoff-ack'),
    [timeline],
  );

  const latestHandoff: AcmiEvent | undefined = useMemo(
    () =>
      [...timeline]
        .reverse()
        .find((e) => e.kind === 'task-delegation' || e.kind === 'coord-note'),
    [timeline],
  );

  const currentAckStatus: AckStatus = latestHandoff
    ? deriveAckStatus(latestHandoff, timeline)
    : 'completed';

  // Group events by type for summary
  const decisionEvents = useMemo(
    () => timeline.filter((e) => e.kind === 'decision'),
    [timeline],
  );

  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-madez-bg-mid/40">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-semibold text-madez-text-primary">
              Round Table: #{threadName}
            </h2>
            {profile?.description && (
              <p className="text-[11px] text-madez-stroke-soft/60 mt-0.5">
                {profile.description}
              </p>
            )}
          </div>
          <AcmiAcknowledgementBadge
            status={currentAckStatus}
            showLabel
            size="lg"
          />
        </div>

        {/* Current agenda */}
        {currentAgenda && (
          <div className="mt-2 p-3 rounded-xl bg-madez-bg-mid/30 border border-madez-bg-mid/50">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-madez-accent-blue/70 mb-1">
              Agenda
            </p>
            <p className="text-sm text-madez-text-primary">{currentAgenda}</p>
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 mt-2 text-[10px] text-madez-stroke-soft/50">
          <span>{participants.length} participant{participants.length !== 1 ? 's' : ''}</span>
          <span>{decisionEvents.length} decision{decisionEvents.length !== 1 ? 's' : ''}</span>
          <span>{timeline.length} event{timeline.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Seating chart — agent grid */}
      <div className="px-5 py-4 border-b border-madez-bg-mid/30">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-madez-stroke-soft/50 mb-3">
          Participants
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {participants.map((p) => {
            const statusColor =
              p.status === 'absent'
                ? 'border-madez-skin/50 opacity-60'
                : p.status === 'pending'
                  ? 'border-madez-stroke-soft/30'
                  : 'border-madez-accent-mint/40';
            return (
              <div
                key={p.id}
                className={`flex flex-col items-center p-3 rounded-xl bg-madez-bg-mid/20 border ${statusColor} transition-colors hover:bg-madez-bg-mid/40`}
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-madez-bg-mid flex items-center justify-center text-sm font-semibold text-madez-accent-mint mb-2">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-madez-text-primary truncate w-full text-center">
                  {p.name}
                </span>
                {p.actorType && (
                  <span className="text-[9px] text-madez-stroke-soft/50 mt-0.5">
                    {p.actorType}
                  </span>
                )}
                {/* Decision / ACK */}
                {p.decision && (
                  <span className="mt-1.5 px-2 py-0.5 rounded-full text-[9px] bg-madez-accent-blue/10 text-madez-accent-blue truncate max-w-full">
                    {p.decision}
                  </span>
                )}
                {p.acked && (
                  <span className="mt-1 text-[9px] text-madez-accent-mint">✓ ACKed</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent decisions list */}
      {decisionEvents.length > 0 && (
        <div className="px-5 py-3 border-b border-madez-bg-mid/30">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-madez-stroke-soft/50 mb-2">
            Recent Decisions
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {decisionEvents.slice(-5).reverse().map((event) => (
              <div
                key={event.correlationId}
                className="flex items-start gap-2 py-2 px-3 rounded-xl bg-madez-bg-mid/20"
              >
                <span className="text-madez-accent-blue text-sm mt-0.5">◆</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-madez-text-primary leading-relaxed">
                    {event.summary}
                  </p>
                  <div className="flex gap-2 mt-1 text-[9px] text-madez-stroke-soft/40">
                    <span>{event.source}</span>
                    <span>{new Date(event.ts).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision input */}
      {onDecision && (
        <div className="px-5 py-3">
          <DecisionInput
            participants={participants.filter((p) => p.status !== 'absent')}
            onDecision={onDecision}
          />
        </div>
      )}

      {/* ACK button */}
      {onAck && currentAckStatus === 'pending' && (
        <div className="px-5 py-3 border-t border-madez-bg-mid/30 bg-madez-accent-blue/5">
          <button
            onClick={onAck}
            className="w-full py-2.5 rounded-xl text-xs font-semibold bg-madez-accent-blue/15 text-madez-accent-blue hover:bg-madez-accent-blue/25 transition-colors"
          >
            ✓ Acknowledge Current Item
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: DecisionInput
// ---------------------------------------------------------------------------

function DecisionInput({
  participants,
  onDecision,
}: {
  participants: RoundTableParticipant[];
  onDecision: (participantId: string, decision: string) => void;
}) {
  const [selectedId, setSelectedId] = useState(participants[0]?.id ?? '');
  const [decisionText, setDecisionText] = useState('');

  const handleSubmit = useCallback(() => {
    if (!selectedId || !decisionText.trim()) return;
    onDecision(selectedId, decisionText.trim());
    setDecisionText('');
  }, [selectedId, decisionText, onDecision]);

  return (
    <div className="flex gap-2">
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
        className="bg-madez-bg-mid/40 rounded-xl px-3 py-2 text-xs text-madez-text-primary border border-madez-bg-mid/50 outline-none"
      >
        {participants.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <input
        type="text"
        value={decisionText}
        onChange={(e) => setDecisionText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSubmit();
        }}
        placeholder="Record a decision…"
        className="flex-1 bg-madez-bg-mid/30 rounded-xl px-3 py-2 text-xs text-madez-text-primary placeholder-madez-stroke-soft/40 border border-madez-bg-mid/50 outline-none focus:border-madez-accent-mint/50"
      />
      <button
        onClick={handleSubmit}
        disabled={!decisionText.trim()}
        className="px-3 py-2 rounded-xl text-xs font-medium bg-madez-accent-mint/15 text-madez-accent-mint hover:bg-madez-accent-mint/25 transition-colors disabled:opacity-40"
      >
        Record
      </button>
    </div>
  );
}

export default AcmiRoundTable;
