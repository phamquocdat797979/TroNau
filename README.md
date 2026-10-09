# Trọ Nẫu (TroNau.vn) - Web App Tìm Kiếm Phòng Trọ Tại Quy Nhơn

Nền tảng kết nối trực tiếp giữa **Sinh viên tìm trọ** và **Chủ trọ cho thuê** tại Thành phố Quy Nhơn, Bình Định.

---

## Hướng Dẫn Khởi Chạy Local (Development)

1. **Cài đặt phụ thuộc**:
   ```bash
   npm install
   ```

2. **Chạy server phát triển (Cổng 3001)**:
   ```bash
   npm run dev
   ```

3. **Truy cập ứng dụng**:
   Mở trình duyệt và truy cập địa chỉ: [http://localhost:3001](http://localhost:3001)

---

## Công Nghệ Sử Dụng

- **Frontend**: Next.js 14 (App Router), TypeScript (Strict Mode), Vanilla CSS Modules.
- **Backend & CSDL**: Supabase Cloud (PostgreSQL, RLS Security, Auth, Storage, Realtime).
- **Email Service**: Gmail SMTP (Nodemailer).
- **Cron Jobs**: Vercel Cron (`02:00 ICT` hàng ngày).

---

## Tính Năng Nổi Bật

- **Bảo vệ thông tin cá nhân**: Số nhà và Số điện thoại chủ trọ/sinh viên được bảo mật tuyệt đối, chỉ hiển thị khi Lịch hẹn đạt trạng thái `Đã xác nhận`.
- **Phân quyền 3 đối tượng**: Sinh viên, Chủ trọ và Quản trị viên (Admin).
- **Đặt lịch trực tuyến**: Lưới đặt lịch rảnh theo khung giờ 1h trực quan.
- **Không biểu tượng / Emoji**: Giao diện tiếng Việt chuẩn có dấu 100%, phong cách hiện đại dọn dẹp tối đa.

---

## Tài Liệu Chi Tiết

Xem tài liệu quy chuẩn chính thức của dự án tại: [TAI_LIEU.md](file:///c:/Users/MY%20PC/Downloads/TroNau/TAI_LIEU.md)

