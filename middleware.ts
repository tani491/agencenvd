import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function copyResponseCookies(fromResponse: NextResponse, toResponse: NextResponse) {
  fromResponse.cookies.getAll().forEach((cookie) => {
    toResponse.cookies.set(cookie);
  });
}

function redirectWithCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string
) {
  const redirectResponse = NextResponse.redirect(new URL(pathname, request.url));
  copyResponseCookies(response, redirectResponse);
  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const pathname = request.nextUrl.pathname;
  const isLoginRoute = pathname === "/admin/login";
  const isDashboardRoute = pathname.startsWith("/admin/dashboard");

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return isDashboardRoute
        ? redirectWithCookies(request, response, "/admin/login")
        : response;
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

          response = NextResponse.next({
            request
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, {
              ...options,
              path: "/",
              sameSite: "lax",
              secure: process.env.NODE_ENV === "production"
            });
          });
        }
      }
    });

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (isDashboardRoute && !user) {
      return redirectWithCookies(request, response, "/admin/login");
    }

    if (isLoginRoute && user) {
      return redirectWithCookies(request, response, "/admin/dashboard");
    }
  } catch (error) {
    console.error("Middleware Error:", error);

    if (isDashboardRoute) {
      return redirectWithCookies(request, response, "/admin/login");
    }
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"]
};
