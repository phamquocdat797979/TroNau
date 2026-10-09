'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { laySoGiaThue, dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import type { Profile } from '@/types';
import { DANH_SACH_GIO_24H } from '@/lib/constants';
import { useCaiDat } from '@/context/CaiDatContext';
import styles from '../chu-tro.module.css';

const CAC_THU = [
  { index: 1, label: 'Thứ Hai' },
  { index: 2, label: 'Thứ Ba' },
  { index: 3, label: 'Thứ Tư' },
  { index: 4, label: 'Thứ Năm' },
  { index: 5, label: 'Thứ Sáu' },
  { index: 6, label: 'Thứ Bảy' },
  { index: 0, label: 'Chủ Nhật' },
];

interface KhungGioRanh {
  thu: number;
  chon: boolean;
  gioBatDau: string;
  gioKetThuc: string;
}

export default function DangBaiPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();
  const { caiDat } = useCaiDat();

  const dsPhuong = caiDat.danh_sach_phuong || [];
  const dsDuong = caiDat.danh_sach_duong || [];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [biHan, setBiHan] = useState<string | null>(null);

  // Form states
  const [soNha, setSoNha] = useState('');
  const [duong, setDuong] = useState(dsDuong[0] || '');
  const [phuong, setPhuong] = useState(dsPhuong[0] || '');
  const [tienThue, setTienThue] = useState('');
  const [tienNuoc, setTienNuoc] = useState('');
  const [tienDien, setTienDien] = useState('');
  const [phiKhac, setPhiKhac] = useState('');
  const [ngayTrong, setNgayTrong] = useState('');
  const [ghiChu, setGhiChu] = useState('');

  // Files
  const [filesAnh, setFilesAnh] = useState<(File | null)[]>([null, null, null, null]);
  const [previewsAnh, setPreviewsAnh] = useState<(string | null)[]>([null, null, null, null]);

  // Schedules
  const [lichRanh, setLichRanh] = useState<KhungGioRanh[]>(
    CAC_THU.map((t) => ({
      thu: t.index,
      chon: false,
      gioBatDau: '08:00',
      gioKetThuc: '17:00',
    }))
  );

  const [dangXuLy, setDangXuLy] = useState(false);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    async function kiemTra() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!p || p.role !== 'chu_tro') {
        router.push('/');
        return;
      }

      setProfile(p as Profile);

      if (p.bi_han_gui_bai_den) {
        const han = new Date(p.bi_han_gui_bai_den);
        if (han > new Date()) {
          setBiHan(p.bi_han_gui_bai_den);
        }
      }
      setDangTai(false);
    }
    kiemTra();
  }, []);

  function xuLyChonAnh(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const newFiles = [...filesAnh];
    newFiles[index] = file;
    setFilesAnh(newFiles);

    const newPreviews = [...previewsAnh];
    newPreviews[index] = URL.createObjectURL(file);
    setPreviewsAnh(newPreviews);
  }

  function xoaAnh(index: number) {
    const newFiles = [...filesAnh];
    newFiles[index] = null;
    setFilesAnh(newFiles);

    const newPreviews = [...previewsAnh];
    newPreviews[index] = null;
    setPreviewsAnh(newPreviews);
  }

  async function xuLySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) return;

    if (biHan) {
      hienToast('Tài khoản của bạn đang bị hạn chế đăng bài', 'canh_bao');
      return;
    }

    // Kiem tra it nhat 1 anh
    const hasImage = filesAnh.some((f) => f !== null);
    if (!hasImage) {
      hienToast('Vui lòng tải lên ít nhất 1 ảnh phòng trọ (ảnh đầu tiên là ảnh đại diện)', 'canh_bao');
      return;
    }

    if (!tienNuoc.trim()) {
      hienToast('Vui lòng nhập tiền nước', 'canh_bao');
      return;
    }

    if (!tienDien.trim()) {
      hienToast('Vui lòng nhập tiền điện', 'canh_bao');
      return;
    }

    setDangXuLy(true);

    try {
      const giaThueSo = laySoGiaThue(tienThue);

      // 1. Chen ban ghi bai_dang
      const { data: baiDangMoi, error: bdErr } = await supabase
        .from('bai_dang')
        .insert({
          chu_tro_id: profile.id,
          trang_thai: 'cho_duyet',
          so_nha: soNha.trim() || null,
          duong: duong.trim(),
          phuong,
          tien_thue: tienThue.trim(),
          gia_thue_so: giaThueSo,
          tien_nuoc: tienNuoc.trim() || null,
          tien_dien: tienDien.trim() || null,
          phi_khac: phiKhac.trim() || null,
          ngay_trong_du_kien: ngayTrong || null,
          ghi_chu: ghiChu.trim() || null,
        })
        .select('id')
        .single();

      if (bdErr || !baiDangMoi) {
        hienToast('Lỗi khi tạo bài đăng: ' + (bdErr?.message || ''), 'loi');
        setDangXuLy(false);
        return;
      }

      const baiId = baiDangMoi.id;

      // 2. Upload cac anh len Supabase Storage 'anh-phong-tro'
      let thuTu = 1;
      for (let i = 0; i < filesAnh.length; i++) {
        const file = filesAnh[i];
        if (file) {
          const ext = file.name.split('.').pop();
          const filePath = `${baiId}/${thuTu}_${Date.now()}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('anh-phong-tro')
            .upload(filePath, file);

          if (!upErr) {
            const { data: publicUrlData } = supabase.storage
              .from('anh-phong-tro')
              .getPublicUrl(filePath);

            await supabase.from('hinh_anh_bai_dang').insert({
              bai_dang_id: baiId,
              url: publicUrlData.publicUrl,
              thu_tu: thuTu,
            });
            thuTu++;
          }
        }
      }

      // 3. Gui thong bao cho Admin ve bai dang moi cho duyet
      const { data: dsAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (dsAdmin && dsAdmin.length > 0) {
        const thongBaoAdmins = dsAdmin.map((ad: any) => ({
          nguoi_nhan_id: ad.id,
          loai: 'bai_moi_cho_duyet',
          noi_dung: `Chủ trọ ${profile.ho_ten || 'Chủ trọ'} vừa đăng 1 bài phòng trọ mới tại ${dinhDangDuong(duong)}, ${dinhDangPhuong(phuong)}. Đang chờ Admin phê duyệt.`,
          lien_ket: '/admin/dashboard',
        }));
        await supabase.from('thong_bao').insert(thongBaoAdmins);
      }

      hienToast('Đăng tin thành công! Tin đăng của bạn đang chờ Admin duyệt.', 'thanh_cong');
      router.push('/chu-tro/quan-ly-bai');
    } catch (err: any) {
      hienToast(err.message || 'Có lỗi xảy ra', 'loi');
    } finally {
      setDangXuLy(false);
    }
  }

  if (dangTai) {
    return (
      <LayoutTaiKhoan profile={profile}>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>Đang tải...</div>
      </LayoutTaiKhoan>
    );
  }

  return (
    <LayoutTaiKhoan profile={profile}>
      <div>

        {biHan && (
          <div style={{ background: 'var(--nguy-hiem-nhat)', color: 'var(--nguy-hiem)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--nguy-hiem)' }}>
            Tài khoản của bạn đang bị hạn chế đăng bài mới đến <strong>{new Date(biHan).toLocaleDateString('vi-VN')}</strong> do có 3 bài bị Admin từ chối.
          </div>
        )}

        <form onSubmit={xuLySubmit} className={styles.the_form}>
          <div className={styles.luoi_2_cot}>
            <div className={styles.nhom_truong}>
              <label>Phường <span>*</span></label>
              <select value={phuong} onChange={(e) => setPhuong(e.target.value)}>
                {dsPhuong.map((p) => (
                  <option key={p} value={p}>{dinhDangPhuong(p)}</option>
                ))}
              </select>
            </div>

            <div className={styles.nhom_truong}>
              <label>Tên đường <span>*</span></label>
              <select value={duong} onChange={(e) => setDuong(e.target.value)}>
                {dsDuong.map((d) => (
                  <option key={d} value={d}>{dinhDangDuong(d)}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.nhom_truong}>
            <label>Số nhà <span>*</span> (Chỉ hiển thị cho sinh viên đã được bạn xác nhận lịch hẹn)</label>
            <input
              type="text"
              required

              value={soNha}
              onChange={(e) => setSoNha(e.target.value)}
            />
          </div>

          <div className={styles.nhom_truong}>
            <label>Giá thuê / tháng <span>*</span></label>
            <input
              type="text"
              required

              value={tienThue}
              onChange={(e) => setTienThue(e.target.value)}
            />
          </div>

          <div className={styles.luoi_2_cot}>
            <div className={styles.nhom_truong}>
              <label>Tiền nước <span>*</span></label>
              <input
                type="text"
                required
                value={tienNuoc}
                onChange={(e) => setTienNuoc(e.target.value)}
              />
            </div>

            <div className={styles.nhom_truong}>
              <label>Tiền điện <span>*</span></label>
              <input
                type="text"
                required
                value={tienDien}
                onChange={(e) => setTienDien(e.target.value)}
              />
            </div>
          </div>

          <div className={styles.nhom_truong}>
            <label>Phí dịch vụ khác (Wifi, Rác, Vệ sinh...)</label>
            <input
              type="text"

              value={phiKhac}
              onChange={(e) => setPhiKhac(e.target.value)}
            />
          </div>

          <div className={styles.nhom_truong}>
            <label>Mô tả chi tiết phòng trọ</label>
            <textarea
              rows={4}

              value={ghiChu}
              onChange={(e) => setGhiChu(e.target.value)}
            />
          </div>

          {/* UPLOAD ANH */}
          <div className={styles.nhom_truong}>
            <label>Hình ảnh phòng trọ <span>*</span></label>
            <div className={styles.khung_anh_upload}>
              {[0, 1, 2, 3].map((idx) => (
                <div key={idx} className={styles.o_upload_anh}>
                  {previewsAnh[idx] ? (
                    <>
                      <img src={previewsAnh[idx]!} alt={`Ảnh ${idx + 1}`} className={styles.anh_preview} />
                      <button type="button" className={styles.nut_xoa_anh} onClick={() => xoaAnh(idx)}>x</button>
                    </>
                  ) : (
                    <label className={styles.nhan_upload_anh}>
                      <span className={styles.chu_upload}>Ảnh {idx + 1}</span>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => xuLyChonAnh(idx, e)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--chu-phu)', marginTop: '8px' }}>
              Bấm vào ô để chọn ảnh. Ảnh 1 sẽ là ảnh đại diện của phòng trọ. Tối đa 5MB mỗi ảnh.
            </p>
          </div>

          <button
            type="submit"
            className={styles.nut_luu}
            disabled={dangXuLy || !!biHan}
          >
            {dangXuLy ? 'Đang tải ảnh & đăng bài...' : 'Gửi bài chờ Admin duyệt'}
          </button>
        </form>
      </div>
    </LayoutTaiKhoan>
  );
}
