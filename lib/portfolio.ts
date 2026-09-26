import { createClient } from "@supabase/supabase-js";
import {
  getOptionalSupabasePublishableKey,
  getOptionalSupabasePublicUrl
} from "@/lib/supabase/env";

export type PublicPortfolioItem = {
  id: string;
  created_at: string;
  title: string;
  category: string;
  before_media_url: string;
  after_media_url: string;
  media_type: "image" | "video";
};

type PortfolioPageResult = {
  items: PublicPortfolioItem[];
  total: number;
  error: "not_configured" | "query_failed" | null;
};

export async function getPublishedPortfolioPage(
  page: number,
  pageSize: number
): Promise<PortfolioPageResult> {
  const supabaseUrl = getOptionalSupabasePublicUrl();
  const supabaseKey = getOptionalSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    return {
      items: [],
      total: 0,
      error: "not_configured"
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        "X-Client-Info": "nvd-public-portfolio"
      }
    }
  });

  const { data, error, count } = await supabase
    .from("portfolio_items")
    .select(
      "id, created_at, title, category, before_media_url, after_media_url, media_type",
      { count: "exact" }
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.warn("Unable to load published portfolio items", error);

    return {
      items: [],
      total: 0,
      error: "query_failed"
    };
  }

  return {
    items: (data ?? []) as PublicPortfolioItem[],
    total: count ?? 0,
    error: null
  };
}
