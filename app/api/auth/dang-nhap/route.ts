import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const { taiKhoan, matKhau } = await request.json();
    const nhapLieu = String(taiKhoan).trim();
    let emailDangNhap = nhapLieu;

    const supabaseAdmin = taoSupabaseAdmin();

    // 1. Tra cuu kiem tra Tai khoan (SDT hoac Email) co ton tai trong he thong hay khong
    const sdtChuan = nhapLieu.replace(/\s+/g, '').trim();
    const isEmailInput = nhapLieu.includes('@');

    let targetAuthEmail: string | null = null;
    let foundAccount = false;

    // Tra cuu trong bang profiles
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, so_dien_thoai')
      .or(`so_dien_thoai.eq.${sdtChuan},email.eq.${nhapLieu}`)
      .maybeSingle();

    if (profile) {
      foundAccount = true;
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
      if (authUser?.user?.email) {
        targetAuthEmail = authUser.user.email;
      }
    } else {
      // Neu chua tim thay trong profiles, kiem tra truc tiep bang auth.users
      const virtualEmail = `${sdtChuan}@tronau.local`;
      const { data: listUsers } = await supabaseAdmin.auth.admin.listUsers();
      const matchUser = listUsers?.users?.find(
        (u) =>
          (u.email && u.email.toLowerCase() === nhapLieu.toLowerCase()) ||
          (u.email && u.email.toLowerCase() === virtualEmail.toLowerCase())
      );
      if (matchUser) {
        foundAccount = true;
        targetAuthEmail = matchUser.email || nhapLieu;
      }
    }

    // Neu KHONG tim thấy tài khoản -> Thông báo lỗi Email/SĐT không tồn tại
    if (!foundAccount || !targetAuthEmail) {
      const thongBaoLoi = isEmailInput
        ? 'Email không chính xác hoặc chưa được đăng ký trong hệ thống'
        : 'Số điện thoại không chính xác hoặc chưa được đăng ký trong hệ thống';
      return NextResponse.json({ loi: thongBaoLoi }, { status: 400 });
    }

    // 2. Client server-side cookie handler
    const cookieStore = cookies();

    const supabase = createServerClient(
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
              // Ignore if called from Server Component
            }
          },
        },
      }
    );

    // 3. Xac thuc mat khau voi Supabase Auth (Tai khoan da ton tai -> Neu sai thi chac chan sai mat khau)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: targetAuthEmail,
      password: String(matKhau || ''),
    });

    if (error) {
      return NextResponse.json(
        { loi: 'Mật khẩu không chính xác' },
        { status: 400 }
      );
    }

    // 4. Lay role va tu dong tao profile neu thieu
    let role = 'sinh_vien';
    if (data.user) {
      const { data: p } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      role = p?.role || data.user.user_metadata?.role || (data.user.email?.includes('admin') ? 'admin' : 'sinh_vien');

      if (!p) {
        await supabaseAdmin.from('profiles').upsert({
          id: data.user.id,
          role,
          ho_ten: data.user.user_metadata?.ho_ten || (role === 'admin' ? 'Quản Trị Viên Hệ Thống' : 'Người dùng'),
          so_dien_thoai: data.user.user_metadata?.so_dien_thoai || sdtChuan,
          email: data.user.email,
        });
      }
    }

    return NextResponse.json({
      thanhCong: true,
      role,
    });
  } catch (err: any) {
    return NextResponse.json(
      { loi: err.message || 'Lỗi hệ thống khi đăng nhập' },
      { status: 500 }
    );
  }
}
