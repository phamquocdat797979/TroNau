'use client';

import { useCaiDat } from '@/context/CaiDatContext';
import styles from './Footer.module.css';

interface FooterProps {
  previewData?: {
    ten_app?: string;
    sub_name?: string;
    footer_mo_ta?: string;
    footer_sinh_vien?: string[];
    footer_chu_tro?: string[];
    footer_ban_quyen?: string;
  };
}

export default function Footer({ previewData }: FooterProps) {
  const { caiDat } = useCaiDat();

  const data = {
    ten_app: previewData?.ten_app ?? caiDat.ten_app,
    sub_name: previewData?.sub_name ?? caiDat.sub_name,
    footer_mo_ta: previewData?.footer_mo_ta ?? caiDat.footer_mo_ta,
    footer_sinh_vien: previewData?.footer_sinh_vien ?? caiDat.footer_sinh_vien,
    footer_chu_tro: previewData?.footer_chu_tro ?? caiDat.footer_chu_tro,
    footer_ban_quyen: previewData?.footer_ban_quyen ?? caiDat.footer_ban_quyen,
  };

  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.noi_dung}>
          <div className={styles.cot_thu_nhat}>
            <h3>
              {data.ten_app || 'Trọ'}{' '}
              <span style={{ color: '#a8e6cf', fontWeight: 700 }}>{data.sub_name || 'Nẫu'}</span>
            </h3>
            <p>{data.footer_mo_ta || 'Mô tả ngắn thương hiệu hiển thị ở đây...'}</p>
          </div>

          <div>
            <h4 className={styles.tieu_de_cot}>Dành cho Sinh viên</h4>
            <ul className={styles.danh_sach_text}>
              {(data.footer_sinh_vien && data.footer_sinh_vien.length > 0) ? (
                data.footer_sinh_vien.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))
              ) : (
                <li style={{ fontStyle: 'italic', opacity: 0.6 }}>Chưa có nội dung...</li>
              )}
            </ul>
          </div>

          <div>
            <h4 className={styles.tieu_de_cot}>Dành cho Chủ trọ</h4>
            <ul className={styles.danh_sach_text}>
              {(data.footer_chu_tro && data.footer_chu_tro.length > 0) ? (
                data.footer_chu_tro.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))
              ) : (
                <li style={{ fontStyle: 'italic', opacity: 0.6 }}>Chưa có nội dung...</li>
              )}
            </ul>
          </div>
        </div>

        <div className={styles.ban_quyen}>
          {data.footer_ban_quyen || '© 2026 Trọ Nẫu - Quy Nhơn.'}
        </div>
      </div>
    </footer>
  );
}

