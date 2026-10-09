import { NextResponse, type NextRequest } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // 1. Kiem tra Xac thuc CRON_SECRET neu co cau hinh
    const authHeader = request.headers.get('authorization');
    const secretKey = process.env.CRON_SECRET;

    if (secretKey && authHeader !== `Bearer ${secretKey}`) {
      return NextResponse.json(
        { loi: 'Không có quyền truy cập Cron Job' },
        { status: 401 }
      );
    }

    const supabaseAdmin = taoSupabaseAdmin();

    // 2. Goi stored procedure tu_dong_huy_lich_hen_qua_han
    const { error } = await supabaseAdmin.rpc('tu_dong_huy_lich_hen_qua_han');

    if (error) {
      console.error('Lỗi khi dọn dẹp lịch hẹn quá hạn:', error);
      return NextResponse.json(
        { thanhCong: false, loi: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      thanhCong: true,
      thoiGian: new Date().toISOString(),
      thongBao: 'Đã tự động hủy và xóa các lịch hẹn quá hạn thành công.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { thanhCong: false, loi: err.message || 'Lỗi server' },
      { status: 500 }
    );
  }
}
