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
  before_url?: string | null;
  after_url?: string | null;
  media_type: "image" | "video";
  is_published?: boolean | null;
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
      fetch: noStoreFetch,
      headers: {
        "X-Client-Info": "nvd-public-portfolio"
      }
    }
  });

  const selectPortfolioPage = (onlyPublished: boolean, includeLegacyUrls: boolean) => {
    let query = supabase.from("portfolio_items").select(
      includeLegacyUrls
        ? "id, created_at, title, category, before_media_url, after_media_url, before_url, after_url, media_type, is_published"
        : "id, created_at, title, category, before_media_url, after_media_url, media_type",
      { count: "exact" }
    );

    if (onlyPublished) {
      query = query.eq("is_published", true);
    }

    return query.order("created_at", { ascending: false }).range(from, to);
  };

  let data: unknown[] | null = null;
  let error: unknown = null;
  let count: number | null = 0;

  for (const candidate of [
    { onlyPublished: true, includeLegacyUrls: true },
    { onlyPublished: true, includeLegacyUrls: false },
    { onlyPublished: false, includeLegacyUrls: true },
    { onlyPublished: false, includeLegacyUrls: false }
  ]) {
    const result = await selectPortfolioPage(
      candidate.onlyPublished,
      candidate.includeLegacyUrls
    );

    data = result.data;
    error = result.error;
    count = result.count;

    if (!error) {
      break;
    }

    if (!isMissingOptionalPortfolioColumn(error)) {
      break;
    }
  }

  if (isMissingPublicationColumn(error)) {
    const legacyResult = await selectPortfolioPage(false, false);
    data = legacyResult.data;
    error = legacyResult.error;
    count = legacyResult.count;
  }

  if (error) {
    console.warn("Unable to load published portfolio items", error);

    return {
      items: [],
      total: 0,
      error: "query_failed"
    };
  }

  const items = (data ?? [])
    .map(normalizePublicPortfolioItem)
    .filter((item): item is PublicPortfolioItem => Boolean(item));

  return {
    items,
    total: count ?? items.length,
    error: null
  };
}

function normalizePublicPortfolioItem(row: unknown): PublicPortfolioItem | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const item = row as Partial<PublicPortfolioItem>;
  const beforeMediaUrl = item.before_media_url || item.before_url || "";
  const afterMediaUrl = item.after_media_url || item.after_url || "";

  if (!beforeMediaUrl || !afterMediaUrl) {
    return null;
  }

  return {
    id: item.id ?? crypto.randomUUID(),
    created_at: item.created_at ?? new Date(0).toISOString(),
    title: item.title || "Réalisation NVD",
    category: item.category || "Canapés",
    before_media_url: beforeMediaUrl,
    after_media_url: afterMediaUrl,
    before_url: beforeMediaUrl,
    after_url: afterMediaUrl,
    media_type: item.media_type === "video" ? "video" : "image",
    is_published: item.is_published ?? true
  };
}

function isMissingPublicationColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return code === "PGRST204" || message.includes("is_published");
}

function isMissingOptionalPortfolioColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return (
    code === "PGRST204" ||
    message.includes("is_published") ||
    message.includes("before_url") ||
    message.includes("after_url")
  );
}

function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    cache: "no-store"
  });
}
