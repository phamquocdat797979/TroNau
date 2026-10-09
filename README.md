<p align="center">
  <img src="public/logo.png" alt="Logo Trọ Nẫu" width="220" />
</p>

<h1 align="center">TRỌ NẪU</h1>

<p align="center">
  <b>Nền tảng kết nối trực tiếp giữa Sinh viên tìm trọ và Chủ trọ cho thuê tại TP. Quy Nhơn, Bình Định</b>
</p>

<p align="center">
  <a href="https://tro-nau.vercel.app"><b>Trải nghiệm Trực tuyến (Live App)</b></a> | 
  <a href="https://github.com/phamquocdat797979/TroNau"><b>Kho mã nguồn GitHub</b></a>
</p>

## 1. TỔNG QUAN DỰ ÁN

**Trọ Nẫu** là ứng dụng Web App hiện đại được phát triển dành riêng cho cộng đồng sinh viên và chủ trọ tại Thành phố Quy Nhơn, tỉnh Bình Định. Hệ thống giúp sinh viên tìm kiếm phòng trọ chất lượng, đặt lịch hẹn xem phòng trực tuyến nhanh chóng, đồng thời hỗ trợ chủ trọ quản lý tin đăng và lịch hẹn hiệu quả.

## 2. TÍNH NĂNG TRỌNG TÂM & ĐIỂM NỔI BẬT

- **Bảo vệ Thông tin Cá nhân**: Số nhà và Số điện thoại của Chủ trọ được bảo mật tuyệt đối trên giao diện công khai và lịch hẹn chưa duyệt. Thông tin chỉ hiển thị cho Sinh viên khi lịch hẹn xem phòng chuyển sang trạng thái **Đã xác nhận**.
- **Phân quyền 3 Đối tượng Người dùng**:
  - **Sinh viên**: Tìm kiếm phòng trọ, lọc thông minh, bình luận và đặt lịch hẹn xem phòng theo slot giờ rảnh.
  - **Chủ trọ**: Đăng bài cho thuê (tối đa 4 ảnh), chỉnh sửa tin đăng, quản lý khung giờ rảnh và duyệt/từ chối lịch hẹn.
  - **Quản trị viên (Admin)**: Bảng điều khiển 5 Tab quản lý toàn bộ hệ thống, duyệt bài đăng, cấu hình Banner, Logo, Danh sách Đường/Phường và kiểm duyệt bình luận.
- **Bộ lọc Thông minh (Single Source of Truth)**: Lọc bài đăng nhanh chóng theo Phường/Xã (5 Phường), Tuyến đường (21 Tuyến đường Quy Nhơn) và Trạng thái phòng (`Còn trống` / `Đã cho thuê`).
- **Đặt lịch Trực tuyến mượt mà**: Lưới chọn khung giờ rảnh 1 tiếng (07:00 - 19:00) trực quan với bảng màu phản hồi trạng thái rõ ràng (Màu xanh: Rảnh, Màu xám: Bận, Màu đỏ: Đã có người đặt).
- **Tự động hóa Hệ thống**: Tự động dọn dẹp lịch hẹn quá hạn qua Vercel Cron Job chạy hàng ngày vào 02:00 ICT, gửi email xác minh và khôi phục mật khẩu bảo mật qua Gmail SMTP (Nodemailer).

## 3. CÔNG NGHỆ & HẠ TẦNG KỸ THUẬT

| Thành phần | Công nghệ sử dụng | Ghi chú & Đặc điểm |
|---|---|---|
| **Frontend** | Next.js 14 (App Router), TypeScript, Vanilla CSS Modules | Chuẩn Strict Mode, tối ưu hóa SEO và trải nghiệm người dùng |
| **Backend & CSDL** | Supabase Cloud (PostgreSQL, Row Level Security - RLS) | 9 Bảng CSDL, Stored Procedures (RPC), Triggers tự động |
| **Xác thực (Auth)** | Supabase Auth | Hỗ trợ Đăng ký/Đăng nhập linh hoạt bằng Email hoặc SĐT |
| **Lưu trữ (Storage)** | Supabase Storage | Bucket `anh-phong-tro` & `banner` lưu trữ hình ảnh chất lượng cao |
| **Dịch vụ Email** | Nodemailer (Gmail SMTP) | Gửi email HTML khôi phục mật khẩu bảo mật với `token_hash` |
| **Cron Job** | Vercel Cron Jobs | Chạy tự động lúc 02:00 ICT hàng ngày dọn dẹp lịch hẹn quá hạn |
| **Phông chữ** | Be Vietnam Pro (Google Fonts) | Phông chữ tiếng Việt hiện đại, sắc nét trên mọi thiết bị |

## 4. HƯỚNG DẪN KHỞI CHẠY CỤC BỘ (LOCAL DEVELOPMENT)

### Yêu cầu môi trường:
- Node.js version `18.x` hoặc trở lên
- Trình quản lý gói `npm`

### Các bước thực hiện:

1. **Tải mã nguồn dự án**:
   ```bash
   git clone https://github.com/phamquocdat797979/TroNau.git
   cd TroNau
   ```

2. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```

3. **Cấu hình Biến môi trường**:
   Tạo tệp `.env.local` tại thư mục gốc của dự án và điền các tham số:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://ebmcgicdkhwxkmyltoln.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   CRON_SECRET=your_cron_secret_key
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```

4. **Khởi chạy ứng dụng tại Cổng 3001**:
   ```bash
   npm run dev
   ```

5. **Truy cập ứng dụng**:
   Mở trình duyệt và truy cập: [http://localhost:3001](http://localhost:3001)

## 5. THÔNG TIN TRIỂN KHAI (PRODUCTION DEPLOYMENT)

- **Trang Web Chính Thức**: [https://tro-nau.vercel.app](https://tro-nau.vercel.app)
- **Nền Tảng Triển Khai**: Vercel Cloud Platform
- **Trạng Thái Vận Hành**: Hoạt động 24/7 ổn định, tự động biên dịch từ nhánh `main`.

<p align="center">
  <b>Trọ Nẫu - Giải pháp tìm trọ an tâm & tiện lợi tại Quy Nhơn</b><br>
  <i>Copyright © 2026 Trọ Nẫu. Bảo lưu mọi quyền.</i>
</p>
