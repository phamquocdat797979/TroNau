'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import { useCaiDat } from '@/context/CaiDatContext';
import styles from './Header.module.css';

interface HeaderProps {
  slot?: React.ReactNode;
}

export default function Header({ slot }: HeaderProps = {}) {
  const { profile } = useAuth();
  const { caiDat } = useCaiDat();

  function layDuongDanTrangChinh(): string {
    if (!profile) return '/';
    if (profile.role === 'chu_tro') return '/chu-tro/quan-ly-bai';
    if (profile.role === 'admin') return '/admin/dashboard';
    return '/sinh-vien/lich-hen';
  }

  function layTenVaiTro(role?: string): string {
    if (role === 'admin') return 'Quản trị viên';
    if (role === 'chu_tro') return 'Chủ trọ';
    return 'Sinh viên';
  }

  return (
    <header className={styles.header}>
      <div className={`container ${styles.noi_dung}`}>
        <Link href="/" className={styles.logo}>
          <div className={styles.khung_logo}>
            <Image
              src={caiDat.logo_url || '/logo.png'}
              alt={caiDat.ten_app || 'Logo'}
              width={38}
              height={38}
              className={styles.logo_anh}
              priority
              unoptimized
            />
          </div>
          <span className={styles.ten_logo}>
            {caiDat.ten_app}
            {caiDat.sub_name ? <span className={styles.ten_logo_phu}> {caiDat.sub_name}</span> : null}
          </span>
        </Link>

        <div className={styles.nhom_phai}>
          {profile ? (
            <Link href={layDuongDanTrangChinh()} className={styles.nut_tai_khoan}>
              <div className={styles.thong_tin_nguoi_dung}>
                <span className={styles.ten_nguoi_dung}>{profile.ho_ten}</span>
                <span className={styles.vai_tro_nguoi_dung}>{layTenVaiTro(profile.role)}</span>
              </div>
            </Link>
          ) : (
            <>
              <Link href="/dang-nhap" className={styles.nut_dang_nhap}>
                Đăng nhập
              </Link>
              <Link href="/dang-ky" className={styles.nut_dang_ky}>
                Đăng ký
              </Link>
            </>
          )}
        </div>
      </div>

      {slot && (
        <div className={styles.slot_tim_kiem}>
          <div className="container">
            {slot}
          </div>
        </div>
      )}
    </header>
  );
}
