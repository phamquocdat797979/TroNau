import { DANH_SACH_PHUONG_QUY_NHON, DANH_SACH_DUONG_QUY_NHON } from './constants';
import type { CaiDatHeThong } from '@/types';

export const CAI_DAT_MAC_DINH: CaiDatHeThong = {
  ten_app: 'Trọ',
  sub_name: 'Nẫu',
  logo_url: '/logo.png',
  danh_sach_phuong: DANH_SACH_PHUONG_QUY_NHON,
  danh_sach_duong: DANH_SACH_DUONG_QUY_NHON,
  footer_mo_ta: 'Nền tảng tìm kiếm và đặt lịch hẹn xem phòng trọ uy tín, tiện lợi dành cho sinh viên tại Quy Nhơn.',
  footer_sinh_vien: [
    'Tìm phòng trọ uy tín gần trường học',
    'Đặt lịch hẹn xem phòng trực tuyến',
    'Xem địa chỉ số nhà & SĐT chủ trọ khi được xác nhận',
  ],
  footer_chu_tro: [
    'Đăng tin phòng trọ hoàn toàn miễn phí',
    'Quản lý lịch hẹn xem phòng của sinh viên',
    'Chủ động xác nhận hoặc từ chối lịch hẹn',
  ],
  footer_ban_quyen: '© 2026 Trọ Nẫu - Quy Nhơn. Bảo lưu mọi quyền.',
};
