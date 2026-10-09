'use client';

import Link from 'next/link';
import Image from 'next/image';
import Badge from '@/components/Badge/Badge';
import type { BaiDangCard } from '@/types';
import { dinhDangDuong, dinhDangPhuong } from '@/lib/utils';
import styles from './TheBaiDang.module.css';

interface Props {
  baiDang: BaiDangCard;
}

function formatNgay(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function TheBaiDang({ baiDang }: Props) {
  const textDuong = dinhDangDuong(baiDang.duong);
  const textPhuong = dinhDangPhuong(baiDang.phuong);

  // Ngay dang duoc tinh tu thoi gian thuc luc Admin phe duyet (updated_at)
  const ngayDangThucTe = baiDang.updated_at || baiDang.created_at;

  return (
    <Link href={`/phong-tro/${baiDang.id}`} className={styles.the_bai}>
      {/* ANH BEN TRAI */}
      <div className={styles.khung_anh}>
        {baiDang.anh_dai_dien ? (
          <Image
            src={baiDang.anh_dai_dien}
            alt={`Phòng trọ tại ${textDuong}`}
            fill
            sizes="280px"
            className={styles.anh_phong}
          />
        ) : (
          <div className={styles.anh_mac_dinh}>Chưa có ảnh</div>
        )}
        <div className={styles.huy_hieu_trang_thai}>
          <Badge trangThai={baiDang.trang_thai} loai="bai_dang" />
          {baiDang.trang_thai === 'con_trong' && (
            <span
              style={{
                background: baiDang.co_lich_hen ? '#e8f5e9' : '#ffebee',
                color: baiDang.co_lich_hen ? '#2e7d32' : '#c62828',
                border: baiDang.co_lich_hen ? '1px solid #81c784' : '1px solid #e57373',
                padding: '3px 8px',
                borderRadius: 'var(--bo-vua)',
                fontSize: '0.75rem',
                fontWeight: '700',
                boxShadow: '0 2px 4px rgba(0,0,0,0.12)',
              }}
            >
              {baiDang.co_lich_hen ? 'Còn lịch hẹn' : 'Hết lịch hẹn'}
            </span>
          )}
        </div>
      </div>

      {/* NOI DUNG BEN PHAI */}
      <div className={styles.noi_dung}>
        <h3 className={styles.dia_chi}>
          {textDuong}, {textPhuong}
        </h3>

        <div className={styles.gia_thue}>
          {baiDang.tien_thue} <span style={{ fontSize: '0.85rem', fontWeight: '400' }}>/tháng</span>
        </div>

        {/* CHI PHI DIEN NUOC DICH VU KHAC */}
        <div className={styles.hang_chi_phi}>
          <span>Nước: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.tien_nuoc || 'Theo thực tế'}</strong></span>
          <span>Điện: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.tien_dien || 'Theo thực tế'}</strong></span>
          <span>Phí khác: <strong style={{ color: 'var(--chu-chinh)' }}>{baiDang.phi_khac || 'Không'}</strong></span>
        </div>

        <div className={styles.hang_meta}>
          <span className={styles.meta_item}>
            Chủ trọ: <strong style={{ color: 'var(--chu-chinh)', marginLeft: 4 }}>{baiDang.chu_tro?.ho_ten || 'Chưa cập nhật'}</strong>
          </span>
          <span className={styles.meta_item}>
            Đăng ngày: {formatNgay(ngayDangThucTe)}
          </span>
        </div>

        {baiDang.trang_thai === 'da_cho_thue' && baiDang.ngay_trong_du_kien && (
          <div className={styles.ngay_trong_note}>
            Dự kiến trống: {baiDang.ngay_trong_du_kien}
          </div>
        )}

        {baiDang.ghi_chu && (
          <p className={styles.ghi_chu}>{baiDang.ghi_chu}</p>
        )}
      </div>
    </Link>
  );
}
