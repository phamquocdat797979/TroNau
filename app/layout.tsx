import type { Metadata } from 'next';
import { AuthProvider } from '@/context/AuthContext';
import { CaiDatProvider } from '@/context/CaiDatContext';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Trọ Nẫu - Tìm phòng trọ tại Quy Nhơn',
    template: '%s | Trọ Nẫu',
  },
  description:
    'Tìm kiếm phòng trọ uy tín tại Quy Nhơn, Bình Định. Đăng tin phòng trọ miễn phí, đặt lịch xem phòng trực tuyến.',
  keywords: 'phong tro quy nhon, binh dinh, tim tro, nha tro',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>
          <CaiDatProvider>{children}</CaiDatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
