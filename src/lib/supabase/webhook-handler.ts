import { supabaseAdmin } from './admin';

interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export async function handleClerkWebhook(event: ClerkWebhookEvent) {
  const { type, data } = event;

  switch (type) {
    case 'user.created': {
      const emailArr = data.email_addresses as Array<{ email_address: string }> | undefined;
      await supabaseAdmin.from('users').upsert({
        id: data.id as string,
        email: emailArr?.[0]?.email_address || null,
        name: `${(data.first_name as string) || ''} ${(data.last_name as string) || ''}`.trim() || null,
        avatar_url: (data.image_url as string) || null,
      });
      break;
    }

    case 'user.deleted': {
      await supabaseAdmin.from('users').delete().eq('id', data.id as string);
      break;
    }

    case 'organization.created': {
      const slug = (data.slug as string) || (data.id as string);
      await supabaseAdmin.from('organizations').insert({
        id: data.id as string,
        slug,
        name: (data.name as string) || slug,
        acmi_tenant_id: slug,
      });
      const createdBy = data.created_by as string;
      if (createdBy) {
        await supabaseAdmin.from('organization_members').insert({
          org_id: data.id as string,
          user_id: createdBy,
          role: 'owner',
        });
      }
      break;
    }

    case 'organization.deleted': {
      await supabaseAdmin.from('organizations').delete().eq('id', data.id as string);
      break;
    }

    case 'organizationMembership.created': {
      const orgId = (data.organization as Record<string, unknown> | undefined)?.id as string;
      const userId = data.created_by as string;
      const role = data.role as string;
      if (orgId && userId) {
        // Only insert if user exists in our users table
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        if (existingUser) {
          await supabaseAdmin.from('organization_members').upsert({
            org_id: orgId,
            user_id: userId,
            role: (role === 'org:admin' ? 'admin' : 'viewer') as 'admin' | 'viewer',
          });
        }
      }
      break;
    }

    case 'organizationMembership.deleted': {
      const delOrgId = (data.organization as Record<string, unknown> | undefined)?.id as string;
      const delUserId = (data.user as Record<string, unknown> | undefined)?.id as string;
      if (delOrgId && delUserId) {
        await supabaseAdmin
          .from('organization_members')
          .delete()
          .eq('org_id', delOrgId)
          .eq('user_id', delUserId);
      }
      break;
    }
  }
}
