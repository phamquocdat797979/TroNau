'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCaiDat } from '@/context/CaiDatContext';
import type { Banner } from '@/types';
import styles from './BannerCarousel.module.css';

interface Props {
  banners: Banner[];
}

const DEFAULT_BANNERS: Banner[] = [
  {
    id: 'banner-mac-dinh-1',
    url_anh: '/banner-1.jpg',
    thu_tu: 1,
    tieu_de: 'Trọ Nẫu',
    mo_ta: 'Nền tảng tìm kiếm phòng trọ uy tín, nhanh chóng & tiện lợi dành cho Sinh viên và Chủ trọ.',
    the_tags: 'Phòng trọ chính chủ, Đặt lịch trực tuyến, Gần các trường ĐH & CĐ Quy Nhơn',
    lien_ket: '/',
    updated_at: new Date().toISOString(),
  },
];

export default function BannerCarousel({ banners }: Props) {
  const [viTri, setViTri] = useState(0);
  const { caiDat } = useCaiDat();

  const danhSachHienThi = banners.length > 0 ? banners : DEFAULT_BANNERS;

  useEffect(() => {
    if (danhSachHienThi.length <= 1) return;
    const interval = setInterval(() => {
      setViTri((prev) => (prev + 1) % danhSachHienThi.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [danhSachHienThi.length]);

  return (
    <div className={styles.khung_banner}>
      {danhSachHienThi.map((b, idx) => {
        const tieuDeBanner = b.tieu_de || (idx === 0 ? `${caiDat.ten_app} - ${caiDat.sub_name}` : '');
        const moTaBanner = b.mo_ta || (idx === 0 ? caiDat.footer_mo_ta : '');
        const tagsStr = b.the_tags || (idx === 0 ? 'Phòng trọ chính chủ, Đặt lịch trực tuyến, Gần các trường ĐH & CĐ Quy Nhơn' : '');
        const danhSachTags = tagsStr ? tagsStr.split(',').map((t) => t.trim()).filter(Boolean) : [];

        const Content = (
          <div
            key={b.id}
            className={`${styles.slide} ${idx === viTri ? styles.slide_tich_cuc : ''}`}
          >
            <Image
              src={b.url_anh}
              alt={`Banner ${idx + 1}`}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              priority={idx === 0}
              className={styles.anh_banner}
              unoptimized
            />
            {(tieuDeBanner || moTaBanner || danhSachTags.length > 0) && (
              <div className={styles.overlay_gioi_thieu}>
                <div className={styles.noi_dung_gioi_thieu}>
                  <div className={styles.khung_logo_banner}>
                    <Image
                      src={caiDat.logo_url || '/logo.png'}
                      alt="Logo"
                      width={60}
                      height={60}
                      className={styles.logo_banner_img}
                      unoptimized
                    />
                  </div>
                  <div className={styles.phan_chu_banner}>
                    {tieuDeBanner && (
                      <h1 className={styles.tieu_de_banner}>
                        {tieuDeBanner}
                      </h1>
                    )}
                    {moTaBanner && (
                      <p className={styles.mo_ta_banner}>
                        {moTaBanner}
                      </p>
                    )}
                    {danhSachTags.length > 0 && (
                      <div className={styles.danh_sach_the_banner}>
                        {danhSachTags.map((tag, tIdx) => (
                          <span key={tIdx} className={styles.the_giao_dien}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

        return b.lien_ket ? (
          <Link key={b.id} href={b.lien_ket}>
            {Content}
          </Link>
        ) : (
          Content
        );
      })}

      {danhSachHienThi.length > 1 && (
        <>
          <button
            className={`${styles.nut_chuyen} ${styles.nut_trai}`}
            onClick={() => setViTri((prev) => (prev - 1 + danhSachHienThi.length) % danhSachHienThi.length)}
          >
            ‹
          </button>
          <button
            className={`${styles.nut_chuyen} ${styles.nut_phai}`}
            onClick={() => setViTri((prev) => (prev + 1) % danhSachHienThi.length)}
          >
            ›
          </button>

          <div className={styles.cham_chuyen}>
            {danhSachHienThi.map((_, idx) => (
              <button
                key={idx}
                className={`${styles.cham} ${idx === viTri ? styles.cham_tich_cuc : ''}`}
                onClick={() => setViTri(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}


