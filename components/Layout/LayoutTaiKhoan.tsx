'use client';

import Header from '@/components/Header/Header';
import Footer from '@/components/Footer/Footer';
import ToastContainer from '@/components/Toast/Toast';
import NavNgang from '@/components/NavNgang/NavNgang';
import type { Profile } from '@/types';
import styles from './LayoutTaiKhoan.module.css';

interface LayoutTaiKhoanProps {
  children: React.ReactNode;
  profile?: Profile | null;
}

export default function LayoutTaiKhoan({ children, profile }: LayoutTaiKhoanProps) {
  return (
    <>
      <Header />
      <NavNgang profile={profile} />
      <ToastContainer />
      <main className={styles.khung_trang}>
        <div className="container">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
