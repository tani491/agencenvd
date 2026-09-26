import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cachedAdminClient: SupabaseClient | null = null;

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function getSupabaseServerKey() {
  return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function getSupabaseAdminClient() {
  if (cachedAdminClient) {
    return cachedAdminClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = getSupabaseServerKey();

  if (!supabaseUrl) {
    throw new Error("Missing environment variable: SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!supabaseKey) {
    throw new Error(
      "Missing environment variable: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"
    );
  }

  cachedAdminClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        "X-Client-Info": "nvd-next-backend"
      }
    }
  });

  return cachedAdminClient;
}

export function assertSupabaseConfigured() {
  requireEnv("SUPABASE_URL");

  if (!getSupabaseServerKey()) {
    throw new Error(
      "Missing environment variable: SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
}
