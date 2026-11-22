-- ============================================================
-- TRONAU - SQL KHOI TAO CO SO DU LIEU
-- Chay tung buoc theo thu tu trong Supabase SQL Editor
-- ============================================================

-- BUOC 1: TAO CAC BANG
-- ============================================================

-- Bang profiles (lien ket voi auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('sinh_vien', 'chu_tro', 'admin')),
  ho_ten TEXT NOT NULL,
  so_dien_thoai TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  bi_han_gui_bai_den TIMESTAMPTZ,
  tong_lan_bi_tu_choi_trong_han INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dam bao bang profiles cu cung duoc bo sung 2 cot quan ly han che dang bai
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bi_han_gui_bai_den TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tong_lan_bi_tu_choi_trong_han INT NOT NULL DEFAULT 0;

-- Bang bai_dang
CREATE TABLE IF NOT EXISTS bai_dang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chu_tro_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  trang_thai TEXT NOT NULL DEFAULT 'cho_duyet'
    CHECK (trang_thai IN ('cho_duyet', 'bi_tu_choi', 'con_trong', 'da_cho_thue')),
  khung_gio_bi_khoa BOOLEAN NOT NULL DEFAULT FALSE,
  so_nha TEXT,
  duong TEXT NOT NULL,
  phuong TEXT NOT NULL,
  tien_thue TEXT NOT NULL,
  gia_thue_so BIGINT,
  tien_nuoc TEXT,
  tien_dien TEXT,
  phi_khac TEXT,
  ghi_chu TEXT,
  ngay_trong_du_kien TEXT,
  ly_do_tu_choi TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dọn dẹp bảng video_bai_dang cũ (nếu có)
DROP TABLE IF EXISTS video_bai_dang CASCADE;

-- Bang hinh_anh_bai_dang
CREATE TABLE IF NOT EXISTS hinh_anh_bai_dang (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bai_dang_id UUID NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thu_tu INT NOT NULL CHECK (thu_tu BETWEEN 1 AND 4),
  CONSTRAINT unique_anh_thu_tu UNIQUE (bai_dang_id, thu_tu)
);

-- Bang lich_co_the_dat (khung gio chu tro thiet lap theo ngay cu the)
CREATE TABLE IF NOT EXISTS lich_co_the_dat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bai_dang_id UUID NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE,
  ngay_hen DATE NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL CHECK (gio_ket_thuc > gio_bat_dau)
);

-- Dam bao bang lich_co_the_dat cu tren Supabase tu dong duoc cap nhat sang cot ngay_hen
ALTER TABLE public.lich_co_the_dat ADD COLUMN IF NOT EXISTS ngay_hen DATE;
ALTER TABLE public.lich_co_the_dat DROP COLUMN IF EXISTS thu_trong_tuan;

