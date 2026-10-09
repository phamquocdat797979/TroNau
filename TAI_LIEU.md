# TÀI LIỆU QUY CHUẨN VÀ TÍNH NĂNG NGUYÊN BẢN (TRỌ NẪU - TRONAU.VN)
*(Tài liệu chính thức duy nhất quy định toàn bộ nghiệp vụ, CSDL và kỹ thuật của hệ thống Web App Trọ Nẫu)*

---

## 1. TỔNG QUAN HỆ THỐNG

- **Tên Web App**: Trọ Nẫu (`TroNau.vn`)
- **Mục đích**: Ứng dụng hỗ trợ sinh viên tìm kiếm phòng trọ chất lượng, nhanh chóng và uy tín tại Thành phố Quy Nhơn, tỉnh Bình Định.
- **Mô hình hoạt động**:
  - Kết nối trực tiếp giữa **Sinh viên tìm trọ** và **Chủ trọ cho thuê**.
  - **Bảo vệ thông tin liên hệ**: Để đảm bảo tính riêng tư và an toàn cho chủ trọ, `Số nhà` và `Số điện thoại` của Chủ trọ bị ẩn hoàn toàn trên giao diện công khai và danh sách lịch hẹn chưa xác nhận. Thông tin này chỉ hiển thị với Sinh viên khi Lịch hẹn xem phòng chuyển sang trạng thái **`Đã xác nhận`**.
  - **Phân quyền 3 đối tượng**: `Sinh viên` (`sinh_vien`), `Chủ trọ` (`chu_tro`), và `Quản trị viên` (`admin`).

---

## 2. QUY CHUẨN GIAO DIỆN VÀ TRẢI NGHIỆM NGUỜI DÙNG

1. **Tuyệt đối không sử dụng Icon Font hoặc Text Emoji**:
   - Giao diện và mã nguồn **tuyệt đối không chứa bất kỳ icon font hay text emoji nào**.
   - Các trạng thái được biểu diễn bằng nhãn chữ tiếng Việt có dấu, badge màu sắc hoặc điểm chấm CSS thuần. Nút đóng modal sử dụng ký tự unicode tiêu chuẩn (`×`).
2. **Tiếng Việt chuẩn có dấu 100%**: Tất cả văn bản trên giao diện và trong mã nguồn phải là tiếng Việt có dấu chuẩn xác.
3. **Bố cục danh sách bài đăng**:
   - Phân trang: Hiển thị 12 bài đăng trên một trang trên giao diện trang chủ, có các nút chuyển trang (1, 2, 3...) rõ ràng (không cuộn vô tận hoặc dồn vào một trang).
   - Lưới bài đăng responsive, tự động điều chỉnh theo kích thước màn hình.
4. **Bộ lọc thông minh (Pill Filters)**:
   - Lọc bài đăng theo 3 tiêu chí: **Phường/Xã**, **Tuyến đường** và **Trạng thái phòng** (`Tất cả`, `Còn trống`, `Đã cho thuê`).
   - Dữ liệu Phường (5 Phường) và Tuyến đường (21 Tuyến đường) được đồng bộ động từ Cài đặt Hệ thống (`CaiDatContext` - Single Source of Truth) lưu trong CSDL. KHÔNG sử dụng ô tìm kiếm tự do.
5. **Thiết kế & Màu sắc**:
   - Bảng màu đặc trưng Quy Nhơn: Xanh lá núi (`#2d6a4f` / `#2e7d32`) kết hợp Xanh dương biển (`#1d6fa4`).
   - Nền trắng 100%, khoảng cách lề (padding/margin) thoáng đãng, rộng rãi.
   - Bo góc vi mô tiêu chuẩn: `--bo-vua: 2px` áp dụng thống nhất cho toàn bộ ô nhập, thẻ card và nút bấm.
   - Font chữ: **`Be Vietnam Pro`** (nhúng trực tiếp từ Google Fonts).

---

## 3. CÔNG NGHỆ VÀ HẠ TẦNG KỸ THUẬT

