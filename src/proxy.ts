import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Proxy (antes "middleware") — SOLO se ejecuta en /admin.
 * 1. Refresca la sesión de Supabase (cookies httpOnly).
 * 2. Si no hay usuario administrador → redirige al login.
 * Es la primera capa; el layout del panel y cada Server Action vuelven
 * a verificar, y RLS en la base de datos es la última barrera.
 */
export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!url || !key) {
    if (isLogin) return NextResponse.next();
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, key, {
    cookieOptions,
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, { ...options, ...cookieOptions });
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data } = await supabase.from("admin_users").select("user_id").eq("user_id", user.id).maybeSingle();
    isAdmin = Boolean(data);
  }

  if (!isLogin && !isAdmin) {
    const redirect = NextResponse.redirect(new URL("/admin/login", request.url));
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }

  if (isLogin && isAdmin) {
    const redirect = NextResponse.redirect(new URL("/admin", request.url));
    for (const c of response.cookies.getAll()) redirect.cookies.set(c);
    return redirect;
  }

  return response;
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
