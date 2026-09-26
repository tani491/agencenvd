const supabasePublicUrlNames = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const supabasePublishableKeyNames = [
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
] as const;

export function getAnyEnv(names: readonly string[]) {
  return names.map((name) => process.env[name]).find(Boolean) ?? null;
}

export function requireAnyEnv(names: readonly string[]) {
  const value = getAnyEnv(names);

  if (value) return value;

  throw new Error(`Missing environment variable: ${names.join(" or ")}`);
}

export function getSupabasePublicUrl() {
  return requireAnyEnv(supabasePublicUrlNames);
}

export function getSupabasePublishableKey() {
  return requireAnyEnv(supabasePublishableKeyNames);
}

export function getOptionalSupabasePublicUrl() {
  return getAnyEnv(supabasePublicUrlNames);
}

export function getOptionalSupabasePublishableKey() {
  return getAnyEnv(supabasePublishableKeyNames);
}
