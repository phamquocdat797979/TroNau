'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { laySoGiaThue, dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import type { Profile, BaiDang, HinhAnhBaiDang, LichCoTheDat } from '@/types';
import { DANH_SACH_GIO_24H } from '@/lib/constants';
import { useCaiDat } from '@/context/CaiDatContext';
import styles from '../../chu-tro.module.css';

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

export default function SuaBaiPage() {
  const router = useRouter();
  const params = useParams();
  const baiId = params?.id as string;
  const supabase = taoSupabaseClient();
  const { caiDat } = useCaiDat();

  const dsPhuong = caiDat.danh_sach_phuong || [];
  const dsDuong = caiDat.danh_sach_duong || [];

  const [profile, setProfile] = useState<Profile | null>(null);
  const [baiDangGoc, setBaiDangGoc] = useState<BaiDang | null>(null);
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
  const [khungGioBiKhoa, setKhungGioBiKhoa] = useState(false);

  // Existing URLs & new File objects for 4 images
  const [existingAnh, setExistingAnh] = useState<(string | null)[]>([null, null, null, null]);
  const [newFilesAnh, setNewFilesAnh] = useState<(File | null)[]>([null, null, null, null]);
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
    async function taiDuLieu() {
      if (!baiId) return;
      setDangTai(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }

      // 1. Get profile
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

      // 2. Get post
      const { data: bd, error: bdErr } = await supabase
        .from('bai_dang')
        .select('*')
        .eq('id', baiId)
        .eq('chu_tro_id', user.id)
        .single();

      if (bdErr || !bd) {
        hienToast('Không tìm thấy bài đăng hoặc bạn không có quyền sửa.', 'loi');
        router.push('/chu-tro/quan-ly-bai');
        return;
      }

      if (bd.trang_thai === 'da_cho_thue') {
        hienToast('Bài đăng ở trạng thái "Đã cho thuê" không được chỉnh sửa nội dung.', 'canh_bao');
        router.push('/chu-tro/quan-ly-bai');
        return;
      }

      setBaiDangGoc(bd as BaiDang);
      setSoNha(bd.so_nha || '');
      setDuong(bd.duong || (dsDuong[0] || ''));
      setPhuong(bd.phuong || (dsPhuong[0] || ''));
      setTienThue(bd.tien_thue || '');
      setTienNuoc(bd.tien_nuoc || '');
      setTienDien(bd.tien_dien || '');
      setPhiKhac(bd.phi_khac || '');
      setNgayTrong(bd.ngay_trong_du_kien || '');
      setGhiChu(bd.ghi_chu || '');
      setKhungGioBiKhoa(!!bd.khung_gio_bi_khoa);

      // 3. Get images
      const { data: anhs } = await supabase
        .from('hinh_anh_bai_dang')
        .select('*')
        .eq('bai_dang_id', baiId)
        .order('thu_tu', { ascending: true });

      if (anhs) {
        const initialExist: (string | null)[] = [null, null, null, null];
        const initialPrev: (string | null)[] = [null, null, null, null];
        (anhs as HinhAnhBaiDang[]).forEach((img) => {
          if (img.thu_tu >= 1 && img.thu_tu <= 4) {
            initialExist[img.thu_tu - 1] = img.url;
            initialPrev[img.thu_tu - 1] = img.url;
          }
        });
        setExistingAnh(initialExist);
        setPreviewsAnh(initialPrev);
      }



      // 5. Schedule slots are managed on /chu-tro/lich-hen

      setDangTai(false);
    }
    taiDuLieu();
  }, [baiId]);

  function xuLyChonAnh(index: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const updatedFiles = [...newFilesAnh];
    updatedFiles[index] = file;
    setNewFilesAnh(updatedFiles);

    const updatedPreviews = [...previewsAnh];
    updatedPreviews[index] = URL.createObjectURL(file);
    setPreviewsAnh(updatedPreviews);
  }

  function xoaAnh(index: number) {
    const updatedFiles = [...newFilesAnh];
    updatedFiles[index] = null;
    setNewFilesAnh(updatedFiles);

    const updatedExist = [...existingAnh];
    updatedExist[index] = null;
    setExistingAnh(updatedExist);

    const updatedPreviews = [...previewsAnh];
    updatedPreviews[index] = null;
    setPreviewsAnh(updatedPreviews);
  }

  async function xuLySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profile || !baiDangGoc) return;

    if (biHan) {
      hienToast('Tài khoản của bạn đang bị hạn chế đăng bài', 'canh_bao');
      return;
    }

    const hasImage = previewsAnh.some((p) => p !== null);
    if (!hasImage) {
      hienToast('Vui lòng giữ lại hoặc tải lên ít nhất 1 ảnh phòng trọ', 'canh_bao');
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
      const trangThaiCu = baiDangGoc.trang_thai;

      // 1. Clear appointments and send notification to students if post was 'con_trong'
      if (trangThaiCu === 'con_trong') {
        const { data: dsLich } = await supabase
          .from('lich_hen')
          .select('sinh_vien_id')
          .eq('bai_dang_id', baiId);

        if (dsLich && dsLich.length > 0) {
          const dsSinhVienUnique = Array.from(new Set(dsLich.map((l: any) => l.sinh_vien_id)));
          const thongBaos = dsSinhVienUnique.map((svId) => ({
            nguoi_nhan_id: svId,
            loai: 'bai_cho_duyet_lai',
            noi_dung: `Bài đăng phòng trọ tại ${dinhDangDuong(duong)}, ${dinhDangPhuong(phuong)} đã được chủ trọ chỉnh sửa và quay lại trạng thái chờ duyệt. Tất cả lịch hẹn liên quan đã tự động được hủy.`,
            lien_ket: `/phong-tro/${baiId}`,
          }));

          await supabase.from('thong_bao').insert(thongBaos);
          await supabase.from('lich_hen').delete().eq('bai_dang_id', baiId);
        }
      }

      // 2. Update bai_dang table (status reverts to 'cho_duyet')
      const { error: bdErr } = await supabase
        .from('bai_dang')
        .update({
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
          trang_thai: 'cho_duyet',
          ly_do_tu_choi: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', baiId);

      if (bdErr) {
        hienToast('Lỗi khi cập nhật bài đăng: ' + bdErr.message, 'loi');
        setDangXuLy(false);
        return;
      }

      // 3. Update Images in Storage & DB
      // Clear old DB image records first
      await supabase.from('hinh_anh_bai_dang').delete().eq('bai_dang_id', baiId);

      for (let i = 0; i < 4; i++) {
        const thuTuSlot = i + 1;
        const newFile = newFilesAnh[i];
        const existUrl = existingAnh[i];

        if (newFile) {
          // Upload new image
          const ext = newFile.name.split('.').pop();
          const filePath = `${baiId}/${thuTuSlot}_${Date.now()}.${ext}`;

          const { error: upErr } = await supabase.storage
            .from('anh-phong-tro')
            .upload(filePath, newFile);

          if (!upErr) {
            const { data: publicUrlData } = supabase.storage
              .from('anh-phong-tro')
              .getPublicUrl(filePath);

            await supabase.from('hinh_anh_bai_dang').insert({
              bai_dang_id: baiId,
              url: publicUrlData.publicUrl,
              thu_tu: thuTuSlot,
            });
          }
        } else if (existUrl) {
          // Keep existing image
          await supabase.from('hinh_anh_bai_dang').insert({
            bai_dang_id: baiId,
            url: existUrl,
            thu_tu: thuTuSlot,
          });
        }
      }



      // 5. Schedule slots managed on /chu-tro/lich-hen

      // Gui thong bao cho Admin ve bai dang duoc sua
      const { data: dsAdmin } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (dsAdmin && dsAdmin.length > 0) {
        const thongBaoAdmins = dsAdmin.map((ad: any) => ({
          nguoi_nhan_id: ad.id,
          loai: 'bai_sua_cho_duyet',
          noi_dung: `Chủ trọ ${profile.ho_ten || 'Chủ trọ'} vừa cập nhật bài phòng trọ tại ${dinhDangDuong(duong)}, ${dinhDangPhuong(phuong)}. Đang chờ Admin duyệt lại.`,
          lien_ket: '/admin/dashboard',
        }));
        await supabase.from('thong_bao').insert(thongBaoAdmins);
      }

      hienToast('Đã cập nhật bài đăng thành công! Tin đăng đang chờ Admin duyệt lại.', 'thanh_cong');
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
        <div style={{ textAlign: 'center', padding: '60px 0' }}>Đang tải bài đăng...</div>
      </LayoutTaiKhoan>
    );
  }

  return (
    <LayoutTaiKhoan profile={profile}>
      <div>
        <h1 className={styles.tieu_de_trang}>Chỉnh sửa tin đăng phòng trọ</h1>

        {biHan && (
          <div style={{ background: 'var(--nguy-hiem-nhat)', color: 'var(--nguy-hiem)', padding: '16px', borderRadius: '8px', marginBottom: '24px', border: '1px solid var(--nguy-hiem)' }}>
            Tài khoản của bạn đang bị hạn chế đăng bài mới đến <strong>{new Date(biHan).toLocaleDateString('vi-VN')}</strong>.
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

          {/* QUAN LY HINH ANH (1..4) */}
          <div className={styles.nhom_truong}>
            <label>Hình ảnh phòng trọ <span>*</span></label>
            <div className={styles.khung_anh_upload}>
              {[0, 1, 2, 3].map((idx) => {
                const prev = previewsAnh[idx];
                return (
                  <div key={idx} className={styles.o_upload_anh}>
                    {prev ? (
                      <>
                        <img src={prev} alt={`Ảnh ${idx + 1}`} className={styles.anh_preview} />
                        <button
                          type="button"
                          className={styles.nut_xoa_anh}
                          onClick={() => xoaAnh(idx)}
                          title="Xóa ảnh"
                        >
                          ✕
                        </button>
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
                );
              })}
            </div>
          </div>



          {/* HUONG DAN CAI DAT LICH RANH */}
          <div className={styles.nhom_truong}>
            <label>Khung giờ rảnh cho sinh viên đặt lịch xem phòng</label>
            <div style={{ background: 'var(--nen-xam)', padding: '14px 16px', borderRadius: '8px', color: 'var(--chu-chinh)', fontSize: '0.9rem', border: '1px solid var(--vien-nhap)' }}>
              Bạn có thể cài đặt hoặc thay đổi khung giờ rảnh xem phòng bất kỳ lúc nào tại mục{' '}
              <a href="/chu-tro/lich-hen" style={{ color: 'var(--mau-chu-dao)', fontWeight: '700', textDecoration: 'underline' }}>
                Quản lý lịch hẹn xem phòng
              </a>{' '}
              mà không cần sửa bài hay chờ Admin duyệt lại.
            </div>
          </div>

          <button
            type="submit"
            className={styles.nut_luu}
            disabled={dangXuLy}
          >
            {dangXuLy ? 'Đang cập nhật bài đăng...' : 'Lưu và Gửi duyệt lại'}
          </button>
        </form>
      </div>
    </LayoutTaiKhoan>
  );
}
