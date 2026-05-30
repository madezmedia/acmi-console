'use client';

import { useState, useMemo, useCallback } from 'react';
import type { AcmiEvent, AcmiThread } from '@/lib/acmi/acmi-types';
import { AcmiTimelineStream } from './AcmiTimelineStream';
import { AcmiAcknowledgementBadge, deriveAckStatus } from './AcmiAcknowledgementBadge';
import type { AckStatus } from './AcmiAcknowledgementBadge';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiCoordinationThreadProps {
  /** The ACMI thread entity data */
  thread: AcmiThread;
  /** Optional CSS classname to merge */
  className?: string;
  /** Called when the user wants to reply in the thread */
  onReply?: (message: string) => void;
  /** Called when the user wants to ACK a specific event */
  onAck?: (event: AcmiEvent) => void;
  /** Whether to show the reply input (default: true) */
  showReplyInput?: boolean;
  /** Page size for paginated events (default: 20) */
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiCoordinationThread — A single communication thread between agents.
 *
 * Displays ACMI events sharing the same correlationId chain as a threaded
 * conversation. Provides reply and ACK interfaces for human participants.
 *
 * @example
 * ```tsx
 * <AcmiCoordinationThread
 *   thread={{
 *     id: 'agent-coordination',
 *     profile: { actor_type: 'agent', name: 'Coordination' },
 *     signals: { active_agents: 3 },
 *     timeline: events,
 *     activeAgents: ['claude-engineer', 'folana'],
 *   }}
 *   onReply={(msg) => console.log('Reply:', msg)}
 *   onAck={(event) => console.log('ACK:', event.correlationId)}
 * />
 * ```
 */
export function AcmiCoordinationThread({
  thread,
  className = '',
  onReply,
  onAck,
  showReplyInput = true,
  pageSize = 20,
}: AcmiCoordinationThreadProps) {
  const [replyText, setReplyText] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);

  const { profile, signals, timeline, activeAgents } = thread;

  // Extract unique correlation chains for threaded grouping
  const correlationChains = useMemo(() => {
    const chains = new Map<string, AcmiEvent[]>();
    for (const event of timeline) {
      const cid = event.correlationId;
      if (!chains.has(cid)) chains.set(cid, []);
      chains.get(cid)!.push(event);
    }
    return Array.from(chains.entries()).sort(
      ([, a], [, b]) => b[0].ts - a[0].ts,
    );
  }, [timeline]);

  const threadName = profile?.name ?? thread.id;

  const handleReply = useCallback(() => {
    if (!replyText.trim()) return;
    onReply?.(replyText.trim());
    setReplyText('');
  }, [replyText, onReply]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleReply();
      }
    },
    [handleReply],
  );

  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-madez-bg-mid/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-madez-text-primary">
              #{threadName}
            </h2>
            {profile?.description && (
              <p className="text-[11px] text-madez-stroke-soft/60 mt-0.5">
                {profile.description}
              </p>
            )}
          </div>
          {activeAgents && activeAgents.length > 0 && (
            <div className="flex -space-x-1.5">
              {activeAgents.slice(0, 5).map((agent) => (
                <span
                  key={agent}
                  className="w-6 h-6 rounded-full bg-madez-bg-mid border-2 border-madez-bg-deep flex items-center justify-center text-[9px] font-semibold text-madez-accent-mint"
                  title={agent}
                >
                  {agent.slice(0, 2).toUpperCase()}
                </span>
              ))}
              {activeAgents.length > 5 && (
                <span className="w-6 h-6 rounded-full bg-madez-bg-mid/60 border-2 border-madez-bg-deep flex items-center justify-center text-[9px] text-madez-stroke-soft/60">
                  +{activeAgents.length - 5}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Thread stats */}
        <div className="flex gap-3 mt-2 text-[10px] text-madez-stroke-soft/50">
          <span>{timeline.length} event{timeline.length !== 1 ? 's' : ''}</span>
          <span>{correlationChains.length} chain{correlationChains.length !== 1 ? 's' : ''}</span>
          {signals?.active_agents != null && (
            <span>{(signals.active_agents as string | number)?.toString?.() ??
                ''} active</span>
          )}
        </div>
      </div>

      {/* Correlation chain list */}
      <div className="divide-y divide-madez-bg-mid/20 max-h-[500px] overflow-y-auto">
        {correlationChains.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-madez-stroke-soft/40">
            <span className="text-2xl mb-2">💬</span>
            <p className="text-sm">No messages yet</p>
          </div>
        ) : (
          correlationChains.map(([cid, chainEvents]) => {
            const latestEvent = chainEvents[chainEvents.length - 1];
            const ackStatus: AckStatus = deriveAckStatus(latestEvent, timeline);

            return (
              <div
                key={cid}
                className="px-5 py-3 transition-colors duration-100 hover:bg-madez-bg-mid/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-madez-accent-blue">
                        {latestEvent.source}
                      </span>
                      <span className="text-[10px] font-mono text-madez-stroke-soft/40 truncate" title={cid}>
                        #{cid.slice(0, 28)}
                      </span>
                    </div>
                    <p className="text-sm text-madez-text-primary leading-relaxed">
                      {latestEvent.summary}
                    </p>
                    {chainEvents.length > 1 && (
                      <p className="text-[10px] text-madez-stroke-soft/40 mt-1">
                        +{chainEvents.length - 1} related event{chainEvents.length - 1 !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <AcmiAcknowledgementBadge status={ackStatus} showLabel size="sm" />
                    {onAck && ackStatus === 'pending' && (
                      <button
                        onClick={() => onAck(latestEvent)}
                        className="px-2 py-0.5 rounded text-[9px] font-medium bg-madez-accent-blue/10 text-madez-accent-blue hover:bg-madez-accent-blue/20 transition-colors"
                      >
                        ACK
                      </button>
                    )}
                  </div>
                </div>
                {/* Timestamp */}
                <div className="mt-1 text-[10px] text-madez-stroke-soft/40">
                  {new Date(latestEvent.ts).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Toggle full timeline */}
      <div className="px-4 py-2 border-t border-madez-bg-mid/30">
        <button
          onClick={() => setShowTimeline(!showTimeline)}
          className="w-full py-1.5 rounded-full text-[10px] font-medium text-madez-accent-blue/60 hover:text-madez-accent-blue transition-colors"
        >
          {showTimeline ? '▲ Hide full timeline' : '▼ Show full timeline'}
        </button>
      </div>

      {showTimeline && (
        <div className="border-t border-madez-bg-mid/30 max-h-80 overflow-y-auto">
          <AcmiTimelineStream
            events={timeline}
            pageSize={pageSize}
            relativeTime={false}
          />
        </div>
      )}

      {/* Reply input */}
      {showReplyInput && (
        <div className="px-4 py-3 border-t border-madez-bg-mid/30 bg-madez-bg-deep/80">
          <div className="flex gap-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              className="flex-1 resize-none bg-madez-bg-mid/30 rounded-xl px-3 py-2 text-sm text-madez-text-primary placeholder-madez-stroke-soft/40 border border-madez-bg-mid/50 outline-none focus:border-madez-accent-mint/50 transition-colors"
            />
            <button
              onClick={handleReply}
              disabled={!replyText.trim()}
              className="self-end px-4 py-2 rounded-xl text-xs font-semibold bg-madez-accent-mint text-madez-bg-deep hover:bg-madez-accent-mint/90 transition-colors disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcmiCoordinationThread;
