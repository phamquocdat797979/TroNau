'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { kiemTraSoDienThoai } from '@/lib/utils';
import styles from '../auth.module.css';

export default function DangNhapPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();

  const [taiKhoan, setTaiKhoan] = useState(''); // email hoac sdt
  const [matKhau, setMatKhau] = useState('');
  const [hienMatKhau, setHienMatKhau] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function xuLyDangNhap(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangXuLy(true);

    try {
      const res = await fetch('/api/auth/dang-nhap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taiKhoan, matKhau }),
      });

      const data = await res.json();

      if (!res.ok || data.loi) {
        setLoi(data.loi || 'Thông tin đăng nhập hoặc mật khẩu không chính xác');
        setDangXuLy(false);
        return;
      }

      // Neu thanh cong -> Redirect theo role
      const mucTieu = data.role === 'admin' ? '/admin/dashboard' : '/';
      window.location.href = mucTieu;
    } catch (err: any) {
      setLoi(err.message || 'Đã có lỗi xảy ra');
      setDangXuLy(false);
    }
  }

  return (
    <div className={styles.khung_auth}>
      <div className={styles.the_auth}>
        <h1 className={styles.tieu_de}>Đăng nhập Trọ Nẫu</h1>
        <p className={styles.mo_ta}>Nhập thông tin tài khoản để tiếp tục</p>

        {loi && <div className={styles.thong_bao_loi}>{loi}</div>}

        <form onSubmit={xuLyDangNhap}>
          <div className={styles.form_group}>
            <label htmlFor="taiKhoan">Email hoặc Số điện thoại</label>
            <input
              id="taiKhoan"
              type="text"
              required
              value={taiKhoan}
              onChange={(e) => setTaiKhoan(e.target.value)}
            />
          </div>

          <div className={styles.form_group}>
            <label htmlFor="matKhau">Mật khẩu</label>
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
          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <Link href="/quen-mat-khau" className={styles.quen_mat_khau_link}>
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            className={styles.nut_xac_nhan}
            disabled={dangXuLy}
          >
            {dangXuLy ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>
        </form>

        <div className={styles.chuyen_trang}>
          Chưa có tài khoản? <Link href="/dang-ky">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
