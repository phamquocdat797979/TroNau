"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { taoSupabaseClient } from "@/lib/supabase/client";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import styles from "../auth.module.css";

export default function DatLaiMatKhauPage() {
  const router = useRouter();
  const supabase = taoSupabaseClient();

  const [matKhauMoi, setMatKhauMoi] = useState("");
  const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
  const [hienMatKhauMoi, setHienMatKhauMoi] = useState(false);
  const [hienXacNhan, setHienXacNhan] = useState(false);
  const [dangXuLy, setDangXuLy] = useState(false);
  const [thanhCong, setThanhCong] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);
  const [dangKiemTraToken, setDangKiemTraToken] = useState(true);
  const [tokenHopLe, setTokenHopLe] = useState(false);

  useEffect(() => {
    let unmounted = false;

    async function kiemTraToken() {
      // 1. Kiem tra query parameter ?token_hash=... (Tranh bi Gmail bot scan email huy token)
      const searchParams = new URLSearchParams(window.location.search);
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "recovery" | null;

      if (tokenHash) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type || "recovery",
        });

        if (!unmounted) {
          if (!error) {
            setTokenHopLe(true);
            setDangKiemTraToken(false);
            return;
          } else {
            console.error("Lỗi verifyOtp token_hash:", error.message);
            setLoi(error.message);
            setTokenHopLe(false);
            setDangKiemTraToken(false);
            return;
          }
        }
      }

      // 2. Kiem tra URL hash neu co loi
      const hash = window.location.hash;
      if (hash && hash.includes("error_code=otp_expired")) {
        if (!unmounted) {
          setTokenHopLe(false);
          setDangKiemTraToken(false);
        }
        return;
      }

      // 3. Lang nghe su kien auth state change neu dung hash access_token
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (!unmounted) {
          if (event === "PASSWORD_RECOVERY" || (session && event === "SIGNED_IN")) {
            setTokenHopLe(true);
            setDangKiemTraToken(false);
          }
        }
      });

      // 4. Timeout fallback kiem tra session
      const timeout = setTimeout(async () => {
        if (!unmounted) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setTokenHopLe(true);
          }
          setDangKiemTraToken(false);
        }
      }, 2000);
    }

    kiemTraToken();

    return () => {
      unmounted = true;
    };
  }, []);

  async function xuLyDatLaiMatKhau(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);

    if (matKhauMoi.length < 6) {
      setLoi("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (matKhauMoi !== xacNhanMatKhau) {
      setLoi("Mật khẩu xác nhận không khớp");
      return;
    }

    setDangXuLy(true);

    try {
      const { error } = await supabase.auth.updateUser({ password: matKhauMoi });

      if (error) {
        setLoi("Không thể đặt lại mật khẩu: " + error.message);
        return;
      }

      setThanhCong(true);

      // Chuyen ve trang dang nhap sau 3 giay
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 3000);
    } catch (err: any) {
      setLoi(err.message || "Đã có lỗi xảy ra");
    } finally {
      setDangXuLy(false);
    }
  }

  if (dangKiemTraToken) {
    return (
      <div className={styles.khung_auth}>
        <div className={styles.the_auth} style={{ textAlign: "center" }}>
          <p style={{ color: "var(--chu-phu)" }}>Đang xác thực link...</p>
        </div>
      </div>
    );
  }

  if (!tokenHopLe) {
    return (
      <div className={styles.khung_auth}>
        <div className={styles.the_auth}>
          <h1 className={styles.tieu_de}>Link không hợp lệ</h1>
          <p className={styles.mo_ta}>Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.</p>
          <div className={styles.thong_bao_loi}>
            Vui lòng gửi lại yêu cầu quên mật khẩu để nhận link mới.
          </div>
          <div className={styles.chuyen_trang} style={{ marginTop: "20px" }}>
            <a href="/quen-mat-khau" style={{ color: "var(--mau-la)", fontWeight: "600" }}>
              Gửi lại yêu cầu
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (thanhCong) {
    return (
      <div className={styles.khung_auth}>
        <div className={styles.the_auth}>
          <h1 className={styles.tieu_de}>Đặt lại thành công</h1>
          <div className={styles.thong_bao_thanh_cong}>
            Mật khẩu của bạn đã được đặt lại thành công. Bạn sẽ được chuyển về trang đăng nhập sau 3 giây...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.khung_auth}>
      <div className={styles.the_auth}>
        <h1 className={styles.tieu_de}>Đặt lại mật khẩu</h1>
        <p className={styles.mo_ta}>Nhập mật khẩu mới cho tài khoản của bạn</p>

        {loi && <div className={styles.thong_bao_loi}>{loi}</div>}

        <form onSubmit={xuLyDatLaiMatKhau}>
          <div className={styles.form_group}>
            <label htmlFor="matKhauMoi">Mật khẩu mới</label>
            <div className={styles.khung_nhap_mat_khau}>
              <input
                id="matKhauMoi"
                type={hienMatKhauMoi ? "text" : "password"}
                required
                minLength={6}
                placeholder="Ít nhất 6 ký tự"
                value={matKhauMoi}
                onChange={(e) => setMatKhauMoi(e.target.value)}
              />
              <button
                type="button"
                className={styles.nut_an_hien_mat_khau}
                onClick={() => setHienMatKhauMoi(!hienMatKhauMoi)}
                title={hienMatKhauMoi ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-label={hienMatKhauMoi ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {hienMatKhauMoi ? (
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
            <label htmlFor="xacNhanMatKhau">Xác nhận mật khẩu mới</label>
            <div className={styles.khung_nhap_mat_khau}>
              <input
                id="xacNhanMatKhau"
                type={hienXacNhan ? "text" : "password"}
                required
                placeholder="Nhập lại mật khẩu mới"
                value={xacNhanMatKhau}
                onChange={(e) => setXacNhanMatKhau(e.target.value)}
              />
              <button
                type="button"
                className={styles.nut_an_hien_mat_khau}
                onClick={() => setHienXacNhan(!hienXacNhan)}
                title={hienXacNhan ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                aria-label={hienXacNhan ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              >
                {hienXacNhan ? (
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
            {dangXuLy ? "Đang đặt lại..." : "Xác nhận đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
