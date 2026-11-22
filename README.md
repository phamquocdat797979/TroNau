<p align="center">
  <img src="public/logo.png" alt="Logo Trọ Nẫu" width="220" />
</p>

<h1 align="center">TRỌ NẪU</h1>

<p align="center">
  <b>Nền tảng kết nối trực tiếp giữa Sinh viên tìm trọ và Chủ trọ cho thuê tại TP. Quy Nhơn, Bình Định</b>
</p>

<p align="center">
  <a href="https://tro-nau.vercel.app"><b>Trải nghiệm Trực tuyến</b></a> | 
  <a href="https://github.com/phamquocdat797979/TroNau"><b>Kho mã nguồn GitHub</b></a>
</p>

---

## 1. TỔNG QUAN DỰ ÁN

**Trọ Nẫu** là ứng dụng web app hiện đại được phát triển dành riêng cho cộng đồng sinh viên và chủ trọ tại thành phố Quy Nhơn, tỉnh Bình Định. Hệ thống giúp sinh viên tìm kiếm phòng trọ chất lượng, đặt lịch hẹn xem phòng trực tuyến nhanh chóng, đồng thời hỗ trợ chủ trọ quản lý tin đăng và lịch hẹn hiệu quả.

---

## 2. TÍNH NĂNG TRỌNG TÂM VÀ ĐIỂM NỔI BẬT

- **Bảo vệ Thông tin Cá nhân**: Số nhà và số điện thoại của chủ trọ được bảo mật tuyệt đối trên giao diện công khai và trên lịch hẹn chưa duyệt. Thông tin chỉ hiển thị cho sinh viên khi lịch hẹn xem phòng chuyển sang trạng thái **Đã xác nhận**.
- **Phân quyền 3 Đối tượng Người dùng**:
  - **Sinh viên**: Tìm kiếm phòng trọ, lọc thông minh theo phường và tuyến đường, bình luận trao đổi và đặt lịch hẹn xem phòng theo các khung giờ rảnh của chủ trọ.
  - **Chủ trọ**: Đăng bài cho thuê phòng kèm 4 ảnh thực tế, chỉnh sửa tin đăng, quản lý các khung giờ rảnh trong tuần và duyệt hoặc từ chối lịch hẹn.
  - **Quản trị viên**: Bảng điều khiển quản lý toàn bộ hệ thống, kiểm duyệt tin đăng mới, cấu hình danh mục phường, tuyến đường và biểu ngữ trang chủ.
- **Bộ lọc Thông minh**: Lọc bài đăng nhanh chóng theo danh mục 5 phường Quy Nhơn, 21 tuyến đường tiêu biểu và trạng thái phòng (`Còn trống` hoặc `Đã cho thuê`).
- **Đặt lịch Trực tuyến mượt mà**: Lưới chọn khung giờ rảnh trực quan với màu sắc phân biệt rõ ràng (Màu xanh: Rảnh, Màu xám: Bận, Màu đỏ: Đã có người đặt). Hệ thống tích hợp khóa giao dịch cấp cơ sở dữ liệu ngăn chặn hoàn toàn việc đặt trùng giờ.
- **Tự động hóa Hệ thống**: Tự động dọn dẹp các lịch hẹn quá hạn qua tác vụ nền Vercel Cron Job chạy định kỳ vào lúc 02:00 sáng hàng ngày (giờ Việt Nam), hỗ trợ gửi thư điện tử đặt lại mật khẩu an toàn qua Gmail SMTP và Nodemailer.

---

## 3. CÔNG NGHỆ VÀ HẠ TẦNG KỸ THUẬT

| Thành phần | Công nghệ sử dụng | Ghi chú và Đặc điểm |
|---|---|---|
| **Giao diện người dùng** | Next.js 14 App Router, TypeScript, CSS Modules | Tối ưu hóa giao diện tương thích trên cả máy tính và điện thoại |
| **Cơ sở dữ liệu** | Supabase Cloud, PostgreSQL 15 | 9 bảng dữ liệu chuẩn hóa 3NF, bảo mật cấp hàng Row Level Security |
| **Xác thực người dùng** | Supabase Auth | Quản lý đăng ký, đăng nhập an toàn bằng số điện thoại hoặc email |
| **Lưu trữ tệp hình ảnh** | Supabase Storage | 2 kho lưu trữ tệp gồm `anh-phong-tro` và `banner` |
| **Dịch vụ thư điện tử** | Nodemailer kết nối Gmail SMTP | Gửi email khôi phục mật khẩu bảo mật |
| **Tác vụ tự động** | Vercel Cron Jobs | Tự động kích hoạt dọn dẹp lịch hẹn quá hạn vào 02:00 sáng hàng ngày |
| **Phông chữ** | Be Vietnam Pro của Google Fonts | Phông chữ tiếng Việt hiện đại, sắc nét |

