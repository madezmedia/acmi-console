'use client';

import { AcmiBusFeed } from '@/components/acmi/AcmiBusFeed';

export default function TimelinePage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Fleet Timeline</h1>
      <AcmiBusFeed
        sources={[
          { label: 'Claude Engineer', namespace: 'agent', id: 'claude-engineer' },
          { label: 'Folana', namespace: 'agent', id: 'folana' },
          { label: 'Coordination', namespace: 'thread', id: 'agent-coordination' },
        ]}
        maxEvents={100}
        deduplicate
      />
    </div>
  );
}