- **Frontend**: Next.js 14 (App Router), TypeScript (Strict Mode), Vanilla CSS + CSS Modules.
- **Backend & Cơ sở dữ liệu**: Supabase Cloud (PostgreSQL, Row Level Security - RLS, Supabase Auth, Storage bucket `anh-phong-tro`).
- **Hệ thống Gửi Email**: Nodemailer + Gmail SMTP tự động gửi email HTML thương hiệu **Trọ Nẫu** (Sử dụng `token_hash` OTP chống việc Gmail Security Scanner tự kích hoạt link).
- **Tự động dọn dẹp Lịch quá hạn**: Vercel Cron Jobs (`/api/cron/cleanup`) chạy tự động vào 02:00 ICT (19:00 UTC) hàng ngày, xác thực `CRON_SECRET` và thực thi hàm RPC `tu_dong_huy_lich_hen_qua_han()`.
- **Môi trường phát triển & Triển khai**:
  - Local: Chạy trên Cổng `http://localhost:3001` (`npm run dev`).
  - Production: Deploy Vercel + Supabase Cloud.

---

## 4. CHI TIẾT NGHIỆP VỤ THEO VAI TRÒ NGUỜI DÙNG

### 4.1. Hệ thống Tài khoản & Xác thực chung
- **Đăng ký / Đăng nhập**: Linh hoạt bằng Số điện thoại hoặc Email. Đối với tài khoản đăng ký bằng SĐT, hệ thống tự động khởi tạo virtual email dạng `{sdt}@tronau.local` trong Supabase Auth.
- **Quên mật khẩu**: Nhập SĐT/Email để gửi email khôi phục tự động về Gmail thực. Người dùng click liên kết trong email chứa `token_hash` để đặt lại mật khẩu mới an toàn.
- **Đổi mật khẩu**: Thực hiện tại trang Cá nhân, bắt buộc xác minh Mật khẩu hiện tại trước khi cập nhật.
- **Giao diện Trang Tài khoản (`/tai-khoan`)**: Phân chia 2 Sub-Tabs mượt mà:
  - Tab 1: `Thông tin cá nhân` (Cập nhật Họ tên, SĐT, Email thực)
  - Tab 2: `Đổi mật khẩu`
- **Xóa tài khoản**: Nút **Xóa tài khoản** hiển thị ở góc dưới tab `Thông tin cá nhân` dành riêng cho **Sinh viên** và **Chủ trọ** (Đi kèm Hộp thoại Modal xác nhận nguy hiểm trước khi xóa vĩnh viễn). Gọi API `/api/auth/xoa-tai-khoan` thực thi xóa user trong Supabase Auth và tự động dọn dẹp toàn bộ dữ liệu liên quan qua cơ chế `ON DELETE CASCADE`. Tài khoản **Admin** bị chặn không có nút tự xóa này.

### 4.2. Sinh viên (Tìm phòng trọ)
- Xem danh sách và chi tiết bài đăng phòng trọ (Số nhà & SĐT bị ẩn trên trang công khai).
- Đặt lịch xem phòng dựa trên các khung giờ rảnh theo ngày cụ thể mà chủ trọ đã mở.
- Bảng chú thích màu sắc khi chọn khung giờ đặt lịch:
  - **Màu xanh**: Khung giờ rảnh (bấm để chọn).
  - **Màu xám**: Khung giờ chủ trọ bận.
  - **Màu đỏ**: Khung giờ đã có sinh viên khác đặt.
- **Quy tắc Lịch hẹn**:
  - Mỗi sinh viên chỉ có tối đa 1 lịch hẹn active (`cho_xac_nhan` hoặc `da_xac_nhan`) trên một bài đăng.
  - Khi lịch bị Từ chối hoặc tự Hủy, quyền đặt lịch mới cho bài đăng đó tự động được mở lại.
  - Các lịch hẹn quá hạn (`ngay_hen < CURRENT_DATE`) tự động được lọc ẩn trên giao diện real-time.
- Xem chi tiết Số nhà & SĐT chủ trọ ngay khi lịch chuyển sang trạng thái **`Đã xác nhận`** tại trang `/sinh-vien/lich-hen`.
- Bình luận dưới bài đăng phòng trọ.

