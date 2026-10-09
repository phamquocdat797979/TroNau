'use client';

import { useEffect, useState, useCallback } from 'react';
import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import BannerCarousel from '@/components/Banner/BannerCarousel';
import ThanhTimKiem from '@/components/BaiDang/ThanhTimKiem';
import TheBaiDang from '@/components/BaiDang/TheBaiDang';
import ToastContainer from '@/components/Toast/Toast';
import { taoSupabaseClient } from '@/lib/supabase/client';
import type { BaiDangCard, Banner, BoLocPhong } from '@/types';
import styles from './page.module.css';

export default function TrangChu() {
  const supabase = taoSupabaseClient();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [danhSachPhong, setDanhSachPhong] = useState<BaiDangCard[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [boLoc, setBoLoc] = useState<BoLocPhong>({});
  const [trangHienTai, setTrangHienTai] = useState(1);
  const [tongSoTrang, setTongSoTrang] = useState(1);

  const SO_BAI_DANG_PER_PAGE = 12;

  // Lay danh sach banner
  useEffect(() => {
    async function layBanner() {
      const { data } = await supabase
        .from('banner')
        .select('*')
        .order('thu_tu', { ascending: true });
      if (data) setBanners(data as Banner[]);
    }
    layBanner();
  }, []);

  // Lay danh sach bai dang hop le (con_trong hoac da_cho_thue)
  const layDanhSachBaiDang = useCallback(async () => {
    setDangTai(true);
    try {
      let query = supabase
        .from('bai_dang')
        .select(
          `
          id,
          trang_thai,
          duong,
          phuong,
          tien_thue,
          gia_thue_so,
          tien_nuoc,
          tien_dien,
          phi_khac,
          ghi_chu,
          ngay_trong_du_kien,
          created_at,
          updated_at,
          chu_tro:profiles!bai_dang_chu_tro_id_fkey(ho_ten, so_dien_thoai),
          hinh_anh:hinh_anh_bai_dang(url, thu_tu),
          lich_co_the_dat(*),
          lich_hen(ngay_hen, gio_bat_dau, gio_ket_thuc, trang_thai)
        `,
          { count: 'exact' }
        )
        .in('trang_thai', ['con_trong', 'da_cho_thue']);

      // Ap dung bo loc
      if (boLoc.phuong) {
        const phuongTen = boLoc.phuong.split(' (')[0].trim();
        query = query.ilike('phuong', `%${phuongTen}%`);
      }
      if (boLoc.duong) {
        const duongTen = boLoc.duong.split(' (')[0].trim();
        query = query.ilike('duong', `%${duongTen}%`);
      }
      if (boLoc.gia_tu !== undefined) {
        query = query.gte('gia_thue_so', boLoc.gia_tu);
      }
      if (boLoc.gia_den !== undefined) {
        query = query.lte('gia_thue_so', boLoc.gia_den);
      }

      // Ap dung bo loc trang thai (mac dinh lay ca con_trong va da_cho_thue)
      if (boLoc.trang_thai === 'con_trong') {
        query = query.eq('trang_thai', 'con_trong');
      } else if (boLoc.trang_thai === 'da_cho_thue') {
        query = query.eq('trang_thai', 'da_cho_thue');
      }

      // Sắp xếp: còn trống trước, mới duyệt nhất trước
      query = query
        .order('trang_thai', { ascending: true }) // 'con_trong' < 'da_cho_thue'
        .order('updated_at', { ascending: false })
        .order('created_at', { ascending: false });

      // Phân trang
      const from = (trangHienTai - 1) * SO_BAI_DANG_PER_PAGE;
      const to = from + SO_BAI_DANG_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count, error } = await query;

      if (error) {
        console.error('Lỗi lấy bài đăng:', error);
        setDanhSachPhong([]);
        return;
      }

      if (data) {
        const todayStr = new Date().toISOString().substring(0, 10);

        const formatData: BaiDangCard[] = data.map((item: any) => {
          const hinhAnhOrder1 = item.hinh_anh?.find((h: any) => h.thu_tu === 1) || item.hinh_anh?.[0];

          // Tinh xem bai dang co khung gio ranh mau xanh (chua bi dat) tu ngay hien tai tro ve sau hay khong
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
            id: item.id,
            trang_thai: item.trang_thai,
            duong: item.duong,
            phuong: item.phuong,
            tien_thue: item.tien_thue,
            gia_thue_so: item.gia_thue_so,
            tien_nuoc: item.tien_nuoc,
            tien_dien: item.tien_dien,
            phi_khac: item.phi_khac,
            ghi_chu: item.ghi_chu,
            ngay_trong_du_kien: item.ngay_trong_du_kien,
            created_at: item.created_at,
            updated_at: item.updated_at,
            anh_dai_dien: hinhAnhOrder1?.url || null,
            co_lich_hen: hasAvailableSlot,
            chu_tro: {
              ho_ten: item.chu_tro?.ho_ten || 'Chủ trọ',
              so_dien_thoai: item.chu_tro?.so_dien_thoai || null,
            },
          };
        });

        setDanhSachPhong(formatData);
        if (count) {
          setTongSoTrang(Math.ceil(count / SO_BAI_DANG_PER_PAGE));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDangTai(false);
    }
  }, [boLoc, trangHienTai]);

  useEffect(() => {
    layDanhSachBaiDang();
  }, [layDanhSachBaiDang]);

  function xuLyTimKiem(filters: BoLocPhong) {
    setBoLoc(filters);
    setTrangHienTai(1);
  }

  function xuLyDatLai() {
    setBoLoc({});
    setTrangHienTai(1);
  }

  return (
    <>
      <Header slot={
        <ThanhTimKiem onTimKiem={xuLyTimKiem} onDatLai={xuLyDatLai} />
      } />
      <ToastContainer />
      <main className={styles.trang_chu}>
        <div className="container">
          <BannerCarousel banners={banners} />

          <div className={styles.thanh_tieu_de}>
            <h2 className={styles.tieu_de_muc}>Phòng trọ dành cho bạn</h2>
            <span className={styles.badge_so_luong}>{danhSachPhong.length} phòng</span>
          </div>

          {dangTai ? (
            <div className={styles.khong_co_du_lieu}>Đang tải danh sách phòng trọ...</div>
          ) : danhSachPhong.length === 0 ? (
            <div className={styles.khong_co_du_lieu}>
              Không tìm thấy phòng trọ nào phù hợp với tìm kiếm của bạn.
            </div>
          ) : (
            <div className={styles.luoi_bai_dang}>
              {danhSachPhong.map((phong) => (
                <TheBaiDang key={phong.id} baiDang={phong} />
              ))}
            </div>
          )}

          {tongSoTrang > 1 && (
            <div className={styles.phan_trang}>
              <button
                className={styles.nut_trang}
                disabled={trangHienTai === 1}
                onClick={() => setTrangHienTai((p) => Math.max(p - 1, 1))}
              >
                ‹ Trang trước
              </button>
              <span className={styles.trang_hien_tai}>
                Trang {trangHienTai} / {tongSoTrang}
              </span>
              <button
                className={styles.nut_trang}
                disabled={trangHienTai === tongSoTrang}
                onClick={() => setTrangHienTai((p) => Math.min(p + 1, tongSoTrang))}
              >
                Trang sau ›
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
