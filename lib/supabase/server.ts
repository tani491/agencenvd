import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabasePublicUrl } from "@/lib/supabase/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    getSupabasePublicUrl(),
    getSupabasePublishableKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Server Components cannot write cookies. Middleware refreshes the session.
          }
        }
      }
    }
  );
}
