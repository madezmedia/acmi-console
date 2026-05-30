import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { AcmiClusterDashboard } from '@/components/acmi/AcmiClusterDashboard';

export default async function AdminPage() {
  const { userId } = await auth();
  if (!userId) redirect('/login');

  return (
    <div>
      <AcmiClusterDashboard />
    </div>
  );
}
