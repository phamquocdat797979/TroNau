'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { CAI_DAT_MAC_DINH } from '@/lib/caiDat';
import type { CaiDatHeThong } from '@/types';

interface CaiDatContextType {
  caiDat: CaiDatHeThong;
  taiLaiCaiDat: () => Promise<void>;
  dangTai: boolean;
}

const CaiDatContext = createContext<CaiDatContextType>({
  caiDat: CAI_DAT_MAC_DINH,
  taiLaiCaiDat: async () => {},
  dangTai: false,
});

export function CaiDatProvider({ children }: { children: React.ReactNode }) {
  const [caiDat, setCaiDat] = useState<CaiDatHeThong>(CAI_DAT_MAC_DINH);
  const [dangTai, setDangTai] = useState(true);

  async function taiLaiCaiDat() {
    try {
      const res = await fetch(`/api/cai-dat?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.caiDat) {
          setCaiDat(data.caiDat);
        }
      }
    } catch (err) {
      console.error('Lỗi tải cài đặt hệ thống:', err);
    } finally {
      setDangTai(false);
    }
  }

  useEffect(() => {
    taiLaiCaiDat();
  }, []);

  return (
    <CaiDatContext.Provider value={{ caiDat, taiLaiCaiDat, dangTai }}>
      {children}
    </CaiDatContext.Provider>
  );
}

export function useCaiDat() {
  return useContext(CaiDatContext);
}
