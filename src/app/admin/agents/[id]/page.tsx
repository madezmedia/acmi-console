import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AcmiAgentProfileFull } from '@/components/acmi/AcmiAgentProfileFull';

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  const { id } = await params;

  return (
    <div className="min-h-screen bg-madez-bg-mid">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <AcmiAgentProfileFull
          profile={{
            actor_type: 'agent',
            name: `Agent ${id.slice(0, 8)}`,
            role: 'ACM I Agent',
          }}
          signals={null}
          timeline={[]}
          workItems={[]}
        />
      </div>
    </div>
  );
}