-- Bang lich_hen
CREATE TABLE IF NOT EXISTS lich_hen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bai_dang_id UUID NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE,
  sinh_vien_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  ngay_hen DATE NOT NULL,
  gio_bat_dau TIME NOT NULL,
  gio_ket_thuc TIME NOT NULL,
  trang_thai TEXT NOT NULL DEFAULT 'cho_xac_nhan'
    CHECK (trang_thai IN ('cho_xac_nhan', 'da_xac_nhan', 'huy_sau_xac_nhan')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bang binh_luan
CREATE TABLE IF NOT EXISTS binh_luan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bai_dang_id UUID NOT NULL REFERENCES bai_dang(id) ON DELETE CASCADE,
  sinh_vien_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  noi_dung TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bang thong_bao
CREATE TABLE IF NOT EXISTS thong_bao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nguoi_nhan_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  loai TEXT NOT NULL,
  noi_dung TEXT NOT NULL,
  lien_ket TEXT,
  da_doc BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bang banner (toi da 3 banner)
CREATE TABLE IF NOT EXISTS banner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_anh TEXT NOT NULL,
  thu_tu INT NOT NULL UNIQUE CHECK (thu_tu BETWEEN 1 AND 3),
  lien_ket TEXT,
  tieu_de TEXT,
  mo_ta TEXT,
  the_tags TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dam bao bang banner cu tren Supabase cung duoc bo sung day du 3 cot moi
ALTER TABLE public.banner ADD COLUMN IF NOT EXISTS tieu_de TEXT;
ALTER TABLE public.banner ADD COLUMN IF NOT EXISTS mo_ta TEXT;
ALTER TABLE public.banner ADD COLUMN IF NOT EXISTS the_tags TEXT;

-- Bang cai_dat_he_thong (luu cau hinh CMS app: logo, ten app, phuong, duong, footer)
CREATE TABLE IF NOT EXISTS cai_dat_he_thong (
  khoa TEXT PRIMARY KEY,
  gia_tri JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- BUOC 2: TRIGGER CAP NHAT updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION cap_nhat_thoi_gian()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_bai_dang_updated_at ON bai_dang;
CREATE TRIGGER trigger_bai_dang_updated_at
  BEFORE UPDATE ON bai_dang
  FOR EACH ROW EXECUTE FUNCTION cap_nhat_thoi_gian();

DROP TRIGGER IF EXISTS trigger_banner_updated_at ON banner;
CREATE TRIGGER trigger_banner_updated_at
  BEFORE UPDATE ON banner
  FOR EACH ROW EXECUTE FUNCTION cap_nhat_thoi_gian();

-- Trigger tu dong tao profile khi dang ky auth user
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, role, ho_ten, so_dien_thoai, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sinh_vien'),
    COALESCE(NEW.raw_user_meta_data->>'ho_ten', 'Người dùng'),
    COALESCE(NEW.raw_user_meta_data->>'so_dien_thoai', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    ho_ten = EXCLUDED.ho_ten,
    so_dien_thoai = EXCLUDED.so_dien_thoai,
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- BUOC 3: INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_bai_dang_chu_tro_id ON bai_dang(chu_tro_id);
CREATE INDEX IF NOT EXISTS idx_bai_dang_trang_thai ON bai_dang(trang_thai);
CREATE INDEX IF NOT EXISTS idx_bai_dang_phuong ON bai_dang(phuong);
CREATE INDEX IF NOT EXISTS idx_bai_dang_duong ON bai_dang(duong);
CREATE INDEX IF NOT EXISTS idx_bai_dang_gia_thue_so ON bai_dang(gia_thue_so);
CREATE INDEX IF NOT EXISTS idx_lich_hen_bai_dang_id ON lich_hen(bai_dang_id);
CREATE INDEX IF NOT EXISTS idx_lich_hen_sinh_vien_id ON lich_hen(sinh_vien_id);
CREATE INDEX IF NOT EXISTS idx_lich_hen_ngay_hen ON lich_hen(ngay_hen);
CREATE INDEX IF NOT EXISTS idx_thong_bao_nguoi_nhan_id ON thong_bao(nguoi_nhan_id);
CREATE INDEX IF NOT EXISTS idx_binh_luan_bai_dang_id ON binh_luan(bai_dang_id);
CREATE INDEX IF NOT EXISTS idx_profiles_so_dien_thoai ON profiles(so_dien_thoai);


-- BUOC 4: STORED PROCEDURES
-- ============================================================

-- 4.1. Stored Procedure Dat lich hen (atomic, chong race condition)
DROP FUNCTION IF EXISTS dat_lich_hen(UUID, UUID, DATE, TIME, TIME);
DROP FUNCTION IF EXISTS dat_lich_hen(UUID, DATE, TIME, TIME);

CREATE OR REPLACE FUNCTION dat_lich_hen(
  p_bai_dang_id UUID,
  p_ngay_hen DATE,
  p_gio_bat_dau TIME,
  p_gio_ket_thuc TIME
) RETURNS JSON AS $$
DECLARE
  ket_qua JSON;
  v_sinh_vien_id UUID := auth.uid();
  v_chu_tro_id UUID;
  v_duong TEXT;
  v_phuong TEXT;
  v_ten_sv TEXT;
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

  IF NOT EXISTS (
    SELECT 1 FROM lich_co_the_dat
    WHERE bai_dang_id = p_bai_dang_id
      AND ngay_hen = p_ngay_hen
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

  -- Gui thong bao den Chu tro
  SELECT chu_tro_id, duong, phuong INTO v_chu_tro_id, v_duong, v_phuong
  FROM bai_dang WHERE id = p_bai_dang_id;

  SELECT ho_ten INTO v_ten_sv FROM profiles WHERE id = v_sinh_vien_id;

  IF v_chu_tro_id IS NOT NULL THEN
    INSERT INTO thong_bao (nguoi_nhan_id, loai, noi_dung, lien_ket)
    VALUES (
      v_chu_tro_id,
      'co_lich_hen_moi',
      'Sinh viên ' || COALESCE(v_ten_sv, 'NĐT') || ' vừa đăng ký lịch hẹn xem phòng tại ' || COALESCE(v_duong, '') || ', ' || COALESCE(v_phuong, '') || ' vào ngày ' || to_char(p_ngay_hen, 'DD/MM/YYYY') || ' (' || to_char(p_gio_bat_dau, 'HH24:MI') || ' - ' || to_char(p_gio_ket_thuc, 'HH24:MI') || ').',
      '/chu-tro/lich-hen'
    );
  END IF;

  RETURN json_build_object('thanh_cong', TRUE, 'du_lieu', ket_qua);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2. Stored Procedure Chuyen trang thai da cho thue & xoa tat ca lich hen (Rule M & O & L)
CREATE OR REPLACE FUNCTION chuyen_trang_thai_da_cho_thue(p_bai_dang_id UUID)
RETURNS VOID AS $$
DECLARE
  rec RECORD;
BEGIN
  UPDATE bai_dang SET trang_thai = 'da_cho_thue' WHERE id = p_bai_dang_id;

  FOR rec IN 
    SELECT DISTINCT sinh_vien_id FROM lich_hen WHERE bai_dang_id = p_bai_dang_id
  LOOP
    INSERT INTO thong_bao (nguoi_nhan_id, loai, noi_dung)
    VALUES (rec.sinh_vien_id, 'da_tu_choi_lich', 'Bài đăng phòng trọ bạn đăng ký lịch hẹn đã chuyển sang trạng thái Đã cho thuê. Tất cả lịch hẹn liên quan đã tự động được hủy.');
  END LOOP;

  DELETE FROM lich_hen WHERE bai_dang_id = p_bai_dang_id;
  DELETE FROM lich_co_the_dat WHERE bai_dang_id = p_bai_dang_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.3. Stored Procedure Tu dong huy & xoa lich hen qua han (Vercel Cron Job)
CREATE OR REPLACE FUNCTION tu_dong_huy_lich_hen_qua_han()
RETURNS VOID AS $$
BEGIN
  DELETE FROM lich_hen
  WHERE ngay_hen < CURRENT_DATE
     OR (ngay_hen = CURRENT_DATE AND gio_ket_thuc < LOCALTIME);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- BUOC 5: HÀM KIỂM TRA ADMIN & BẬT RLS POLICIES
-- ============================================================

-- Hàm kiểm tra Admin bảo mật (SECURITY DEFINER bypass RLS chống lặp vô tận Postgres 42P17)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bai_dang ENABLE ROW LEVEL SECURITY;
ALTER TABLE lich_hen ENABLE ROW LEVEL SECURITY;
ALTER TABLE thong_bao ENABLE ROW LEVEL SECURITY;
ALTER TABLE binh_luan ENABLE ROW LEVEL SECURITY;
ALTER TABLE hinh_anh_bai_dang ENABLE ROW LEVEL SECURITY;
ALTER TABLE lich_co_the_dat ENABLE ROW LEVEL SECURITY;
ALTER TABLE banner ENABLE ROW LEVEL SECURITY;
ALTER TABLE cai_dat_he_thong ENABLE ROW LEVEL SECURITY;

-- 5.1. Profiles Policies (Không gọi subquery tới profiles để tránh lặp 42P17)
DROP POLICY IF EXISTS "doc_profile_cua_minh" ON profiles;
DROP POLICY IF EXISTS "cong_khai_doc_profile" ON profiles;
DROP POLICY IF EXISTS "admin_doc_tat_ca_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_cap_nhat_profiles" ON profiles;
DROP POLICY IF EXISTS "cap_nhat_profile_cua_minh" ON profiles;
DROP POLICY IF EXISTS "cong_khai_doc_profiles" ON profiles;
DROP POLICY IF EXISTS "user_sua_profile_cua_minh" ON profiles;
DROP POLICY IF EXISTS "admin_sua_moi_profile" ON profiles;

CREATE POLICY "cong_khai_doc_profiles" ON profiles FOR SELECT
  TO anon, authenticated
  USING (TRUE);

CREATE POLICY "user_sua_profile_cua_minh" ON profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "admin_sua_moi_profile" ON profiles FOR UPDATE
  TO authenticated
  USING (is_admin());

-- 5.2. Bai Dang Policies
DROP POLICY IF EXISTS "cong_khai_doc_bai" ON bai_dang;
CREATE POLICY "cong_khai_doc_bai" ON bai_dang FOR SELECT
  TO anon, authenticated
  USING (trang_thai IN ('con_trong', 'da_cho_thue'));

DROP POLICY IF EXISTS "chu_tro_doc_bai_cua_minh" ON bai_dang;
CREATE POLICY "chu_tro_doc_bai_cua_minh" ON bai_dang FOR SELECT
  TO authenticated
  USING (chu_tro_id = auth.uid());

DROP POLICY IF EXISTS "admin_doc_tat_ca_bai" ON bai_dang;
CREATE POLICY "admin_doc_tat_ca_bai" ON bai_dang FOR SELECT
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "chu_tro_them_bai" ON bai_dang;
CREATE POLICY "chu_tro_them_bai" ON bai_dang FOR INSERT
  TO authenticated
  WITH CHECK (
    chu_tro_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'chu_tro'
      AND (profiles.bi_han_gui_bai_den IS NULL OR profiles.bi_han_gui_bai_den < NOW())
    )
  );

DROP POLICY IF EXISTS "chu_tro_sua_bai_cua_minh" ON bai_dang;
CREATE POLICY "chu_tro_sua_bai_cua_minh" ON bai_dang FOR UPDATE
  TO authenticated
  USING (chu_tro_id = auth.uid())
  WITH CHECK (chu_tro_id = auth.uid());

DROP POLICY IF EXISTS "admin_sua_trang_thai_bai" ON bai_dang;
CREATE POLICY "admin_sua_trang_thai_bai" ON bai_dang FOR UPDATE
  TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "chu_tro_xoa_bai_cua_minh" ON bai_dang;
CREATE POLICY "chu_tro_xoa_bai_cua_minh" ON bai_dang FOR DELETE
  TO authenticated
  USING (chu_tro_id = auth.uid());

-- 5.3. Lich Hen Policies
DROP POLICY IF EXISTS "sv_doc_lich_cua_minh" ON lich_hen;
CREATE POLICY "sv_doc_lich_cua_minh" ON lich_hen FOR SELECT
  TO authenticated
  USING (sinh_vien_id = auth.uid());

DROP POLICY IF EXISTS "ct_doc_lich_bai_cua_minh" ON lich_hen;
CREATE POLICY "ct_doc_lich_bai_cua_minh" ON lich_hen FOR SELECT
  TO authenticated
  USING (
    bai_dang_id IN (
      SELECT id FROM bai_dang WHERE chu_tro_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sv_dat_lich" ON lich_hen;
CREATE POLICY "sv_dat_lich" ON lich_hen FOR INSERT
  TO authenticated
  WITH CHECK (sinh_vien_id = auth.uid());

DROP POLICY IF EXISTS "ct_cap_nhat_lich" ON lich_hen;
CREATE POLICY "ct_cap_nhat_lich" ON lich_hen FOR UPDATE
  TO authenticated
  USING (
    bai_dang_id IN (
      SELECT id FROM bai_dang WHERE chu_tro_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "sv_cap_nhat_lich_cua_minh" ON lich_hen;
CREATE POLICY "sv_cap_nhat_lich_cua_minh" ON lich_hen FOR UPDATE
  TO authenticated
  USING (sinh_vien_id = auth.uid())
  WITH CHECK (sinh_vien_id = auth.uid());

DROP POLICY IF EXISTS "admin_quan_ly_tat_ca_lich" ON lich_hen;
CREATE POLICY "admin_quan_ly_tat_ca_lich" ON lich_hen FOR ALL
  TO authenticated
  USING (is_admin());

-- Cho phep chu tro xoa lich hen cua bai dang thuoc so huu cua ho (khi danh dau Da cho thue)
DROP POLICY IF EXISTS "ct_xoa_lich_bai_cua_minh" ON lich_hen;
CREATE POLICY "ct_xoa_lich_bai_cua_minh" ON lich_hen FOR DELETE
  TO authenticated
  USING (
    bai_dang_id IN (
      SELECT id FROM bai_dang WHERE chu_tro_id = auth.uid()
    )
  );

-- 5.4. Thong Bao Policies
DROP POLICY IF EXISTS "doc_thong_bao_cua_minh" ON thong_bao;
CREATE POLICY "doc_thong_bao_cua_minh" ON thong_bao FOR SELECT
  TO authenticated
  USING (nguoi_nhan_id = auth.uid());

DROP POLICY IF EXISTS "them_thong_bao" ON thong_bao;
CREATE POLICY "them_thong_bao" ON thong_bao FOR INSERT
  TO authenticated
  WITH CHECK (TRUE);

DROP POLICY IF EXISTS "cap_nhat_thong_bao_cua_minh" ON thong_bao;
CREATE POLICY "cap_nhat_thong_bao_cua_minh" ON thong_bao FOR UPDATE
  TO authenticated
  USING (nguoi_nhan_id = auth.uid())
  WITH CHECK (nguoi_nhan_id = auth.uid());

DROP POLICY IF EXISTS "xoa_thong_bao_cua_minh" ON thong_bao;
CREATE POLICY "xoa_thong_bao_cua_minh" ON thong_bao FOR DELETE
  TO authenticated
  USING (nguoi_nhan_id = auth.uid());

-- 5.5. Binh Luan Policies
DROP POLICY IF EXISTS "binh_luan_doc" ON binh_luan;
CREATE POLICY "binh_luan_doc" ON binh_luan FOR SELECT
  TO anon, authenticated
  USING (TRUE);

DROP POLICY IF EXISTS "binh_luan_them" ON binh_luan;
CREATE POLICY "binh_luan_them" ON binh_luan FOR INSERT
  TO authenticated
  WITH CHECK (sinh_vien_id = auth.uid());

DROP POLICY IF EXISTS "binh_luan_xoa_cua_minh" ON binh_luan;
CREATE POLICY "binh_luan_xoa_cua_minh" ON binh_luan FOR DELETE
  TO authenticated
  USING (sinh_vien_id = auth.uid() OR is_admin());

-- 5.6. Hinh Anh & Banner Policies
DROP POLICY IF EXISTS "cong_khai_doc_hinh_anh" ON hinh_anh_bai_dang;
CREATE POLICY "cong_khai_doc_hinh_anh" ON hinh_anh_bai_dang FOR SELECT
  TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "cong_khai_doc_lich_co_the_dat" ON lich_co_the_dat;
CREATE POLICY "cong_khai_doc_lich_co_the_dat" ON lich_co_the_dat FOR SELECT
  TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "cong_khai_doc_banner" ON banner;
CREATE POLICY "cong_khai_doc_banner" ON banner FOR SELECT
  TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "cai_dat_he_thong_doc_cong_khai" ON cai_dat_he_thong;
CREATE POLICY "cai_dat_he_thong_doc_cong_khai" ON cai_dat_he_thong FOR SELECT
  TO anon, authenticated USING (TRUE);

DROP POLICY IF EXISTS "cai_dat_he_thong_quan_ly_admin" ON cai_dat_he_thong;
CREATE POLICY "cai_dat_he_thong_quan_ly_admin" ON cai_dat_he_thong FOR ALL
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_quan_ly_banner" ON banner;
CREATE POLICY "admin_quan_ly_banner" ON banner FOR ALL
  TO authenticated
  USING (is_admin());


-- ============================================================
-- BUOC 6: STORAGE BUCKETS & POLICIES
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('anh-phong-tro', 'anh-phong-tro', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('banner', 'banner', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "anh_phong_tro_doc_cong_khai" ON storage.objects;
CREATE POLICY "anh_phong_tro_doc_cong_khai" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'anh-phong-tro');

DROP POLICY IF EXISTS "banner_doc_cong_khai" ON storage.objects;
CREATE POLICY "banner_doc_cong_khai" ON storage.objects FOR SELECT
  TO anon, authenticated USING (bucket_id = 'banner');

DROP POLICY IF EXISTS "banner_upload_admin" ON storage.objects;
CREATE POLICY "banner_upload_admin" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'banner' AND is_admin());

DROP POLICY IF EXISTS "banner_xoa_admin" ON storage.objects;
CREATE POLICY "banner_xoa_admin" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'banner' AND is_admin());

DROP POLICY IF EXISTS "anh_phong_tro_upload" ON storage.objects;
CREATE POLICY "anh_phong_tro_upload" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'anh-phong-tro');


-- ============================================================
-- BUOC 7: KHOI TAO DU LIEU BANNER (Chữ trượt độc lập per banner)
-- ============================================================
INSERT INTO public.banner (thu_tu, url_anh, tieu_de, mo_ta, the_tags, lien_ket)
VALUES
  (
    1,
    '/banner-1.jpg',
    'Trọ Nẫu',
    'Nền tảng tìm kiếm phòng trọ uy tín, nhanh chóng & tiện lợi dành cho Sinh viên và Chủ trọ.',
    'Phòng trọ chính chủ, Đặt lịch trực tuyến, Gần các trường ĐH & CĐ Quy Nhơn',
    '/'
  ),
  (
    2,
    '/banner-2.jpg',
    'Đặt Lịch Xem Phòng Trực Tuyến',
    'Chủ động chọn khung giờ rảnh, gặp trực tiếp chủ trọ không qua trung gian môi giới.',
    'Xác nhận nhanh chóng, Không tốn phí, An tâm minh bạch',
    '/'
  ),
  (
    3,
    '/banner-3.jpg',
    'Đầy Đủ Tiện Nghi & An Ninh',
    'Danh sách phòng trọ đa dạng khu vực Quy Nhơn được kiểm duyệt kỹ càng, cập nhật liên tục.',
    'Giờ giấc tự do, An ninh đảm bảo, Giá cả hợp lý',
    '/'
  )
ON CONFLICT (thu_tu) DO UPDATE SET
  url_anh = EXCLUDED.url_anh,
  tieu_de = COALESCE(banner.tieu_de, EXCLUDED.tieu_de),
  mo_ta = COALESCE(banner.mo_ta, EXCLUDED.mo_ta),
  the_tags = COALESCE(banner.the_tags, EXCLUDED.the_tags);


-- ============================================================
-- BUOC 8: KHOI TAO DU LIEU CAI DAT HE THONG (Logo, Ten App, Phuong, Duong, Footer)
-- ============================================================
INSERT INTO public.cai_dat_he_thong (khoa, gia_tri)
VALUES
  (
    'ten_app',
    '"Trọ"'::jsonb
  ),
  (
    'sub_name',
    '"Nẫu"'::jsonb
  ),
  (
    'logo_url',
    '"/logo.png"'::jsonb
  ),
  (
    'danh_sach_phuong',
    '["Phường Quy Nhơn Nam", "Phường Quy Nhơn Bắc", "Phường Quy Nhơn", "Phường Quy Nhơn Đông", "Phường Quy Nhơn Tây"]'::jsonb
  ),
  (
    'danh_sach_duong',
    '["An Dương Vương", "Ngô Mây", "Nguyễn Thái Học", "Tây Sơn", "Chương Dương", "Nguyễn Trung Trực", "Võ Thị Sáu", "Diên Hồng", "Hàm Nghi", "Xuân Diệu", "Lý Thường Kiệt", "Lê Hồng Phong", "Nguyễn Tất Thành", "Hùng Vương", "Đào Tấn", "Điện Biên Phủ", "Nguyễn Huệ", "Trần Hưng Đạo", "Phan Bội Châu", "Võ Nguyên Giáp", "Bạch Đằng"]'::jsonb
  ),
  (
    'footer_mo_ta',
    '"Nền tảng tìm kiếm và đặt lịch hẹn xem phòng trọ uy tín, tiện lợi dành cho sinh viên tại Quy Nhơn."'::jsonb
  ),
  (
    'footer_sinh_vien',
    '["Tìm phòng trọ uy tín gần trường học", "Đặt lịch hẹn xem phòng trực tuyến", "Xem địa chỉ số nhà & SĐT chủ trọ khi được xác nhận"]'::jsonb
  ),
  (
    'footer_chu_tro',
    '["Đăng tin phòng trọ hoàn toàn miễn phí", "Quản lý lịch hẹn xem phòng của sinh viên", "Chủ động xác nhận hoặc từ chối lịch hẹn"]'::jsonb
  ),
  (
    'footer_ban_quyen',
    '"© 2026 Trọ Nẫu - Quy Nhơn. Bảo lưu mọi quyền."'::jsonb
  )
ON CONFLICT (khoa) DO UPDATE SET
  gia_tri = EXCLUDED.gia_tri,
  updated_at = NOW();


-- ============================================================
-- BUOC 9: THIET LAP TAI KHOAN QUAN TRI VIEN (ADMIN)
-- ============================================================
-- Buoc 1: Vao Supabase Dashboard > Authentication > Users > Nhan "Add User" > Tao user voi Email & Mat khau
-- Buoc 2: Copy UUID (ID) cua user vua tao, thay vao vi tri duoi day va chay cau lenh SQL:

-- INSERT INTO public.profiles (id, role, ho_ten, so_dien_thoai, email)
-- VALUES (
--   'uuid-cua-admin-trong-auth-users', -- Thay UUID thuc te cua user vua tao
--   'admin',
--   'Quản Trị Viên',
--   '0900000000',                     -- So dien thoai admin
--   'admin@tronau.vn'                -- Email admin
-- )
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';
