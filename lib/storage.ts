import { taoSupabaseClient } from '@/lib/supabase/client';

const BUCKET_ANH = 'anh-phong-tro';
const BUCKET_BANNER = 'banner';

// Xoa mot anh cua bai dang
export async function xoaAnhBaiDang(baiDangId: string, thuTu: number): Promise<void> {
  const supabase = taoSupabaseClient();
  const duongDan = `${baiDangId}/${thuTu}.jpg`;
  const { error } = await supabase.storage.from(BUCKET_ANH).remove([duongDan]);
  if (error) {
    console.error('Lỗi xóa ảnh Storage:', error.message);
  }
}

// Xoa tat ca anh cua mot bai dang
// Dung khi xoa bai dang hoac xoa tai khoan chu tro
export async function xoaTatCaFileBaiDang(baiDangId: string): Promise<void> {
  const supabase = taoSupabaseClient();

  // Lay danh sach tat ca anh trong thu muc cua bai
  const { data: danhSachAnh } = await supabase.storage
    .from(BUCKET_ANH)
    .list(baiDangId);

  if (danhSachAnh && danhSachAnh.length > 0) {
    const duongDanAnh = danhSachAnh.map((f: any) => `${baiDangId}/${f.name}`);
    await supabase.storage.from(BUCKET_ANH).remove(duongDanAnh);
  }
}

// Lay URL cong khai cua anh banner
export function layUrlAnhCongKhai(bucket: string, duongDan: string): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${url}/storage/v1/object/public/${bucket}/${duongDan}`;
}

// Xoa banner cu truoc khi upload moi
export async function xoaBanner(thuTu: number): Promise<void> {
  const supabase = taoSupabaseClient();
  const duongDan = `${thuTu}.jpg`;
  await supabase.storage.from(BUCKET_BANNER).remove([duongDan]);
}

export { BUCKET_ANH, BUCKET_BANNER };

