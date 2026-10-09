# Kế hoạch triển khai Web App Trọ Nẫu (TroNau.vn)
*(Phiên bản cập nhật thực tế - Đồng bộ 100% với hệ thống đã triển khai)*

---

## Mục lục

1. [Công nghệ sử dụng](#1-công-nghệ-sử-dụng)
2. [Kiến trúc tổng thể](#2-kiến-trúc-tổng-thể)
3. [Ghi chú kỹ thuật quan trọng](#3-ghi-chú-kỹ-thuật-quan-trọng)
4. [Cơ sở dữ liệu (Supabase)](#4-cơ-sở-dữ-liệu-supabase)
5. [Cấu trúc thư mục dự án](#5-cấu-trúc-thư-mục-dự-án)
6. [Các trang và chức năng chi tiết](#6-các-trang-và-chức-năng-chi-tiết)
7. [Luồng xử lý nghiệp vụ quan trọng](#7-luồng-xử-lý-nghiệp-vụ-quan-trọng)
8. [Giao diện và thiết kế](#8-giao-diện-và-thiết-kế)
9. [Triển khai (Deployment)](#9-triển-khai-deployment)
10. [Tóm tắt toàn bộ quyết định đã xác nhận](#10-tóm-tắt-toàn-bộ-quyết-định-đã-xác-nhận)

---

## 1. Công nghệ sử dụng

### Frontend
| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR/SSG tải nhanh, SEO tốt, deploy Vercel dễ |
| Ngôn ngữ | **TypeScript** (strict mode) | Giảm lỗi runtime, dễ bảo trì |
| Styling | **Vanilla CSS + CSS Modules** | Không dùng Tailwind |
| State/Context | **React Context API (`CaiDatContext`)** | Single Source of Truth cho cấu hình hệ thống |
| Realtime | **Supabase Realtime** (WebSocket) | Lịch hẹn + thông báo tức thì |
| Upload ảnh/video | **Supabase Storage** | Tích hợp sẵn, miễn phí |

### Backend / Database
| Hạng mục | Lựa chọn | Lý do |
|---|---|---|
| Cơ sở dữ liệu | **Supabase** (PostgreSQL) | Miễn phí, đủ tính năng |
| Authentication | **Supabase Auth** + virtual email | Đăng nhập linh hoạt SĐT / Email |
| API | **Next.js API Routes / Server Actions** | Bảo vệ logic nghiệp vụ, ẩn `so_nha` & SĐT |
| RLS | **Supabase RLS** + `is_admin()` helper | Bảo vệ dữ liệu theo vai trò, chống đệ quy 42P17 |
| Tự động dọn lịch cũ | **Vercel Cron Jobs** | Dọn dẹp tự động lúc 02:00 hàng ngày |

### Packages đã cài
```json
"@supabase/supabase-js": "^2.x.x",
"@supabase/ssr": "^0.x.x"
```

### Deployment
- **Local**: `npm run dev` tại cổng **3001** (vì cổng 3000 dành cho ứng dụng khác)
- **Production**: **Vercel** + Supabase cloud

---

## 2. Kiến trúc tổng thể

```
[Người dùng trình duyệt]
        |
        v
[Next.js App - Vercel - cổng 3001 local]
   - CaiDatProvider (Context API bao bọc toàn bộ App)
   - Trang công khai (chỉ hiện con_trong và da_cho_thue)
   - Trang Sinh viên (Đặt lịch xem phòng khung 1h, Thông báo, Lịch hẹn)
   - Trang Chủ trọ (Đăng tin, Quản lý bài đăng, Cài đặt khung giờ rảnh 1h trực tiếp)
   - Trang Admin (Duyệt bài, Quản lý Cài đặt Phường/Đường/Banner, Bình luận)
   - /api/cron/cleanup (Vercel Cron - chạy 02:00 mỗi ngày)
        |
        v
[Supabase (Cloud)]
   - PostgreSQL + RLS (`is_admin()` Security Definer function)
   - Supabase Auth (email + password, virtual email cho user chỉ có SĐT)
   - Supabase Storage (anh-phong-tro, video-phong-tro, banner)
   - Supabase Realtime (WebSocket)
```

---

## 3. Ghi chú kỹ thuật quan trọng

### 3.1. Đăng nhập bằng SĐT - Virtual Email

- Khi đăng ký, dù người dùng có nhập email thật hay không, hệ thống luôn tạo tài khoản trong `auth.users` với một email hợp lệ.
- Nếu người dùng nhập email thật → dùng email đó cho `auth.users`.
- Nếu người dùng chỉ nhập SĐT → tạo virtual email: `{sdt}@tronau.local` (ví dụ: `0912345678@tronau.local`).
- Cột `profiles.email` lưu email thật của người dùng (hoặc NULL nếu không có).

### 3.2. Tự động xóa lịch hẹn cũ - Vercel Cron

- Endpoint `GET /api/cron/cleanup` trong Next.js.
- Cấu hình trong `vercel.json` chạy vào 19:00 UTC (tương đương 02:00 ICT hàng ngày).
- Sử dụng `SUPABASE_SERVICE_ROLE_KEY` để tự động xóa các lịch hẹn có `ngay_hen < CURRENT_DATE`.

### 3.3. Xóa file trên Supabase Storage

- Xóa bản ghi trong `hinh_anh_bai_dang` hoặc `video_bai_dang` qua CASCADE chỉ xóa database, không xóa file Storage.
- Mọi thao tác xóa bài/ảnh/video/tài khoản thực hiện 2 bước:
  1. Xóa file trên Supabase Storage (`supabase.storage.from('bucket').remove([paths])`).
  2. Xóa bản ghi trong database.

### 3.4. Kiểm tra thời lượng video & dung lượng

- Kiểm tra thời lượng video (tối đa 2 phút) bằng HTML5 Video API phía client.
- Giới hạn kích thước file tối đa **50MB** (giới hạn của Supabase Storage free tier).

### 3.5. Bảo vệ thông tin liên hệ & địa chỉ chính xác

- API công khai không bao giờ trả về `so_nha` và SĐT chủ trọ/sinh viên.
- Thông tin nhạy cảm (`so_nha`, SĐT) **chỉ hiển thị khi lịch hẹn chuyển sang trạng thái `da_xac_nhan`** hoặc người dùng là chính chủ trọ/Admin.

### 3.6. Chuyển `ngay_trong_du_kien` sang kiểu `TEXT`

- Cột `ngay_trong_du_kien` kiểu **`TEXT`** để chủ trọ nhập dạng ghi chú tự do (VD: `Sau 15/10/2026`, `Giữa tháng 11`...).
- Quản lý riêng tại trang **Quản lý bài đăng** khi bài chuyển sang trạng thái `da_cho_thue`, cập nhật bất cứ lúc nào không cần duyệt lại.

### 3.7. Cài đặt khung giờ rảnh (`lich_co_the_dat`) không qua duyệt Admin

- Quản lý trực tiếp tại trang **Quản lý lịch hẹn xem phòng (`/chu-tro/lich-hen`)**.
- **Điều kiện**: Menu chọn bài đăng **chỉ hiển thị các bài đăng ở trạng thái `con_trong`** (bài đã được Admin duyệt và chưa cho thuê).
- Chủ trọ chọn bài đăng và bật/tắt từng khung giờ 1 tiếng (07:00-08:00, 08:00-09:00..., 18:00-19:00) cho các ngày trong tuần theo thời gian thực.

### 3.8. Giao diện Đặt lịch xem phòng khung 1 tiếng cố định & Bảng Chú thích

- Cả Chủ trọ và Sinh viên thao tác trên **lưới 12 khung giờ 1 tiếng cố định** (Buổi sáng 07:00-13:00, Buổi chiều 13:00-19:00).
- **Thanh điều hướng tuần**: `< Tuần trước` | `Tuần sau >` với 7 tab ngày hiển thị ngày/tháng thực tế (`T2 14/09`, `T3 15/09`...).
- **Bảng Chú thích trạng thái màu sắc**:
  - **Màu xanh (Còn trống - Bấm để chọn)**: Khung giờ chủ trọ rảnh, sinh viên có thể chọn để đặt lịch.
  - **Màu xám (Chủ trọ bận)**: Chủ trọ chưa mở slot này.
  - **Màu đỏ (Đã có người đặt)**: Đã có sinh viên khác đăng ký slot này.

### 3.9. Kiểm soát Lịch hẹn & Stored Procedure `dat_lich_hen` thời gian thực

- **Ngày đăng bài tính từ khi Admin duyệt**: Khi Admin duyệt bài, `created_at` và `updated_at` được gán bằng thời điểm duyệt bài thực tế.
- **Khóa ngày quá khứ**: Chỉ đặt lịch từ ngày hiện tại trở về sau.
- **Tự động ẩn lịch quá hạn**: Tất cả danh sách lịch hẹn (Chủ trọ & Sinh viên) lọc điều kiện `.gte('ngay_hen', todayStr)` để lịch quá ngày tự động ẩn theo thời gian thực.
- **1 Sinh viên - 1 Lịch active / 1 Bài đăng**: Mỗi Sinh viên chỉ có tối đa 1 lịch hẹn active (`cho_xac_nhan` hoặc `da_xac_nhan`) trên 1 bài đăng.
- **Đặt lại lịch khi Hủy / Từ chối**: Nếu Sinh viên Hủy lịch hoặc Chủ trọ Từ chối, bản ghi cũ giải phóng, Sinh viên hoàn toàn có thể đặt lại lịch mới.

```sql
CREATE OR REPLACE FUNCTION dat_lich_hen(
  p_bai_dang_id UUID,
  p_ngay_hen DATE,
  p_gio_bat_dau TIME,
  p_gio_ket_thuc TIME
) RETURNS JSON AS $$
DECLARE
  ket_qua JSON;
  v_thu_trong_tuan INT;
  v_sinh_vien_id UUID := auth.uid();
BEGIN
  IF v_sinh_vien_id IS NULL THEN
    RETURN json_build_object('loi', 'Bạn cần đăng nhập để thực hiện');
  END IF;

  PERFORM pg_advisory_xact_lock(
    hashtext(p_bai_dang_id::TEXT || p_ngay_hen::TEXT || p_gio_bat_dau::TEXT)
  );

  IF NOT EXISTS (
    SELECT 1 FROM bai_dang
    WHERE id = p_bai_dang_id AND trang_thai = 'con_trong'
  ) THEN
    RETURN json_build_object('loi', 'Phòng này hiện không nhận đặt lịch (chỉ bài đăng đã được duyệt mới được phép đặt lịch)');
  END IF;

  IF p_ngay_hen < CURRENT_DATE THEN
    RETURN json_build_object('loi', 'Ngày hẹn không được trong quá khứ');
  END IF;

  v_thu_trong_tuan := EXTRACT(DOW FROM p_ngay_hen)::INT;
  IF NOT EXISTS (
    SELECT 1 FROM lich_co_the_dat
    WHERE bai_dang_id = p_bai_dang_id
      AND thu_trong_tuan = v_thu_trong_tuan
      AND gio_bat_dau <= p_gio_bat_dau
      AND gio_ket_thuc >= p_gio_ket_thuc
  ) THEN
    RETURN json_build_object('loi', 'Khung giờ không hợp lệ với lịch rảnh của chủ trọ');
  END IF;

  IF EXISTS (
    SELECT 1 FROM lich_hen
    WHERE bai_dang_id = p_bai_dang_id
      AND ngay_hen = p_ngay_hen
      AND gio_bat_dau = p_gio_bat_dau
      AND trang_thai IN ('cho_xac_nhan', 'da_xac_nhan')
  ) THEN
    RETURN json_build_object('loi', 'Khung giờ này đã có người đặt');
  END IF;

  IF EXISTS (
    SELECT 1 FROM lich_hen
    WHERE bai_dang_id = p_bai_dang_id
      AND sinh_vien_id = v_sinh_vien_id
      AND trang_thai IN ('cho_xac_nhan', 'da_xac_nhan')
  ) THEN
    RETURN json_build_object('loi', 'Bạn đã có lịch hẹn đang chờ hoặc đã xác nhận cho phòng này');
  END IF;

  INSERT INTO lich_hen (bai_dang_id, sinh_vien_id, ngay_hen, gio_bat_dau, gio_ket_thuc, trang_thai)
  VALUES (p_bai_dang_id, v_sinh_vien_id, p_ngay_hen, p_gio_bat_dau, p_gio_ket_thuc, 'cho_xac_nhan')
  RETURNING to_json(lich_hen.*) INTO ket_qua;

  RETURN json_build_object('thanh_cong', TRUE, 'du_lieu', ket_qua);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.10. Single Source of Truth cho Cài đặt Hệ thống (`cai_dat` Table)

- Bảng `cai_dat` trong Supabase lưu trữ cấu hình hệ thống: 5 Phường Quy Nhơn (`Phường Quy Nhơn`, `Phường Quy Nhơn Nam`, `Phường Quy Nhơn Bắc`, `Phường Quy Nhơn Đông`, `Phường Quy Nhơn Tây`), 21 Tuyến đường, Banner, Logo, Footer.
- Admin chỉnh sửa trực tiếp tại Admin Dashboard (`/admin/dashboard`).
- API `/api/cai-dat` trả về dữ liệu cấu hình thực tế, cài đặt header `Cache-Control: no-store` và `revalidate = 0` chống cache tĩnh.

### 3.11. Nghiêm cấm sử dụng Emoji trong mã nguồn và giao diện

- Giao diện VÀ mã nguồn **không sử dụng bất kỳ text emoji hay icon font nào**.
- Các trạng thái được thể hiện bằng nhãn chữ tiếng Việt có dấu, badge màu hoặc chấm tròn CSS thuần.

### 3.12. Cấu hình RLS & Tránh đệ quy bằng `is_admin()`

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Cơ sở dữ liệu (Supabase)

### Sơ đồ trạng thái bài đăng (4 trạng thái)

```
[Chủ trọ đăng bài]
        |
   cho_duyet (ẩn công khai)
    /              \
[Admin duyệt]  [Admin từ chối + lý do bắt buộc]
    |                     |
con_trong             bi_tu_choi (ẩn công khai)
(hiện, cho đặt lịch)      |
    |               [Chủ trọ sửa + gửi lại]
    |                     |
[Chủ trọ sửa nội dung]  cho_duyet (lại)
    |
cho_duyet (lại) + HỦY MỌI lịch hẹn + Thông báo sinh viên
    |
[Chủ trọ đổi → da_cho_thue]
    |
da_cho_thue + HỦY MỌI lịch hẹn + Thông báo sinh viên
    |
[Chủ trọ đổi lại - không duyệt lại]
    |
con_trong
```

### Bảng `cai_dat`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| khoa | text UNIQUE NOT NULL | Khóa cài đặt (VD: `danh_sach_phuong`, `danh_sach_duong`, `thong_tin_app`) |
| gia_tri | jsonb NOT NULL | Giá trị lưu dạng JSONB |
| updated_at | timestamptz DEFAULT NOW() | |

### Bảng `profiles`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE | |
| role | text NOT NULL CHECK (role IN ('sinh_vien', 'chu_tro', 'admin')) | |
| ho_ten | text NOT NULL | |
| so_dien_thoai | text NOT NULL UNIQUE | |
| email | text UNIQUE | Email thật (NULL nếu dùng virtual email) |
| bi_han_gui_bai_den | timestamptz | NULL nếu không bị khóa |
| tong_lan_bi_tu_choi_trong_han | int NOT NULL DEFAULT 0 | |
| created_at | timestamptz NOT NULL DEFAULT NOW() | |

### Bảng `bai_dang`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| chu_tro_id | uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE | |
| trang_thai | text NOT NULL DEFAULT 'cho_duyet' CHECK (trang_thai IN ('cho_duyet','bi_tu_choi','con_trong','da_cho_thue')) | |
| khung_gio_bi_khoa | boolean NOT NULL DEFAULT false | |
| so_nha | text | Chỉ hiển thị khi xác nhận lịch hẹn |
| duong | text NOT NULL | |
| phuong | text NOT NULL | |
| tien_thue | text NOT NULL | Hiển thị (VD: "1.5 triệu") |
| gia_thue_so | bigint | Bóc tách số nguyên để lọc |
| tien_nuoc | text | |
| tien_dien | text | |
| phi_khac | text | |
| ghi_chu | text | |
| ngay_trong_du_kien | text | **Kiểu TEXT** (ghi chú tự do khi bài đã cho thuê) |
| ly_do_tu_choi | text | |
| created_at | timestamptz NOT NULL DEFAULT NOW() | Đặt lại theo thời gian duyệt bài |
| updated_at | timestamptz NOT NULL DEFAULT NOW() | |

### Bảng `hinh_anh_bai_dang`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| bai_dang_id | uuid NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE | |
| url | text NOT NULL | |
| thu_tu | int NOT NULL CHECK (thu_tu BETWEEN 1 AND 4) | |

### Bảng `video_bai_dang`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| bai_dang_id | uuid NOT NULL UNIQUE REFERENCES bai_dang(id) ON DELETE CASCADE | |
| url | text NOT NULL | |

### Bảng `lich_co_the_dat`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| bai_dang_id | uuid NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE | |
| thu_trong_tuan | int NOT NULL CHECK (thu_trong_tuan BETWEEN 0 AND 6) | 0=CN, 1=T2,...,6=T7 |
| gio_bat_dau | time NOT NULL | Định dạng hh:mm:ss |
| gio_ket_thuc | time NOT NULL | Định dạng hh:mm:ss |

### Bảng `lich_hen`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| bai_dang_id | uuid NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE | |
| sinh_vien_id | uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE | |
| ngay_hen | date NOT NULL | |
| gio_bat_dau | time NOT NULL | |
| gio_ket_thuc | time NOT NULL | |
| trang_thai | text NOT NULL DEFAULT 'cho_xac_nhan' CHECK (trang_thai IN ('cho_xac_nhan','da_xac_nhan','huy_sau_xac_nhan')) | |
| created_at | timestamptz NOT NULL DEFAULT NOW() | |

### Bảng `binh_luan`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| bai_dang_id | uuid NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE | |
| sinh_vien_id | uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE | |
| noi_dung | text NOT NULL | |
| created_at | timestamptz DEFAULT NOW() | |

### Bảng `thong_bao`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| nguoi_nhan_id | uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE | |
| loai | text NOT NULL | |
| noi_dung | text NOT NULL | |
| lien_ket | text | |
| da_doc | boolean NOT NULL DEFAULT false | |
| created_at | timestamptz DEFAULT NOW() | |

### Bảng `banner`
| Cột | Kiểu | Mô tả |
|---|---|---|
| id | uuid PRIMARY KEY DEFAULT gen_random_uuid() | |
| url_anh | text NOT NULL | |
| thu_tu | int NOT NULL UNIQUE | |
| updated_at | timestamptz NOT NULL DEFAULT NOW() | |

---

## 5. Cấu trúc thư mục dự án

```
TroNau/
├── app/
│   ├── page.tsx                         # Trang chủ (Lọc, Lưới bài, Banner)
│   ├── layout.tsx                       # Root Layout chứa CaiDatProvider
│   ├── phong-tro/[id]/page.tsx          # Chi tiết phòng & Modal đặt lịch xem phòng + Bảng chú thích
│   ├── dang-nhap/page.tsx               # Đăng nhập SĐT / Email
│   ├── dang-ky/page.tsx                 # Đăng ký tài khoản
│   ├── chu-tro/
│   │   ├── dang-bai/page.tsx            # Đăng bài mới
│   │   ├── quan-ly-bai/page.tsx         # Quản lý bài, đổi trạng thái, cập nhật ngày trống
│   │   ├── sua-bai/[id]/page.tsx        # Chỉnh sửa nội dung bài đăng
│   │   ├── lich-hen/page.tsx            # Quản lý lịch hẹn & Cài đặt khung giờ rảnh (chỉ bài con_trong)
│   │   ├── thong-bao/page.tsx           # Thông báo chủ trọ
│   │   └── tai-khoan/page.tsx           # Hồ sơ chủ trọ
│   ├── sinh-vien/
│   │   ├── lich-hen/page.tsx            # Danh sách lịch hẹn sinh viên (lọc ngày >= hôm nay)
│   │   ├── thong-bao/page.tsx           # Thông báo sinh viên
│   │   └── tai-khoan/page.tsx           # Hồ sơ sinh viên
│   ├── admin/
│   │   ├── dashboard/page.tsx           # Duyệt bài, Quản lý Cài đặt Phường/Đường/App/Banner
│   │   ├── banner/page.tsx              # Quản lý banner
│   │   ├── binh-luan/page.tsx           # Quản lý bình luận
│   │   ├── thong-bao/page.tsx
│   │   └── tai-khoan/page.tsx
│   └── api/
│       ├── auth/                        # API Đăng nhập, Đăng ký, Đăng xuất
│       ├── cai-dat/route.ts             # API Lấy cài đặt hệ thống (Phường, Đường, App)
│       ├── admin/cai-dat/route.ts       # API Cập nhật cài đặt Admin
│       └── cron/cleanup/route.ts        # Vercel Cron dọn dẹp lịch cũ
├── components/
│   ├── Header/                          # Header điều hướng chính
│   ├── Footer/                          # Footer chân trang
│   ├── Banner/BannerCarousel.tsx        # Banner Carousel hiệu ứng Glassmorphism
│   ├── BaiDang/TheBaiDang.tsx           # Thẻ bài đăng hiển thị thông tin
│   ├── Badge/Badge.tsx                  # Nhãn trạng thái bài đăng & lịch hẹn
│   ├── Modal/Modal.tsx                  # Modal chung
│   ├── Toast/Toast.tsx                  # Toast thông báo trải nghiệm người dùng
│   └── Layout/LayoutTaiKhoan.tsx        # Layout trang quản lý có sidebar
├── context/
│   └── CaiDatContext.tsx                # Context API quản lý Single Source of Truth Cài đặt
├── lib/
│   ├── caiDat.ts                        # Fallback cài đặt mặc định
│   ├── supabase/client.ts               # Supabase browser client
│   ├── constants.ts                     # Fallback danh sách đường, phường Quy Nhơn
│   └── utils.ts                         # Hàm bóc tách số giá thuê
├── types/
│   └── index.ts                         # Interface TypeScript
├── supabase/
│   └── schema.sql                       # SQL khởi tạo cơ sở dữ liệu & seed data
└── vercel.json                          # Cấu hình Vercel Cron
```

---

## 6. Các trang và chức năng chi tiết

### 6.1. Trang chủ - Công khai
- Banner 3 ảnh trượt tự động với nút điều hướng Glassmorphism tinh tế.
- Thanh tìm kiếm: Tên đường, Phường / Xã (Load trực tiếp từ `CaiDatContext` - 5 Phường & 21 Tuyến đường Quy Nhơn).
- Lưới hiển thị bài đăng có trạng thái `con_trong` và `da_cho_thue`.

### 6.2. Trang chi tiết phòng
- Hiển thị đầy đủ hình ảnh, video, thông tin phòng trọ.
- Hiển thị "Ngày trống dự kiến" nếu phòng đã cho thuê.
- Modal Đặt lịch xem phòng khung 1 tiếng cố định có **Bảng Chú thích màu sắc** (Xanh: Còn trống, Xám: Chủ trọ bận, Đỏ: Đã có người đặt).
- Hiển thị thông báo trạng thái lịch hẹn active của chính sinh viên đó (Chờ xác nhận / Đã xác nhận).

### 6.3. Đăng ký / Đăng nhập
- Đăng ký vai trò Sinh viên hoặc Chủ trọ.
- Đăng nhập linh hoạt bằng SĐT hoặc Email.

### 6.4. Khu vực Chủ trọ
- **Quản lý bài đăng**: Chuyển trạng thái `con_trong` <-> `da_cho_thue`. Cập nhật ghi chú "Ngày trống dự kiến" mà không cần duyệt lại.
- **Quản lý lịch hẹn xem phòng**: Chọn bài đăng (chỉ liệt kê bài `con_trong`) và bật/tắt khung giờ rảnh 1 tiếng (07:00 - 19:00).

### 6.5. Khu vực Sinh viên
- Đặt lịch xem phòng theo khung giờ rảnh. Tự động ẩn lịch đã qua ngày hẹn theo thời gian thực.
- Xem số nhà và SĐT chủ trọ ngay sau khi chủ trọ Xác nhận lịch.

### 6.6. Khu vực Admin
- Duyệt bài đăng (gán lại `created_at` = ngày giờ duyệt) hoặc Từ chối kèm lý do bắt buộc.
- Quản lý cấu hình Cài đặt Hệ thống (5 Phường, 21 Đường, Banner, Logo, Footer).

---

## 7. Luồng xử lý nghiệp vụ quan trọng

- **Hủy toàn bộ lịch hẹn**: Khi bài đăng sửa nội dung chờ duyệt lại hoặc đổi sang `da_cho_thue`, hệ thống tự động gửi thông báo và hủy mọi lịch hẹn đang chờ.
- **Vercel Cron Cleanup**: Xóa lịch hẹn đã qua ngày hẹn vào 02:00 hàng ngày.
- **Quản lý dung lượng Storage**: Xóa file trên Supabase Storage trước khi xóa bản ghi database.

---

## 8. Giao diện và thiết kế

- **Đồng bộ Nền Trắng 100%**: Loại bỏ toàn bộ các nền xám lốm đốm.
- **Lề trong padding rộng rãi**: `padding: 32px 36px` cho `.the_form`, chống sát mép viền.
- **Bóc tách chuỗi option**: Tự động lược bỏ ngoặc đơn mô tả dài để menu dropdown không bị tràn khỏi màn hình.
- **Bảng màu**: Xanh lá núi `#2d6a4f` + Xanh dương biển `#1d6fa4`.

---

## 9. Triển khai (Deployment)

- Running local cổng `3001` (`npm run dev`).
- Deploy production Vercel + Supabase cloud.

---

## 10. Tóm tắt toàn bộ quyết định đã xác nhận

| Hạng mục | Quyết định |
|---|---|
| Port local | **3001** |
| Single Source of Truth | Bảng `cai_dat` + `CaiDatContext` quản lý 5 Phường & 21 Đường Quy Nhơn |
| Đăng nhập SĐT | Virtual email `{sdt}@tronau.local` trong auth.users |
| Cron xóa lịch cũ | Vercel Cron Jobs (`/api/cron/cleanup`) |
| Kiểu ngày trống | `ngay_trong_du_kien` kiểu **TEXT** (quản lý tại quan-ly-bai) |
| Ngày đăng bài | Ngày Admin duyệt bài (cập nhật `created_at` = thời điểm duyệt) |
| Cài đặt lịch rảnh | Phân chia 2 Tab riêng tại `/chu-tro/lich-hen`: Tab "Danh sách lịch hẹn từ sinh viên" & Tab "Cài đặt khung giờ rảnh" (chỉ hiển thị bài `con_trong`) |
| Giao diện đặt lịch | Modal lưới 12 slot 1 tiếng cố định + Bảng chú thích màu sắc (Xanh / Xám / Đỏ) |
| Giới hạn lịch hẹn SV | 1 lịch active/bài đăng. Mở lại quyền đặt nếu Hủy/Từ chối. Tự động ẩn lịch đã qua ngày. |
| Bảo vệ RLS & Admin | Bật RLS + hàm `is_admin()` Security Definer chống đệ quy 42P17 |
| Bảo mật thông tin | SĐT & số nhà ẩn hoàn toàn cho đến khi lịch hẹn chuyển sang `da_xac_nhan` |
| Emoji & Icon | Bắt buộc không dùng text emoji hoặc icon font |

---

*Tài liệu đã được rà soát và kiểm duyệt đầy đủ, đồng bộ 100% với ứng dụng web thực tế Trọ Nẫu.*
