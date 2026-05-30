import { CreateOrganization } from '@clerk/nextjs';

export default function CreateOrgPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-2xl font-bold">Create Your Organization</h1>
      <p className="text-muted-foreground text-sm">
        Set up your ACMI Console workspace to manage your agent fleet.
      </p>
      <CreateOrganization afterCreateOrganizationUrl="/admin" />
    </div>
  );
}
