'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LayoutTaiKhoan from '@/components/Layout/LayoutTaiKhoan';
import { taoSupabaseClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { hienToast } from '@/components/Toast/Toast';
import type { ThongBao } from '@/types';

export default function TrangThongBao() {
  const router = useRouter();
  const supabase = taoSupabaseClient();
  const { capNhatSoChuaDoc } = useAuth();
  const [thongBaos, setThongBaos] = useState<ThongBao[]>([]);
  const [dangTai, setDangTai] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function taiThongBao() {
      setDangTai(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/dang-nhap');
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from('thong_bao')
        .select('*')
        .eq('nguoi_nhan_id', user.id)
        .order('created_at', { ascending: false });

      if (data) setThongBaos(data as ThongBao[]);

      // Danh dau tat ca la da doc
      await supabase
        .from('thong_bao')
        .update({ da_doc: true })
        .eq('nguoi_nhan_id', user.id)
        .eq('da_doc', false);

      // Cap nhat lai so chua doc tren header/sidebar ve 0
      await capNhatSoChuaDoc();

      setDangTai(false);
    }
    taiThongBao();
  }, []);

  async function xoaMotThongBao(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    const { error } = await supabase.from('thong_bao').delete().eq('id', id);
    if (error) {
      hienToast('Không thể xóa thông báo', 'loi');
      return;
    }
    setThongBaos((prev) => prev.filter((tb) => tb.id !== id));
    await capNhatSoChuaDoc();
    hienToast('Đã xóa thông báo', 'thanh_cong');
  }

  async function xoaTatCaThongBao() {
    if (!userId || thongBaos.length === 0) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo không?')) return;

    const { error } = await supabase
      .from('thong_bao')
      .delete()
      .eq('nguoi_nhan_id', userId);

    if (error) {
      hienToast('Lỗi khi xóa tất cả thông báo', 'loi');
      return;
    }

    setThongBaos([]);
    await capNhatSoChuaDoc();
    hienToast('Đã xóa tất cả thông báo', 'thanh_cong');
  }

  return (
    <LayoutTaiKhoan>
      <div style={{ background: '#fff', padding: '28px', borderRadius: 'var(--bo-vua)', border: '1px solid var(--vien-nhat)', boxShadow: 'var(--bong-nho)' }}>
        {thongBaos.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={xoaTatCaThongBao}
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: '600',
                background: 'var(--nguy-hiem-nhat)',
                color: 'var(--nguy-hiem)',
                border: '1px solid rgba(198, 40, 40, 0.2)',
                borderRadius: 'var(--bo-vua)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Xóa tất cả thông báo
            </button>
          </div>
        )}

        {dangTai ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải thông báo...</div>
        ) : thongBaos.length === 0 ? (
          <div style={{ padding: '40px', borderRadius: 'var(--bo-vua)', textAlign: 'center', color: 'var(--chu-phu)', background: 'var(--nen-xam)' }}>
            Bạn chưa có thông báo nào.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {thongBaos.map((tb) => (
              <div
                key={tb.id}
                style={{
                  background: 'var(--nen-xam)',
                  borderRadius: 'var(--bo-vua)',
                  padding: '16px 20px',
                  border: '1px solid var(--vien-nhat)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', color: 'var(--chu-chinh)', marginBottom: '6px', lineHeight: '1.5' }}>
                    {tb.noi_dung}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--chu-phu)' }}>
                    {new Date(tb.created_at).toLocaleString('vi-VN')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                  {tb.lien_ket && (
                    <a
                      href={tb.lien_ket}
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.825rem',
                        fontWeight: '600',
                        color: 'var(--mau-la)',
                        background: 'var(--mau-la-nhat)',
                        borderRadius: 'var(--bo-vua)',
                        textDecoration: 'none',
                        border: '1px solid rgba(45, 106, 79, 0.25)',
                      }}
                    >
                      Xem chi tiết
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={(e) => xoaMotThongBao(tb.id, e)}
                    title="Xóa thông báo này"
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      color: 'var(--nguy-hiem)',
                      background: 'var(--nguy-hiem-nhat)',
                      border: '1px solid rgba(198, 40, 40, 0.2)',
                      borderRadius: 'var(--bo-vua)',
                      cursor: 'pointer',
                    }}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </LayoutTaiKhoan>
  );
}
