'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { taoSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import styles from './NavNgang.module.css';

interface NavNgangProps {
  profile?: Profile | null;
}

export default function NavNgang({ profile: profileProp }: NavNgangProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = taoSupabaseClient();

  const { profile: authProfile, soChuaDoc } = useAuth();
  const profile = profileProp || authProfile;

  async function dangXuat() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (!profile) return null;

  const role = profile.role;

  const menuItems = [
    ...(role === 'chu_tro'
      ? [
          { label: 'Quản lý tin đăng', href: '/chu-tro/quan-ly-bai' },
          { label: 'Đăng tin phòng mới', href: '/chu-tro/dang-bai' },
          { label: 'Lịch hẹn xem phòng', href: '/chu-tro/lich-hen' },
          { label: 'Thông báo', href: '/chu-tro/thong-bao', badge: soChuaDoc },
          { label: 'Tài khoản', href: '/tai-khoan' },
        ]
      : []),
    ...(role === 'sinh_vien'
      ? [
          { label: 'Lịch hẹn xem phòng', href: '/sinh-vien/lich-hen' },
          { label: 'Thông báo', href: '/sinh-vien/thong-bao', badge: soChuaDoc },
          { label: 'Tài khoản', href: '/tai-khoan' },
        ]
      : []),
    ...(role === 'admin'
      ? [
          { label: 'Bảng điều khiển', href: '/admin/dashboard' },
          { label: 'Thông báo', href: '/admin/thong-bao', badge: soChuaDoc },
          { label: 'Tài khoản', href: '/tai-khoan' },
        ]
      : []),
  ];

  return (
    <div className={styles.thanh_nav_ngang}>
      <div className="container">
        <div className={styles.noi_dung_nav}>
          <nav className={styles.danh_sach_menu}>
            {menuItems.map((item) => {
              const isKichHoat = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.muc_menu} ${isKichHoat ? styles.muc_menu_kich_hoat : ''}`}
                >
                  {item.label}
                  {!!item.badge && item.badge > 0 && (
                    <span className={styles.huy_so}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button onClick={dangXuat} className={styles.nut_dang_xuat}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
