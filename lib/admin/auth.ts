import { redirect } from "next/navigation";
import { isAdminIdentity } from "@/lib/admin/identity";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type AdminUser = {
  id: string;
  email?: string | null;
  app_metadata?: Record<string, unknown> | null;
  user_metadata?: Record<string, unknown> | null;
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
  let supabase;

  try {
    supabase = await createSupabaseServerClient();
  } catch {
    return {
      isAdmin: false,
      email: null,
      userId: null
    };
  }

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
    isAdmin: await isAdminUser(supabase, data.user),
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

export async function isAdminUser(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  user: AdminUser
) {
  const hasMetadataAccess = isAdminIdentity({
    email: user.email ?? null,
    appMetadata: user.app_metadata
  }) || hasAdminMetadata(user.user_metadata);

  if (hasMetadataAccess) {
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

function hasAdminMetadata(metadata?: Record<string, unknown> | null) {
  const role = metadata?.role;
  const roles = metadata?.roles;

  return role === "admin" || (Array.isArray(roles) && roles.includes("admin"));
}
