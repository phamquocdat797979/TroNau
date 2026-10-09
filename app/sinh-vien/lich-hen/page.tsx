'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import Badge from '@/components/Badge/Badge';
import { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import type { LichHen } from '@/types';
import styles from '../sinh-vien.module.css';

export default function SinhVienLichHenPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();

  const [danhSachLich, setDanhSachLich] = useState<LichHen[]>([]);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    async function taiLichHen() {
      setDangTai(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }

      const todayStr = new Date().toISOString().substring(0, 10);

      // Chi lay lich hen tu ngay hien tai tro ve sau (lich qua han tu dong bien mat theo thoi gian thuc)
      const { data: lichs } = await supabase
        .from('lich_hen')
        .select(`
          *,
          bai_dang:bai_dang_id(id, duong, phuong, tien_thue, so_nha, trang_thai, chu_tro_id, chu_tro:profiles!bai_dang_chu_tro_id_fkey(id, ho_ten, so_dien_thoai))
        `)
        .eq('sinh_vien_id', user.id)
        .gte('ngay_hen', todayStr) // Lich qua han tu dong bien mat theo thoi gian thuc
        .in('trang_thai', ['cho_xac_nhan', 'da_xac_nhan', 'huy_sau_xac_nhan'])
        .order('created_at', { ascending: false });

      // Loc bo lich cua bai dang da_cho_thue (phong da duoc thue, lich khong con hieu luc)
      const lichHopLe = (lichs || []).filter(
        (lh: any) => lh.bai_dang?.trang_thai !== 'da_cho_thue'
      );

      if (lichHopLe) setDanhSachLich(lichHopLe as LichHen[]);
      setDangTai(false);
    }
    taiLichHen();
  }, []);

  // Sinh vien huy lich hen
  async function xuLyHuyLich(lh: LichHen) {
    const bai = lh.bai_dang as any;
    const chuTroId = bai?.chu_tro_id || bai?.chu_tro?.id;

    if (lh.trang_thai === 'cho_xac_nhan') {
      const { error } = await supabase
        .from('lich_hen')
        .delete()
        .eq('id', lh.id);

      if (error) {
        hienToast('Lỗi khi hủy lịch: ' + error.message, 'loi');
        return;
      }

      if (chuTroId) {
        await supabase.from('thong_bao').insert({
          nguoi_nhan_id: chuTroId,
          loai: 'sinh_vien_huy_lich',
          noi_dung: `Sinh viên đã HỦY lịch hẹn xem phòng tại ${dinhDangDuong(bai?.duong)}, ${dinhDangPhuong(bai?.phuong)} vào ngày ${new Date(lh.ngay_hen).toLocaleDateString('vi-VN')} (${lh.gio_bat_dau.substring(0, 5)} - ${lh.gio_ket_thuc.substring(0, 5)}).`,
          lien_ket: '/chu-tro/lich-hen',
        });
      }

      setDanhSachLich((prev) => prev.filter((item) => item.id !== lh.id));
      hienToast('Đã hủy lịch hẹn.', 'thanh_cong');
    } else if (lh.trang_thai === 'da_xac_nhan') {
      const { data, error } = await supabase
        .from('lich_hen')
        .update({ trang_thai: 'huy_sau_xac_nhan' })
        .eq('id', lh.id)
        .select();

      if (error || !data || data.length === 0) {
        hienToast('Lỗi khi hủy lịch: ' + (error?.message || 'Quyền thao tác bị từ chối'), 'loi');
        return;
      }

      if (chuTroId) {
        await supabase.from('thong_bao').insert({
          nguoi_nhan_id: chuTroId,
          loai: 'sinh_vien_huy_lich',
          noi_dung: `Sinh viên đã HỦY lịch hẹn (đã từng xác nhận) xem phòng tại ${dinhDangDuong(bai?.duong)}, ${dinhDangPhuong(bai?.phuong)} vào ngày ${new Date(lh.ngay_hen).toLocaleDateString('vi-VN')} (${lh.gio_bat_dau.substring(0, 5)} - ${lh.gio_ket_thuc.substring(0, 5)}).`,
          lien_ket: '/chu-tro/lich-hen',
        });
      }

      setDanhSachLich((prev) =>
        prev.map((item) => (item.id === lh.id ? { ...item, trang_thai: 'huy_sau_xac_nhan' } : item))
      );
      hienToast('Đã hủy lịch hẹn sau khi được xác nhận.', 'thanh_cong');
    }
  }

  if (dangTai) {
    return (
      <LayoutTaiKhoan>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>Đang tải lịch hẹn...</div>
      </LayoutTaiKhoan>
    );
  }

  return (
    <LayoutTaiKhoan>
      <div>

        {danhSachLich.length === 0 ? (
          <div className={styles.the_khung} style={{ textAlign: 'center', color: 'var(--chu-phu)' }}>
            Bạn chưa đăng ký lịch hẹn xem phòng nào.{' '}
            <Link href="/" style={{ color: 'var(--mau-la)', fontWeight: '600' }}>
              Tìm phòng ngay
            </Link>
          </div>
        ) : (
          <div className={styles.danh_sach_the}>
            {danhSachLich.map((lh) => {
              const bai = lh.bai_dang as any;
              const daDuocXacNhan = lh.trang_thai === 'da_xac_nhan';

              return (
                <div key={lh.id} className={styles.the_khung}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '4px' }}>
                        <Link href={`/phong-tro/${lh.bai_dang_id}`} style={{ textDecoration: 'none', color: 'var(--chu-chinh)' }}>
                          {dinhDangDuong(bai?.duong)}, {dinhDangPhuong(bai?.phuong)}
                        </Link>
                      </h3>
                      <div style={{ color: 'var(--mau-la)', fontWeight: '600', fontSize: '0.9rem' }}>
                        {bai?.tien_thue} / tháng
                      </div>
                    </div>
                    <Badge trangThai={lh.trang_thai} loai="lich_hen" />
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--chu-chinh)', marginBottom: '12px' }}>
                    Thời gian hẹn: <strong>{new Date(lh.ngay_hen).toLocaleDateString('vi-VN')}</strong> từ <strong>{lh.gio_bat_dau.substring(0, 5)}</strong> đến <strong>{lh.gio_ket_thuc.substring(0, 5)}</strong>
                  </div>

                  {/* HIEN SO NHA VA SDT CHU TRO NEU DA XAC NHAN */}
                  {daDuocXacNhan ? (
                    <div className={styles.thong_tin_xac_nhan}>
                      <strong>Đã được xác nhận!</strong>
                      <div>Địa chỉ chính xác: Số <strong>{bai?.so_nha}</strong>, {dinhDangDuong(bai?.duong)}, {dinhDangPhuong(bai?.phuong)}</div>
                      <div>SĐT Chủ trọ ({bai?.chu_tro?.ho_ten}): <strong>{bai?.chu_tro?.so_dien_thoai}</strong></div>
                    </div>
                  ) : (
                    <div className={styles.thong_tin_cho}>
                      Địa chỉ số nhà và SĐT chủ trọ sẽ hiển thị ở đây sau khi chủ trọ xác nhận lịch hẹn của bạn.
                    </div>
                  )}

                  {/* NUT HUY LICH */}
                  {(lh.trang_thai === 'cho_xac_nhan' || lh.trang_thai === 'da_xac_nhan') && (
                    <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        className={styles.nut_huy}
                        onClick={() => xuLyHuyLich(lh)}
                      >
                        Hủy lịch hẹn này
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </LayoutTaiKhoan>
  );
}