### 4.3. Chủ trọ (Đăng tin cho thuê)
- **Đăng bài mới**: Nhập đầy đủ thông tin địa chỉ (Tuyến đường & Phường tại Quy Nhơn), giá thuê (`tien_thue` và số nguyên `gia_thue_so`), tiền điện, tiền nước, phí khác, ghi chú. Tải lên từ 1 đến 4 ảnh phòng trọ (bắt buộc tối thiểu 1 ảnh). Bài đăng mới sẽ ở trạng thái `Chờ duyệt` (`cho_duyet`).
- **Chỉnh sửa bài đăng**: Bài sau khi sửa sẽ quay về trạng thái `Chờ duyệt`, đồng thời tự động hủy các lịch hẹn cũ và gửi thông báo cho sinh viên liên quan. Bài ở trạng thái `Đã cho thuê` không được phép sửa.
- **Đổi trạng thái phòng**: Chuyển đổi giữa `Còn trống` (`con_trong`) và `Đã cho thuê` (`da_cho_thue`). Khi ở trạng thái `Đã cho thuê`, chủ trọ có thể cập nhật ghi chú `Ngày trống dự kiến` (dạng TEXT tự do) để sinh viên tham khảo mà không cần qua Admin duyệt lại. Khi chuyển `Đã cho thuê`, hệ thống tự dọn dẹp các lịch hẹn cũ.
- **Xóa bài đăng**: Cho phép xóa bài đăng cá nhân, hệ thống tự động dọn dẹp ảnh trong Supabase Storage `anh-phong-tro` và bản ghi CSDL.
- **Cài đặt khung giờ rảnh**: Thiết lập các slot 1 tiếng rảnh theo từng ngày cụ thể (`ngay_hen`) tại trang Quản lý lịch hẹn (chỉ áp dụng đối với các bài đăng ở trạng thái `Còn trống`).
- **Quản lý lịch hẹn**: Xác nhận hoặc Từ chối lịch hẹn từ sinh viên. Khi bấm **Xác nhận**, số nhà và SĐT của chủ trọ sẽ hiển thị cho sinh viên đó.

### 4.4. Quản trị viên (Admin)
- **Bảng điều khiển Admin Dashboard (`/admin/dashboard`) với 5 Tab chính**:
  1. **Duyệt bài đăng**: Kiểm tra thông tin bài đăng `Chờ duyệt`. Khi bấm Duyệt, bài chuyển sang `Còn trống` và hệ thống tự động gán lại `created_at` và `updated_at` = thời điểm duyệt thực tế (để bài hiển thị lên đầu trang chủ). Khi Từ chối, bắt buộc nhập lý do từ chối.
  2. **Quản lý Banner**: Cấu hình danh sách 3 banner trình chiếu trên trang chủ (ảnh, tiêu đề, mô tả, thẻ tags).
  3. **Logo & Tên App**: Cấu hình nhận diện thương hiệu Trọ Nẫu.
  4. **Đường & Phường**: Quản lý danh sách Phường/Xã (5 Phường) và Tuyến đường (21 Tuyến đường) tại Quy Nhơn.
  5. **Chân trang (Footer)**: Cấu hình nội dung hướng dẫn dành cho Sinh viên & Chủ trọ.
- **Quản lý Bình luận**: Xem và xóa các bình luận vi phạm trên bài đăng.
- **Bảo mật**: Nút xóa tài khoản cá nhân bị ẩn hoàn toàn với Admin.

---

## 5. CẤU TRÚC CƠ SỞ DỮ LIỆU (SUPABASE SCHEMA - 9 BẢNG HOẠT ĐỘNG)

Mọi bảng trong CSDL đều được thiết lập khóa ngoại kèm ràng buộc **`ON DELETE CASCADE`** để tự động dọn dẹp dữ liệu liên quan khi xóa tài khoản hoặc bài đăng:

