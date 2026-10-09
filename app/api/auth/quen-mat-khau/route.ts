import { NextResponse, type NextRequest } from "next/server";
import { taoSupabaseAdmin } from "@/lib/supabase/admin";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { taiKhoan } = await request.json();
    const nhapLieu = String(taiKhoan || "").trim();

    if (!nhapLieu) {
      return NextResponse.json({ loi: "Vui lòng nhập email hoặc số điện thoại" }, { status: 400 });
    }

    const supabaseAdmin = taoSupabaseAdmin();

    // Tim profile theo SDT hoac email
    const sdtChuan = nhapLieu.replace(/\s+/g, "").trim();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, so_dien_thoai")
      .or(`so_dien_thoai.eq.${sdtChuan},email.eq.${nhapLieu}`)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ thanhCong: true });
    }

    // Lay email thuc tu auth.users
    const { data: authUserData } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    const authEmail = authUserData?.user?.email;

    if (!authEmail) {
      return NextResponse.json({ thanhCong: true });
    }

    const emailAo = `${profile.so_dien_thoai}@gmail.com`;
    const isEmailAo = authEmail === emailAo;

    if (isEmailAo && !profile.email) {
      return NextResponse.json(
        { loi: "khong_co_email" },
        { status: 400 }
      );
    }

    // Dong bo profile.email sang auth.users neu can
    if (profile.email && profile.email !== authEmail) {
      await supabaseAdmin.auth.admin.updateUserById(profile.id, {
        email: profile.email,
        email_confirm: true,
      });
    }

    const emailGuiDi = profile.email || authEmail;
    const requestOrigin = request.nextUrl.origin;
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestOrigin || "http://localhost:3001";

    // 1. Tao link recovery bang Supabase Admin (khong phu thuoc vao SMTP cua Supabase Dashboard)
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: emailGuiDi,
      options: {
        redirectTo: `${baseUrl}/dat-lai-mat-khau`,
      },
    });

    if (linkErr || !linkData?.properties) {
      return NextResponse.json(
        { loi: linkErr?.message || "Không thể tạo liên kết đặt lại mật khẩu" },
        { status: 400 }
      );
    }

    // Dung token_hash chuyen toi trang Next.js cua minh de Gmail bot khong tu dong lam thoi token
    const hashedToken = linkData.properties.hashed_token;
    const actionLink = `${baseUrl}/dat-lai-mat-khau?token_hash=${hashedToken}&type=recovery`;

    // 2. Gui mail qua Nodemailer (Gmail SMTP)
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      try {
        const passChuan = gmailPass.replace(/\s+/g, '');
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: gmailUser,
            pass: passChuan,
          },
        });

        await transporter.sendMail({
          from: `"Trọ Nẫu" <${gmailUser}>`,
          to: emailGuiDi,
          subject: "[Trọ Nẫu] Yêu cầu đặt lại mật khẩu",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
              <h2 style="color: #2e7d32; text-align: center;">Đặt lại mật khẩu Trọ Nẫu</h2>
              <p>Xin chào,</p>
              <p>Bạn (hoặc ai đó) vừa yêu cầu đặt lại mật khẩu cho tài khoản <strong>${emailGuiDi}</strong> tại Trọ Nẫu.</p>
              <p>Vui lòng bấm vào nút bên dưới để tiến hành đặt mật khẩu mới:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${actionLink}" style="background-color: #2e7d32; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Đặt lại mật khẩu</a>
              </div>
              <p style="color: #666; font-size: 14px;">Nếu không bấm được nút trên, bạn có thể copy link sau dán vào trình duyệt:</p>
              <p style="word-break: break-all; color: #2e7d32;">${actionLink}</p>
            </div>
          `,
        });
      } catch (emailErr: any) {
        console.error("Lỗi gửi mail Nodemailer:", emailErr.message);
        return NextResponse.json(
          { loi: `Không thể gửi email khôi phục: ${emailErr.message}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { loi: "Hệ thống chưa cấu hình tài khoản gửi email (GMAIL_USER & GMAIL_APP_PASSWORD)" },
        { status: 500 }
      );
    }

    return NextResponse.json({ thanhCong: true });
  } catch (err: any) {
    console.error("Lỗi quen-mat-khau route:", err);
    return NextResponse.json(
      { loi: err.message || "Lỗi hệ thống khi xử lý yêu cầu" },
      { status: 500 }
    );
  }
}
