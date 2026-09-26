import { redirect } from "next/navigation";
import { isAdminIdentity } from "@/lib/admin/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
};

type SupabaseAuthReader = {
  getUser: () => Promise<{
    data: { user: AdminUser | null };
    error: unknown;
  }>;
};

export type AdminAuthState = {
  isAdmin: boolean;
  email: string | null;
  userId: string | null;
};

export async function getAdminAuthState(): Promise<AdminAuthState> {
  const supabase = await createSupabaseServerClient();
  const auth = supabase.auth as unknown as SupabaseAuthReader;
  const { data, error } = await auth.getUser();

  if (error || !data.user) {
    return {
      isAdmin: false,
      email: null,
      userId: null
    };
  }

  return {
    isAdmin: isAdminUser(data.user),
    email: data.user.email ?? null,
    userId: data.user.id
  };
}

export async function requireAdminUser() {
  const state = await getAdminAuthState();

  if (!state.isAdmin) {
    redirect("/admin/login?error=unauthorized");
  }

  return state;
}

export function isAdminUser(user: AdminUser) {
  return isAdminIdentity({
    email: user.email ?? null,
    appMetadata: user.app_metadata
  });
}
