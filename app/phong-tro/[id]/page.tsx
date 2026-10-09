'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import Badge from '@/components/Badge/Badge';
import Modal from '@/components/Modal/Modal';
import ToastContainer, { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import type { BaiDangCongKhai, BinhLuan, Profile } from '@/types';
import styles from './phong-tro.module.css';

interface SlotGio {
  gioBatDau: string;
  gioKetThuc: string;
}

const KHUNG_GIO_SANG: SlotGio[] = [
  { gioBatDau: '07:00', gioKetThuc: '08:00' },
  { gioBatDau: '08:00', gioKetThuc: '09:00' },
  { gioBatDau: '09:00', gioKetThuc: '10:00' },
  { gioBatDau: '10:00', gioKetThuc: '11:00' },
  { gioBatDau: '11:00', gioKetThuc: '12:00' },
  { gioBatDau: '12:00', gioKetThuc: '13:00' },
];

const KHUNG_GIO_CHIEU: SlotGio[] = [
  { gioBatDau: '13:00', gioKetThuc: '14:00' },
  { gioBatDau: '14:00', gioKetThuc: '15:00' },
  { gioBatDau: '15:00', gioKetThuc: '16:00' },
  { gioBatDau: '16:00', gioKetThuc: '17:00' },
  { gioBatDau: '17:00', gioKetThuc: '18:00' },
  { gioBatDau: '18:00', gioKetThuc: '19:00' },
];

export default function ChiTietPhongTroPage() {
  const params = useParams();
  const baiDangId = params.id as string;
  const supabase = taoSupabaseClient();

  const [baiDang, setBaiDang] = useState<BaiDangCongKhai | null>(null);
  const [soNha, setSoNha] = useState<string | null>(null);
  const [sdtChuTro, setSdtChuTro] = useState<string | null>(null);
  const [daXacNhanLich, setDaXacNhanLich] = useState(false);
  const [lichHenHienTai, setLichHenHienTai] = useState<{ id: string; trang_thai: string; ngay_hen: string; gio_bat_dau: string; gio_ket_thuc: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const [anhChinh, setAnhChinh] = useState<string | null>(null);
  const [danhSachBinhLuan, setDanhSachBinhLuan] = useState<BinhLuan[]>([]);
  const [noiDungBL, setNoiDungBL] = useState('');
  const [dangGuiBL, setDangGuiBL] = useState(false);

  // Form dat lich theo wireframe anh 2
  const [hienModalDatLich, setHienModalDatLich] = useState(false);
  const [tuanOffset, setTuanOffset] = useState(0); // 0 = tuan nay, 1 = tuan sau...
  const [ngayChonIndex, setNgayChonIndex] = useState(0); // 0..6 (T2..CN)
  const [danhSachLichDaDat, setDanhSachLichDaDat] = useState<Array<{ ngay_hen: string; gio_bat_dau: string; gio_ket_thuc: string }>>([]);

  const [slotChon, setSlotChon] = useState<{ ngay_hen: string; gio_bat_dau: string; gio_ket_thuc: string } | null>(null);
  const [dangDatLich, setDangDatLich] = useState(false);
  const [loiDatLich, setLoiDatLich] = useState<string | null>(null);

  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    async function taiDuLieu() {
      setDangTai(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: p } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          if (p) setProfile(p as Profile);

          if (p?.role === 'sinh_vien') {
            const { data: lh } = await supabase
              .from('lich_hen')
              .select('id, trang_thai, ngay_hen, gio_bat_dau, gio_ket_thuc, bai_dang:bai_dang_id(trang_thai)')
              .eq('bai_dang_id', baiDangId)
              .eq('sinh_vien_id', user.id)
              .in('trang_thai', ['cho_xac_nhan', 'da_xac_nhan'])
              .maybeSingle();

            if (lh && (lh as any).bai_dang?.trang_thai === 'con_trong') {
              setLichHenHienTai(lh as any);
              if (lh.trang_thai === 'da_xac_nhan') {
                setDaXacNhanLich(true);
              }
            } else {
              setLichHenHienTai(null);
              setDaXacNhanLich(false);
            }
          }
        }

        const { data: bd, error: bdErr } = await supabase
          .from('bai_dang')
          .select(`
            *,
            chu_tro:profiles!bai_dang_chu_tro_id_fkey(ho_ten, so_dien_thoai),
            hinh_anh:hinh_anh_bai_dang(*),
            lich_co_the_dat(*)
          `)
          .eq('id', baiDangId)
          .single();

        if (bdErr || !bd) {
          hienToast('Không tìm thấy bài đăng', 'loi');
          setDangTai(false);
          return;
        }

        const sortedImages = (bd.hinh_anh || []).sort(
          (a: any, b: any) => a.thu_tu - b.thu_tu
        );

        setBaiDang({
          id: bd.id,
          trang_thai: bd.trang_thai,
          duong: bd.duong,
          phuong: bd.phuong,
          tien_thue: bd.tien_thue,
          gia_thue_so: bd.gia_thue_so,
          tien_nuoc: bd.tien_nuoc,
          tien_dien: bd.tien_dien,
          phi_khac: bd.phi_khac,
          ghi_chu: bd.ghi_chu,
          ngay_trong_du_kien: bd.ngay_trong_du_kien,
          created_at: bd.created_at,
          anh_dai_dien: sortedImages[0]?.url || null,
          chu_tro: {
            ho_ten: bd.chu_tro?.ho_ten || 'Chủ trọ',
          },
          hinh_anh: sortedImages,
          lich_co_the_dat: bd.lich_co_the_dat || [],
        });

        setAnhChinh(sortedImages[0]?.url || null);

        if (
          daXacNhanLich ||
          (user && (bd.chu_tro_id === user.id || profile?.role === 'admin'))
        ) {
          setSoNha(bd.so_nha);
          setSdtChuTro(bd.chu_tro?.so_dien_thoai);
        }

        // Lay tat ca lich hen hien tai cua bai dang (chi khi phong chua cho thue)
        if (bd.trang_thai !== 'da_cho_thue') {
          const { data: lichs } = await supabase
            .from('lich_hen')
            .select('ngay_hen, gio_bat_dau, gio_ket_thuc')
            .eq('bai_dang_id', baiDangId)
            .in('trang_thai', ['cho_xac_nhan', 'da_xac_nhan']);

          if (lichs) {
            setDanhSachLichDaDat(lichs);
          }
        }

        // Lay binh luan
        const { data: bls } = await supabase
          .from('binh_luan')
          .select(`
            *,
            sinh_vien:profiles!binh_luan_sinh_vien_id_fkey(ho_ten)
          `)
          .eq('bai_dang_id', baiDangId)
          .order('created_at', { ascending: false });

        if (bls) setDanhSachBinhLuan(bls as BinhLuan[]);
      } catch (err) {
        console.error(err);
      } finally {
        setDangTai(false);
      }
    }

    taiDuLieu();
  }, [baiDangId, daXacNhanLich]);

  // Tinh toán 7 ngay trong tuan theo tuanOffset
  function layDanhSachNgayTrongTuan(offset: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const day = today.getDay();
    const diffToMon = today.getDate() - (day === 0 ? 6 : day - 1);
    const monday = new Date(today);
    monday.setDate(diffToMon + offset * 7);

    const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const fullLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];
    const thuDBMap = [1, 2, 3, 4, 5, 6, 0];

    const result = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);

      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      result.push({
        dateObj: d,
        dateStr,
        labelDay: dayLabels[i],
        labelDate: `${dd}/${mm}`,
        fullLabel: `${fullLabels[i]} - ${dd}/${mm}`,
        thuDB: thuDBMap[i],
        isPast: d < today,
      });
    }
    return result;
  }

  const dsNgayTuan = layDanhSachNgayTrongTuan(tuanOffset);

  // Xử lý chọn ngày mặc định: Nếu tuần này -> Ngày hiện tại; Nếu sang tuần khác -> Mặc định Thứ 2 (index 0)
  useEffect(() => {
    if (tuanOffset === 0) {
      const todayIdx = dsNgayTuan.findIndex((n) => !n.isPast);
      if (todayIdx !== -1) {
        setNgayChonIndex(todayIdx);
      }
    } else {
      setNgayChonIndex(0);
    }
  }, [tuanOffset, hienModalDatLich]);

  const ngayDangChon = dsNgayTuan[ngayChonIndex] || dsNgayTuan[0];

  // Kiem tra khung gio co ranh / da dat hay khong
  function kiemTraTrangThaiSlot(dateStr: string, thuDB: number, gBatDau: string, gKetThuc: string) {
    if (!baiDang) return { ranh: false, daDat: false, hopLe: false };

    // 1. Kiem tra ngay qua khuu
    const todayStr = new Date().toISOString().substring(0, 10);
    if (dateStr < todayStr) {
      return { ranh: false, daDat: false, hopLe: false };
    }

    // 2. Kiem tra chu tro co cai dat ranh khung gio nay khong
    const slotStartSec = gBatDau;
    const slotEndSec = gKetThuc;

    const ranhInDB = baiDang.lich_co_the_dat.some((l) => {
      if (l.ngay_hen !== dateStr) return false;
      const lStart = l.gio_bat_dau.substring(0, 5);
      const lEnd = l.gio_ket_thuc.substring(0, 5);
      return lStart <= slotStartSec && lEnd >= slotEndSec;
    });

    if (!ranhInDB) {
      return { ranh: false, daDat: false, hopLe: false };
    }

    // 3. Kiem tra da co ai dat lich trung ngay & trung khung gio nay chua
    const daDat = danhSachLichDaDat.some((lh) => {
      if (lh.ngay_hen !== dateStr) return false;
      const lhStart = lh.gio_bat_dau.substring(0, 5);
      const lhEnd = lh.gio_ket_thuc.substring(0, 5);
      return lhStart < slotEndSec && lhEnd > slotStartSec;
    });

    if (daDat) {
      return { ranh: false, daDat: true, hopLe: false };
    }

    return { ranh: true, daDat: false, hopLe: true };
  }

  async function xuLyGuiBinhLuan(e: React.FormEvent) {
    e.preventDefault();
    if (!profile) {
      hienToast('Vui lòng đăng nhập để bình luận', 'canh_bao');
      return;
    }
    if (!noiDungBL.trim()) return;

    setDangGuiBL(true);
    const { data: moi, error } = await supabase
      .from('binh_luan')
      .insert({
        bai_dang_id: baiDangId,
        sinh_vien_id: profile.id,
        noi_dung: noiDungBL.trim(),
      })
      .select(`
        *,
        sinh_vien:profiles!binh_luan_sinh_vien_id_fkey(ho_ten)
      `)
      .single();

    setDangGuiBL(false);

    if (error) {
      hienToast('Không thể gửi bình luận', 'loi');
      return;
    }

    setDanhSachBinhLuan((prev) => [moi as BinhLuan, ...prev]);
    setNoiDungBL('');
    hienToast('Đã gửi bình luận', 'thanh_cong');
  }

  async function xuLyXoaBinhLuan(blId: string) {
    const targetBL = danhSachBinhLuan.find((b) => b.id === blId);
    if (!targetBL) return;

    if (!window.confirm('Bạn có chắc chắn muốn xóa bình luận này không?')) return;

    const { error } = await supabase
      .from('binh_luan')
      .delete()
      .eq('id', blId);

    if (error) {
      hienToast('Không thể xóa bình luận: ' + error.message, 'loi');
      return;
    }

    // Neu Admin la nguoi xoa va khong phai chu nhan binh luan -> Gui thong bao cho sinh vien
    if (profile?.role === 'admin' && profile.id !== targetBL.sinh_vien_id) {
      const duongText = baiDang ? dinhDangDuong(baiDang.duong) : '';
      const phuongText = baiDang ? dinhDangPhuong(baiDang.phuong) : '';

      await supabase.from('thong_bao').insert({
        nguoi_nhan_id: targetBL.sinh_vien_id,
        loai: 'binh_luan_bi_xoa',
        noi_dung: `Bình luận của bạn tại bài đăng phòng trọ ở ${duongText}, ${phuongText} đã bị Admin xóa do vi phạm quy chuẩn nội dung.`,
        lien_ket: `/phong-tro/${baiDangId}`,
      });
    }

    setDanhSachBinhLuan((prev) => prev.filter((b) => b.id !== blId));
    hienToast('Đã xóa bình luận', 'thanh_cong');
  }

  async function xuLyDatLich(e: React.FormEvent) {
    e.preventDefault();
    setLoiDatLich(null);

    if (!slotChon) {
      setLoiDatLich('Vui lòng chọn 1 khung giờ trống');
      return;
    }

    setDangDatLich(true);

    try {
      const { data, error } = await supabase.rpc('dat_lich_hen', {
        p_bai_dang_id: baiDangId,
        p_ngay_hen: slotChon.ngay_hen,
        p_gio_bat_dau: `${slotChon.gio_bat_dau}:00`,
        p_gio_ket_thuc: `${slotChon.gio_ket_thuc}:00`,
      });

      if (error) {
        setLoiDatLich(error.message);
        setDangDatLich(false);
        return;
      }

      const res = data as any;
      if (res?.loi) {
        setLoiDatLich(res.loi);
        setDangDatLich(false);
        return;
      }

      // Cap nhat local state lich da dat
      setDanhSachLichDaDat((prev) => [
        ...prev,
        { ngay_hen: slotChon.ngay_hen, gio_bat_dau: `${slotChon.gio_bat_dau}:00`, gio_ket_thuc: `${slotChon.gio_ket_thuc}:00` },
      ]);

      setLichHenHienTai({
        id: res?.du_lieu?.id || 'temp',
        trang_thai: 'cho_xac_nhan',
        ngay_hen: slotChon.ngay_hen,
        gio_bat_dau: `${slotChon.gio_bat_dau}:00`,
        gio_ket_thuc: `${slotChon.gio_ket_thuc}:00`,
      });

      setSlotChon(null);
      setHienModalDatLich(false);
      hienToast('Đặt lịch hẹn thành công! Vui lòng chờ chủ trọ xác nhận', 'thanh_cong');
    } catch (err: any) {
      setLoiDatLich(err.message || 'Đã xảy ra lỗi khi đặt lịch');
    } finally {
      setDangDatLich(false);
    }
  }

  if (dangTai) {
    return (
      <>
        <Header />
        <div style={{ textAlign: 'center', padding: '80px 0' }}>Đang tải thông tin phòng trọ...</div>
        <Footer />
      </>
    );
  }

  if (!baiDang) return null;

  return (
    <>
      <ToastContainer />
      <Header />
      <main style={{ paddingBottom: '64px', minHeight: '80vh', background: 'transparent' }}>
        <div className="container" style={{ maxWidth: '900px' }}>

          {/* === KHU ANH (FULL WIDTH) === */}
          <div style={{ marginBottom: '20px', paddingTop: '24px' }}>
            {/* ANH CHINH */}
            <div style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              overflow: 'hidden',
              background: '#111',
              position: 'relative',
            }}>
              {anhChinh ? (
                <img
                  src={anhChinh}
                  alt="Ảnh phòng trọ"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--chu-phu)', fontSize: '0.95rem' }}>
                  Chưa có ảnh
                </div>
              )}
            </div>

            {/* DANH SACH ANH NHO */}
            {baiDang.hinh_anh.length > 1 && (
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {baiDang.hinh_anh.map((anh) => (
                  <img
                    key={anh.id}
                    src={anh.url}
                    alt="Ảnh nhỏ"
                    onClick={() => setAnhChinh(anh.url)}
                    style={{
                      width: '120px',
                      height: '80px',
                      objectFit: 'cover',
                      borderRadius: '8px',
                      flexShrink: 0,
                      cursor: 'pointer',
                      border: anhChinh === anh.url ? '2.5px solid var(--mau-la)' : '2.5px solid transparent',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* === TIEU DE & BADGE === */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', border: '1px solid var(--vien-nhat)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '10px' }}>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--chu-chinh)', lineHeight: '1.4', margin: 0 }}>
                Phòng trọ {dinhDangDuong(baiDang.duong)}, {dinhDangPhuong(baiDang.phuong)}
              </h1>
              <div style={{ flexShrink: 0 }}>
                <Badge trangThai={baiDang.trang_thai} loai="bai_dang" />
              </div>
            </div>

            {/* GIA & CHI PHI */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <span style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--mau-la)' }}>{baiDang.tien_thue}</span>
              <span style={{ fontSize: '1rem', color: 'var(--chu-phu)' }}>/tháng</span>
            </div>

            {/* HANG CHI PHI KHAC */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '0.875rem', color: 'var(--chu-phu)', paddingTop: '12px', borderTop: '1px solid var(--vien-nhat)' }}>
              <span>Tiền nước: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.tien_nuoc || 'Theo thực tế'}</strong></span>
              <span>Tiền điện: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.tien_dien || 'Theo thực tế'}</strong></span>
              <span>Phí khác: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.phi_khac || 'Không'}</strong></span>
            </div>

            {/* DIA CHI + CHU TRO */}
            <div style={{ marginTop: '12px', fontSize: '0.875rem', color: 'var(--chu-phu)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div>
                Địa điểm: <strong style={{ color: 'var(--chu-chinh)' }}>{dinhDangDuong(baiDang.duong)}, {dinhDangPhuong(baiDang.phuong)}, Quy Nhơn</strong>
              </div>
              <div>
                Chủ trọ: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.chu_tro?.ho_ten || 'Chưa cập nhật'}</strong>
              </div>
            </div>

            {/* NGAY TRONG DU KIEN */}
            {baiDang.trang_thai === 'da_cho_thue' && baiDang.ngay_trong_du_kien && (
              <div style={{ marginTop: '12px', background: 'var(--mau-la-nhat)', padding: '10px 14px', borderRadius: '8px', border: '1px solid rgba(45,106,79,0.2)', fontSize: '0.875rem', color: 'var(--mau-la)', fontWeight: '600' }}>
                Dự kiến trống từ: {baiDang.ngay_trong_du_kien}
              </div>
            )}
          </div>

          {/* === MO TA === */}
          {baiDang.ghi_chu && (
            <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', border: '1px solid var(--vien-nhat)' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '10px', color: 'var(--chu-chinh)' }}>Mô tả phòng trọ</h2>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.7', color: 'var(--chu-chinh)', whiteSpace: 'pre-line', margin: 0 }}>{baiDang.ghi_chu}</p>
            </div>
          )}



          {/* === DIA CHI + DAT LICH === */}
          <div style={{ background: '#fff', borderRadius: '12px', padding: '20px 24px', marginBottom: '12px', border: '1px solid var(--vien-nhat)' }}>
            {lichHenHienTai && lichHenHienTai.trang_thai === 'cho_xac_nhan' && (
              <div style={{ background: '#fff8e1', padding: '14px 18px', borderRadius: '8px', border: '1px solid #ffe082', marginBottom: '16px', fontSize: '0.9rem', color: '#8d6e63' }}>
                <div style={{ fontWeight: '700', color: '#f57f17', marginBottom: '4px' }}>Bạn đã đăng ký 1 lịch hẹn xem phòng này (Chờ xác nhận):</div>
                <div>Thời gian hẹn: <strong>{new Date(lichHenHienTai.ngay_hen).toLocaleDateString('vi-VN')}</strong> từ <strong>{lichHenHienTai.gio_bat_dau.substring(0,5)}</strong> đến <strong>{lichHenHienTai.gio_ket_thuc.substring(0,5)}</strong></div>
                <div style={{ fontSize: '0.825rem', marginTop: '6px', color: 'var(--chu-phu)' }}>Vui lòng chờ chủ trọ xác nhận hoặc hủy lịch trong trang &quot;Lịch hẹn của tôi&quot; nếu bạn muốn chọn lại giờ khác.</div>
              </div>
            )}

            {soNha && sdtChuTro ? (
              <div style={{ background: 'var(--mau-la-nhat)', padding: '14px 18px', borderRadius: '8px', border: '1px solid rgba(45,106,79,0.25)', marginBottom: '16px', fontSize: '0.9rem' }}>
                <div style={{ fontWeight: '700', color: 'var(--mau-la)', marginBottom: '6px' }}>Đã xác nhận lịch hẹn xem phòng!</div>
                <div><strong>Thời gian hẹn:</strong> {lichHenHienTai ? `${new Date(lichHenHienTai.ngay_hen).toLocaleDateString('vi-VN')} từ ${lichHenHienTai.gio_bat_dau.substring(0,5)} đến ${lichHenHienTai.gio_ket_thuc.substring(0,5)}` : 'Đã xác nhận'}</div>
                <div style={{ marginTop: '4px' }}><strong>Địa chỉ chi tiết:</strong> {soNha}, {dinhDangDuong(baiDang.duong)}, {dinhDangPhuong(baiDang.phuong)}</div>
                <div style={{ marginTop: '4px' }}><strong>Số điện thoại chủ trọ:</strong> {sdtChuTro}</div>
              </div>
            ) : null}

            {profile?.role === 'sinh_vien' ? (
              <button
                className={styles.nut_dat_phong}
                onClick={() => setHienModalDatLich(true)}
                disabled={baiDang.trang_thai === 'da_cho_thue'}
              >
                {baiDang.trang_thai === 'da_cho_thue' ? 'Phòng đã cho thuê' : 'Đặt lịch hẹn ngay'}
              </button>
            ) : profile ? (
              <div style={{ fontSize: '0.875rem', color: 'var(--chu-phu)' }}>
                Tài khoản của bạn là {profile.role === 'chu_tro' ? 'Chủ trọ' : 'Admin'}. Chỉ Sinh viên mới có thể đặt lịch xem phòng.
              </div>
            ) : (
              <a
                href="/dang-nhap"
                className={styles.nut_dat_phong}
                style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
              >
                Đăng nhập để đặt lịch
              </a>
            )}
          </div>

          {/* === BINH LUAN === */}
          <div style={{ background: '#fff', borderRadius: 'var(--bo-vua)', padding: '20px 24px', marginBottom: '12px', border: '1px solid var(--vien-nhat)' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '16px', color: 'var(--chu-chinh)' }}>
              Bình luận từ sinh viên ({danhSachBinhLuan.length})
            </h2>

            {profile?.role === 'sinh_vien' && (
              <form onSubmit={xuLyGuiBinhLuan} style={{ marginBottom: '16px', display: 'flex', gap: '10px' }}>
                <textarea
                  rows={2}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--bo-vua)', border: '1.5px solid var(--vien-nhap)', resize: 'none', fontFamily: 'inherit', fontSize: '0.9rem' }}
                  value={noiDungBL}
                  onChange={(e) => setNoiDungBL(e.target.value)}
                />
                <button
                  type="submit"
                  style={{ padding: '10px 18px', background: 'var(--mau-la)', color: '#fff', border: 'none', borderRadius: 'var(--bo-vua)', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}
                  disabled={dangGuiBL}
                >
                  {dangGuiBL ? 'Đang gửi...' : 'Gửi'}
                </button>
              </form>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {danhSachBinhLuan.length === 0 ? (
                <div style={{ color: 'var(--chu-phu)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>Chưa có bình luận nào.</div>
              ) : (
                danhSachBinhLuan.map((bl) => {
                  const isAuthor = profile && profile.id === bl.sinh_vien_id;
                  const isAdmin = profile && profile.role === 'admin';
                  const canDelete = isAuthor || isAdmin;

                  return (
                    <div key={bl.id} style={{ background: 'var(--nen-xam)', padding: '12px 14px', borderRadius: 'var(--bo-vua)' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.88rem', marginBottom: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--mau-la)' }}>{bl.sinh_vien?.ho_ten || 'Sinh viên'}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 'normal', fontSize: '0.8rem', color: 'var(--chu-phu)' }}>
                            {new Date(bl.created_at).toLocaleDateString('vi-VN')}
                          </span>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => xuLyXoaBinhLuan(bl.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--nguy-hiem)',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                cursor: 'pointer',
                                padding: '2px 6px',
                                borderRadius: 'var(--bo-vua)',
                              }}
                              title="Xóa bình luận này"
                            >
                              Xóa
                            </button>
                          )}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--chu-chinh)', whiteSpace: 'pre-line' }}>{bl.noi_dung}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      </main>

      {/* MODAL DAT LICH HEN CHUAN ANH 2 */}
      <Modal
        hienThi={hienModalDatLich}
        tieuDe="ĐẶT LỊCH XEM PHÒNG"
        onClose={() => setHienModalDatLich(false)}
      >
        <form onSubmit={xuLyDatLich} style={{ padding: '4px' }}>
          {loiDatLich && (
            <div style={{ background: 'var(--nguy-hiem-nhat)', color: 'var(--nguy-hiem)', padding: '10px 14px', borderRadius: 'var(--bo-vua)', marginBottom: '16px', fontSize: '0.85rem', fontWeight: '600' }}>
              {loiDatLich}
            </div>
          )}

          {lichHenHienTai && (
            <div style={{ background: '#fff3e0', border: '1px solid #ffb74d', color: '#e65100', padding: '12px 16px', borderRadius: 'var(--bo-vua)', marginBottom: '16px', fontSize: '0.875rem' }}>
              <strong>Lưu ý:</strong> Bạn đã có 1 lịch hẹn cho phòng trọ này vào ngày <strong>{new Date(lichHenHienTai.ngay_hen).toLocaleDateString('vi-VN')}</strong> từ <strong>{lichHenHienTai.gio_bat_dau.substring(0, 5)}</strong> đến <strong>{lichHenHienTai.gio_ket_thuc.substring(0, 5)}</strong> (Trạng thái: <strong>{lichHenHienTai.trang_thai === 'cho_xac_nhan' ? 'Chờ xác nhận' : 'Đã xác nhận'}</strong>).
              <br />
              Nếu muốn đổi sang khung giờ khác, bạn vui lòng vào trang <strong>Lịch hẹn của tôi</strong> để hủy lịch cũ trước khi đặt lại.
            </div>
          )}

          {/* HALT NAV: TUAN TRUOC / TUAN SAU */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => setTuanOffset((prev) => Math.max(0, prev - 1))}
              disabled={tuanOffset === 0}
              style={{ padding: '6px 12px', background: 'none', border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', cursor: tuanOffset === 0 ? 'not-allowed' : 'pointer', opacity: tuanOffset === 0 ? 0.4 : 1, fontSize: '0.85rem', fontWeight: '600' }}
            >
              &lt; Tuần trước
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--mau-chu-dao)' }}>
              {tuanOffset === 0 ? 'Tuần này' : `Tuần +${tuanOffset}`}
            </span>
            <button
              type="button"
              onClick={() => setTuanOffset((prev) => prev + 1)}
              style={{ padding: '6px 12px', background: 'none', border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}
            >
              Tuần sau &gt;
            </button>
          </div>

          {/* TAB 7 NGAY TRONG TUAN */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', marginBottom: '20px' }}>
            {dsNgayTuan.map((ngay, idx) => {
              const isSelected = ngayChonIndex === idx;
              const isPast = ngay.isPast;
              const countRanh = [...KHUNG_GIO_SANG, ...KHUNG_GIO_CHIEU].filter((s) => kiemTraTrangThaiSlot(ngay.dateStr, ngay.thuDB, s.gioBatDau, s.gioKetThuc).ranh).length;

              return (
                <button
                  key={ngay.dateStr}
                  type="button"
                  disabled={isPast}
                  onClick={() => {
                    if (isPast) return;
                    setNgayChonIndex(idx);
                    setSlotChon(null);
                  }}
                  style={{
                    padding: '8px 4px',
                    borderRadius: 'var(--bo-vua)',
                    border: isSelected ? '2px solid var(--mau-chu-dao)' : '1px solid var(--vien-nhap)',
                    background: isPast ? '#f5f5f5' : isSelected ? 'var(--mau-la-nhat)' : 'var(--nen-the)',
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    opacity: isPast ? 0.4 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '2px',
                    transition: 'all 0.15s ease',
                  }}
                  title={isPast ? 'Ngày trong quá khứ' : undefined}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: '700', color: isSelected ? 'var(--mau-chu-dao)' : 'var(--chu-chinh)' }}>
                    {ngay.labelDay}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--chu-phu)' }}>
                    {ngay.labelDate}
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 6px',
                      borderRadius: 'var(--bo-vua)',
                      background: isPast ? '#9e9e9e' : countRanh > 0 ? '#4caf50' : '#bdbdbd',
                      color: '#ffffff',
                      fontWeight: '700',
                      marginTop: '2px',
                    }}
                  >
                    {isPast ? 'Đã qua' : `${countRanh}/12`}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CHÚ THÍCH MÀU TRẠNG THÁI KHUNG GIỜ */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '10px 14px', background: '#ffffff', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhap)', marginBottom: '16px', fontSize: '0.825rem', color: 'var(--chu-chinh)', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '700', color: 'var(--chu-phu)' }}>Chú thích:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4caf50' }} />
              <span>Màu xanh: Còn trống (Bấm để chọn)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#bdbdbd' }} />
              <span>Màu xám: Chủ trọ bận</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#e53935' }} />
              <span>Màu đỏ: Đã có người đặt</span>
            </div>
          </div>

          {/* TIEU DE NGAY DANG CHON */}
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--chu-chinh)', marginBottom: '14px', borderBottom: '1.5px solid var(--vien-nhap)', paddingBottom: '6px' }}>
            {ngayDangChon.fullLabel}
          </div>

          {/* BANG KHUNG GIO: BUOI SANG & BUOI CHIEU */}
          <div style={{ border: '1px solid var(--vien-nhap)', borderRadius: 'var(--bo-vua)', padding: '16px', background: 'var(--nen-xam)', marginBottom: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* BUOI SANG */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: 'var(--chu-chinh)' }}>
                  Buổi sáng
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {KHUNG_GIO_SANG.map((slot) => {
                    const st = kiemTraTrangThaiSlot(ngayDangChon.dateStr, ngayDangChon.thuDB, slot.gioBatDau, slot.gioKetThuc);
                    const isSelected = slotChon?.ngay_hen === ngayDangChon.dateStr && slotChon?.gio_bat_dau === slot.gioBatDau;

                    let statusBg = '#bdbdbd'; // Xam: khong ranh
                    if (st.daDat) statusBg = '#e53935'; // Do: da co nguoi dat
                    if (st.ranh) statusBg = '#4caf50'; // Xanh: trong

                    return (
                      <div
                        key={slot.gioBatDau}
                        onClick={() => {
                          if (st.ranh) {
                            setSlotChon({
                              ngay_hen: ngayDangChon.dateStr,
                              gio_bat_dau: slot.gioBatDau,
                              gio_ket_thuc: slot.gioKetThuc,
                            });
                            setLoiDatLich(null);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: isSelected ? '#e8f5e9' : '#ffffff',
                          border: isSelected ? '2px solid #2e7d32' : '1px solid var(--vien-nhap)',
                          borderRadius: 'var(--bo-vua)',
                          cursor: st.ranh ? 'pointer' : 'not-allowed',
                          opacity: st.ranh ? 1 : 0.65,
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? '700' : '500',
                        }}
                      >
                        <span>{slot.gioBatDau} - {slot.gioKetThuc}</span>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: statusBg,
                            flexShrink: 0,
                          }}
                          title={st.daDat ? 'Đã có người đặt' : st.ranh ? 'Còn trống' : 'Bận / Không rảnh'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BUOI CHIEU */}
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '12px', color: 'var(--chu-chinh)' }}>
                  Buổi chiều
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {KHUNG_GIO_CHIEU.map((slot) => {
                    const st = kiemTraTrangThaiSlot(ngayDangChon.dateStr, ngayDangChon.thuDB, slot.gioBatDau, slot.gioKetThuc);
                    const isSelected = slotChon?.ngay_hen === ngayDangChon.dateStr && slotChon?.gio_bat_dau === slot.gioBatDau;

                    let statusBg = '#bdbdbd';
                    if (st.daDat) statusBg = '#e53935';
                    if (st.ranh) statusBg = '#4caf50';

                    return (
                      <div
                        key={slot.gioBatDau}
                        onClick={() => {
                          if (st.ranh) {
                            setSlotChon({
                              ngay_hen: ngayDangChon.dateStr,
                              gio_bat_dau: slot.gioBatDau,
                              gio_ket_thuc: slot.gioKetThuc,
                            });
                            setLoiDatLich(null);
                          }
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: isSelected ? '#e8f5e9' : '#ffffff',
                          border: isSelected ? '2px solid #2e7d32' : '1px solid var(--vien-nhap)',
                          borderRadius: 'var(--bo-vua)',
                          cursor: st.ranh ? 'pointer' : 'not-allowed',
                          opacity: st.ranh ? 1 : 0.65,
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? '700' : '500',
                        }}
                      >
                        <span>{slot.gioBatDau} - {slot.gioKetThuc}</span>
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            background: statusBg,
                            flexShrink: 0,
                          }}
                          title={st.daDat ? 'Đã có người đặt' : st.ranh ? 'Còn trống' : 'Bận / Không rảnh'}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* CHU THICH DANG CHON */}
          {slotChon && (
            <div style={{ marginBottom: '16px', background: 'var(--mau-la-nhat)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--mau-la)', fontSize: '0.875rem' }}>
              <strong>Khung giờ bạn chọn:</strong> {ngayDangChon.fullLabel} từ <strong>{slotChon.gio_bat_dau}</strong> đến <strong>{slotChon.gio_ket_thuc}</strong>
            </div>
          )}

          <button
            type="submit"
            className={styles.nut_dat_phong}
            style={{ width: '100%', padding: '12px', opacity: lichHenHienTai ? 0.6 : 1, cursor: lichHenHienTai ? 'not-allowed' : 'pointer' }}
            disabled={dangDatLich || !slotChon || !!lichHenHienTai}
          >
            {dangDatLich ? 'Đang gửi yêu cầu...' : lichHenHienTai ? 'Bạn đã có lịch hẹn cho bài đăng này' : 'Xác nhận đặt lịch'}
          </button>
        </form>
      </Modal>

      <Footer />
    </>
  );
}
