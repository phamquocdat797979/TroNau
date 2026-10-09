'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import Footer from '@/components/Footer/Footer';
import Badge from '@/components/Badge/Badge';
import Modal from '@/components/Modal/Modal';
import { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import { useCaiDat } from '@/context/CaiDatContext';
import type { BaiDang, Banner } from '@/types';
import styles from '../admin.module.css';

type TabAdmin = 'duyet_bai' | 'quan_ly_banner' | 'logo_va_ten' | 'duong_va_phuong' | 'quan_ly_footer';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();
  const { caiDat, taiLaiCaiDat } = useCaiDat();

  const [tab, setTab] = useState<TabAdmin>('duyet_bai');
  const [baiChoDuyet, setBaiChoDuyet] = useState<BaiDang[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [dangTai, setDangTai] = useState(true);

  // Modal tu choi
  const [baiTuChoi, setBaiTuChoi] = useState<BaiDang | null>(null);
  const [lyDoTuChoi, setLyDoTuChoi] = useState('');
  const [dangTuChoi, setDangTuChoi] = useState(false);

  // Banner state per slot (1, 2, 3)
  const [dangUploadBanner, setDangUploadBanner] = useState<number | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    [thuTu: number]: { url_anh: string; tieu_de: string; mo_ta: string; the_tags: string };
  }>({
    1: { url_anh: '', tieu_de: '', mo_ta: '', the_tags: '' },
    2: { url_anh: '', tieu_de: '', mo_ta: '', the_tags: '' },
    3: { url_anh: '', tieu_de: '', mo_ta: '', the_tags: '' },
  });

  // State Sub tab Banner (Banner 1, 2, 3)
  const [subTabBanner, setSubTabBanner] = useState<number>(1);

  // State Sub tab Duong & Phuong (Phuong, Duong)
  const [subTabDuongPhuong, setSubTabDuongPhuong] = useState<'phuong' | 'duong'>('phuong');

  // State Logo & Ten App (Hinh 1)
  const [tenApp, setTenApp] = useState(caiDat.ten_app || 'Trọ');
  const [subName, setSubName] = useState(caiDat.sub_name || 'Nẫu');
  const [logoUrl, setLogoUrl] = useState(caiDat.logo_url || '/logo.png');
  const [dangLuuLogo, setDangLuuLogo] = useState(false);

  // State Duong & Phuong (Hinh 3)
  const [dsPhuong, setDsPhuong] = useState<string[]>(caiDat.danh_sach_phuong || []);
  const [phuongMoi, setPhuongMoi] = useState('');
  const [dsDuong, setDsDuong] = useState<string[]>(caiDat.danh_sach_duong || []);
  const [duongMoi, setDuongMoi] = useState('');
  const [dangLuuDuongPhuong, setDangLuuDuongPhuong] = useState(false);

  // State Footer (Hinh 4)
  const [footerMoTa, setFooterMoTa] = useState(caiDat.footer_mo_ta || '');
  const [footerSinhVien, setFooterSinhVien] = useState((caiDat.footer_sinh_vien || []).join('\n'));
  const [footerChuTro, setFooterChuTro] = useState((caiDat.footer_chu_tro || []).join('\n'));
  const [footerBanQuyen, setFooterBanQuyen] = useState(caiDat.footer_ban_quyen || '');
  const [dangLuuFooter, setDangLuuFooter] = useState(false);

  useEffect(() => {
    async function kiemTraAdmin() {
      setDangTai(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }

      const { data: p } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (!p || p.role !== 'admin') {
        router.push('/');
        return;
      }

      await taiBaiChoDuyet();
      await taiBanner();
      setDangTai(false);
    }
    kiemTraAdmin();
  }, []);

  // Update local states when global caiDat loads
  // dsPhuong & dsDuong ARE synced here for initial Supabase load.
  // After save, we do NOT call taiLaiCaiDat() so this effect won't re-run and won't overwrite local edits.
  useEffect(() => {
    setTenApp(caiDat.ten_app || 'Trọ');
    setSubName(caiDat.sub_name || 'Nẫu');
    setLogoUrl(caiDat.logo_url || '/logo.png');
    setDsPhuong(caiDat.danh_sach_phuong || []);
    setDsDuong(caiDat.danh_sach_duong || []);
    setFooterMoTa(caiDat.footer_mo_ta || '');
    setFooterSinhVien((caiDat.footer_sinh_vien || []).join('\n'));
    setFooterChuTro((caiDat.footer_chu_tro || []).join('\n'));
    setFooterBanQuyen(caiDat.footer_ban_quyen || '');
  }, [caiDat]);

  async function taiBaiChoDuyet() {
    const { data } = await supabase
      .from('bai_dang')
      .select(`
        *,
        chu_tro:profiles!bai_dang_chu_tro_id_fkey(ho_ten, so_dien_thoai),
        hinh_anh:hinh_anh_bai_dang(*)
      `)
      .eq('trang_thai', 'cho_duyet')
      .order('created_at', { ascending: false });

    if (data) setBaiChoDuyet(data as BaiDang[]);
  }

  async function taiBanner() {
    const { data } = await supabase
      .from('banner')
      .select('*')
      .order('thu_tu', { ascending: true });

    if (data) {
      setBanners(data as Banner[]);
      const newForm = { ...bannerForm };
      (data as Banner[]).forEach((b) => {
        newForm[b.thu_tu] = {
          url_anh: b.url_anh || '',
          tieu_de: b.tieu_de || '',
          mo_ta: b.mo_ta || '',
          the_tags: b.the_tags || '',
        };
      });
      setBannerForm(newForm);
    }
  }

  async function xuLyDuyetBai(baiId: string) {
    const bai = baiChoDuyet.find((b) => b.id === baiId);
    const nowIso = new Date().toISOString();

    const { error } = await supabase
      .from('bai_dang')
      .update({
        trang_thai: 'con_trong',
        created_at: nowIso, // Ngay dang bai chinh la ngay Admin duyet bai
        updated_at: nowIso,
      })
      .eq('id', baiId);

    if (error) {
      hienToast('Lỗi khi duyệt bài: ' + error.message, 'loi');
      return;
    }

    // Gui thong bao cho chu tro khi bai duoc duyet
    if (bai && bai.chu_tro_id) {
      await supabase.from('thong_bao').insert({
        nguoi_nhan_id: bai.chu_tro_id,
        loai: 'bai_da_duyet',
        noi_dung: `Bài đăng phòng trọ tại ${dinhDangDuong(bai.duong)}, ${dinhDangPhuong(bai.phuong)} của bạn đã được Admin phê duyệt thành công! Bạn có thể thiết lập lịch rảnh để nhận lịch hẹn xem phòng từ Sinh viên.`,
      });
    }

    setBaiChoDuyet((prev) => prev.filter((b) => b.id !== baiId));
    hienToast('Đã duyệt bài đăng thành công! Tin đã xuất hiện trên trang chủ.', 'thanh_cong');
  }

  async function xuLyTuChoiBai() {
    if (!baiTuChoi || !lyDoTuChoi.trim()) {
      hienToast('Vui lòng nhập lý do từ chối', 'canh_bao');
      return;
    }

    setDangTuChoi(true);
    const chuTroId = baiTuChoi.chu_tro_id;

    // 1. Cap nhat bai dang -> bi_tu_choi
    const { error: bdErr } = await supabase
      .from('bai_dang')
      .update({
        trang_thai: 'bi_tu_choi',
        ly_do_tu_choi: lyDoTuChoi.trim(),
      })
      .eq('id', baiTuChoi.id);

    if (bdErr) {
      hienToast('Lỗi từ chối bài: ' + bdErr.message, 'loi');
      setDangTuChoi(false);
      return;
    }

    // 2. Gui thong bao cho chu tro
    await supabase.from('thong_bao').insert({
      nguoi_nhan_id: chuTroId,
      loai: 'bai_bi_tu_choi',
      noi_dung: `Bài đăng của bạn tại ${dinhDangDuong(baiTuChoi.duong)}, ${dinhDangPhuong(baiTuChoi.phuong)} đã bị từ chối. Lý do: ${lyDoTuChoi.trim()}`,
    });

    // 3. Dem va kiem tra vi pham cua chu tro
    const { data: p } = await supabase
      .from('profiles')
      .select('tong_lan_bi_tu_choi_trong_han')
      .eq('id', chuTroId)
      .single();

    const lanBiTuChoiMoi = (p?.tong_lan_bi_tu_choi_trong_han || 0) + 1;

    if (lanBiTuChoiMoi >= 3) {
      const hanKhoa = new Date();
      hanKhoa.setDate(hanKhoa.getDate() + 7);

      await supabase
        .from('profiles')
        .update({
          bi_han_gui_bai_den: hanKhoa.toISOString(),
          tong_lan_bi_tu_choi_trong_han: 0,
        })
        .eq('id', chuTroId);

      await supabase.from('thong_bao').insert({
        nguoi_nhan_id: chuTroId,
        loai: 'bi_han_che',
        noi_dung: 'Tài khoản của bạn đã bị tạm khóa chức năng Đăng bài mới 7 ngày do bị từ chối 3 bài liên tiếp.',
      });

      hienToast(`Đã từ chối bài và TẠM KHÓA đăng bài 7 ngày với chủ trọ này (Vi phạm 3 lần).`, 'canh_bao');
    } else {
      await supabase
        .from('profiles')
        .update({ tong_lan_bi_tu_choi_trong_han: lanBiTuChoiMoi })
        .eq('id', chuTroId);

      hienToast(`Đã từ chối bài đăng (Lần vi phạm thứ ${lanBiTuChoiMoi}/3).`, 'thanh_cong');
    }

    setBaiChoDuyet((prev) => prev.filter((b) => b.id !== baiTuChoi.id));
    setBaiTuChoi(null);
    setLyDoTuChoi('');
    setDangTuChoi(false);
  }

  // Upload anh banner tu File
  async function xuLyUploadFileBanner(thuTu: number, file: File) {
    setDangUploadBanner(thuTu);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `banner_${thuTu}_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('banner')
        .upload(filePath, file, { upsert: true });

      if (upErr) {
        hienToast('Lỗi upload banner: ' + upErr.message, 'loi');
        setDangUploadBanner(null);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('banner')
        .getPublicUrl(filePath);

      const urlAnh = publicUrlData.publicUrl;

      setBannerForm((prev) => ({
        ...prev,
        [thuTu]: { ...prev[thuTu], url_anh: urlAnh },
      }));

      hienToast(`Đã tải ảnh Banner ${thuTu} thành công! Hãy nhập thêm tiêu đề/mô tả nếu cần rồi bấm Lưu Banner.`, 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi upload banner: ' + err.message, 'loi');
    } finally {
      setDangUploadBanner(null);
    }
  }

  // Luu thong tin Banner (Anh + Tiêu đề + Mô tả + Tags per banner - Hinh 2)
  async function xuLyLuuBannerSlot(thuTu: number) {
    const slot = bannerForm[thuTu] || { url_anh: '', tieu_de: '', mo_ta: '', the_tags: '' };

    try {
      const res = await fetch('/api/admin/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          thuTu,
          urlAnh: slot.url_anh,
          tieuDe: slot.tieu_de,
          moTa: slot.mo_ta,
          theTags: slot.the_tags,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.loi) {
        hienToast(data.loi || `Lỗi lưu Banner ${thuTu}`, 'loi');
        return;
      }

      await taiBanner();
      await taiLaiCaiDat();
      hienToast(`Đã cập nhật Banner ${thuTu} thành công!`, 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi lưu Banner: ' + err.message, 'loi');
    }
  }

  // Upload Logo File (Hinh 1)
  async function xuLyUploadLogoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const ext = file.name.split('.').pop();
      const filePath = `logo_${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('banner')
        .upload(filePath, file, { upsert: true });

      if (upErr) {
        hienToast('Lỗi upload logo: ' + upErr.message, 'loi');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('banner')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrlData.publicUrl);
      hienToast('Đã tải ảnh logo mới! Bấm "Lưu Logo & Tên App" để hoàn tất.', 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    }
  }

  // Luu Logo & Ten App (Hinh 1)
  async function xuLyLuuLogoVaTenApp(e: React.FormEvent) {
    e.preventDefault();
    setDangLuuLogo(true);

    try {
      const res = await fetch('/api/admin/cai-dat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyValues: {
            ten_app: tenApp.trim() || 'Trọ Nẫu',
            sub_name: subName.trim() || 'Quy Nhơn',
            logo_url: logoUrl.trim() || '/logo.png',
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.loi) {
        hienToast(data.loi || 'Lỗi cập nhật Logo & Tên App', 'loi');
        setDangLuuLogo(false);
        return;
      }

      await taiLaiCaiDat();
      hienToast('Đã cập nhật Logo và Tên ứng dụng thành công!', 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    } finally {
      setDangLuuLogo(false);
    }
  }

  // Luu Danh sach Phuong
  async function xuLyLuuPhuong() {
    setDangLuuDuongPhuong(true);
    try {
      const res = await fetch('/api/admin/cai-dat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyValues: {
            danh_sach_phuong: dsPhuong,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.loi) {
        hienToast(data.loi || 'Lỗi cập nhật Phường', 'loi');
        setDangLuuDuongPhuong(false);
        return;
      }

      await taiLaiCaiDat();
      hienToast('Đã lưu danh sách Phường thành công!', 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    } finally {
      setDangLuuDuongPhuong(false);
    }
  }

  // Luu Danh sach Duong
  async function xuLyLuuDuong() {
    setDangLuuDuongPhuong(true);
    try {
      const res = await fetch('/api/admin/cai-dat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyValues: {
            danh_sach_duong: dsDuong,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.loi) {
        hienToast(data.loi || 'Lỗi cập nhật Tuyến đường', 'loi');
        setDangLuuDuongPhuong(false);
        return;
      }

      await taiLaiCaiDat();
      hienToast('Đã lưu danh sách Tuyến đường thành công!', 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    } finally {
      setDangLuuDuongPhuong(false);
    }
  }

  function themPhuongMoi() {
    const val = phuongMoi.trim();
    if (!val) return;
    if (dsPhuong.includes(val)) {
      hienToast('Phường này đã có trong danh sách', 'canh_bao');
      return;
    }
    setDsPhuong([...dsPhuong, val]);
    setPhuongMoi('');
  }

  function xoaPhuong(item: string) {
    setDsPhuong(dsPhuong.filter((p) => p !== item));
  }

  function themDuongMoi() {
    const val = duongMoi.trim();
    if (!val) return;
    if (dsDuong.includes(val)) {
      hienToast('Tuyến đường này đã có trong danh sách', 'canh_bao');
      return;
    }
    setDsDuong([...dsDuong, val]);
    setDuongMoi('');
  }

  function xoaDuong(item: string) {
    setDsDuong(dsDuong.filter((d) => d !== item));
  }

  // Luu Noi dung Footer (Hinh 4)
  async function xuLyLuuFooter(e: React.FormEvent) {
    e.preventDefault();
    setDangLuuFooter(true);

    try {
      const arraySinhVien = footerSinhVien
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const arrayChuTro = footerChuTro
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/cai-dat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyValues: {
            footer_mo_ta: footerMoTa.trim(),
            footer_sinh_vien: arraySinhVien,
            footer_chu_tro: arrayChuTro,
            footer_ban_quyen: footerBanQuyen.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || data.loi) {
        hienToast(data.loi || 'Lỗi cập nhật Footer', 'loi');
        setDangLuuFooter(false);
        return;
      }

      await taiLaiCaiDat();
      hienToast('Đã cập nhật nội dung Footer thành công!', 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi: ' + err.message, 'loi');
    } finally {
      setDangLuuFooter(false);
    }
  }

  if (dangTai) {
    return (
      <LayoutTaiKhoan>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>Đang tải bảng điều khiển Admin...</div>
      </LayoutTaiKhoan>
    );
  }

  return (
    <LayoutTaiKhoan>
      <div className={styles.khung_admin}>
        {/* 1. MANAGEMENT NAVIGATION TABS (Kéo dài tràn viền 100vw cùng độ dài khớp hệt với 2 thanh Header & NavNgang) */}
        <div className={styles.thanh_tab_full_width}>
          <div className="container">
            <div className={styles.noi_dung_thanh_tab}>
              <button
                className={`${styles.nut_tab} ${tab === 'duyet_bai' ? styles.nut_tab_tich_cuc : ''}`}
                onClick={() => setTab('duyet_bai')}
              >
                Duyệt bài đăng
                {baiChoDuyet.length > 0 && (
                  <span className={styles.badge_thong_bao}>
                    {baiChoDuyet.length > 99 ? '99+' : baiChoDuyet.length}
                  </span>
                )}
              </button>
              <button
                className={`${styles.nut_tab} ${tab === 'quan_ly_banner' ? styles.nut_tab_tich_cuc : ''}`}
                onClick={() => setTab('quan_ly_banner')}
              >
                Banner
              </button>
              <button
                className={`${styles.nut_tab} ${tab === 'logo_va_ten' ? styles.nut_tab_tich_cuc : ''}`}
                onClick={() => setTab('logo_va_ten')}
              >
                Logo & Tên
              </button>
              <button
                className={`${styles.nut_tab} ${tab === 'duong_va_phuong' ? styles.nut_tab_tich_cuc : ''}`}
                onClick={() => setTab('duong_va_phuong')}
              >
                Đường & Phường
              </button>
              <button
                className={`${styles.nut_tab} ${tab === 'quan_ly_footer' ? styles.nut_tab_tich_cuc : ''}`}
                onClick={() => setTab('quan_ly_footer')}
              >
                Footer
              </button>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* TAB 1: DUYET BAI DANG */}
        {/* ============================================================ */}
        {tab === 'duyet_bai' && (
          <div>
            {baiChoDuyet.length === 0 ? (
              <div className={styles.the_cai_dat} style={{ textAlign: 'center', color: 'var(--chu-phu)', padding: '40px' }}>
                Hiện không có bài đăng nào đang chờ duyệt.
              </div>
            ) : (
              <div className={styles.luoi_duyet_bai}>
                {baiChoDuyet.map((bai) => {
                  const sortedAnh = ((bai as any).hinh_anh || []).sort((a: any, b: any) => a.thu_tu - b.thu_tu);
                  const anhDaiDien = sortedAnh[0]?.url;

                  return (
                    <div key={bai.id} className={styles.the_duyet}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        {anhDaiDien && (
                          <div style={{ position: 'relative', width: '120px', height: '90px', borderRadius: 'var(--bo-vua)', overflow: 'hidden', flexShrink: 0 }}>
                            <Image src={anhDaiDien} alt="Ảnh phòng" fill sizes="120px" style={{ objectFit: 'cover' }} unoptimized />
                          </div>
                        )}
                        <div>
                          <h3 style={{ fontSize: '1.05rem', fontWeight: '700', marginBottom: '4px' }}>
                            Số {bai.so_nha || '---'}, {dinhDangDuong(bai.duong)}, {dinhDangPhuong(bai.phuong)}
                          </h3>
                          <div style={{ fontSize: '0.9rem', color: 'var(--mau-la)', fontWeight: '700', marginBottom: '4px' }}>
                            Giá thuê: {bai.tien_thue} / tháng
                          </div>
                          <div style={{ fontSize: '0.85rem', color: 'var(--chu-phu)' }}>
                            Chủ trọ: <strong>{(bai as any).chu_tro?.ho_ten}</strong> ({(bai as any).chu_tro?.so_dien_thoai})
                          </div>
                          {bai.ghi_chu && (
                            <div style={{ fontSize: '0.85rem', color: 'var(--chu-phu)', marginTop: '4px' }}>
                              Mô tả: {bai.ghi_chu}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <Link
                          href={`/phong-tro/${bai.id}`}
                          style={{ padding: '8px 16px', borderRadius: 'var(--bo-vua)', background: 'var(--nen-xam)', color: 'var(--chu-chinh)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: '600' }}
                        >
                          Xem chi tiết
                        </Link>
                        <button
                          className={styles.nut_duyet}
                          onClick={() => xuLyDuyetBai(bai.id)}
                        >
                          Duyệt bài này
                        </button>
                        <button
                          className={styles.nut_tu_choi}
                          onClick={() => setBaiTuChoi(bai)}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: QUAN LY BANNER CAROUSEL (CHỮ TRƯỢT THEO ẢNH) */}
        {/* ============================================================ */}
        {tab === 'quan_ly_banner' && (
          <div>
            {/* SUB-TABS SELECTOR BANNER 1, BANNER 2, BANNER 3 */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              {[1, 2, 3].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setSubTabBanner(num)}
                  style={{
                    padding: '8px 20px',
                    borderRadius: 'var(--bo-vua)',
                    border: subTabBanner === num ? '1.5px solid var(--mau-la)' : '1px solid var(--vien-nhat)',
                    background: subTabBanner === num ? 'var(--mau-la)' : '#ffffff',
                    color: subTabBanner === num ? '#ffffff' : 'var(--chu-chinh)',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    boxShadow: subTabBanner === num ? 'var(--bong-nho)' : 'none',
                    transition: 'all 0.2s ease',
                  }}
                >
                  Banner {num}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              {[subTabBanner].map((thuTu) => {
                const bForm = bannerForm[thuTu] || { url_anh: '', tieu_de: '', mo_ta: '', the_tags: '' };
                const isUploading = dangUploadBanner === thuTu;
                const tags = bForm.the_tags ? bForm.the_tags.split(',').map(t => t.trim()).filter(Boolean) : [];

                return (
                  <div key={thuTu} style={{ background: '#fff', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhat)', boxShadow: 'var(--bong-nho)', overflow: 'hidden' }}>
                    {/* HEADER */}
                    <div style={{ background: 'var(--gradient-chinh)', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '0.95rem' }}>
                        Banner {thuTu}
                      </span>
                      <label style={{
                        background: 'rgba(255,255,255,0.18)', color: '#fff', padding: '5px 14px',
                        borderRadius: 'var(--bo-vua)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}>
                        {isUploading ? 'Đang tải...' : 'Chọn ảnh từ máy'}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) xuLyUploadFileBanner(thuTu, f);
                          }}
                        />
                      </label>
                    </div>

                    {/* Banner canvas — same aspect ratio as real banner */}
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      aspectRatio: '21 / 7',
                      maxHeight: '260px',
                      minHeight: '140px',
                      overflow: 'hidden',
                      background: '#112211',
                    }}>
                      {/* Ảnh nền */}
                      {bForm.url_anh ? (
                        <Image src={bForm.url_anh} alt={`Banner ${thuTu}`} fill sizes="(max-width: 1200px) 100vw, 1200px" style={{ objectFit: 'cover' }} unoptimized />
                      ) : (
                        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0F2E22 0%, #1A4D36 50%, #134E5E 100%)' }} />
                      )}

                      {/* Overlay gradient — 90deg trái sang phải giống BannerCarousel.module.css */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'linear-gradient(90deg, rgba(10,30,22,0.88) 0%, rgba(15,45,55,0.72) 50%, rgba(0,0,0,0.25) 100%)',
                        zIndex: 1,
                      }} />

                      {/* Nội dung overlay — layout khớp với .noi_dung_gioi_thieu: flex row, align center */}
                      <div style={{
                        position: 'absolute', inset: 0, zIndex: 2,
                        display: 'flex', alignItems: 'center',
                        padding: '0 32px', gap: '20px',
                      }}>
                        {/* Logo box — khớp với .khung_logo_banner */}
                        <div style={{
                          width: '60px', height: '60px', flexShrink: 0,
                          borderRadius: 'var(--bo-vua)',
                          background: '#fff', padding: '4px',
                          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
                          border: '2px solid rgba(255,255,255,0.8)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          overflow: 'hidden',
                        }}>
                          <Image
                            src={caiDat.logo_url || '/logo.png'}
                            alt="Logo"
                            width={52}
                            height={52}
                            style={{ objectFit: 'cover', borderRadius: 'var(--bo-vua)' }}
                            unoptimized
                          />
                        </div>

                        {/* Phần chữ bên phải logo — khớp với .phan_chu_banner */}
                        <div style={{ color: '#fff', maxWidth: '700px' }}>
                          {/* Tiêu đề — khớp với .tieu_de_banner */}
                          <div style={{
                            fontSize: '1.5rem', fontWeight: 800,
                            marginBottom: '5px', color: bForm.tieu_de ? '#fff' : 'rgba(255,255,255,0.3)',
                            textShadow: '0 2px 4px rgba(0,0,0,0.4)', letterSpacing: '-0.5px',
                            fontStyle: bForm.tieu_de ? 'normal' : 'italic',
                          }}>
                            {bForm.tieu_de || 'Tiêu đề banner (nhập ô bên dưới)'}
                          </div>

                          {/* Mô tả — khớp với .mo_ta_banner */}
                          <div style={{
                            fontSize: '0.88rem',
                            marginBottom: '10px', color: bForm.mo_ta ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.3)',
                            lineHeight: 1.4, textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            fontStyle: bForm.mo_ta ? 'normal' : 'italic',
                          }}>
                            {bForm.mo_ta || 'Dòng mô tả ngắn hiển thị bên dưới tiêu đề'}
                          </div>

                          {/* Tags — khớp với .danh_sach_the_banner + .the_giao_dien */}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {tags.length > 0 ? tags.map((tag, i) => (
                              <span key={i} style={{
                                background: 'rgba(255,255,255,0.18)',
                                backdropFilter: 'blur(8px)',
                                border: '1px solid rgba(255,255,255,0.3)',
                                padding: '4px 12px',
                                borderRadius: 'var(--bo-vua)',
                                fontSize: '0.72rem', fontWeight: 600,
                                color: '#fff',
                              }}>{tag}</span>
                            )) : (
                              <>
                                <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 'var(--bo-vua)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Nhãn 1</span>
                                <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 'var(--bo-vua)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Nhãn 2</span>
                                <span style={{ background: 'rgba(255,255,255,0.1)', border: '1px dashed rgba(255,255,255,0.25)', padding: '4px 12px', borderRadius: 'var(--bo-vua)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>Nhãn 3</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* FORM INPUTS */}
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '13px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '13px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: 'var(--chu-chinh)' }}>
                            URL Ảnh nền:
                          </label>
                          <input
                            type="text"
                            placeholder="Dán URL ảnh hoặc dùng 'Chọn ảnh từ máy'"
                            value={bForm.url_anh}
                            onChange={(e) =>
                              setBannerForm((prev) => ({
                                ...prev,
                                [thuTu]: { ...prev[thuTu], url_anh: e.target.value },
                              }))
                            }
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                          />
                        </div>

                        <div>
                          <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: 'var(--chu-chinh)' }}>
                            Tiêu đề:
                          </label>
                          <input
                            type="text"
                            placeholder="VD: Trọ Nẫu - Quy Nhơn"
                            value={bForm.tieu_de}
                            onChange={(e) =>
                              setBannerForm((prev) => ({
                                ...prev,
                                [thuTu]: { ...prev[thuTu], tieu_de: e.target.value },
                              }))
                            }
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: 'var(--chu-chinh)' }}>
                          Mô tả:
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Nền tảng tìm kiếm phòng trọ uy tín, nhanh chóng & tiện lợi dành cho Sinh viên và Chủ trọ."
                          value={bForm.mo_ta}
                          onChange={(e) =>
                            setBannerForm((prev) => ({
                              ...prev,
                              [thuTu]: { ...prev[thuTu], mo_ta: e.target.value },
                            }))
                          }
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '700', marginBottom: '5px', color: 'var(--chu-chinh)' }}>
                          Các nhãn:
                        </label>
                        <input
                          type="text"
                          placeholder="VD: Phòng trọ chính chủ, Đặt lịch trực tuyến, Gần các trường ĐH & CĐ Quy Nhơn"
                          value={bForm.the_tags}
                          onChange={(e) =>
                            setBannerForm((prev) => ({
                              ...prev,
                              [thuTu]: { ...prev[thuTu], the_tags: e.target.value },
                            }))
                          }
                          style={{ width: '100%', padding: '9px 12px', border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', fontSize: '0.85rem', boxSizing: 'border-box' }}
                        />
                      </div>

                      <button
                        type="button"
                        className={styles.nut_duyet}
                        style={{ padding: '10px 24px', fontWeight: '700', width: 'fit-content' }}
                        onClick={() => xuLyLuuBannerSlot(thuTu)}
                      >
                        Lưu Banner {thuTu}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: LOGO & TEN UNG DUNG (HINH 1) */}
        {/* ============================================================ */}
        {tab === 'logo_va_ten' && (
          <form onSubmit={xuLyLuuLogoVaTenApp} className={styles.the_cai_dat} style={{ maxWidth: '100%' }}>
            {/* PREVIEW CONTAINER — 1:1 CHUẨN XÁC VỚI HEADER.TSX THẬT */}
            <div style={{
              background: 'var(--gradient-chinh)',
              height: '64px',
              padding: '0 20px',
              borderRadius: 'var(--bo-vua)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              {/* Logo & Tên hiển thị chuẩn Header.tsx */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--bo-vua)',
                  background: 'rgba(255,255,255,0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                  border: '1.5px solid rgba(255,255,255,0.4)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                }}>
                  <Image
                    src={logoUrl || '/logo.png'}
                    alt="Logo Preview"
                    width={38}
                    height={38}
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
                <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.3px', textShadow: '0 1px 3px rgba(0,0,0,0.2)' }}>
                  {tenApp || 'Trọ'}
                  {subName ? <span style={{ color: '#a8e6cf', fontWeight: 700 }}> {subName}</span> : null}
                </span>
              </div>

              {/* Nút giả lập góc phải Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.85 }}>
                <span style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--bo-vua)',
                  background: 'rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: '1px solid rgba(255,255,255,0.3)',
                }}>
                  Tài khoản Admin
                </span>
              </div>
            </div>

            {/* FORM INPUTS — BỐ CỤC HÀNG NGANG GỌN GÀNG */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 2fr auto',
              gap: '14px',
              alignItems: 'flex-end',
            }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Tên ứng dụng:
                </label>
                <input
                  type="text"
                  required
                  value={tenApp}
                  onChange={(e) => setTenApp(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Chữ nhấn màu:
                </label>
                <input
                  type="text"
                  value={subName}
                  onChange={(e) => setSubName(e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', fontSize: '0.875rem' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Ảnh Logo:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    style={{ flex: 1, padding: '9px 12px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', fontSize: '0.875rem' }}
                  />
                  <label className={styles.nut_doi_banner} style={{ padding: '9px 14px', whiteSpace: 'nowrap', fontSize: '0.82rem', height: '38px', display: 'flex', alignItems: 'center' }}>
                    Tải file Logo
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={xuLyUploadLogoFile}
                    />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={dangLuuLogo}
                className={styles.nut_duyet}
                style={{ padding: '10px 20px', fontWeight: '700', whiteSpace: 'nowrap', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                {dangLuuLogo ? 'Đang lưu...' : 'Lưu nội dung'}
              </button>
            </div>
          </form>
        )}

        {/* ============================================================ */}
        {/* TAB 4: QUAN LY DUONG & PHUONG */}
        {/* ============================================================ */}
        {tab === 'duong_va_phuong' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* LIVE PREVIEW 1:1 BỘ LỌC TÌM KIẾM TRÊN TRANG CHỦ */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--bo-vua)',
              border: '1px solid var(--vien-nhat)',
              boxShadow: 'var(--bong-vua)',
              padding: '16px 20px',
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--chu-phu)', marginBottom: '4px' }}>
                    Chọn Phường ({dsPhuong.length})
                  </label>
                  <select style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', fontSize: '0.875rem' }}>
                    <option value="">Tất cả Phường</option>
                    {dsPhuong.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '600', color: 'var(--chu-phu)', marginBottom: '4px' }}>
                    Chọn Đường ({dsDuong.length})
                  </label>
                  <select style={{ width: '100%', padding: '9px 12px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', fontSize: '0.875rem' }}>
                    <option value="">Tất cả Tuyến đường</option>
                    {dsDuong.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* SUB-TABS SELECTOR PHƯỜNG & ĐƯỜNG */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setSubTabDuongPhuong('phuong')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--bo-vua)',
                  border: subTabDuongPhuong === 'phuong' ? '1.5px solid var(--mau-la)' : '1px solid var(--vien-nhat)',
                  background: subTabDuongPhuong === 'phuong' ? 'var(--mau-la)' : '#ffffff',
                  color: subTabDuongPhuong === 'phuong' ? '#ffffff' : 'var(--chu-chinh)',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: subTabDuongPhuong === 'phuong' ? 'var(--bong-nho)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Phường ({dsPhuong.length})
              </button>
              <button
                type="button"
                onClick={() => setSubTabDuongPhuong('duong')}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--bo-vua)',
                  border: subTabDuongPhuong === 'duong' ? '1.5px solid var(--mau-la)' : '1px solid var(--vien-nhat)',
                  background: subTabDuongPhuong === 'duong' ? 'var(--mau-la)' : '#ffffff',
                  color: subTabDuongPhuong === 'duong' ? '#ffffff' : 'var(--chu-chinh)',
                  fontWeight: '700',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  boxShadow: subTabDuongPhuong === 'duong' ? 'var(--bong-nho)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                Đường ({dsDuong.length})
              </button>
            </div>

            {/* BLOCK 1: DANH SACH PHUONG */}
            {subTabDuongPhuong === 'phuong' && (
              <div className={styles.the_cai_dat}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--mau-la)', marginBottom: '14px' }}>
                  Danh sách Phường / Xã ({dsPhuong.length})
                </h2>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', maxWidth: '500px' }}>
                  <input
                    type="text"
                    placeholder="Nhập tên Phường mới..."
                    value={phuongMoi}
                    onChange={(e) => setPhuongMoi(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), themPhuongMoi())}
                    style={{ flex: 1, padding: '9px 14px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)' }}
                  />
                  <button
                    type="button"
                    onClick={themPhuongMoi}
                    style={{ padding: '9px 16px', background: 'var(--mau-la)', color: '#fff', border: 'none', borderRadius: 'var(--bo-vua)', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Thêm Phường
                  </button>
                </div>

                <div className={styles.danh_sach_chip} style={{ marginBottom: '20px' }}>
                  {dsPhuong.map((p) => (
                    <span key={p} className={styles.chip_item}>
                      {p}
                      <button type="button" onClick={() => xoaPhuong(p)} className={styles.nut_xoa_chip} title="Xóa">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={dangLuuDuongPhuong}
                  onClick={xuLyLuuPhuong}
                  className={styles.nut_duyet}
                  style={{ padding: '11px 24px', fontWeight: '700', fontSize: '0.9rem' }}
                >
                  {dangLuuDuongPhuong ? 'Đang lưu...' : 'Lưu danh sách Phường'}
                </button>
              </div>
            )}

            {/* BLOCK 2: DANH SACH DUONG */}
            {subTabDuongPhuong === 'duong' && (
              <div className={styles.the_cai_dat}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--mau-la)', marginBottom: '14px' }}>
                  Danh sách Tuyến đường ({dsDuong.length})
                </h2>

                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', maxWidth: '500px' }}>
                  <input
                    type="text"
                    placeholder="Nhập tên Tuyến đường mới..."
                    value={duongMoi}
                    onChange={(e) => setDuongMoi(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), themDuongMoi())}
                    style={{ flex: 1, padding: '9px 14px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)' }}
                  />
                  <button
                    type="button"
                    onClick={themDuongMoi}
                    style={{ padding: '9px 16px', background: 'var(--mau-la)', color: '#fff', border: 'none', borderRadius: 'var(--bo-vua)', fontWeight: '600', cursor: 'pointer' }}
                  >
                    + Thêm Đường
                  </button>
                </div>

                <div className={styles.danh_sach_chip} style={{ marginBottom: '20px' }}>
                  {dsDuong.map((d) => (
                    <span key={d} className={styles.chip_item}>
                      {d}
                      <button type="button" onClick={() => xoaDuong(d)} className={styles.nut_xoa_chip} title="Xóa">
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={dangLuuDuongPhuong}
                  onClick={xuLyLuuDuong}
                  className={styles.nut_duyet}
                  style={{ padding: '11px 24px', fontWeight: '700', fontSize: '0.9rem' }}
                >
                  {dangLuuDuongPhuong ? 'Đang lưu...' : 'Lưu danh sách Đường'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 5: QUAN LY NOI DUNG FOOTER (HINH 4) */}
        {/* ============================================================ */}
        {tab === 'quan_ly_footer' && (
          <form onSubmit={xuLyLuuFooter} className={styles.the_cai_dat} style={{ maxWidth: '100%' }}>
            {/* PREVIEW CONTAINER — 1:1 CHUẨN XÁC DÙNG CHÍNH COMPONENT FOOTER.TSX */}
            <div style={{
              marginBottom: '24px',
              borderRadius: 'var(--bo-vua)',
              overflow: 'hidden',
              border: '1px solid var(--vien-nhat)',
              boxShadow: 'var(--bong-vua)',
            }}>
              <Footer
                previewData={{
                  ten_app: tenApp,
                  sub_name: subName,
                  footer_mo_ta: footerMoTa,
                  footer_sinh_vien: footerSinhVien.split('\n').filter(Boolean),
                  footer_chu_tro: footerChuTro.split('\n').filter(Boolean),
                  footer_ban_quyen: footerBanQuyen,
                }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '6px' }}>
                Mô tả ngắn thương hiệu:
              </label>
              <textarea
                rows={3}
                required
                value={footerMoTa}
                onChange={(e) => setFooterMoTa(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', resize: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '6px' }}>
                Cột "Dành cho Sinh viên":
              </label>
              <textarea
                rows={4}
                required
                value={footerSinhVien}
                onChange={(e) => setFooterSinhVien(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)' }}
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '6px' }}>
                Cột "Dành cho Chủ trọ":
              </label>
              <textarea
                rows={4}
                required
                value={footerChuTro}
                onChange={(e) => setFooterChuTro(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.875rem', marginBottom: '6px' }}>
                Dòng chữ Bản quyền Footer:
              </label>
              <input
                type="text"
                required
                value={footerBanQuyen}
                onChange={(e) => setFooterBanQuyen(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)' }}
              />
            </div>

            <button
              type="submit"
              disabled={dangLuuFooter}
              className={styles.nut_duyet}
              style={{ padding: '10px 24px', fontWeight: '700', width: 'fit-content' }}
            >
              {dangLuuFooter ? 'Đang lưu...' : 'Lưu nội dung'}
            </button>
          </form>
        )}

        {/* MODAL TU CHOI BAI DANG */}
        {baiTuChoi && (
          <Modal
            hienThi={!!baiTuChoi}
            tieuDe="Từ chối bài đăng phòng trọ"
            onClose={() => setBaiTuChoi(null)}
          >
            <div style={{ padding: '4px' }}>
              <p style={{ fontSize: '0.9rem', marginBottom: '14px', color: 'var(--chu-chinh)' }}>
                Nhập lý do từ chối bài đăng tại <strong>{dinhDangDuong(baiTuChoi.duong)}</strong>. Lý do này sẽ gửi thông báo trực tiếp đến Chủ trọ.
              </p>

              <textarea
                rows={3}
                required

                value={lyDoTuChoi}
                onChange={(e) => setLyDoTuChoi(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: 'var(--bo-vua)', border: '1.5px solid var(--vien-nhap)', marginBottom: '16px', resize: 'none' }}
              />

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setBaiTuChoi(null)}
                  style={{ padding: '8px 16px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', background: '#fff', cursor: 'pointer' }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={dangTuChoi}
                  onClick={xuLyTuChoiBai}
                  style={{ padding: '8px 16px', borderRadius: 'var(--bo-vua)', border: 'none', background: 'var(--nguy-hiem)', color: '#fff', fontWeight: '600', cursor: 'pointer' }}
                >
                  {dangTuChoi ? 'Đang từ chối...' : 'Xác nhận Từ chối'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </LayoutTaiKhoan>
  );
}
