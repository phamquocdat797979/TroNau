"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "../auth.module.css";

export default function QuenMatKhauPage() {
  const [taiKhoan, setTaiKhoan] = useState("");
  const [dangXuLy, setDangXuLy] = useState(false);
  const [thanhCong, setThanhCong] = useState(false);
  const [loi, setLoi] = useState<string | null>(null);

  async function xuLyGuiYeuCau(e: React.FormEvent) {
    e.preventDefault();
    setLoi(null);
    setDangXuLy(true);

    try {
      const res = await fetch("/api/auth/quen-mat-khau", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taiKhoan }),
      });

      const data = await res.json();

      if (!res.ok && data.loi === "khong_co_email") {
        setLoi(
          "Tài khoản này chưa liên kết email thực. Vui lòng cập nhật email trong phần Tài khoản sau khi đăng nhập, hoặc liên hệ admin để được hỗ trợ."
        );
        setDangXuLy(false);
        return;
      }

      // Luon hien thanh cong (kể cả khi khong tim thay - tranh lo thong tin)
      setThanhCong(true);
    } catch (err: any) {
      setLoi(err.message || "Đã có lỗi xảy ra, vui lòng thử lại");
    } finally {
      setDangXuLy(false);
    }
  }

  if (thanhCong) {
    return (
      <div className={styles.khung_auth}>
        <div className={styles.the_auth}>
          <h1 className={styles.tieu_de}>Kiểm tra hộp thư</h1>
          <p className={styles.mo_ta}>
            Nếu tài khoản của bạn tồn tại và có liên kết email thực, chúng tôi đã gửi link đặt lại mật khẩu đến email đó.
          </p>
          <div className={styles.thong_bao_thanh_cong}>
            Vui lòng kiểm tra hộp thư (kể cả thư mục Spam) và click vào link trong email để tiếp tục.
          </div>
          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "0.875rem", color: "var(--chu-phu)" }}>
            Link có hiệu lực trong <strong>1 giờ</strong>.
          </p>
          <div className={styles.chuyen_trang}>
            <Link href="/dang-nhap">Quay lại đăng nhập</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.khung_auth}>
      <div className={styles.the_auth}>
        <h1 className={styles.tieu_de}>Quên mật khẩu</h1>
        <p className={styles.mo_ta}>
          Nhập số điện thoại hoặc email đăng ký tài khoản. Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn.
        </p>

        {loi && <div className={styles.thong_bao_loi}>{loi}</div>}

        <form onSubmit={xuLyGuiYeuCau}>
          <div className={styles.form_group}>
            <label htmlFor="taiKhoan">Email hoặc Số điện thoại</label>
            <input
              id="taiKhoan"
              type="text"
              required
              placeholder="VD: 0901234567 hoặc abc@gmail.com"
              value={taiKhoan}
              onChange={(e) => setTaiKhoan(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={styles.nut_xac_nhan}
            disabled={dangXuLy}
          >
            {dangXuLy ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
          </button>
        </form>

        <div className={styles.chuyen_trang}>
          Nhớ mật khẩu rồi? <Link href="/dang-nhap">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
