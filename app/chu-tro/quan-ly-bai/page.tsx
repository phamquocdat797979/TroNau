'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import Badge from '@/components/Badge/Badge';
import Modal from '@/components/Modal/Modal';
import { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { xoaTatCaFileBaiDang } from '@/lib/storage';
import { dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import type { BaiDang } from '@/types';
import styles from '../chu-tro.module.css';

export default function QuanLyBaiPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();

  const [danhSachBai, setDanhSachBai] = useState<BaiDang[]>([]);
  const [dangTai, setDangTai] = useState(true);

  // Modal Xoa bai
  const [baiDangXoa, setBaiDangXoa] = useState<BaiDang | null>(null);
  const [dangXoa, setDangXoa] = useState(false);

  // Modal xac nhan danh dau Da cho thue
  const [baiXacNhanChoThue, setBaiXacNhanChoThue] = useState<BaiDang | null>(null);
  const [dangChoThue, setDangChoThue] = useState(false);

  // Modal cap nhat ghi chu ngay trong du kien (chi la ghi chu)
  const [baiDoiNgayTrong, setBaiDoiNgayTrong] = useState<BaiDang | null>(null);
  const [ngayTrongMoi, setNgayTrongMoi] = useState('');
  const [dangLuuNgayTrong, setDangLuuNgayTrong] = useState(false);

  useEffect(() => {
    async function taiDuLieu() {
      setDangTai(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }

      const { data } = await supabase
        .from('bai_dang')
        .select('*, lich_co_the_dat(*), lich_hen(ngay_hen, gio_bat_dau, gio_ket_thuc, trang_thai)')
        .eq('chu_tro_id', user.id)
        .order('created_at', { ascending: false });

      if (data) {
        const todayStr = new Date().toISOString().substring(0, 10);
        const danhSachFormatted: BaiDang[] = data.map((item: any) => {
          const futureSlots = item.lich_co_the_dat?.filter((l: any) => l.ngay_hen >= todayStr) || [];
          const hasAvailableSlot = futureSlots.some((l: any) => {
            const isBooked = (item.lich_hen || []).some((lh: any) => {
              if (lh.trang_thai === 'huy_sau_xac_nhan') return false;
              if (lh.ngay_hen !== l.ngay_hen) return false;
              const lStart = l.gio_bat_dau.substring(0, 5);
              const lEnd = l.gio_ket_thuc.substring(0, 5);
              const lhStart = lh.gio_bat_dau.substring(0, 5);
              const lhEnd = lh.gio_ket_thuc.substring(0, 5);
              return lhStart < lEnd && lhEnd > lStart;
            });
            return !isBooked;
          });

          return {
            ...item,
            co_lich_hen: hasAvailableSlot,
          };
        });
        setDanhSachBai(danhSachFormatted);
      }
      setDangTai(false);
    }
    taiDuLieu();
  }, []);

  function dinhDangNgay(dateStr?: string | null) {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return year && month && day ? `${day}/${month}/${year}` : dateStr;
  }

  // Mo modal xac nhan danh dau Da cho thue
  function moXacNhanChoThue(bai: BaiDang) {
    setBaiXacNhanChoThue(bai);
  }

  // Xu ly danh dau Da cho thue (xoa lich hen, xoa lich co the dat, doi trang thai)
  async function xuLyDaChoThue() {
    if (!baiXacNhanChoThue) return;
    setDangChoThue(true);

    try {
      // 1. Goi RPC chuyen_trang_thai_da_cho_thue
      const { error: rpcErr } = await supabase.rpc('chuyen_trang_thai_da_cho_thue', {
        p_bai_dang_id: baiXacNhanChoThue.id,
      });

      if (rpcErr) {
        // Fallback xoa lich_hen, xoa lich_co_the_dat, va cap nhat trang_thai sang da_cho_thue
        await supabase.from('lich_hen').delete().eq('bai_dang_id', baiXacNhanChoThue.id);
        await supabase.from('lich_co_the_dat').delete().eq('bai_dang_id', baiXacNhanChoThue.id);
        await supabase.from('bai_dang').update({ trang_thai: 'da_cho_thue' }).eq('id', baiXacNhanChoThue.id);
      }

      setDanhSachBai((prev) =>
        prev.map((b) =>
          b.id === baiXacNhanChoThue.id
            ? { ...b, trang_thai: 'da_cho_thue' }
            : b
        )
      );
      hienToast('Đã đánh dấu Đã cho thuê và dọn dẹp toàn bộ lịch hẹn cũ.', 'thanh_cong');
      setBaiXacNhanChoThue(null);
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    } finally {
      setDangChoThue(false);
    }
  }

  // Mo modal cap nhat ghi chu ngay trong du kien
  function moModalCapNhatNgayTrong(bai: BaiDang) {
    setBaiDoiNgayTrong(bai);
    setNgayTrongMoi(bai.ngay_trong_du_kien || '');
  }

  // Xu ly luu ghi chu ngay trong du kien (khong doi trang thai)
  async function xuLyLuuNgayTrong() {
    if (!baiDoiNgayTrong) return;
    setDangLuuNgayTrong(true);

    try {
      const valNgay = ngayTrongMoi.trim() || null;

      const { error } = await supabase
        .from('bai_dang')
        .update({ ngay_trong_du_kien: valNgay })
        .eq('id', baiDoiNgayTrong.id);

      if (error) {
        hienToast('Lỗi cập nhật ngày trống: ' + error.message, 'loi');
        return;
      }

      setDanhSachBai((prev) =>
        prev.map((b) =>
          b.id === baiDoiNgayTrong.id ? { ...b, ngay_trong_du_kien: valNgay } : b
        )
      );
      hienToast('Đã cập nhật ghi chú ngày trống!', 'thanh_cong');
      setBaiDoiNgayTrong(null);
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    } finally {
      setDangLuuNgayTrong(false);
    }
  }

  // Chuyen tu da_cho_thue -> con_trong (Tu dong xoa ngay_trong_du_kien)
  async function xuLyDoiVeConTrong(bai: BaiDang) {
    const { error } = await supabase
      .from('bai_dang')
      .update({ trang_thai: 'con_trong', ngay_trong_du_kien: null })
      .eq('id', bai.id);

    if (error) {
      hienToast('Lỗi khi chuyển trạng thái: ' + error.message, 'loi');
      return;
    }

    setDanhSachBai((prev) =>
      prev.map((b) =>
        b.id === bai.id ? { ...b, trang_thai: 'con_trong', ngay_trong_du_kien: null } : b
      )
    );
    hienToast('Đã chuyển bài đăng thành Còn trống.', 'thanh_cong');
  }

  // Xoa bai dang
  async function xacNhanXoaBai() {
    if (!baiDangXoa) return;
    setDangXoa(true);

    try {
      await xoaTatCaFileBaiDang(baiDangXoa.id);
      const { error } = await supabase
        .from('bai_dang')
        .delete()
        .eq('id', baiDangXoa.id);

      if (error) {
        hienToast('Không thể xóa bài đăng: ' + error.message, 'loi');
        return;
      }

      setDanhSachBai((prev) => prev.filter((b) => b.id !== baiDangXoa.id));
      hienToast('Đã xóa bài đăng thành công.', 'thanh_cong');
      setBaiDangXoa(null);
    } catch (err: any) {
      hienToast('Lỗi khi xóa bài đăng: ' + err.message, 'loi');
    } finally {
      setDangXoa(false);
    }
  }

  if (dangTai) {
    return (
      <LayoutTaiKhoan>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>Đang tải danh sách bài đăng...</div>
      </LayoutTaiKhoan>
    );
  }

  return (
    <LayoutTaiKhoan>
      <div>

        {danhSachBai.length === 0 ? (
          <div className={styles.the_form} style={{ textAlign: 'center', color: 'var(--chu-phu)' }}>
            Bạn chưa có tin đăng phòng trọ nào.{' '}
            <Link href="/chu-tro/dang-bai" style={{ color: 'var(--mau-la)', fontWeight: '600' }}>
              Đăng tin ngay
            </Link>
          </div>
        ) : (
          <div className={styles.danh_sach_the_bai}>
            {danhSachBai.map((bai) => (
              <div key={bai.id} className={styles.the_quan_ly}>
                <div className={styles.thong_tin_bai}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.1rem' }}>
                        Số {bai.so_nha || '---'}, {dinhDangDuong(bai.duong)}, {dinhDangPhuong(bai.phuong)}
                      </strong>
                      <Badge trangThai={bai.trang_thai} loai="bai_dang" />
                      {bai.trang_thai === 'con_trong' && (
                        <span
                          style={{
                            background: bai.co_lich_hen ? '#e8f5e9' : '#ffebee',
                            color: bai.co_lich_hen ? '#2e7d32' : '#c62828',
                            border: bai.co_lich_hen ? '1px solid #81c784' : '1px solid #e57373',
                            padding: '3px 8px',
                            borderRadius: 'var(--bo-vua)',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                          }}
                        >
                          {bai.co_lich_hen ? 'Còn lịch hẹn' : 'Hết lịch hẹn'}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--mau-la)', fontWeight: '700', marginBottom: '4px' }}>
                      {bai.tien_thue} / tháng
                    </div>

                    {/* HIEN THI NGAY TRONG DU KIEN KHI DA CHO THUE */}
                    {bai.trang_thai === 'da_cho_thue' && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--mau-la)', background: 'var(--mau-la-nhat)', padding: '4px 10px', borderRadius: 'var(--bo-vua)', marginTop: '6px', display: 'inline-block', border: '1px solid rgba(46, 125, 50, 0.2)' }}>
                        Dự kiến trống: <strong>{bai.ngay_trong_du_kien || 'Chưa cài đặt'}</strong>
                      </div>
                    )}

                    {bai.ly_do_tu_choi && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--nguy-hiem)', background: 'var(--nguy-hiem-nhat)', padding: '6px 10px', borderRadius: 'var(--bo-vua)', marginTop: '6px' }}>
                        Lý do bị từ chối: {bai.ly_do_tu_choi}
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.cac_nut_thao_tac}>
                  {/* CHUYEN TRANG THAI */}
                  {bai.trang_thai === 'con_trong' && (
                    <button
                      className={`${styles.nut_chuyen_trang_thai} ${styles.nut_chuyen_da_cho_thue}`}
                      onClick={() => moXacNhanChoThue(bai)}
                    >
                      Đánh dấu Đã cho thuê
                    </button>
                  )}

                  {bai.trang_thai === 'da_cho_thue' && (
                    <>
                      <button
                        type="button"
                        style={{ padding: '8px 12px', background: 'var(--nen-xam)', border: '1px solid var(--vien-nhap)', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
                        onClick={() => moModalCapNhatNgayTrong(bai)}
                      >
                        {bai.ngay_trong_du_kien ? 'Đổi ngày trống' : 'Thêm ngày trống'}
                      </button>

                      <button
                        className={`${styles.nut_chuyen_trang_thai} ${styles.nut_chuyen_con_trong}`}
                        onClick={() => xuLyDoiVeConTrong(bai)}
                      >
                        Đánh dấu Còn trống
                      </button>
                    </>
                  )}

                  {/* NUT SUA BAI DANG: Cho phep sua khi trang thai KHAC 'da_cho_thue' theo Plan */}
                  {bai.trang_thai !== 'da_cho_thue' && (
                    <Link href={`/chu-tro/sua-bai/${bai.id}`} className={styles.nut_sua}>
                      Sửa
                    </Link>
                  )}

                  <Link href={`/phong-tro/${bai.id}`} className={styles.nut_xem}>
                    Xem
                  </Link>

                  <button
                    className={styles.nut_xoa}
                    onClick={() => setBaiDangXoa(bai)}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL XAC NHAN DANH DAU DA CHO THUE */}
      <Modal
        hienThi={!!baiXacNhanChoThue}
        tieuDe="Xác nhận Đã cho thuê"
        onClose={() => setBaiXacNhanChoThue(null)}
      >
        <p style={{ marginBottom: '16px', fontSize: '0.9rem', color: 'var(--chu-chinh)' }}>
          Xác nhận bài đăng tại <strong>{dinhDangDuong(baiXacNhanChoThue?.duong)}, {dinhDangPhuong(baiXacNhanChoThue?.phuong)}</strong> đã được cho thuê?
        </p>
        <p style={{ marginBottom: '16px', fontSize: '0.875rem', color: 'var(--chu-phu)' }}>
          Toàn bộ lịch hẹn đang chờ và đã xác nhận của bài đăng này sẽ bị hủy. Bạn có thể thêm ghi chú &quot;Ngày trống dự kiến&quot; sau bất kỳ lúc nào.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setBaiXacNhanChoThue(null)}
            style={{ padding: '8px 16px', background: 'var(--nen-xam)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button
            onClick={xuLyDaChoThue}
            disabled={dangChoThue}
            style={{ padding: '8px 16px', background: 'var(--mau-la)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            {dangChoThue ? 'Đang xử lý...' : 'Xác nhận Đã cho thuê'}
          </button>
        </div>
      </Modal>

      {/* MODAL CAP NHAT GHI CHU NGAY TRONG DU KIEN */}
      <Modal
        hienThi={!!baiDoiNgayTrong}
        tieuDe="Cập nhật Ngày trống dự kiến"
        onClose={() => setBaiDoiNgayTrong(null)}
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '0.9rem' }}>
            Ghi chú ngày trống dự kiến:
          </label>
          <input
            type="text"
            style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1.5px solid var(--vien-nhap)', boxSizing: 'border-box' }}
            value={ngayTrongMoi}
            onChange={(e) => setNgayTrongMoi(e.target.value)}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--chu-phu)', marginTop: '4px', display: 'block' }}>
            Chỉ là ghi chú tham khảo, giúp người tìm trọ biết khi nào phòng có thể trống lại. Bạn có thể sửa bất kỳ lúc nào.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={() => setBaiDoiNgayTrong(null)}
            style={{ padding: '8px 16px', background: 'var(--nen-xam)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Hủy
          </button>
          <button
            onClick={xuLyLuuNgayTrong}
            disabled={dangLuuNgayTrong}
            style={{ padding: '8px 16px', background: 'var(--mau-la)', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
          >
            {dangLuuNgayTrong ? 'Đang lưu...' : 'Lưu ghi chú'}
          </button>
        </div>
      </Modal>

      {/* MODAL XAC NHAN XOA BAI */}
      <Modal
        hienThi={!!baiDangXoa}
        tieuDe="Xác nhận xóa bài đăng"
        onClose={() => setBaiDangXoa(null)}
      >
        <p style={{ marginBottom: '16px' }}>
          Bạn có chắc chắn muốn xóa bài đăng tại <strong>{dinhDangDuong(baiDangXoa?.duong)}, {dinhDangPhuong(baiDangXoa?.phuong)}</strong>? Tất cả hình ảnh và lịch hẹn liên quan sẽ bị xóa vĩnh viễn.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => setBaiDangXoa(null)} style={{ padding: '8px 16px', background: 'var(--nen-xam)', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Hủy
          </button>
          <button
            onClick={xacNhanXoaBai}
            className={styles.nut_xoa}
            disabled={dangXoa}
          >
            {dangXoa ? 'Đang xóa...' : 'Xác nhận Xóa'}
          </button>
        </div>
      </Modal>
    </LayoutTaiKhoan>
  );
}
