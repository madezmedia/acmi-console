import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

function ensureClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Supabase environment variables are not configured');
  }

  cachedClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  return cachedClient;
}

// Lazy proxy — only creates the actual client when a method is called
export const supabaseAdmin = new Proxy<SupabaseClient>({} as SupabaseClient, {
  get(_target, prop: string | symbol) {
    const client = ensureClient();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  },
});