---

## 4. HƯỚNG DẪN CÀI ĐẶT VÀ KHỞI CHẠY TRÊN MÁY CỤC BỘ

### Yêu cầu môi trường:
- Node.js phiên bản `18.x` hoặc `20.x` trở lên
- Trình quản lý gói `npm`
- Trình duyệt web: Google Chrome
- Một tài khoản hoặc dự án trên nền tảng Supabase

### Các bước thực hiện chi tiết:

1. **Tải mã nguồn dự án từ GitHub**:
   ```bash
   git clone https://github.com/phamquocdat797979/TroNau.git
   cd TroNau
   ```

2. **Cài đặt các gói thư viện phụ thuộc**:
   ```bash
   npm install
   ```

3. **Khởi tạo cơ sở dữ liệu trên Supabase từ tệp `supabase/schema.sql`**:
   - Đăng nhập vào trang quản trị Supabase Dashboard, tạo một dự án mới (hoặc chọn dự án hiện có).
   - Tại thanh điều hướng bên trái, bấm vào mục **SQL Editor**, sau đó chọn **New query**.
   - Mở tệp `supabase/schema.sql` trong mã nguồn vừa tải về máy, sao chép toàn bộ nội dung và dán vào khung soạn thảo SQL Editor trên Supabase.
   - Bấm nút **Run** để thực thi. Thao tác này sẽ tự động:
     + Tạo đầy đủ 9 bảng CSDL chuẩn hóa 3NF và 11 chỉ mục Index tăng tốc độ truy vấn.
     + Kích hoạt Row Level Security và cấu hình toàn bộ các chính sách bảo mật dữ liệu.
     + Cài đặt các hàm thủ tục và Trigger tự động gồm `handle_new_user`, `dat_lich_hen` với cơ chế khóa giao dịch chống trùng giờ, `chuyen_trang_thai_da_cho_thue` và `tu_dong_huy_lich_hen_qua_han`.
     + Khởi tạo 2 kho lưu trữ tệp trên Supabase Storage gồm `anh-phong-tro` và `banner`.
     + Nạp sẵn dữ liệu cấu hình ban đầu: danh mục 5 phường, 21 tuyến đường Quy Nhơn và 3 biểu ngữ trang chủ.

4. **Cấu hình biến môi trường**:
   Tạo tệp `.env.local` tại thư mục gốc của dự án (sao chép từ tệp mẫu `.env.example`) và điền các tham số sau dấu `=`:
   ```env
   # Lấy từ Project Settings, chọn mục API trên Supabase Dashboard
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Khóa bí mật bảo vệ API Cron Job
   CRON_SECRET=your_cron_secret_key

   # Cấu hình gửi email tự động qua Gmail SMTP
   GMAIL_USER=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_gmail_app_password
   NEXT_PUBLIC_SITE_URL=http://localhost:3001
   ```

5. **Khởi chạy ứng dụng**:
   ```bash
   npm run dev
   ```

6. **Truy cập ứng dụng và tạo tài khoản thử nghiệm trên máy cục bộ**:
   - Mở Google Chrome và truy cập: [http://localhost:3001](http://localhost:3001)
   - Bấm **Đăng ký** trên thanh điều hướng để tạo tài khoản mới với vai trò Sinh viên hoặc Chủ trọ.
   - Để cấp quyền Quản trị viên: mở mục **Table Editor** trên Supabase Dashboard, chọn bảng `profiles`, tìm dòng tài khoản vừa đăng ký và sửa cột `role` thành `admin` (hoặc vào mục **SQL Editor** chạy lệnh: `UPDATE public.profiles SET role = 'admin' WHERE so_dien_thoai = 'số_điện_thoại_vừa_tạo';`).

---

## 5. THÔNG TIN TRIỂN KHAI HỆ THỐNG

- **Trang web chính thức**: [https://tro-nau.vercel.app](https://tro-nau.vercel.app)
- **Nền tảng triển khai**: Vercel Cloud Platform
- **Trạng thái vận hành**: Hoạt động ổn định liên tục, tự động triển khai phiên bản mới từ nhánh `main`.

---

<p align="center">
  <b>Trọ Nẫu - Giải pháp tìm trọ an tâm và tiện lợi tại Quy Nhơn</b><br>
  <i>Bản quyền © 2026 Nhóm Trọ Nẫu. Bảo lưu mọi quyền.</i>
</p>
