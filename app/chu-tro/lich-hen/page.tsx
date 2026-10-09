'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import Badge from '@/components/Badge/Badge';
import { hienToast } from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import type { LichHen, LichCoTheDat } from '@/types';
import styles from '../chu-tro.module.css';

interface BaiDangItem {
  id: string;
  duong: string;
  phuong: string;
  tien_thue: string;
  trang_thai: string;
  lich_co_the_dat: LichCoTheDat[];
}

interface SlotGio {
  gioBatDau: string;
  gioKetThuc: string;
}

const KHUNG_GIO_1H_SANG: SlotGio[] = [
  { gioBatDau: '07:00', gioKetThuc: '08:00' },
  { gioBatDau: '08:00', gioKetThuc: '09:00' },
  { gioBatDau: '09:00', gioKetThuc: '10:00' },
  { gioBatDau: '10:00', gioKetThuc: '11:00' },
  { gioBatDau: '11:00', gioKetThuc: '12:00' },
  { gioBatDau: '12:00', gioKetThuc: '13:00' },
];

const KHUNG_GIO_1H_CHIEU: SlotGio[] = [
  { gioBatDau: '13:00', gioKetThuc: '14:00' },
  { gioBatDau: '14:00', gioKetThuc: '15:00' },
  { gioBatDau: '15:00', gioKetThuc: '16:00' },
  { gioBatDau: '16:00', gioKetThuc: '17:00' },
  { gioBatDau: '17:00', gioKetThuc: '18:00' },
  { gioBatDau: '18:00', gioKetThuc: '19:00' },
];

