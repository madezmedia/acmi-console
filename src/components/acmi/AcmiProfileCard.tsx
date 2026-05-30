'use client';

import type { AcmiProfile, AcmiSignals } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Status indicator color map
// ---------------------------------------------------------------------------

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-madez-accent-mint shadow-madez-glow-mint',
  away: 'bg-madez-accent-blue shadow-madez-glow-blue',
  idle: 'bg-madez-stroke-soft',
  busy: 'bg-madez-skin',
  offline: 'bg-madez-bg-mid',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiProfileCardProps {
  /** The ACMI agent/user profile data */
  profile: AcmiProfile;
  /** Optional current signals to display as status indicators */
  signals?: AcmiSignals | null;
  /** Optional CSS classname to merge */
  className?: string;
  /** Whether to show the status dot indicator (default: true) */
  showStatus?: boolean;
  /** Optional click handler */
  onClick?: () => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract a display name from the profile.
 * Falls back through name → id → 'Unknown Agent'.
 */
function displayName(profile: AcmiProfile): string {
  return profile.name ?? profile.role ?? 'Unknown Agent';
}

/**
 * Extract the initials for the avatar fallback.
 */
function initials(profile: AcmiProfile): string {
  const name = displayName(profile);
  const parts = name.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Map an ACMI actor_type to a readable badge label.
 */
function actorLabel(actorType: string): string {
  const labels: Record<string, string> = {
    agent: 'Agent',
    human: 'Human',
    system: 'System',
    external: 'External',
  };
  return labels[actorType] ?? actorType;
}

/**
 * Extract a status string from signals, falling back to a default.
 */
function getStatus(signals?: AcmiSignals | null): string {
  if (!signals) return 'offline';
  const status = signals.status ?? signals.mood ?? 'offline';
  return String(status).toLowerCase();
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiProfileCard — Agent & user profile display.
 *
 * Renders a card with avatar initial fallback, name, role, actor-type badge,
 * and optional live status dot. Uses the Mad EZ v3 design palette.
 *
 * @example
 * ```tsx
 * <AcmiProfileCard
 *   profile={{ actor_type: 'agent', name: 'Claude Engineer', role: 'Architect' }}
 *   signals={{ status: 'active' }}
 * />
 * ```
 */
export function AcmiProfileCard({
  profile,
  signals,
  className = '',
  showStatus = true,
  onClick,
}: AcmiProfileCardProps) {
  const status = getStatus(signals);
  const statusColor = STATUS_COLORS[status] ?? STATUS_COLORS.offline;

  return (
    <div
      className={`relative flex items-center gap-4 bg-madez-bg-deep rounded-madez shadow-madez-soft p-6 font-sans text-madez-text-primary transition-all duration-200 hover:shadow-madez-glow-mint ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <div className="w-14 h-14 rounded-madez bg-madez-bg-mid flex items-center justify-center text-lg font-semibold text-madez-accent-mint select-none">
          {initials(profile)}
        </div>
        {showStatus && (
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-madez-bg-deep ${statusColor}`}
            aria-label={`Status: ${status}`}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-semibold truncate text-madez-text-primary">
          {displayName(profile)}
        </h3>
        {profile.role && (
          <p className="text-sm text-madez-stroke-soft/70 truncate mt-0.5">
            {profile.role}
          </p>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-madez-bg-mid text-madez-accent-blue">
            {actorLabel(profile.actor_type)}
          </span>
          {profile.tenant_id && profile.tenant_id !== 'madez' && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-madez-bg-mid/60 text-madez-stroke-soft/80">
              {profile.tenant_id}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default AcmiProfileCard;
