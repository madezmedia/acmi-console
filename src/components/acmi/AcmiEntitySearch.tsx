'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import type { AcmiEvent, AcmiEventKind } from '@/lib/acmi/acmi-types';

// ---------------------------------------------------------------------------
// Entity shape used by the search — intentionally loose to stay decoupled
// ---------------------------------------------------------------------------

/** A searchable entity result item */
export interface AcmiSearchEntity {
  /** Entity ID */
  id: string;
  /** Display name derived from profile or fallback */
  label: string;
  /** ACMI namespace */
  namespace: string;
  /** Optional role or description snippet */
  subtitle?: string;
  /** Optional avatar URL or emoji */
  icon?: string;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface AcmiEntitySearchProps {
  /** Array of all searchable entities across namespaces */
  entities: AcmiSearchEntity[];
  /** Optional CSS classname to merge */
  className?: string;
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Called when an entity is selected from the dropdown */
  onSelect: (entity: AcmiSearchEntity) => void;
  /** Optional callback when the search query changes */
  onSearch?: (query: string) => void;
  /** Max results to show in dropdown (default: 8) */
  maxResults?: number;
  /** If true, shows a brief recent-event snippet for each result */
  showRecentActivity?: boolean;
  /** Optional recent events map keyed by entity id for activity snippets */
  recentActivity?: Record<string, AcmiEvent[]>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * AcmiEntitySearch — Search across ACMI entities with dropdown results.
 *
 * Provides a text input that filters through a provided list of ACMI entities
 * (agents, users, threads, work items, etc.) and shows a dropdown with
 * matching results. Supports keyboard navigation (↑↓ Enter Escape),
 * optional recent activity snippets, and click-to-select.
 *
 * @example
 * ```tsx
 * const entities = [
 *   { id: 'claude-engineer', label: 'Claude Engineer', namespace: 'agent', subtitle: 'Architect' },
 *   { id: 'my-thread', label: 'agent-coordination', namespace: 'thread' },
 * ];
 *
 * <AcmiEntitySearch
 *   entities={entities}
 *   onSelect={(e) => console.log('Selected:', e)}
 *   placeholder="Search agents, threads, work items…"
 *   showRecentActivity
 * />
 * ```
 */
export function AcmiEntitySearch({
  entities,
  className = '',
  placeholder = 'Search ACMI entities…',
  onSelect,
  onSearch,
  maxResults = 8,
  showRecentActivity = false,
  recentActivity,
}: AcmiEntitySearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter entities by query (case-insensitive across label, id, subtitle, namespace)
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    return entities
      .filter(
        (e) =>
          e.label.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          (e.subtitle && e.subtitle.toLowerCase().includes(q)) ||
          e.namespace.toLowerCase().includes(q),
      )
      .slice(0, maxResults);
  }, [entities, query, maxResults]);

  const hasResults = results.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [results.length]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /** Handle selecting an entity */
  const selectEntity = useCallback(
    (entity: AcmiSearchEntity) => {
      setQuery('');
      setIsOpen(false);
      onSelect(entity);
    },
    [onSelect],
  );

  /** Handle keyboard navigation */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1,
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < results.length) {
            selectEntity(results[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          inputRef.current?.blur();
          break;
      }
    },
    [showDropdown, results, highlightedIndex, selectEntity],
  );

  /** Handle input change */
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setQuery(value);
      setIsOpen(true);
      onSearch?.(value);
    },
    [onSearch],
  );

  return (
    <div className={`relative font-sans ${className}`}>
      {/* Search input */}
      <div className="relative">
        {/* Search icon */}
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-madez-stroke-soft/50 pointer-events-none text-sm">
          🔍
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => query.trim() && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full h-11 pl-9 pr-4 bg-madez-bg-deep border border-madez-bg-mid/50 rounded-madez text-sm text-madez-text-primary placeholder-madez-stroke-soft/40 font-sans outline-none transition-all duration-200 focus:border-madez-accent-mint/50 focus:shadow-madez-glow-mint"
          aria-label="Search ACMI entities"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
          aria-controls="acmi-search-dropdown"
          role="combobox"
        />
        {/* Active search indicator */}
        {query.trim() && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-madez-stroke-soft/40 hover:text-madez-text-primary transition-colors text-xs"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          id="acmi-search-dropdown"
          className="absolute top-full left-0 right-0 mt-2 bg-madez-bg-deep border border-madez-bg-mid/50 rounded-madez shadow-madez-soft overflow-hidden z-50"
          role="listbox"
        >
          {!hasResults ? (
            <div className="px-4 py-8 text-center text-sm text-madez-stroke-soft/40">
              No entities match &quot;{query}&quot;
            </div>
          ) : (
            <ul className="max-h-72 overflow-y-auto divide-y divide-madez-bg-mid/20">
              {results.map((entity, index) => {
                const isHighlighted = index === highlightedIndex;
                const activity = recentActivity?.[entity.id];

                return (
                  <li
                    key={`${entity.namespace}:${entity.id}`}
                    role="option"
                    aria-selected={isHighlighted}
                    className={`px-4 py-3 transition-colors duration-100 cursor-pointer ${
                      isHighlighted
                        ? 'bg-madez-bg-mid/50'
                        : 'hover:bg-madez-bg-mid/30'
                    }`}
                    onClick={() => selectEntity(entity)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-madez-bg-mid/60 flex items-center justify-center text-xs font-semibold text-madez-accent-blue">
                        {entity.icon ?? entity.namespace.slice(0, 2).toUpperCase()}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-madez-text-primary truncate">
                            {entity.label}
                          </span>
                          <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-wider bg-madez-bg-mid/40 text-madez-stroke-soft/60">
                            {entity.namespace}
                          </span>
                        </div>
                        {entity.subtitle && (
                          <p className="text-[11px] text-madez-stroke-soft/60 mt-0.5 truncate">
                            {entity.subtitle}
                          </p>
                        )}
                        {/* Recent activity snippet */}
                        {showRecentActivity && activity && activity.length > 0 && (
                          <p className="text-[10px] text-madez-stroke-soft/40 mt-0.5 truncate">
                            Latest: {activity[activity.length - 1].summary.slice(0, 60)}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {/* Results count */}
          <div className="px-4 py-2 border-t border-madez-bg-mid/30 bg-madez-bg-deep/80">
            <p className="text-[10px] text-madez-stroke-soft/40 text-center">
              {hasResults
                ? `${results.length} of ${entities.length} entities`
                : `${entities.length} entities indexed`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AcmiEntitySearch;
