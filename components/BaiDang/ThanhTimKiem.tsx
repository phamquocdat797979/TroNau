'use client';

import { useState } from 'react';
import type { BoLocPhong } from '@/types';
import { useCaiDat } from '@/context/CaiDatContext';
import styles from './ThanhTimKiem.module.css';

interface Props {
  onTimKiem: (boLoc: BoLocPhong) => void;
  onDatLai: () => void;
}

const TRANG_THAI_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'con_trong', label: 'Còn trống' },
  { value: 'da_cho_thue', label: 'Đã cho thuê' },
];

export default function ThanhTimKiem({ onTimKiem, onDatLai }: Props) {
  const { caiDat } = useCaiDat();
  const [phuong, setPhuong] = useState('');
  const [duong, setDuong] = useState('');
  const [trangThai, setTrangThai] = useState<'con_trong' | 'da_cho_thue' | ''>('');

  const dsPhuong = caiDat.danh_sach_phuong || [];
  const dsDuong = caiDat.danh_sach_duong || [];

  function xuLyGui(e: React.FormEvent) {
    e.preventDefault();
    onTimKiem({
      phuong: phuong || undefined,
      duong: duong || undefined,
      trang_thai: trangThai || undefined,
      trang: 1,
    });
  }

  function xuLyDatLai() {
    setPhuong('');
    setDuong('');
    setTrangThai('');
    onDatLai();
  }

  function xuLyChonTrangThai(val: 'con_trong' | 'da_cho_thue' | '') {
    setTrangThai(val);
    onTimKiem({
      phuong: phuong || undefined,
      duong: duong || undefined,
      trang_thai: val || undefined,
      trang: 1,
    });
  }

  return (
    <form onSubmit={xuLyGui} className={styles.khung_tim_kiem}>
      {/* Tab lọc trạng thái dạng pill */}
      <div className={styles.nhom_tab_trang_thai}>
        {TRANG_THAI_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`${styles.tab_trang_thai} ${trangThai === opt.value ? styles.tab_active : ''}`}
            onClick={() => xuLyChonTrangThai(opt.value as any)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Dropdown Chọn Phường */}
      <div className={styles.o_nhap}>
        <select
          id="phuong"
          value={phuong}
          onChange={(e) => setPhuong(e.target.value)}
          aria-label="Chọn Phường"
        >
          <option value="">Tất cả Phường</option>
          {dsPhuong.map((p) => {
            const phuongNgan = p.split(' (')[0].trim();
            return (
              <option key={p} value={p}>
                {phuongNgan}
              </option>
            );
          })}
        </select>
      </div>

      {/* Dropdown Chọn Tuyến đường */}
      <div className={styles.o_nhap}>
        <select
          id="duong"
          value={duong}
          onChange={(e) => setDuong(e.target.value)}
          aria-label="Chọn Tuyến đường"
        >
          <option value="">Tất cả Tuyến đường</option>
          {dsDuong.map((d) => {
            const duongNgan = d.split(' (')[0].trim();
            return (
              <option key={d} value={d}>
                {duongNgan}
              </option>
            );
          })}
        </select>
      </div>

      {/* Các nút thao tác */}
      <div className={styles.cac_nut_thao_tac}>
        <button type="submit" className={styles.nut_tim}>
          Tìm kiếm
        </button>
        <button type="button" onClick={xuLyDatLai} className={styles.nut_dat_lai}>
          Đặt lại
        </button>
      </div>
    </form>
  );
}
