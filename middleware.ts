import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const duongDan = request.nextUrl.pathname;

  // Chua dang nhap -> chuyen ve trang dang nhap
  if (!user) {
    const urlDangNhap = new URL('/dang-nhap', request.url);
    urlDangNhap.searchParams.set('tiep_theo', duongDan);
    return NextResponse.redirect(urlDangNhap);
  }

  // Lay role tu database
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role;

  // Bao ve khu vuc Admin
  if (duongDan.startsWith('/admin')) {
    if (role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Bao ve khu vuc Sinh vien
  if (duongDan.startsWith('/sinh-vien')) {
    if (role !== 'sinh_vien') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Bao ve khu vuc Chu tro
  if (duongDan.startsWith('/chu-tro')) {
    if (role !== 'chu_tro') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}

// Chi chay middleware tren cac route can bao ve
// KHONG chay tren file tinh, _next, favicon
export const config = {
  matcher: [
    '/sinh-vien/:path*',
    '/chu-tro/:path*',
    '/admin/:path*',
  ],
};
