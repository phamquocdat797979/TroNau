export function kiemTraSoDienThoai(sdt: string): boolean {
  const cleanSdt = sdt.replace(/\s+/g, '').trim();
  return /^(0[35789][0-9]{8})$/.test(cleanSdt);
}

// Boc tach so nguyen tu chuoi tien thue
// Vi du: "2.500.000" -> 2500000
// Vi du: "Thoa thuan" -> null
export function bocTachGiaThueNumber(tienThue: string): number | null {
  const chuoi = tienThue.replace(/[.\s]/g, '').trim();
  if (/^\d+$/.test(chuoi)) {
    return parseInt(chuoi, 10);
  }
  return null;
}

export const laySoGiaThue = bocTachGiaThueNumber;

// Dinh dang tien Viet Nam
// Vi du: 2500000 -> "2.500.000"
export function dinhDangTienVN(so: number): string {
  return so.toLocaleString('vi-VN');
}

// Lay ten thu trong tuan
// 0=CN, 1=T2, ..., 6=T7
export function tenThuTrongTuan(thu: number): string {
  const tenThu = ['Chu nhat', 'Thu hai', 'Thu ba', 'Thu tu', 'Thu nam', 'Thu sau', 'Thu bay'];
  return tenThu[thu] ?? '';
}

// Dinh dang ngay YYYY-MM-DD -> DD/MM/YYYY
export function dinhDangNgay(ngay: string): string {
  const [nam, thang, ngayNum] = ngay.split('-');
  return `${ngayNum}/${thang}/${nam}`;
}

// Dinh dang gio HH:MM:SS -> HH:MM
export function dinhDangGio(gio: string): string {
  return gio.slice(0, 5);
}

// Tinh thoi gian con lai cho han gui bai
// Tra ve chuoi nhu "2 gio 30 phut"
export function tinhThoiGianConLai(denKhi: string): string {
  const now = new Date();
  const den = new Date(denKhi);
  const diffMs = den.getTime() - now.getTime();
  if (diffMs <= 0) return '0 phut';
  const gio = Math.floor(diffMs / (1000 * 60 * 60));
  const phut = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (gio > 0) return `${gio} gio ${phut} phut`;
  return `${phut} phut`;
}

// Lay ngay hom nay dinh dang YYYY-MM-DD (theo gio Viet Nam)
export function ngayHomNayVN(): string {
  const now = new Date();
  const vnTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
  const nam = vnTime.getFullYear();
  const thang = String(vnTime.getMonth() + 1).padStart(2, '0');
  const ngay = String(vnTime.getDate()).padStart(2, '0');
  return `${nam}-${thang}-${ngay}`;
}

// Kiem tra email hop le
export function kiemTraEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Dinh dang ten Phuong/Xa dam bao khong bi lap tu "Phuong" hoac "P."
export function dinhDangPhuong(phuongRaw?: string): string {
  if (!phuongRaw) return '';
  const tenNgan = phuongRaw.split(' (')[0].trim();
  if (/^(phường|p\.)\s+/i.test(tenNgan)) {
    return tenNgan.replace(/^(phường|p\.)\s+/i, 'Phường ');
  }
  return `Phường ${tenNgan}`;
}

// Dinh dang ten Duong dam bao co chu "Duong"
export function dinhDangDuong(duongRaw?: string): string {
  if (!duongRaw) return '';
  const tenNgan = duongRaw.split(' (')[0].trim();
  if (/^(đường|đ\.)\s+/i.test(tenNgan)) {
    return tenNgan.replace(/^(đường|đ\.)\s+/i, 'Đường ');
  }
  return `Đường ${tenNgan}`;
}

