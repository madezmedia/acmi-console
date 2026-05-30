'use client';

import { useOrg } from '@/lib/acmi/acmi-context';
import { SetupWizard } from '@/components/setup-wizard';
import { AcmiClusterDashboard } from '@/components/acmi/AcmiClusterDashboard';

export default function AdminPage() {
  const { activeOrg, isLoading } = useOrg();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading workspace...
      </div>
    );
  }

  if (!activeOrg) {
    return <SetupWizard />;
  }

  return (
    <div>
      <div className="mb-4 text-sm text-muted-foreground">
        Workspace: <strong>{activeOrg.name}</strong>
      </div>
      <AcmiClusterDashboard />
    </div>
  );
}
