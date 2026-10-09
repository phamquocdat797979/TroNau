'use client';

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

export interface ThongBaoToast {
  id: string;
  loai: 'thanh_cong' | 'loi' | 'canh_bao' | 'thong_tin';
  noiDung: string;
}

let listener: ((toast: ThongBaoToast) => void) | null = null;

export function hienToast(noiDung: string, loai: ThongBaoToast['loai'] = 'thanh_cong') {
  if (listener) {
    listener({
      id: Math.random().toString(36).substring(2, 9),
      loai,
      noiDung,
    });
  }
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ThongBaoToast[]>([]);

  useEffect(() => {
    listener = (moi) => {
      setToasts((prev) => [...prev, moi]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== moi.id));
      }, 4000);
    };

    return () => {
      listener = null;
    };
  }, []);

  function xoaToast(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  if (toasts.length === 0) return null;

  return (
    <div className={styles.toast_container}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${styles.toast} ${styles[`toast_${t.loai}`]}`}
        >
          <span>{t.noiDung}</span>
          <button className={styles.nut_dong} onClick={() => xoaToast(t.id)}>
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
