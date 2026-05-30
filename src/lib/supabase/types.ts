export type MemberRole = 'owner' | 'admin' | 'viewer';

export interface Organization {
  id: string;
  slug: string;
  name: string;
  acmi_tenant_id: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
}

export interface AcmiConnection {
  id: string;
  org_id: string;
  upstash_url: string;
  upstash_token: string;
  tenant_prefix: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
