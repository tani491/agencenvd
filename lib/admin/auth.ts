import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminUser = {
  id: string;
  email?: string | null;
};

type SupabaseAuthReader = {
  getUser: () => Promise<{
    data: { user: AdminUser | null };
    error: unknown;
  }>;
};

export type AdminAuthState = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  email: string | null;
  userId: string | null;
};

export async function getAdminAuthState(): Promise<AdminAuthState> {
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      isAuthenticated: false,
      isAdmin: false,
      email: null,
      userId: null
    };
  }

  const auth = supabase.auth as unknown as SupabaseAuthReader;
  const { data, error } = await auth.getUser();

  if (error || !data.user) {
    return {
      isAuthenticated: false,
      isAdmin: false,
      email: null,
      userId: null
    };
  }

  return {
    isAuthenticated: true,
    isAdmin: await isAdminUser(supabase, data.user),
    email: data.user.email ?? null,
    userId: data.user.id
  };
}

export async function requireAdminUser() {
  const state = await getAdminAuthState();

  if (!state.isAuthenticated) {
    redirect("/admin/login");
  }

  if (!state.isAdmin) {
    redirect("/admin/login?error=unauthorized");
  }

  return state;
}

export async function isAdminUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
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
