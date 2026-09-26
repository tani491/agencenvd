import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type AdminUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
};

function hasAdminMetadata(metadata?: Record<string, unknown> | null) {
  const role = metadata?.role;
  const roles = metadata?.roles;

  return role === "admin" || (Array.isArray(roles) && roles.includes("admin"));
}

function isAllowlistedAdminEmail(email?: string | null) {
  const allowlist = new Set(
    (process.env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((allowedEmail) => allowedEmail.trim().toLowerCase())
      .filter(Boolean)
  );

  return allowlist.has((email ?? "").toLowerCase());
}

async function hasAdminAccess(
  supabase: ReturnType<typeof createServerClient>,
  user: AdminUser
) {
  if (
    hasAdminMetadata(user.app_metadata) ||
    hasAdminMetadata(user.user_metadata) ||
    isAllowlistedAdminEmail(user.email)
  ) {
    return true;
  }

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

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request
  });
  const pathname = request.nextUrl.pathname;

  if (!pathname.startsWith("/admin")) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
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

  const isLoginRoute = pathname.startsWith("/admin/login");
  const isDashboardRoute = pathname.startsWith("/admin/dashboard");
  const isAdmin = user ? await hasAdminAccess(supabase, user) : false;

  if (isLoginRoute && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/dashboard";
    url.search = "";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (isDashboardRoute && (!user || !isAdmin)) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("error", "unauthorized");
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt)$).*)"
  ]
};
