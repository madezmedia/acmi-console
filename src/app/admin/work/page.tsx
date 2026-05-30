'use client';

import { useAcmiWorkItems } from '@/lib/acmi/hooks';
import { AcmiWorkItemCard } from '@/components/acmi/AcmiWorkItemCard';

export default function WorkItemsPage() {
  const { workItems, isLoading, error } = useAcmiWorkItems();

  if (isLoading) return <div className="py-12 text-center text-muted-foreground">Loading work items...</div>;
  if (error) return <div className="py-12 text-center text-red-500">Error: {error}</div>;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Work Items</h1>
      {!workItems || workItems.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">No work items found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workItems.map((item) => (
            <AcmiWorkItemCard key={item.id} workItem={item} />
          ))}
        </div>
      )}
    </div>
  );
}
