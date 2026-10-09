'use client';

import { useEffect, type ReactNode } from 'react';
import styles from './Modal.module.css';

interface Props {
  hienThi: boolean;
  tieuDe: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ hienThi, tieuDe, onClose, children }: Props) {
  useEffect(() => {
    if (hienThi) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [hienThi]);

  if (!hienThi) return null;

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.dau_modal}>
          <h3 className={styles.tieu_de}>{tieuDe}</h3>
          <button className={styles.nut_dong} onClick={onClose} aria-label="Đóng">
            ×
          </button>
        </div>
        <div className={styles.than_modal}>
          {children}
        </div>
      </div>
    </div>
  );
}
