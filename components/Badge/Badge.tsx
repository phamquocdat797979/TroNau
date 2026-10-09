import type { TrangThaiBaiDang, TrangThaiLichHen } from '@/types';
import styles from './Badge.module.css';

interface Props {
  trangThai: TrangThaiBaiDang | TrangThaiLichHen;
  loai?: 'bai_dang' | 'lich_hen';
}

const NHAN_BAI_DANG: Record<TrangThaiBaiDang, string> = {
  con_trong: 'Còn trống',
  da_cho_thue: 'Đã cho thuê',
  cho_duyet: 'Chờ duyệt',
  bi_tu_choi: 'Bị từ chối',
};

const NHAN_LICH_HEN: Record<TrangThaiLichHen, string> = {
  cho_xac_nhan: 'Chờ xác nhận',
  da_xac_nhan: 'Đã xác nhận',
  huy_sau_xac_nhan: 'Hủy sau xác nhận',
};

export default function Badge({ trangThai, loai = 'bai_dang' }: Props) {
  const nhan = loai === 'bai_dang'
    ? NHAN_BAI_DANG[trangThai as TrangThaiBaiDang]
    : NHAN_LICH_HEN[trangThai as TrangThaiLichHen];

  const className = `${styles.badge} ${styles[trangThai] || ''}`;

  return (
    <span className={className}>
      {nhan || trangThai}
    </span>
  );
}
