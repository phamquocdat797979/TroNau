import { NextResponse, type NextRequest } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';
import { CAI_DAT_MAC_DINH } from '@/lib/caiDat';
import type { CaiDatHeThong, Banner } from '@/types';

// Tắt cache để luôn lấy data mới nhất từ Supabase
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabaseAdmin = taoSupabaseAdmin();

    // 1. Lay cai dat he thong tu bang cai_dat_he_thong
    const { data: rawCaiDat, error: errCaiDat } = await supabaseAdmin
      .from('cai_dat_he_thong')
      .select('*');

    const caiDat: CaiDatHeThong = { ...CAI_DAT_MAC_DINH };

    const safeParse = (val: any) => {
      if (val === null || val === undefined) return null;
      let current = val;
      // Unwrap nếu bị stringify nhiều lần
      while (typeof current === 'string') {
        try {
          const parsed = JSON.parse(current);
          if (parsed === current) break;
          current = parsed;
        } catch {
          break;
        }
      }
      return current;
    };

    if (!errCaiDat && rawCaiDat) {
      rawCaiDat.forEach((item: { khoa: string; gia_tri: any }) => {
        try {
          if (item.khoa === 'ten_app') caiDat.ten_app = item.gia_tri;
          else if (item.khoa === 'sub_name') caiDat.sub_name = item.gia_tri;
          else if (item.khoa === 'logo_url') caiDat.logo_url = item.gia_tri;
          else if (item.khoa === 'footer_mo_ta') caiDat.footer_mo_ta = item.gia_tri;
          else if (item.khoa === 'footer_ban_quyen') caiDat.footer_ban_quyen = item.gia_tri;
          else if (item.khoa === 'danh_sach_phuong') {
            const parsed = safeParse(item.gia_tri);
            if (Array.isArray(parsed)) caiDat.danh_sach_phuong = parsed;
          }
          else if (item.khoa === 'danh_sach_duong') {
            const parsed = safeParse(item.gia_tri);
            if (Array.isArray(parsed)) caiDat.danh_sach_duong = parsed;
          }
          else if (item.khoa === 'footer_sinh_vien') {
            const parsed = safeParse(item.gia_tri);
            if (Array.isArray(parsed)) caiDat.footer_sinh_vien = parsed;
          }
          else if (item.khoa === 'footer_chu_tro') {
            const parsed = safeParse(item.gia_tri);
            if (Array.isArray(parsed)) caiDat.footer_chu_tro = parsed;
          }
        } catch {
          // Keep default if parse fails
        }
      });
    }

    // 2. Lay danh sach banner
    const { data: rawBanners } = await supabaseAdmin
      .from('banner')
      .select('*')
      .order('thu_tu', { ascending: true });

    return NextResponse.json(
      {
        caiDat,
        banners: (rawBanners || []) as Banner[],
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json({
      caiDat: CAI_DAT_MAC_DINH,
      banners: [],
    });
  }
}
