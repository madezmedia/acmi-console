'use client';

import { useState } from 'react';
import type { AcmiThread, AcmiEvent } from '@/lib/acmi/acmi-types';
import { useAcmiEntity } from '@/lib/acmi/hooks';
import { AcmiCoordinationThread } from '@/components/acmi/AcmiCoordinationThread';
import { AcmiRoundTable } from '@/components/acmi/AcmiRoundTable';
import { AcmiHandoffTracker } from '@/components/acmi/AcmiHandoffTracker';
import type { RoundTableParticipant } from '@/components/acmi/AcmiRoundTable';

export default function CoordinationPage() {
  const [threadKey, setThreadKey] = useState('agent-coordination');
  const [inputValue, setInputValue] = useState(threadKey);

  // Fetch thread entity data from ACMI
  const {
    profile,
    signals,
    timeline,
    isLoading,
    error,
    refetch,
  } = useAcmiEntity('thread', threadKey, { timelineLimit: 50 });

  // Construct the thread object for child components
  const threadData: AcmiThread = {
    id: threadKey,
    profile,
    signals,
    timeline,
    activeAgents: [],
  };

  // Default participants for the round table (sensible defaults)
  const defaultParticipants: RoundTableParticipant[] = [
    {
      id: 'claude-engineer',
      name: 'Claude Engineer',
      actorType: 'agent',
      status: 'present',
    },
    {
      id: 'folana',
      name: 'Folana',
      actorType: 'agent',
      status: 'present',
    },
    {
      id: 'orchestrator',
      name: 'Orchestrator',
      actorType: 'agent',
      status: 'present',
    },
  ];

  const handleReply = (message: string) => {
    console.log('[CoordinationPage] Reply:', message);
    // In a real app, this would post the message via the ACMI API
  };

  const handleAck = (event: AcmiEvent) => {
    console.log('[CoordinationPage] ACK:', event.correlationId);
    // In a real app, this would record the acknowledgement
  };

  const handleRoundTableAck = () => {
    console.log('[CoordinationPage] Round Table ACK');
  };

  const handleDecision = (participantId: string, decision: string) => {
    console.log('[CoordinationPage] Decision', participantId, ':', decision);
  };

  const handleHandoffClick = (handoff: AcmiEvent) => {
    console.log('[CoordinationPage] Handoff clicked:', handoff.correlationId);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setThreadKey(inputValue.trim() || 'agent-coordination');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Coordination</h1>

        {/* Thread key search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Thread key…"
            className="px-3 py-1.5 rounded-xl text-sm bg-madez-bg-mid/30 border border-madez-bg-mid/50 text-madez-text-primary placeholder-madez-stroke-soft/40 outline-none focus:border-madez-accent-mint/50 w-48"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-xl text-xs font-medium bg-madez-accent-mint/15 text-madez-accent-mint hover:bg-madez-accent-mint/25 transition-colors"
          >
            Load
          </button>
        </form>
      </div>

      {/* Loading / Error states */}
      {isLoading && (
        <div className="flex items-center justify-center py-8 text-madez-stroke-soft/50">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 rounded-full border-2 border-madez-accent-mint/30 border-t-madez-accent-mint animate-spin" />
            <span className="text-sm">Loading thread {threadKey}…</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-madez-skin/10 border border-madez-skin/30 text-madez-skin text-sm">
          Failed to load thread &quot;{threadKey}&quot;: {error}
        </div>
      )}

      {/* Main grid — single column on mobile, two columns on large screens */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left column — Thread */}
        <div className="space-y-6">
          <AcmiCoordinationThread
            thread={threadData}
            onReply={handleReply}
            onAck={handleAck}
            showReplyInput
            pageSize={20}
          />
        </div>

        {/* Right column — Handoffs */}
        <div className="space-y-6">
          <AcmiHandoffTracker
            events={timeline}
            onHandoffClick={handleHandoffClick}
            onAck={handleAck}
            maxItems={50}
          />
        </div>
      </div>

      {/* Round Table section */}
      <AcmiRoundTable
        thread={threadData}
        participants={defaultParticipants}
        currentAgenda="Agent coordination and task delegation"
        onAck={handleRoundTableAck}
        onDecision={handleDecision}
      />
    </div>
  );
}
