"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublishableKey, getSupabasePublicUrl } from "@/lib/supabase/env";

export function createClient() {
  return createBrowserClient(getSupabasePublicUrl(), getSupabasePublishableKey());
}
