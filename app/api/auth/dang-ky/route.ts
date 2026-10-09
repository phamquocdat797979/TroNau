import { NextResponse, type NextRequest } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { role, hoTen, soDienThoai, email, matKhau } = await request.json();

    const sdtChuan = String(soDienThoai).replace(/\s+/g, '').trim();
    const emailNhap = email ? String(email).trim() : '';
    const emailDangKyAuth = emailNhap || `${sdtChuan}@gmail.com`;

    const supabaseAdmin = taoSupabaseAdmin();

    // 1. Kiem tra trung SDT trong profiles
    const { data: tonTaiSDT } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('so_dien_thoai', sdtChuan)
      .maybeSingle();

    if (tonTaiSDT) {
      return NextResponse.json(
        { loi: 'Số điện thoại này đã được đăng ký tài khoản' },
        { status: 400 }
      );
    }

    // Kiem tra trung Email neu co nhap
    if (emailNhap) {
      const { data: tonTaiEmail } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', emailNhap)
        .maybeSingle();

      if (tonTaiEmail) {
        return NextResponse.json(
          { loi: 'Email này đã được đăng ký tài khoản' },
          { status: 400 }
        );
      }
    }

    // 2. Tao user trong Auth bang Admin API
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: emailDangKyAuth,
      password: matKhau,
      email_confirm: true,
      user_metadata: {
        role,
        ho_ten: hoTen.trim(),
        so_dien_thoai: sdtChuan,
      },
    });

    if (authError) {
      if (authError.message.includes('already registered') || authError.message.includes('already been registered')) {
        return NextResponse.json(
          { loi: 'Email hoặc số điện thoại này đã được đăng ký' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { loi: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      // Upsert profile voi email thuc te (null neu khong nhap)
      await supabaseAdmin.from('profiles').upsert({
        id: authData.user.id,
        role,
        ho_ten: hoTen.trim(),
        so_dien_thoai: sdtChuan,
        email: emailNhap || null,
      });
    }

    return NextResponse.json({ thanhCong: true });
  } catch (err: any) {
    return NextResponse.json(
      { loi: err.message || 'Lỗi hệ thống khi đăng ký' },
      { status: 500 }
    );
  }
}
