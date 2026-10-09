import { NextResponse, type NextRequest } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { taiKhoan } = await request.json();
    const sdtChuan = String(taiKhoan).replace(/\s+/g, '').trim();

    const supabaseAdmin = taoSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('so_dien_thoai', sdtChuan)
      .maybeSingle();

    if (profile && profile.email) {
      return NextResponse.json({ email: profile.email });
    }

    return NextResponse.json({ email: `${sdtChuan}@gmail.com` });
  } catch (err: any) {
    return NextResponse.json({ loi: err.message }, { status: 500 });
  }
}
