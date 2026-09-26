import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAdminIdentity } from "@/lib/admin/identity";
import {
  getOptionalSupabasePublishableKey,
  getOptionalSupabasePublicUrl
} from "@/lib/supabase/env";

type MiddlewareUser = {
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
};

type MiddlewareAuth = {
  getClaims: () => Promise<{
    data: { claims: Record<string, unknown> | null };
    error: unknown;
  }>;
  getUser: () => Promise<{
    data: { user: MiddlewareUser | null };
    error: unknown;
  }>;
};

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const pathname = request.nextUrl.pathname;
  const loginUrl = new URL("/admin/login", request.url);
  const dashboardUrl = new URL("/admin/dashboard/quotes", request.url);
  const supabaseUrl = getOptionalSupabasePublicUrl();
  const supabaseKey = getOptionalSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      "Supabase admin auth is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or their supported aliases."
    );

    if (pathname.startsWith("/admin/login")) {
      const response = NextResponse.next({ request });
      response.headers.set("Cache-Control", "private, no-store");
      return response;
    }

    loginUrl.searchParams.set("error", "configuration");
    return NextResponse.redirect(loginUrl);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        }
      }
    }
  );

  const auth = supabase.auth as unknown as MiddlewareAuth;

  const {
    data: { claims },
    error: claimsError
  } = await auth.getClaims();

  const claimsRecord = claims as Record<string, unknown> | null;
  const appMetadata = claimsRecord?.app_metadata;
  let isAdmin = Boolean(
    !claimsError &&
      claimsRecord &&
      isAdminIdentity({
        email: typeof claimsRecord.email === "string" ? claimsRecord.email : null,
        appMetadata:
          typeof appMetadata === "object" && appMetadata !== null
            ? (appMetadata as Record<string, unknown>)
            : null
      })
  );

  if (isAdmin) {
    const {
      data: { user },
      error: userError
    } = await auth.getUser();

    isAdmin = Boolean(
      !userError &&
        user &&
        isAdminIdentity({
          email: user.email ?? null,
          appMetadata: user.app_metadata
        })
    );
  }

  if (pathname === "/admin") {
    return copySupabaseCookies(
      NextResponse.redirect(isAdmin ? dashboardUrl : loginUrl),
      supabaseResponse
    );
  }

  if (pathname.startsWith("/admin/login")) {
    if (isAdmin) {
      return copySupabaseCookies(NextResponse.redirect(dashboardUrl), supabaseResponse);
    }

    return supabaseResponse;
  }

  if (!isAdmin) {
    loginUrl.searchParams.set("error", "unauthorized");
    return copySupabaseCookies(NextResponse.redirect(loginUrl), supabaseResponse);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"]
};

function copySupabaseCookies(response: NextResponse, supabaseResponse: NextResponse) {
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie;
    response.cookies.set(name, value, options);
  });

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) response.headers.set(header, value);
  }

  return response;
}
