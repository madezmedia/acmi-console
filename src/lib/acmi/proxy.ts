import { supabaseAdmin } from '@/lib/supabase/admin';
import { AcmiClient } from './acmi-client';

export async function getAcmiClientForOrg(orgId: string): Promise<AcmiClient | null> {
  const { data, error } = await supabaseAdmin
    .from('acmi_connections')
    .select('*')
    .eq('org_id', orgId)
    .eq('is_active', true)
    .single();

  if (error || !data) return null;

  return new AcmiClient({
    url: data.upstash_url,
    token: data.upstash_token,
    tenantPrefix: data.tenant_prefix || undefined,
  });
}