export default function ChuTroLichHenPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();

  const [danhSachBai, setDanhSachBai] = useState<BaiDangItem[]>([]);
  const [danhSachLich, setDanhSachLich] = useState<LichHen[]>([]);
  const [dangTai, setDangTai] = useState(true);

  const [tabActive, setTabActive] = useState<'lich_hen' | 'cai_dat_khung_gio'>('lich_hen');
  const [baiDangChonId, setBaiDangChonId] = useState<string | null>(null);
  
  // Tuan offset (0 = tuan nay, 1 = tuan sau...)
  const [tuanOffset, setTuanOffset] = useState(0);
  const [ngayIndexDangChon, setNgayIndexDangChon] = useState<number>(0); // 0..6 (T2..CN)

  // Map dateStr (YYYY-MM-DD) -> Set cac slot ranh (key = "07:00-08:00")
  const [slotForm, setSlotForm] = useState<{ [dateStr: string]: Set<string> }>({});

  const [dangLuuKhungGio, setDangLuuKhungGio] = useState(false);

  useEffect(() => {
    async function taiDuLieu() {
      setDangTai(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }

      // 1. Lay chi cac bai dang CON_TRONG (da duoc Admin duyet) cua chu tro de cai dat lich
      const { data: baiDangs } = await supabase
        .from('bai_dang')
        .select(`
          id, duong, phuong, tien_thue, trang_thai,
          lich_co_the_dat(*)
        `)
        .eq('chu_tro_id', user.id)
        .eq('trang_thai', 'con_trong') // Chi lay bai dang da duoc Admin duyet
        .order('created_at', { ascending: false });

      if (baiDangs) {
        setDanhSachBai(baiDangs as BaiDangItem[]);
        if (baiDangs.length > 0) {
          moCaiDatLich(baiDangs[0] as BaiDangItem);
        }
      }

      // 2. Lay danh sach lich hen tu sinh vien (chi cac bai dang con_trong, chi lich tu ngay hien tai tro ve sau theo thoi gian thuc)
      if (baiDangs && baiDangs.length > 0) {
        const baiIds = baiDangs
          .filter((b: any) => b.trang_thai === 'con_trong')
          .map((b: any) => b.id);

        if (baiIds.length > 0) {
          const todayStr = new Date().toISOString().substring(0, 10);

          const { data: lichs } = await supabase
            .from('lich_hen')
            .select(`
              *,
              bai_dang:bai_dang_id(duong, phuong, tien_thue),
              sinh_vien:profiles!lich_hen_sinh_vien_id_fkey(ho_ten, so_dien_thoai)
            `)
            .in('bai_dang_id', baiIds)
            .gte('ngay_hen', todayStr) // Lich qua han tu dong bien mat theo thoi gian thuc
            .in('trang_thai', ['cho_xac_nhan', 'da_xac_nhan'])
            .order('created_at', { ascending: false });

          if (lichs) setDanhSachLich(lichs as LichHen[]);
        }
      }

      setDangTai(false);
    }
    taiDuLieu();
  }, []);

  const tatCaSlot1H = [...KHUNG_GIO_1H_SANG, ...KHUNG_GIO_1H_CHIEU];

  // Tinh 7 ngay trong tuan theo tuanOffset
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
        setNgayIndexDangChon(todayIdx);
      }
    } else {
      setNgayIndexDangChon(0);
    }
  }, [tuanOffset]);

  const ngayDangChon = dsNgayTuan[ngayIndexDangChon] || dsNgayTuan[0];

  function moCaiDatLich(bai: BaiDangItem) {
    setBaiDangChonId(bai.id);

    const initMap: { [dateStr: string]: Set<string> } = {};

    if (bai.lich_co_the_dat && bai.lich_co_the_dat.length > 0) {
      bai.lich_co_the_dat.forEach((l) => {
        const dateKey = l.ngay_hen;
        if (!dateKey) return;
        if (!initMap[dateKey]) initMap[dateKey] = new Set();
        const gBatDau = l.gio_bat_dau.substring(0, 5);
        const gKetThuc = l.gio_ket_thuc.substring(0, 5);

        tatCaSlot1H.forEach((slot) => {
          if (slot.gioBatDau >= gBatDau && slot.gioKetThuc <= gKetThuc) {
            initMap[dateKey].add(`${slot.gioBatDau}-${slot.gioKetThuc}`);
          }
        });
      });
    }

    setSlotForm(initMap);
  }

  function toggleSlot(dateStr: string, keySlot: string) {
    setSlotForm((prev) => {
      const copy = { ...prev };
      const currentSet = new Set(copy[dateStr] || []);
      if (currentSet.has(keySlot)) {
        currentSet.delete(keySlot);
      } else {
        currentSet.add(keySlot);
      }
      copy[dateStr] = currentSet;
      return copy;
    });
  }

  function chonTatCaNgay(dateStr: string) {
    setSlotForm((prev) => {
      const copy = { ...prev };
      const setAll = new Set<string>();
      tatCaSlot1H.forEach((s) => setAll.add(`${s.gioBatDau}-${s.gioKetThuc}`));
      copy[dateStr] = setAll;
      return copy;
    });
  }

  function boChonTatCaNgay(dateStr: string) {
    setSlotForm((prev) => {
      const copy = { ...prev };
      copy[dateStr] = new Set();
      return copy;
    });
  }

  function apDungChoTatCaCacNgay() {
    const currentSet = slotForm[ngayDangChon.dateStr] || new Set();
    setSlotForm((prev) => {
      const copy = { ...prev };
      dsNgayTuan.forEach((ngay) => {
        if (!ngay.isPast) {
          copy[ngay.dateStr] = new Set(currentSet);
        }
      });
      return copy;
    });
    hienToast(`Đã áp dụng cấu hình khung giờ cho tất cả các ngày trong tuần này!`, 'thanh_cong');
  }

  async function xuLyLuuKhungGio() {
    if (!baiDangChonId) return;
    setDangLuuKhungGio(true);

    try {
      // 1. Xoa lich cu trong DB cua bai dang nay
      await supabase.from('lich_co_the_dat').delete().eq('bai_dang_id', baiDangChonId);

      // 2. Tao cac ban ghi 1h moi theo ngay_hen (dateStr)
      const recordsToInsert: { bai_dang_id: string; ngay_hen: string; gio_bat_dau: string; gio_ket_thuc: string }[] = [];

      Object.entries(slotForm).forEach(([dateStr, setSlots]) => {
        setSlots.forEach((keySlot) => {
          const [gBatDau, gKetThuc] = keySlot.split('-');
          recordsToInsert.push({
            bai_dang_id: baiDangChonId,
            ngay_hen: dateStr,
            gio_bat_dau: `${gBatDau}:00`,
            gio_ket_thuc: `${gKetThuc}:00`,
          });
        });
      });

      if (recordsToInsert.length > 0) {
        const { error } = await supabase.from('lich_co_the_dat').insert(recordsToInsert);
        if (error) throw error;
      }

      setDanhSachBai((prev) =>
        prev.map((b) =>
          b.id === baiDangChonId
            ? {
                ...b,
                lich_co_the_dat: recordsToInsert.map((r, i) => ({
                  id: `temp_${i}`,
                  bai_dang_id: baiDangChonId,
                  ngay_hen: r.ngay_hen,
                  gio_bat_dau: r.gio_bat_dau,
                  gio_ket_thuc: r.gio_ket_thuc,
                })),
              }
            : b
        )
      );

      hienToast('Đã lưu khung giờ rảnh thành công!', 'thanh_cong');
    } catch (err: any) {
      hienToast('Lỗi lưu khung giờ: ' + (err.message || err), 'loi');
    } finally {
      setDangLuuKhungGio(false);
    }
  }

  // Xac nhan lich hen cua sinh vien
  async function xuLyXacNhan(lichId: string, sinhVienId: string) {
    const { error } = await supabase
      .from('lich_hen')
      .update({ trang_thai: 'da_xac_nhan' })
      .eq('id', lichId);

    if (error) {
      hienToast('Không thể xác nhận lịch hẹn: ' + error.message, 'loi');
      return;
    }

    await supabase.from('thong_bao').insert({
      nguoi_nhan_id: sinhVienId,
      loai: 'da_xac_nhan',
      noi_dung: 'Chủ trọ đã XÁC NHẬN lịch hẹn xem phòng của bạn! Bạn có thể xem số nhà và SĐT chủ trọ ngay bây giờ.',
    });

    setDanhSachLich((prev) =>
      prev.map((l) => (l.id === lichId ? { ...l, trang_thai: 'da_xac_nhan' } : l))
    );
    hienToast('Đã xác nhận lịch hẹn!', 'thanh_cong');
  }

  // Tu choi / Huy lich hen
  async function xuLyHuyLich(lichId: string, sinhVienId: string, lyDo: string) {
    await supabase.from('thong_bao').insert({
      nguoi_nhan_id: sinhVienId,
      loai: 'da_tu_choi_lich',
      noi_dung: `Chủ trọ đã từ chối/hủy lịch hẹn xem phòng của bạn. Lý do: ${lyDo}`,
    });

    const { error } = await supabase
      .from('lich_hen')
      .delete()
      .eq('id', lichId);

    if (error) {
      hienToast('Không thể từ chối lịch hẹn: ' + error.message, 'loi');
      return;
    }

    setDanhSachLich((prev) => prev.filter((l) => l.id !== lichId));
    hienToast('Đã từ chối và xóa lịch hẹn.', 'thanh_cong');
  }

  if (dangTai) {
    return (
      <LayoutTaiKhoan>
        <div style={{ textAlign: 'center', padding: '60px 0' }}>Đang tải lịch hẹn...</div>
      </LayoutTaiKhoan>
    );
  }

  const baiDangDangChon = danhSachBai.find((b) => b.id === baiDangChonId);
  const slotsCurrentDay = slotForm[ngayDangChon.thuDB] || new Set();
  const soLichChoXacNhan = danhSachLich.filter((l) => l.trang_thai === 'cho_xac_nhan').length;

  return (
    <LayoutTaiKhoan>
      <div style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
        {/* SUB-TABS PHÂN CHIA 2 TÁC VỤ DẠNG NÚT BẤM CHUẨN BANNER ADMIN */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
          <button
            type="button"
            onClick={() => setTabActive('lich_hen')}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--bo-vua)',
              border: tabActive === 'lich_hen' ? '1.5px solid var(--mau-la)' : '1px solid var(--vien-nhat)',
              background: tabActive === 'lich_hen' ? 'var(--mau-la)' : '#ffffff',
              color: tabActive === 'lich_hen' ? '#ffffff' : 'var(--chu-chinh)',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: tabActive === 'lich_hen' ? 'var(--bong-nho)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>Danh sách lịch hẹn từ sinh viên</span>
            {soLichChoXacNhan > 0 && (
              <span
                style={{
                  background: tabActive === 'lich_hen' ? '#ffffff' : '#e53935',
                  color: tabActive === 'lich_hen' ? '#2e7d32' : '#ffffff',
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '700',
                }}
              >
                {soLichChoXacNhan}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTabActive('cai_dat_khung_gio')}
            style={{
              padding: '9px 20px',
              borderRadius: 'var(--bo-vua)',
              border: tabActive === 'cai_dat_khung_gio' ? '1.5px solid var(--mau-la)' : '1px solid var(--vien-nhat)',
              background: tabActive === 'cai_dat_khung_gio' ? 'var(--mau-la)' : '#ffffff',
              color: tabActive === 'cai_dat_khung_gio' ? '#ffffff' : 'var(--chu-chinh)',
              fontWeight: '700',
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: tabActive === 'cai_dat_khung_gio' ? 'var(--bong-nho)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            Cài đặt khung giờ rảnh
          </button>
        </div>

        {/* TAB 1: CAI DAT KHUNG GIO RANH */}
        {tabActive === 'cai_dat_khung_gio' && (
        <div
          className={styles.the_form}
          style={{
            marginBottom: '32px',
            width: '100%',
            maxWidth: '100%',
            padding: '32px 28px',
            background: '#ffffff',
            borderRadius: 'var(--bo-vua)',
            border: '1px solid var(--vien-nhat)',
            boxShadow: 'var(--bong-nho)',
            boxSizing: 'border-box',
          }}
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--chu-phu)', marginBottom: '20px', lineHeight: '1.5' }}>
            Bấm vào các nút khung giờ 1 tiếng để bật (màu xanh = Rảnh) hoặc tắt (màu xám = Bận). Lịch cài đặt sẽ tự động áp dụng theo thời gian thực.
          </p>

          {danhSachBai.length === 0 ? (
            <div style={{ padding: '18px', background: '#fff9c4', border: '1px solid #fbc02d', color: '#574200', borderRadius: 'var(--bo-vua)', fontSize: '0.9rem', lineHeight: '1.5', fontWeight: '500' }}>
              <strong>Lưu ý:</strong> Bạn hiện chưa có bài đăng nào ở trạng thái <strong>Còn trống</strong> (đã được Admin duyệt). Chỉ những bài đăng đã được Admin phê duyệt mới hiển thị ở đây để cài đặt khung giờ rảnh.
            </div>
          ) : (
            <div style={{ width: '100%', boxSizing: 'border-box' }}>
              {/* CHON BAI DANG */}
              <div style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '0.9rem', marginBottom: '8px', color: 'var(--chu-chinh)' }}>
                  Chọn bài đăng cần cài đặt lịch:
                </label>
                <select
                  style={{
                    width: '100%',
                    maxWidth: '100%',
                    padding: '12px 16px',
                    borderRadius: 'var(--bo-vua)',
                    border: '1.5px solid var(--vien-nhap)',
                    background: '#ffffff',
                    fontWeight: '600',
                    fontSize: '0.95rem',
                    color: 'var(--chu-chinh)',
                    boxSizing: 'border-box',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                  }}
                  value={baiDangChonId || ''}
                  onChange={(e) => {
                    const found = danhSachBai.find((b) => b.id === e.target.value);
                    if (found) moCaiDatLich(found);
                  }}
                >
                  {danhSachBai.map((b) => {
                    const ttText = b.trang_thai === 'con_trong' ? 'Còn trống' : b.trang_thai === 'da_cho_thue' ? 'Đã cho thuê' : 'Chờ duyệt';
                    return (
                      <option key={b.id} value={b.id}>
                        {dinhDangDuong(b.duong)}, {dinhDangPhuong(b.phuong)} ({b.tien_thue}) - [{ttText}]
                      </option>
                    );
                  })}
                </select>
              </div>

              {baiDangDangChon && (
                <div
                  style={{
                    background: '#ffffff',
                    padding: '24px',
                    borderRadius: 'var(--bo-vua)',
                    border: '1px solid var(--vien-nhap)',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  {/* HALT NAV: TUAN TRUOC / TUAN SAU */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setTuanOffset((prev) => Math.max(0, prev - 1))}
                      disabled={tuanOffset === 0}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        border: '1px solid var(--vien-nhap)',
                        borderRadius: 'var(--bo-vua)',
                        cursor: tuanOffset === 0 ? 'not-allowed' : 'pointer',
                        opacity: tuanOffset === 0 ? 0.4 : 1,
                        fontSize: '0.875rem',
                        fontWeight: '600',
                      }}
                    >
                      &lt; Tuần trước
                    </button>
                    <span style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--mau-chu-dao)' }}>
                      {tuanOffset === 0 ? 'Tuần này' : `Tuần +${tuanOffset}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTuanOffset((prev) => prev + 1)}
                      style={{
                        padding: '8px 16px',
                        background: '#ffffff',
                        border: '1px solid var(--vien-nhap)',
                        borderRadius: 'var(--bo-vua)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                      }}
                    >
                      Tuần sau &gt;
                    </button>
                  </div>

                  {/* 7 TAB NGAY TRONG TUAN GRID CLEAN FIT ON WHITE BACKGROUND */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '20px', width: '100%', boxSizing: 'border-box' }}>
                    {dsNgayTuan.map((ngay, idx) => {
                      const countRanh = (slotForm[ngay.dateStr] || new Set()).size;
                      const isSelected = ngayIndexDangChon === idx;
                      const isPast = ngay.isPast;

                      return (
                        <button
                          key={ngay.dateStr}
                          type="button"
                          disabled={isPast}
                          onClick={() => {
                            if (isPast) return;
                            setNgayIndexDangChon(idx);
                          }}
                          style={{
                            padding: '10px 4px',
                            borderRadius: 'var(--bo-vua)',
                            border: isSelected ? '2px solid var(--mau-chu-dao)' : '1px solid var(--vien-nhap)',
                            background: isPast ? '#f5f5f5' : isSelected ? 'var(--mau-la-nhat)' : '#ffffff',
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            opacity: isPast ? 0.4 : 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '3px',
                            boxSizing: 'border-box',
                            overflow: 'hidden',
                            transition: 'all 0.15s ease',
                          }}
                          title={isPast ? 'Ngày trong quá khứ' : undefined}
                        >
                          <span style={{ fontSize: '0.8rem', fontWeight: '700', color: isSelected ? 'var(--mau-chu-dao)' : 'var(--chu-chinh)' }}>
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

                  {/* HEADER NGAY DANG CHON & NUT THAO TAC NHANH */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontWeight: '700', fontSize: '1.05rem', color: 'var(--chu-chinh)' }}>
                      Khung giờ rảnh cho: <span style={{ color: 'var(--mau-chu-dao)' }}>{ngayDangChon.fullLabel}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => chonTatCaNgay(ngayDangChon.dateStr)}
                        style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: 'var(--bo-vua)', background: '#e8f5e9', border: '1px solid #81c784', color: '#2e7d32', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Chọn tất cả giờ ngày này
                      </button>
                      <button
                        type="button"
                        onClick={() => boChonTatCaNgay(ngayDangChon.dateStr)}
                        style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: 'var(--bo-vua)', background: '#ffebee', border: '1px solid #e57373', color: '#c62828', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Bỏ chọn tất cả ngày này
                      </button>
                      <button
                        type="button"
                        onClick={apDungChoTatCaCacNgay}
                        style={{ padding: '7px 12px', fontSize: '0.8rem', borderRadius: 'var(--bo-vua)', background: '#e3f2fd', border: '1px solid #64b5f6', color: '#1565c0', cursor: 'pointer', fontWeight: '600' }}
                      >
                        Áp dụng cho mọi thứ trong tuần
                      </button>
                    </div>
                  </div>

                  {/* CHU THICH MAU */}
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '16px', fontSize: '0.875rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#4caf50' }} />
                      <span><strong>Màu xanh</strong>: Rảnh (Sinh viên được đặt)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#bdbdbd' }} />
                      <span><strong>Màu xám</strong>: Bận (Không nhận hẹn)</span>
                    </div>
                  </div>

                  {/* BANG 12 KHUNG GIO 1 TIENG CHUAN FIX ORDER & NEN TRANG 100% */}
                  {(() => {
                    const slotsCurrentDay = slotForm[ngayDangChon.dateStr] || new Set();
                    return (
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                          gap: '20px',
                          background: '#ffffff',
                          padding: '20px',
                          borderRadius: 'var(--bo-vua)',
                          border: '1px solid var(--vien-nhap)',
                          width: '100%',
                          boxSizing: 'border-box',
                        }}
                      >
                        {/* BUOI SANG */}
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px', color: 'var(--chu-chinh)' }}>
                            Buổi sáng
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {KHUNG_GIO_1H_SANG.map((slot) => {
                              const keySlot = `${slot.gioBatDau}-${slot.gioKetThuc}`;
                              const isRanh = slotsCurrentDay.has(keySlot);
                              return (
                                <div
                                  key={keySlot}
                                  onClick={() => toggleSlot(ngayDangChon.dateStr, keySlot)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: isRanh ? '#f1f8e9' : '#ffffff',
                                    border: isRanh ? '2px solid #2e7d32' : '1px solid var(--vien-nhap)',
                                    borderRadius: 'var(--bo-vua)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: isRanh ? '700' : '500',
                                    color: isRanh ? '#1b5e20' : 'var(--chu-chinh)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <span>{slot.gioBatDau} - {slot.gioKetThuc}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                                      {isRanh ? 'RẢNH' : 'BẬN'}
                                    </span>
                                    <div
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: isRanh ? '#4caf50' : '#bdbdbd',
                                        flexShrink: 0,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* BUOI CHIEU */}
                        <div>
                          <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '14px', color: 'var(--chu-chinh)' }}>
                            Buổi chiều
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {KHUNG_GIO_1H_CHIEU.map((slot) => {
                              const keySlot = `${slot.gioBatDau}-${slot.gioKetThuc}`;
                              const isRanh = slotsCurrentDay.has(keySlot);
                              return (
                                <div
                                  key={keySlot}
                                  onClick={() => toggleSlot(ngayDangChon.dateStr, keySlot)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '10px 14px',
                                    background: isRanh ? '#f1f8e9' : '#ffffff',
                                    border: isRanh ? '2px solid #2e7d32' : '1px solid var(--vien-nhap)',
                                    borderRadius: 'var(--bo-vua)',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    fontWeight: isRanh ? '700' : '500',
                                    color: isRanh ? '#1b5e20' : 'var(--chu-chinh)',
                                    transition: 'all 0.15s ease',
                                  }}
                                >
                                  <span>{slot.gioBatDau} - {slot.gioKetThuc}</span>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>
                                      {isRanh ? 'RẢNH' : 'BẬN'}
                                    </span>
                                    <div
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        background: isRanh ? '#4caf50' : '#bdbdbd',
                                        flexShrink: 0,
                                      }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <button
                    type="button"
                    className={styles.nut_luu}
                    style={{ marginTop: '24px', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                    onClick={xuLyLuuKhungGio}
                    disabled={dangLuuKhungGio}
                  >
                    {dangLuuKhungGio ? 'Đang lưu...' : 'Lưu khung giờ rảnh'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        )}

        {/* TAB 2: DANH SACH LICH HEN TU SINH VIEN */}
        {tabActive === 'lich_hen' && (
        <div style={{ width: '100%', boxSizing: 'border-box' }}>

          {danhSachLich.length === 0 ? (
            <div className={styles.the_form} style={{ textAlign: 'center', color: 'var(--chu-phu)', background: '#ffffff', padding: '24px' }}>
              Hiện chưa có lịch hẹn nào từ sinh viên.
            </div>
          ) : (
            <div className={styles.danh_sach_the_bai}>
              {danhSachLich.map((lh) => (
                <div key={lh.id} className={styles.the_quan_ly} style={{ background: '#ffffff' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '1.05rem' }}>
                        Sinh viên: {lh.sinh_vien?.ho_ten} {lh.trang_thai === 'da_xac_nhan' ? `(SĐT: ${lh.sinh_vien?.so_dien_thoai})` : ''}
                      </strong>
                      <Badge trangThai={lh.trang_thai} loai="lich_hen" />
                    </div>

                    {lh.trang_thai === 'cho_xac_nhan' && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--chu-phu)', fontStyle: 'italic', marginBottom: '6px' }}>
                        * Số điện thoại sinh viên sẽ hiển thị ở đây sau khi bạn bấm nút Xác nhận lịch.
                      </div>
                    )}

                    <div style={{ fontSize: '0.9rem', color: 'var(--chu-chinh)', marginBottom: '4px' }}>
                      Phòng trọ: {dinhDangDuong(lh.bai_dang?.duong)}, {dinhDangPhuong(lh.bai_dang?.phuong)} ({lh.bai_dang?.tien_thue})
                    </div>

                    <div style={{ fontSize: '0.9rem', color: 'var(--mau-la)', fontWeight: '600' }}>
                      Thời gian hẹn: {new Date(lh.ngay_hen).toLocaleDateString('vi-VN')} từ {lh.gio_bat_dau.substring(0, 5)} đến {lh.gio_ket_thuc.substring(0, 5)}
                    </div>
                  </div>

                  <div className={styles.cac_nut_thao_tac}>
                    {lh.trang_thai === 'cho_xac_nhan' && (
                      <>
                        <button
                          className={`${styles.nut_chuyen_trang_thai} ${styles.nut_chuyen_con_trong}`}
                          onClick={() => xuLyXacNhan(lh.id, lh.sinh_vien_id)}
                        >
                          Xác nhận lịch
                        </button>
                        <button
                          className={styles.nut_xoa}
                          onClick={() => xuLyHuyLich(lh.id, lh.sinh_vien_id, 'Chủ trọ không rảnh khung giờ này')}
                        >
                          Từ chối
                        </button>
                      </>
                    )}

                    {lh.trang_thai === 'da_xac_nhan' && (
                      <button
                        className={styles.nut_xoa}
                        onClick={() => xuLyHuyLich(lh.id, lh.sinh_vien_id, 'Chủ trọ bận đột xuất')}
                      >
                        Hủy lịch này
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </LayoutTaiKhoan>
  );
}
