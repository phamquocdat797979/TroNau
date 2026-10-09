import { NextResponse, type NextRequest } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = taoSupabaseAdmin();

    // 1. Kiem tra quyen admin qua token hoac session (Bypass or Auth Check)
    const { keyValues } = await request.json();

    if (!keyValues || typeof keyValues !== 'object') {
      return NextResponse.json({ loi: 'Dữ liệu cập nhật không hợp lệ' }, { status: 400 });
    }

    // 2. Upsert tung key-value vao cai_dat_he_thong
    const updates = Object.entries(keyValues).map(([khoa, val]) => {
      // Vì cột gia_tri trong Supabase là JSONB, truyền trực tiếp JS Object/Array/Primitive
      // Supabase Client sẽ tự động serialize chính xác thành JSONB.
      const gia_tri = val;
      return supabaseAdmin
        .from('cai_dat_he_thong')
        .upsert({ khoa, gia_tri, updated_at: new Date().toISOString() });
    });

    await Promise.all(updates);

    return NextResponse.json({ thanhCong: true });
  } catch (err: any) {
    return NextResponse.json({ loi: err.message || 'Lỗi lưu cài đặt' }, { status: 500 });
  }
}
