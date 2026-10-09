import { NextResponse, type NextRequest } from 'next/server';
import { taoSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = taoSupabaseAdmin();
    const { thuTu, urlAnh, tieuDe, moTa, theTags, lienKet } = await request.json();

    if (!thuTu || thuTu < 1 || thuTu > 3) {
      return NextResponse.json({ loi: 'Vị trí banner không hợp lệ' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin
      .from('banner')
      .select('id, url_anh')
      .eq('thu_tu', thuTu)
      .maybeSingle();

    const finalUrlAnh = urlAnh || (existing?.url_anh ? existing.url_anh : `/banner-${thuTu}.jpg`);

    const bannerData = {
      thu_tu: thuTu,
      url_anh: finalUrlAnh,
      tieu_de: tieuDe || null,
      mo_ta: moTa || null,
      the_tags: theTags || null,
      lien_ket: lienKet || null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabaseAdmin
        .from('banner')
        .update(bannerData)
        .eq('thu_tu', thuTu);
      if (error) throw error;
    } else {
      const { error } = await supabaseAdmin
        .from('banner')
        .insert(bannerData);
      if (error) throw error;
    }

    return NextResponse.json({ thanhCong: true });
  } catch (err: any) {
    return NextResponse.json({ loi: err.message || 'Lỗi cập nhật banner' }, { status: 500 });
  }
}
