import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AdminUser = {
  id: string;
  email?: string | null;
};

async function hasAdminAccess(
  supabase: ReturnType<typeof createServerClient>,
  user: AdminUser
) {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return false;
    }

    return data?.role === "admin";
  } catch {
    return false;
  }
}

function copySupabaseCookies(
  fromResponse: NextResponse,
  toResponse: NextResponse
) {
  fromResponse.cookies.getAll().forEach((cookie) => {
    toResponse.cookies.set(cookie);
  });
}

function redirectToLogin(
  request: NextRequest,
  supabaseResponse: NextResponse,
  error?: "unauthorized"
) {
  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";

  if (error) {
    url.searchParams.set("error", error);
  }

  const redirectResponse = NextResponse.redirect(url);
  copySupabaseCookies(supabaseResponse, redirectResponse);
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });
  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/admin/login";
  const isDashboardRoute = pathname.startsWith("/admin/dashboard");

  if (!pathname.startsWith("/admin")) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    if (isDashboardRoute) {
      return redirectToLogin(request, supabaseResponse);
    }

    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      }
    }
  });

  let user: AdminUser | null = null;

  try {
    const {
      data: { user: currentUser }
    } = await supabase.auth.getUser();

    user = currentUser as AdminUser | null;
  } catch {
    user = null;
  }

  const isAdmin = user ? await hasAdminAccess(supabase, user) : false;

  if (isLoginRoute && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    copySupabaseCookies(supabaseResponse, redirectResponse);
    return redirectResponse;
  }

  if (isDashboardRoute && !user) {
    return redirectToLogin(request, supabaseResponse);
  }

  if (isDashboardRoute && !isAdmin) {
    return redirectToLogin(request, supabaseResponse, "unauthorized");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)"
  ]
};
