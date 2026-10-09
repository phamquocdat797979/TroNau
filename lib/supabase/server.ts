import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
export { taoSupabaseAdmin } from './admin';

// Client dung trong Server Components va API Routes (doc session tu cookie)
export async function taoSupabaseServer() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll duoc goi tu Server Component - co the bo qua loi nay
          }
        },
      },
    }
  );
}
