'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { taoSupabaseClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  soChuaDoc: number;
  dangTaiAuth: boolean;
  lamMoiAuth: () => Promise<void>;
  capNhatSoChuaDoc: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  soChuaDoc: 0,
  dangTaiAuth: true,
  lamMoiAuth: async () => {},
  capNhatSoChuaDoc: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = taoSupabaseClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [soChuaDoc, setSoChuaDoc] = useState(0);
  const [dangTaiAuth, setDangTaiAuth] = useState(true);

  const loadProfileForUser = useCallback(async (u: User) => {
    try {
      let { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', u.id)
        .maybeSingle();

      // Neu user ton tai trong Auth nhung chua co trong profiles table -> Tu dong khoi tao profile
      if (!profileData) {
        const roleFromMeta = u.user_metadata?.role || (u.email?.includes('admin') ? 'admin' : 'sinh_vien');
        const hoTenFromMeta = u.user_metadata?.ho_ten || (roleFromMeta === 'admin' ? 'Quản Trị Viên Hệ Thống' : 'Người dùng');
        const sdtFromMeta = u.user_metadata?.so_dien_thoai || '';

        const { data: newProfile } = await supabase
          .from('profiles')
          .upsert({
            id: u.id,
            role: roleFromMeta,
            ho_ten: hoTenFromMeta,
            so_dien_thoai: sdtFromMeta,
            email: u.email,
          })
          .select('*')
          .maybeSingle();

        if (newProfile) profileData = newProfile;
      }

      if (profileData) {
        setProfile(profileData as Profile);

        const { count } = await supabase
          .from('thong_bao')
          .select('*', { count: 'exact', head: true })
          .eq('nguoi_nhan_id', u.id)
          .eq('da_doc', false);

        setSoChuaDoc(count ?? 0);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }, [supabase]);

  const taiThongTinAuth = useCallback(async () => {
    try {
      setDangTaiAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      if (currentUser) {
        await loadProfileForUser(currentUser);
      } else {
        setProfile(null);
        setSoChuaDoc(0);
      }
    } catch (err) {
      console.error('Lỗi AuthContext:', err);
    } finally {
      setDangTaiAuth(false);
    }
  }, [supabase, loadProfileForUser]);

  useEffect(() => {
    taiThongTinAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (session?.user) {
        setUser(session.user);
        await loadProfileForUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setSoChuaDoc(0);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, taiThongTinAuth, loadProfileForUser]);

  async function capNhatSoChuaDoc() {
    if (user) {
      const { count } = await supabase
        .from('thong_bao')
        .select('*', { count: 'exact', head: true })
        .eq('nguoi_nhan_id', user.id)
        .eq('da_doc', false);
      setSoChuaDoc(count ?? 0);
    }
  }

  // Tự động kiểm tra và cập nhật số lượng thông báo chưa đọc định kỳ (Realtime/Polling 6 giây)
  useEffect(() => {
    if (!user) return;
    const timer = setInterval(() => {
      capNhatSoChuaDoc();
    }, 6000);
    return () => clearInterval(timer);
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        soChuaDoc,
        dangTaiAuth,
        lamMoiAuth: taiThongTinAuth,
        capNhatSoChuaDoc,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