1. **Bảng `profiles`**: Lưu thông tin người dùng (`id`, `role`, `ho_ten`, `so_dien_thoai`, `email`, `bi_han_gui_bai_den`, `tong_lan_bi_tu_choi_trong_han`, `created_at`).
2. **Bảng `bai_dang`**: Lưu thông tin phòng trọ (`id`, `chu_tro_id`, `trang_thai`, `khung_gio_bi_khoa`, `so_nha`, `duong`, `phuong`, `tien_thue`, `gia_thue_so`, `tien_nuoc`, `tien_dien`, `phi_khac`, `ghi_chu`, `ngay_trong_du_kien`, `ly_do_tu_choi`, `created_at`, `updated_at`).
3. **Bảng `hinh_anh_bai_dang`**: Lưu ảnh phòng trọ (`id`, `bai_dang_id`, `url`, `thu_tu` từ 1 -> 4).
4. **Bảng `lich_co_the_dat`**: Lưu khung giờ rảnh chủ trọ mở cho từng bài đăng (`id`, `bai_dang_id`, `ngay_hen`, `gio_bat_dau`, `gio_ket_thuc`).
5. **Bảng `lich_hen`**: Lưu lịch hẹn xem phòng của sinh viên (`id`, `bai_dang_id`, `sinh_vien_id`, `ngay_hen`, `gio_bat_dau`, `gio_ket_thuc`, `trang_thai`, `created_at`). Các trạng thái: `cho_xac_nhan`, `da_xac_nhan`, `huy_sau_xac_nhan`.
6. **Bảng `binh_luan`**: Lưu bình luận của sinh viên dưới bài đăng (`id`, `bai_dang_id`, `sinh_vien_id`, `noi_dung`, `created_at`).
7. **Bảng `thong_bao`**: Lưu thông báo hệ thống gửi tới từng người dùng (`id`, `nguoi_nhan_id`, `loai`, `noi_dung`, `lien_ket`, `da_doc`, `created_at`).
8. **Bảng `banner`**: Lưu danh sách 3 banner hiển thị trang chủ (`id`, `url_anh`, `thu_tu` từ 1 -> 3, `tieu_de`, `mo_ta`, `the_tags`, `lien_ket`, `updated_at`).
9. **Bảng `cai_dat_he_thong`**: Lưu các tham số cấu hình dạng JSONB (`khoa` PRIMARY KEY, `gia_tri` JSONB, `updated_at`). Các khóa cấu hình: `ten_app`, `sub_name`, `logo_url`, `danh_sach_phuong`, `danh_sach_duong`, `footer_mo_ta`, `footer_sinh_vien`, `footer_chu_tro`, `footer_ban_quyen`.

*(Ghi chú: Bảng `video_bai_dang` cũ đã được loại bỏ hoàn toàn khỏi hệ thống bằng câu lệnh `DROP TABLE IF EXISTS video_bai_dang CASCADE`).*

---

## 6. DANH SÁCH API ROUTES (9 BACKEND ENDPOINTS)

1. **`POST /api/auth/dang-nhap`**: Đăng nhập bằng Email hoặc SĐT (tự quy đổi `{sdt}@tronau.local`), thiết lập Auth Cookies phía Server.
2. **`POST /api/auth/dang-ky`**: Đăng ký tài khoản Sinh viên / Chủ trọ, tạo user trong Auth và bản ghi trong `profiles`.
3. **`POST /api/auth/quen-mat-khau`**: Gửi email HTML khôi phục mật khẩu qua Nodemailer SMTP kèm `token_hash`.
4. **`POST /api/auth/lay-email`**: Tra cứu email dựa trên số điện thoại.
5. **`POST /api/auth/xoa-tai-khoan`**: Xóa vĩnh viễn tài khoản người dùng và toàn bộ dữ liệu liên quan qua Supabase Admin Client.
6. **`GET /api/cai-dat`**: Trả về Cài đặt hệ thống & Banner (có `Cache-Control: no-store`).
7. **`POST /api/admin/banner`**: Cập nhật 3 vị trí Banner slideshow.
8. **`POST /api/admin/cai-dat`**: Cập nhật cài đặt hệ thống dạng JSONB.
9. **`GET /api/cron/cleanup`**: Vercel Cron Job tự động dọn dẹp lịch quá hạn lúc 02:00 ICT.

---

## 7. QUẢN LÝ THÀNH PHẦN VÀ TÀI NGUYÊN TĨNH

- **Bộ UI Components dùng chung (`components/`)**: `Badge`, `TheBaiDang`, `ThanhTimKiem`, `BannerCarousel`, `Footer`, `Header`, `LayoutTaiKhoan`, `Modal`, `NavNgang`, `DanhSachThongBao`, `Toast`.
- **Tài nguyên tĩnh (`public/`)**: `logo.png`, `banner-1.jpg`, `banner-2.jpg`, `banner-3.jpg`, `favicon.ico`.
- **Font chữ**: Sử dụng font Google **`Be Vietnam Pro`** nhúng qua CSS `@import` trong [`app/globals.css`](file:///c:/Users/MY%20PC/Downloads/TroNau/app/globals.css). Đã xóa toàn bộ thư mục font mặc định `app/fonts/`.

---

*Tài liệu này là bản quy chuẩn hoàn thiện duy nhất của dự án Trọ Nẫu (TroNau.vn).*
