// Tất cả TypeScript interfaces cho dự án Trọ Nẫu

export type VaiTro = 'sinh_vien' | 'chu_tro' | 'admin';

export type TrangThaiBaiDang = 'cho_duyet' | 'bi_tu_choi' | 'con_trong' | 'da_cho_thue';

export type TrangThaiLichHen = 'cho_xac_nhan' | 'da_xac_nhan' | 'huy_sau_xac_nhan';

export type LoaiThongBao =
  | 'lich_hen_moi'
  | 'da_xac_nhan'
  | 'da_tu_choi_lich'
  | 'huy_sau_xac_nhan'
  | 'bai_duyet'
  | 'bai_tu_choi'
  | 'bai_bi_xoa'
  | 'bai_cho_duyet_lai';

export interface Profile {
  id: string;
  role: VaiTro;
  ho_ten: string;
  so_dien_thoai: string;
  email: string | null;
  bi_han_gui_bai_den: string | null;
  tong_lan_bi_tu_choi_trong_han: number;
  created_at: string;
}

export interface BaiDang {
  id: string;
  chu_tro_id: string;
  trang_thai: TrangThaiBaiDang;
  khung_gio_bi_khoa: boolean;
  so_nha: string | null;
  duong: string;
  phuong: string;
  tien_thue: string;
  gia_thue_so: number | null;
  tien_nuoc: string | null;
  tien_dien: string | null;
  phi_khac: string | null;
  ghi_chu: string | null;
  ngay_trong_du_kien: string | null;
  ly_do_tu_choi: string | null;
  co_lich_hen?: boolean;
  created_at: string;
  updated_at: string;
}

// BaiDang voi thong tin join (danh sach bai, khong co so_nha)
export interface BaiDangCard {
  id: string;
  trang_thai: TrangThaiBaiDang;
  duong: string;
  phuong: string;
  tien_thue: string;
  gia_thue_so: number | null;
  tien_nuoc?: string | null;
  tien_dien?: string | null;
  phi_khac?: string | null;
  ghi_chu: string | null;
  ngay_trong_du_kien?: string | null;
  created_at: string;
  updated_at?: string | null;
  anh_dai_dien: string | null; // url cua hinh_anh co thu_tu = 1
  co_lich_hen?: boolean;
  chu_tro: {
    ho_ten: string;
    so_dien_thoai?: string | null;
  };
}

// BaiDang day du (chi tiet - khong co so_nha cho cong khai)
export interface BaiDangCongKhai extends BaiDangCard {
  tien_nuoc: string | null;
  tien_dien: string | null;
  phi_khac: string | null;
  ngay_trong_du_kien: string | null;
  hinh_anh: HinhAnhBaiDang[];
  lich_co_the_dat: LichCoTheDat[];
}

// BaiDang day du co so_nha (chi tra cho sinh vien da xac nhan lich)
export interface BaiDangDayDu extends BaiDangCongKhai {
  so_nha: string | null;
  chu_tro_sdt: string;
}

export interface HinhAnhBaiDang {
  id: string;
  bai_dang_id: string;
  url: string;
  thu_tu: number;
}

export interface LichCoTheDat {
  id: string;
  bai_dang_id: string;
  ngay_hen: string; // YYYY-MM-DD
  gio_bat_dau: string; // HH:MM:SS
  gio_ket_thuc: string;
}

export interface LichHen {
  id: string;
  bai_dang_id: string;
  sinh_vien_id: string;
  ngay_hen: string; // YYYY-MM-DD
  gio_bat_dau: string;
  gio_ket_thuc: string;
  trang_thai: TrangThaiLichHen;
  created_at: string;
  // Join data
  bai_dang?: {
    duong: string;
    phuong: string;
    tien_thue: string;
    chu_tro?: {
      ho_ten: string;
      so_dien_thoai: string;
    };
  };
  sinh_vien?: {
    ho_ten: string;
    so_dien_thoai: string;
  };
}

export interface BinhLuan {
  id: string;
  bai_dang_id: string;
  sinh_vien_id: string;
  noi_dung: string;
  created_at: string;
  sinh_vien?: {
    ho_ten: string;
  };
}

export interface ThongBao {
  id: string;
  nguoi_nhan_id: string;
  loai: LoaiThongBao;
  noi_dung: string;
  lien_ket: string | null;
  da_doc: boolean;
  created_at: string;
}

export interface Banner {
  id: string;
  url_anh: string;
  thu_tu: number;
  tieu_de?: string | null;
  mo_ta?: string | null;
  the_tags?: string | null;
  lien_ket: string | null;
  updated_at: string;
}

export interface CaiDatHeThong {
  ten_app: string;
  sub_name: string;
  logo_url: string;
  danh_sach_phuong: string[];
  danh_sach_duong: string[];
  footer_mo_ta: string;
  footer_sinh_vien: string[];
  footer_chu_tro: string[];
  footer_ban_quyen: string;
}

// Bo loc trang chu
export interface BoLocPhong {
  gia_tu?: number;
  gia_den?: number;
  duong?: string;
  phuong?: string;
  trang_thai?: 'con_trong' | 'da_cho_thue' | '';
  trang?: number;
}

// Ket qua dat lich tu stored procedure
export interface KetQuaDatLich {
  loi?: string;
  thanh_cong?: boolean;
  du_lieu?: LichHen;
}
