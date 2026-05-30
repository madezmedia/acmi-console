'use client';

import { useMemo, useState } from 'react';
import type { AcmiProfile, AcmiSignals, AcmiEvent } from '@/lib/acmi/acmi-types';
import { AcmiProfileCard } from './AcmiProfileCard';
import { AcmiSignalGauge } from './AcmiSignalGauge';
import { AcmiTimelineStream } from './AcmiTimelineStream';
import { AcmiWorkItemCard } from './AcmiWorkItemCard';
import { AcmiHandoffTracker } from './AcmiHandoffTracker';
import type { AcmiWorkItem } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiAgentProfileFullProps {
  /** Agent profile data */
  profile: AcmiProfile;
  /** Optional current signals */
  signals?: AcmiSignals | null;
  /** Recent timeline events */
  timeline?: AcmiEvent[];
  /** Active work items for this agent */
  workItems?: AcmiWorkItem[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Optional click handler for work items */
  onWorkItemClick?: (workItem: AcmiWorkItem) => void;
  /** Optional click handler for timeline events */
  onTimelineEventClick?: (event: AcmiEvent) => void;
  /** Optional handler for ACKing handoffs */
  onHandoffAck?: (event: AcmiEvent) => void;
  /** Currently active section panel */
  activeSection?: string;
  /** Called when the active section changes */
  onSectionChange?: (section: string) => void;
}

// ---------------------------------------------------------------------------
// Section config
// ---------------------------------------------------------------------------

interface SectionDef {
  id: string;
  label: string;
  icon: string;
}

const SECTIONS: SectionDef[] = [
  { id: 'signals', label: 'Signals', icon: '📊' },
  { id: 'work', label: 'Work Items', icon: '📋' },
  { id: 'timeline', label: 'Timeline', icon: '📜' },
  { id: 'handoffs', label: 'Handoffs', icon: '🤝' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiAgentProfileFull — Full agent profile dashboard.
 *
 * Enhances AcmiProfileCard with a comprehensive agent view showing current
 * signals, recent timeline, active work items, and handoff tracking in a
 * tabbed panel layout.
 *
 * @example
 * ```tsx
 * <AcmiAgentProfileFull
 *   profile={{ actor_type: 'agent', name: 'Claude Engineer', role: 'Architect' }}
 *   signals={{ mood: 'focused', progress_pct: 72 }}
 *   timeline={events}
 *   workItems={items}
 * />
 * ```
 */
export function AcmiAgentProfileFull({
  profile,
  signals,
  timeline = [],
  workItems = [],
  className = '',
  onWorkItemClick,
  onTimelineEventClick,
  onHandoffAck,
  activeSection: externalSection,
  onSectionChange,
}: AcmiAgentProfileFullProps) {
  const [internalSection, setInternalSection] = useState('signals');

  // Use external section control if provided
  const activeSection = externalSection ?? internalSection;
  const setActiveSection = onSectionChange ?? setInternalSection;

  // Handoff events for the tracker
  const handoffEvents = useMemo(
    () => timeline.filter((e) => e.kind === 'task-delegation' || e.kind === 'handoff-ack' || e.kind === 'work-completed'),
    [timeline],
  );

  return (
    <div
      className={`font-sans space-y-4 ${className}`}
    >
      {/* Profile card — always visible */}
      <AcmiProfileCard
        profile={profile}
        signals={signals}
        showStatus
      />

      {/* Section tabs */}
      <div className="flex flex-wrap gap-1 px-1 py-2 bg-madez-bg-deep rounded-madez shadow-madez-soft">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              activeSection === section.id
                ? 'bg-madez-accent-mint/15 text-madez-accent-mint shadow-madez-glow-mint'
                : 'text-madez-stroke-soft/60 hover:text-madez-text-primary hover:bg-madez-bg-mid/30'
            }`}
          >
            <span>{section.icon}</span>
            {section.label}
            {section.id === 'work' && workItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-madez-accent-blue/15 text-madez-accent-blue ml-1">
                {workItems.length}
              </span>
            )}
            {section.id === 'handoffs' && handoffEvents.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-madez-accent-blue/15 text-madez-accent-blue ml-1">
                {handoffEvents.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Signals panel */}
      {activeSection === 'signals' && (
        <AcmiSignalGauge
          signals={signals ?? null}
          title={`${profile.name ?? 'Agent'} Signals`}
        />
      )}

      {/* Work items panel */}
      {activeSection === 'work' && (
        <div className="space-y-3">
          {workItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 bg-madez-bg-deep rounded-madez shadow-madez-soft text-madez-stroke-soft/40">
              <span className="text-2xl mb-2">📋</span>
              <p className="text-sm">No active work items</p>
            </div>
          ) : (
            workItems.map((item) => (
              <AcmiWorkItemCard
                key={item.id}
                workItem={item}
                onClick={onWorkItemClick}
              />
            ))
          )}
        </div>
      )}

      {/* Timeline panel */}
      {activeSection === 'timeline' && (
        <AcmiTimelineStream
          events={timeline}
          pageSize={15}
          relativeTime
        />
      )}

      {/* Handoffs panel */}
      {activeSection === 'handoffs' && (
        <AcmiHandoffTracker
          events={handoffEvents}
          onAck={onHandoffAck}
          maxItems={30}
        />
      )}
    </div>
  );
}

export default AcmiAgentProfileFull;
