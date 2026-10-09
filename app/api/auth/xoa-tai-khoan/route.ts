import { NextResponse, type NextRequest } from "next/server";
import { taoSupabaseAdmin } from "@/lib/supabase/admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
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
            } catch {}
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ loi: "Bạn chưa đăng nhập" }, { status: 401 });
    }

    const supabaseAdmin = taoSupabaseAdmin();

    // 1. Lay profile de kiem tra vai tro
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ loi: "Không tìm thấy thông tin tài khoản" }, { status: 404 });
    }

    // Bắt buộc: Nút xóa chỉ áp dụng cho Chủ trọ & Sinh viên
    if (profile.role === "admin") {
      return NextResponse.json(
        { loi: "Tài khoản Quản trị viên (Admin) không thể tự xóa từ đây" },
        { status: 403 }
      );
    }

    // 2. Xóa user trong Auth bang Admin API (DB cascade tu dong xoa profiles va cac bang lien quan)
    const { error: deleteErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteErr) {
      return NextResponse.json(
        { loi: `Không thể xóa tài khoản: ${deleteErr.message}` },
        { status: 400 }
      );
    }

    // 3. Dang xuat session phia client
    try {
      await supabase.auth.signOut();
    } catch {}

    return NextResponse.json({ thanhCong: true });
  } catch (err: any) {
    console.error("Lỗi xóa tài khoản:", err);
    return NextResponse.json(
      { loi: err.message || "Lỗi hệ thống khi xóa tài khoản" },
      { status: 500 }
    );
  }
}
