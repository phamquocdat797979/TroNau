import { createClient } from '@supabase/supabase-js';

// Client dung trong API Routes hoac Server Side actions can quyen service_role (bo qua RLS)
// KHONG dung client nay o phia browser
export function taoSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
