'use client';

import type { AcmiWorkItem } from '@/lib/acmi/acmi-types';

export interface AcmiWorkItemCardProps {
  workItem: AcmiWorkItem;
  onClick?: (workItem: AcmiWorkItem) => void;
  className?: string;
}

/**
 * AcmiWorkItemCard — Placeholder.
 * TODO: Implement full work item card.
 */
export function AcmiWorkItemCard({
  workItem,
  onClick,
  className = '',
}: AcmiWorkItemCardProps) {
  const status = workItem.profile?.status ?? 'DRAFT';
  const title = workItem.profile?.title ?? workItem.id;
  return (
    <div
      className={`bg-madez-bg-deep rounded-madez shadow-madez-soft p-4 font-sans ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={() => onClick?.(workItem)}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-madez-text-primary truncate">
          {title}
        </h4>
        <span className="text-[10px] font-medium uppercase text-madez-accent-blue bg-madez-bg-mid/50 px-2 py-0.5 rounded-full">
          {status}
        </span>
      </div>
      {!!workItem.profile?.description && (
        <p className="text-xs text-madez-stroke-soft/70 mt-2 line-clamp-2">
          {String(workItem.profile.description)}
        </p>
      )}
    </div>
  );
}

export default AcmiWorkItemCard;
