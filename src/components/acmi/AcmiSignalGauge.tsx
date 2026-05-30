'use client';

import { useMemo } from 'react';
import type { AcmiSignals } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiSignalGaugeProps {
  /** The raw ACMI signals object (mutable KV map) */
  signals: AcmiSignals | null;
  /** Optional CSS classname to merge */
  className?: string;
  /** Keys to display, with optional display labels and value formatters.
   *  If omitted, ALL signal keys are shown. */
  keys?: AcmiSignalKeyDef[];
  /** Title shown in the gauge header (default: "Signals") */
  title?: string;
}

/** Definition for a single signal key to display */
export interface AcmiSignalKeyDef {
  /** The signal key name */
  key: string;
  /** Optional human-readable label (defaults to the key) */
  label?: string;
  /** Optional formatter to transform the raw value for display */
  format?: (value: unknown) => string;
  /** Optional color class for the indicator bar (default: accent-mint) */
  color?: string;
  /** Optional icon/emoji prefix */
  icon?: string;
  /** If true, render as a progress bar (value 0-100) instead of a key-value pair */
  isProgress?: boolean;
}

// ---------------------------------------------------------------------------
// Default formatters
// ---------------------------------------------------------------------------

function defaultFormat(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'number') {
    // Format numbers nicely
    if (Number.isInteger(value)) return value.toLocaleString();
    return value.toFixed(2);
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) {
    if (value.length === 0) return '(empty)';
    return value.map((v) => String(v)).join(', ');
  }
  return String(value);
}

function progressFormat(value: unknown): string {
  const num = typeof value === 'number' ? value : Number(value);
  if (isNaN(num)) return '0%';
  return `${Math.round(Math.max(0, Math.min(100, num)))}%`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiSignalGauge — Live key-value signal display with visual indicators.
 *
 * Renders ACMI signals as a dashboard of labeled values with optional
 * progress bars, color coding, and custom formatting. Ideal for showing
 * live agent state (mood, metrics, scores, priorities).
 *
 * @example
 * ```tsx
 * <AcmiSignalGauge
 *   signals={{ mood: 'focused', progress_pct: 72, blockers: ['awaiting review'] }}
 *   keys={[
 *     { key: 'mood', icon: '🧠', color: 'text-madez-accent-blue' },
 *     { key: 'progress_pct', label: 'Progress', isProgress: true },
 *     { key: 'blockers', icon: '⚠️', format: (v) => String(v ?? 'None') },
 *   ]}
 * />
 * ```
 */
export function AcmiSignalGauge({
  signals,
  className = '',
  keys,
  title = 'Signals',
}: AcmiSignalGaugeProps) {
  // Derive keys from signals if not provided
  const resolvedKeys: AcmiSignalKeyDef[] = useMemo(() => {
    if (keys) return keys;
    if (!signals) return [];
    return Object.keys(signals).map((k) => ({
      key: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    }));
  }, [signals, keys]);

  // Nothing to show
  if (!signals || resolvedKeys.length === 0) {
    return (
      <div
        className={`bg-madez-bg-deep rounded-madez shadow-madez-soft p-5 font-sans ${className}`}
      >
        <h3 className="text-sm font-semibold text-madez-text-primary mb-1">
          {title}
        </h3>
        <p className="text-xs text-madez-stroke-soft/40 italic">No signals</p>
      </div>
    );
  }

  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft p-5 font-sans ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-madez-text-primary tracking-wide">
          {title}
        </h3>
        <span className="text-[10px] text-madez-stroke-soft/40 font-mono">
          {resolvedKeys.length} key{resolvedKeys.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Signal rows */}
      <div className="space-y-3">
        {resolvedKeys.map((def) => {
          const rawValue = signals[def.key];
          const displayLabel = def.label ?? def.key;
          const displayValue = def.isProgress
            ? progressFormat(rawValue)
            : (def.format?.(rawValue) ?? defaultFormat(rawValue));
          const colorClass = def.color ?? 'text-madez-accent-mint';
          const barColor = def.color ?? 'bg-madez-accent-mint';

          // Progress bar variant
          if (def.isProgress) {
            const pct = Math.round(
              Math.max(0, Math.min(100, Number(rawValue) || 0)),
            );
            return (
              <div key={def.key}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-madez-stroke-soft/80 flex items-center gap-1">
                    {def.icon && <span>{def.icon}</span>}
                    {displayLabel}
                  </span>
                  <span className={`text-xs font-semibold tabular-nums ${colorClass}`}>
                    {displayValue}
                  </span>
                </div>
                <div className="w-full h-2 bg-madez-bg-mid rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          }

          // Key-value variant
          return (
            <div
              key={def.key}
              className="flex items-center justify-between py-1.5 border-b border-madez-bg-mid/20 last:border-b-0"
            >
              <span className="text-xs text-madez-stroke-soft/80 flex items-center gap-1.5">
                {def.icon && <span>{def.icon}</span>}
                {displayLabel}
              </span>
              <span
                className={`text-xs font-semibold tabular-nums truncate max-w-[55%] text-right ${colorClass}`}
                title={String(rawValue ?? '')}
              >
                {displayValue}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AcmiSignalGauge;
