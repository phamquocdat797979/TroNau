'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { kiemTraSoDienThoai } from '@/lib/utils';
import type { VaiTro } from '@/types';
import styles from '../auth.module.css';

export default function DangKyPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();

  const [role, setRole] = useState<VaiTro>('sinh_vien');
  const [hoTen, setHoTen] = useState('');
  const [soDienThoai, setSoDienThoai] = useState('');
  const [email, setEmail] = useState('');
  const [matKhau, setMatKhau] = useState('');
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [hienXacNhanMatKhau, setHienXacNhanMatKhau] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function xuLyDangKy(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);

    const sdtChuan = soDienThoai.trim();
    if (!kiemTraSoDienThoai(sdtChuan)) {
      setLoi('Số điện thoại không hợp lệ (phải gồm 10 chữ số, bắt đầu từ 03, 05, 07, 08, 09)');
      return;
    }

    if (matKhau.length < 6) {
      setLoi('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    if (matKhau !== xacNhanMatKhau) {
      setLoi('Xác nhận mật khẩu không khớp');
      return;
    }

    setDangXuLy(true);

    try {
      const res = await fetch('/api/auth/dang-ky', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role,
          hoTen,
          soDienThoai: sdtChuan,
          email,
          matKhau,
        }),
      });

      const data = await res.json();

      if (!res.ok || data.loi) {
        setLoi(data.loi || 'Đã có lỗi xảy ra khi đăng ký');
        setDangXuLy(false);
        return;
      }

      router.push('/dang-nhap?thongbao=dang_ky_thanh_cong');
    } catch (err: any) {
      setLoi(err.message || 'Đã có lỗi xảy ra khi đăng ký');
    } finally {
      setDangXuLy(false);
    }
  }

  return (
    <div className={styles.khung_auth}>
      <div className={styles.the_auth}>
        <h1 className={styles.tieu_de}>Tạo tài khoản Trọ Nẫu</h1>
        <p className={styles.mo_ta}>Đăng ký ngay để tìm hoặc đăng tin phòng trọ</p>

        {loi && <div className={styles.thong_bao_loi}>{loi}</div>}

        <form onSubmit={xuLyDangKy}>
          <div className={styles.form_group}>
            <label htmlFor="role">Bạn là? <span>*</span></label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as VaiTro)}
            >
              <option value="sinh_vien">Sinh viên</option>
              <option value="chu_tro">Chủ trọ</option>
            </select>
          </div>

          <div className={styles.form_group}>
            <label htmlFor="hoTen">Họ và tên <span>*</span></label>
            <input
              id="hoTen"
              type="text"
              required
              value={hoTen}
              onChange={(e) => setHoTen(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label htmlFor="soDienThoai">Số điện thoại <span>*</span></label>
            <input
              id="soDienThoai"
              type="tel"
              required
              value={soDienThoai}
              onChange={(e) => setSoDienThoai(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label htmlFor="matKhau">Mật khẩu <span>*</span></label>
            <div className={styles.khung_nhap_mat_khau}>
              <input
                id="matKhau"
                type={hienMatKhau ? 'text' : 'password'}
                required
                value={matKhau}
                onChange={(e) => setMatKhau(e.target.value)}
              />
              <button
                type="button"
                className={styles.nut_an_hien_mat_khau}
                onClick={() => setHienMatKhau(!hienMatKhau)}
                title={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={hienMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {hienMatKhau ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className={styles.form_group}>
            <label htmlFor="xacNhanMatKhau">Nhập lại mật khẩu <span>*</span></label>
            <div className={styles.khung_nhap_mat_khau}>
              <input
                id="xacNhanMatKhau"
                type={hienXacNhanMatKhau ? 'text' : 'password'}
                required
                value={xacNhanMatKhau}
                onChange={(e) => setXacNhanMatKhau(e.target.value)}
              />
              <button
                type="button"
                className={styles.nut_an_hien_mat_khau}
                onClick={() => setHienXacNhanMatKhau(!hienXacNhanMatKhau)}
                title={hienXacNhanMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                aria-label={hienXacNhanMatKhau ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {hienXacNhanMatKhau ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.nut_xac_nhan}
            disabled={dangXuLy}
          >
            {dangXuLy ? 'Đang đăng ký...' : 'Đăng ký'}
          </button>
        </form>

        <div className={styles.chuyen_trang}>
          Đã có tài khoản? <Link href="/dang-nhap">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
