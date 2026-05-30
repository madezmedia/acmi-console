import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});

// Helper: get auth user id from Clerk session (passed as header)
export function getUserIdFromRequest(request: Request): string | null {
  // Clerk attaches auth to request — this will be used by API routes
  return null; // Placeholder — middleware handles this
}
