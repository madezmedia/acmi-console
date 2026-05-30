'use client';

import { useMemo, useState } from 'react';
import type {
  AcmiAgent,
  AcmiWorkItem,
  AcmiEvent,
  AcmiProfile,
  AcmiSignals,
} from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiClusterDashboardProps {
  /** All fleet agents to display */
  agents?: AcmiAgent[];
  /** Current work items */
  workItems?: AcmiWorkItem[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Title for the dashboard */
  title?: string;
  /** Callback when an agent card is clicked */
  onAgentClick?: (agentId: string) => void;
  /** Callback when a work item is clicked */
  onWorkItemClick?: (workItemId: string) => void;
}

// ---------------------------------------------------------------------------
// Statistics helpers
// ---------------------------------------------------------------------------

interface ClusterStats {
  totalAgents: number;
  activeAgents: number;
  totalEvents: number;
  recentEvents: number;
  openWorkItems: number;
  completedWorkItems: number;
  p0Count: number;
  p1Count: number;
}

function computeStats(
  agents: AcmiAgent[],
  workItems?: AcmiWorkItem[],
): ClusterStats {
  const recentCutoff = Date.now() - 24 * 60 * 60 * 1000; // 24h

  const activeAgents = agents.filter((a) => {
    const mood = a.signals?.mood ?? a.signals?.status;
    return mood !== undefined && String(mood) !== 'offline';
  }).length;

  const totalEvents = agents.reduce(
    (sum, a) => sum + (a.timeline?.length ?? 0),
    0,
  );
  const recentEvents = agents.reduce(
    (sum, a) =>
      sum + (a.timeline?.filter((e) => e.ts >= recentCutoff).length ?? 0),
    0,
  );

  const workList = workItems ?? [];
  const openWorkItems = workList.filter(
    (w) =>
      (w.profile?.status ?? w.signals?.status) !== 'SHIPPED' &&
      (w.profile?.status ?? w.signals?.status) !== 'CANCELLED',
  ).length;
  const completedWorkItems = workList.filter(
    (w) => w.profile?.status === 'SHIPPED',
  ).length;

  const p0Count = workList.filter(
    (w) => w.profile?.priority === 'P0',
  ).length;
  const p1Count = workList.filter(
    (w) => w.profile?.priority === 'P1',
  ).length;

  return {
    totalAgents: agents.length,
    activeAgents,
    totalEvents,
    recentEvents,
    openWorkItems,
    completedWorkItems,
    p0Count,
    p1Count,
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/**
 * A single stat tile in the dashboard grid.
 */
function StatTile({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div className="bg-madez-bg-deep/80 rounded-madez p-4 shadow-sm border border-madez-bg-mid/30">
      <p className="text-[10px] uppercase tracking-widest text-madez-stroke-soft/50 mb-1">
        {label}
      </p>
      <p
        className={`text-xl font-bold tabular-nums ${
          accent ? 'text-madez-accent-mint' : 'text-madez-text-primary'
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * A mini agent row for the agent activity list.
 */
function AgentRow({
  agent,
  onClick,
}: {
  agent: AcmiAgent;
  onClick?: (id: string) => void;
}) {
  const name = agent.profile?.name ?? agent.id;
  const mood = agent.signals?.mood ?? agent.signals?.status;
  const eventCount = agent.timeline?.length ?? 0;
  const lastEvent = agent.timeline?.[agent.timeline.length - 1];

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 hover:bg-madez-bg-mid/30 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onClick?.(agent.id)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(agent.id);
            }
          : undefined
      }
    >
      {/* Mood/status dot */}
      <span
        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
          mood
            ? 'bg-madez-accent-mint shadow-madez-glow-mint'
            : 'bg-madez-bg-mid'
        }`}
        title={mood ? String(mood) : 'unknown'}
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <span className="text-xs font-medium text-madez-text-primary truncate block">
          {name}
        </span>
        {lastEvent && (
          <span className="text-[10px] text-madez-stroke-soft/50 truncate block">
            {lastEvent.kind}
          </span>
        )}
      </div>

      {/* Event count */}
      <span className="text-[10px] text-madez-stroke-soft/40 tabular-nums">
        {eventCount} evt
      </span>
    </div>
  );
}

/**
 * A mini work item row.
 */
function WorkRow({
  item,
  onClick,
}: {
  item: AcmiWorkItem;
  onClick?: (id: string) => void;
}) {
  const status: string =
    (item.profile?.status ?? item.signals?.status ?? 'DRAFT') as string;
  const isActive = status === 'IN_PROGRESS';
  const isDone = status === 'SHIPPED';

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150 hover:bg-madez-bg-mid/30 ${
        onClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onClick?.(item.id)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick(item.id);
            }
          : undefined
      }
    >
      {/* Status indicator */}
      <span
        className={`flex-shrink-0 w-2.5 h-2.5 rounded-full ${
          isActive
            ? 'bg-madez-accent-mint shadow-madez-glow-mint'
            : isDone
              ? 'bg-madez-accent-blue'
              : 'bg-madez-bg-mid'
        }`}
      />

      {/* Title + priority */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-madez-text-primary truncate">
            {item.profile?.title ?? item.id}
          </span>
          {item.profile?.priority && (
            <span className="flex-shrink-0 text-[9px] font-mono text-madez-skin/70">
              {item.profile.priority}
            </span>
          )}
        </div>
        <span className="text-[10px] text-madez-stroke-soft/50">
          {item.timeline?.length ?? 0} event(s)
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiClusterDashboard — Combined fleet overview grid.
 *
 * Renders a full fleet dashboard with statistics tiles, agent activity
 * list, recent cross-fleet events, active work items, and cluster status
 * summary — all styled in the Mad EZ v3 design palette.
 *
 * @example
 * ```tsx
 * <AcmiClusterDashboard
 *   agents={agents}
 *   workItems={workItems}
 *   onAgentClick={(id) => console.log('Agent:', id)}
 *   onWorkItemClick={(id) => console.log('Work:', id)}
 * />
 * ```
 */
export function AcmiClusterDashboard({
  agents = [],
  workItems,
  className = '',
  title = 'Fleet Cluster Dashboard',
  onAgentClick,
  onWorkItemClick,
}: AcmiClusterDashboardProps) {
  const stats = useMemo(() => computeStats(agents, workItems), [agents, workItems]);

  const recentCutoff = Date.now() - 24 * 60 * 60 * 1000;

  // Cross-fleet recent events: collect last 24h events from all agents, sorted
  const recentEvents = useMemo(() => {
    const all: AcmiEvent[] = [];
    for (const agent of agents) {
      if (agent.timeline) {
        for (const e of agent.timeline) {
          if (e.ts >= recentCutoff) {
            all.push({ ...e, source: `${agent.profile?.name ?? agent.id} | ${e.source}` });
          }
        }
      }
    }
    return all.sort((a, b) => b.ts - a.ts).slice(0, 8);
  }, [agents, recentCutoff]);

  return (
    <div
      className={`font-sans bg-madez-bg-deep rounded-madez shadow-madez-soft overflow-hidden ${className}`}
    >
      {/* Dashboard header */}
      <div className="px-6 pt-5 pb-4 border-b border-madez-bg-mid/40">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-madez-text-primary tracking-wide">
              {title}
            </h2>
            <p className="text-[11px] text-madez-stroke-soft/50 mt-0.5">
              Fleet status snapshot
            </p>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] text-madez-accent-mint/80 bg-madez-accent-mint/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-madez-accent-mint animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Stat tiles grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4">
        <StatTile label="Agents" value={stats.totalAgents} />
        <StatTile
          label="Active"
          value={stats.activeAgents}
          accent
        />
        <StatTile
          label="Events (24h)"
          value={stats.recentEvents}
        />
        <StatTile
          label="P0/P1"
          value={`${stats.p0Count}/${stats.p1Count}`}
          accent={stats.p0Count > 0}
        />
        <StatTile
          label="Open Work"
          value={stats.openWorkItems}
        />
        <StatTile
          label="Completed"
          value={stats.completedWorkItems}
        />
      </div>

      {/* Activity panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 pt-2">
        {/* Agent activity */}
        <div className="bg-madez-bg-deep/60 rounded-madez border border-madez-bg-mid/30 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-madez-bg-mid/30">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-madez-stroke-soft/70">
              Agents ({agents.length})
            </h3>
          </div>
          <div className="divide-y divide-madez-bg-mid/20 max-h-64 overflow-y-auto">
            {agents.length === 0 ? (
              <p className="px-4 py-6 text-xs text-madez-stroke-soft/40 text-center">
                No agents in fleet
              </p>
            ) : (
              agents.map((agent) => (
                <AgentRow
                  key={agent.id}
                  agent={agent}
                  onClick={onAgentClick}
                />
              ))
            )}
          </div>
        </div>

        {/* Recent cross-fleet events */}
        <div className="bg-madez-bg-deep/60 rounded-madez border border-madez-bg-mid/30 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-madez-bg-mid/30">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-madez-stroke-soft/70">
              Recent Events (24h)
            </h3>
          </div>
          <div className="divide-y divide-madez-bg-mid/20 max-h-64 overflow-y-auto">
            {recentEvents.length === 0 ? (
              <p className="px-4 py-6 text-xs text-madez-stroke-soft/40 text-center">
                No recent events
              </p>
            ) : (
              recentEvents.map((evt, i) => (
                <div
                  key={`${evt.correlationId}-${i}`}
                  className="px-4 py-2.5 transition-colors hover:bg-madez-bg-mid/20"
                >
                  <p className="text-[11px] text-madez-text-primary leading-relaxed line-clamp-2">
                    {evt.summary}
                  </p>
                  <div className="flex gap-2 mt-1 text-[9px] text-madez-stroke-soft/40">
                    <span className="truncate max-w-[120px]">{evt.source}</span>
                    <span className="px-1 rounded bg-madez-bg-mid/30 text-madez-stroke-soft/60">
                      {evt.kind}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Work items */}
        <div className="bg-madez-bg-deep/60 rounded-madez border border-madez-bg-mid/30 overflow-hidden">
          <div className="px-4 py-2.5 border-b border-madez-bg-mid/30">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-madez-stroke-soft/70">
              Work Items ({(workItems ?? []).length})
            </h3>
          </div>
          <div className="divide-y divide-madez-bg-mid/20 max-h-64 overflow-y-auto">
            {!workItems || workItems.length === 0 ? (
              <p className="px-4 py-6 text-xs text-madez-stroke-soft/40 text-center">
                No work items
              </p>
            ) : (
              workItems.map((item) => (
                <WorkRow
                  key={item.id}
                  item={item}
                  onClick={onWorkItemClick}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer summary */}
      <div className="px-5 py-3 border-t border-madez-bg-mid/30 flex items-center justify-between text-[10px] text-madez-stroke-soft/40">
        <span>
          {stats.totalAgents} agent{stats.totalAgents !== 1 ? 's' : ''} ·{' '}
          {stats.totalEvents} total events ·{' '}
          {workItems ? (workItems ?? []).length : 0} work items
        </span>
        <span className="font-mono">
          cluster:v{agents.length > 0 ? 'active' : 'idle'}
        </span>
      </div>
    </div>
  );
}

export default AcmiClusterDashboard;
