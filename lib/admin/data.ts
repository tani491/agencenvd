import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getServiceLabel, getStatusLabel } from "@/lib/admin/labels";

export type QuoteStatus =
  | "pending"
  | "contacted"
  | "quoted"
  | "scheduled"
  | "completed"
  | "cancelled";

export type QuoteRow = {
  id: string;
  created_at: string;
  full_name: string;
  phone: string;
  location: string;
  services: string[];
  details: string | null;
  furniture_photo_url: string | null;
  preferred_date: string | null;
  status: QuoteStatus;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  referrer_url: string | null;
};

export type PortfolioItem = {
  id: string;
  created_at: string;
  title: string;
  category: string;
  before_media_url: string;
  after_media_url: string;
  before_url?: string | null;
  after_url?: string | null;
  media_type: "image" | "video";
  is_published: boolean;
};

export type TestimonialItem = {
  id: string;
  created_at: string;
  client_name: string;
  rating: number;
  comment: string;
  service_used: string;
  avatar_url: string | null;
  is_published: boolean;
};

export type SiteConfig = {
  id: number;
  logo_url: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  hero_title: string | null;
  hero_background_url: string | null;
};

export type AnalyticsSummary = {
  totalPageViews: number;
  uniqueVisitors: number;
  whatsappClicks: number;
  phoneCalls: number;
  totalQuotes: number;
  convertedQuotes: number;
  quoteConversionRate: number;
  visitorConversionRate: number;
  sourceData: Array<{ name: string; value: number }>;
  locationData: Array<{ location: string; demandes: number }>;
  serviceData: Array<{ service: string; demandes: number }>;
  statusData: Array<{ status: string; value: number }>;
};

export function getDefaultSiteConfig(): SiteConfig {
  return {
    id: 1,
    logo_url: "/logo-nvd.svg",
    phone_primary: "778609143",
    phone_secondary: "788605633",
    whatsapp_number: "778609143",
    hero_title:
      "Le spécialiste du nettoyage à vapeur & désinfection écologique au Sénégal.",
    hero_background_url: null
  };
}

export async function getAdminQuotes() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.warn("Unable to load admin quotes, using empty fallback", error.message);
      return [];
    }

    return (data ?? []).map(normalizeQuoteRow);
  } catch (error) {
    console.warn("Admin quotes unavailable, using empty fallback", error);
    return [];
  }
}

export async function getAdminPortfolioItems() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn(
        "Unable to load portfolio items, using empty fallback",
        error.message
      );
      return [];
    }

    return (data ?? []).map(normalizePortfolioItem);
  } catch (error) {
    console.warn("Portfolio items unavailable, using empty fallback", error);
    return [];
  }
}

export async function getAdminSiteConfig() {
  try {
    const supabase = getSupabaseAdminClient();
    const keyedResult = await supabase
      .from("site_config")
      .select("*")
      .in("key", ["hero_section", "site_logo", "contact_info"]);

    if (!keyedResult.error && keyedResult.data?.length) {
      return normalizeSiteConfigKeyRows(keyedResult.data);
    }

    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn(
        "Unable to load site_config, using default fallback",
        error.message
      );
      return getDefaultSiteConfig();
    }

    return normalizeSiteConfig(data);
  } catch (error) {
    console.warn("Site config unavailable, using default fallback", error);
    return getDefaultSiteConfig();
  }
}

export async function getAdminTestimonials() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.warn(
        "Unable to load testimonials, using empty fallback",
        error.message
      );
      return [];
    }

    return (data ?? []).map(normalizeTestimonialItem);
  } catch (error) {
    console.warn("Testimonials unavailable, using empty fallback", error);
    return [];
  }
}

export async function getAudienceSummary() {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error, count } = await supabase
      .from("analytics_events")
      .select("visitor_id", { count: "exact" })
      .limit(10000);

    if (error) {
      console.warn("Unable to load analytics events", error.message);

      return {
        totalPageViews: 0,
        uniqueVisitors: 0
      };
    }

    return {
      totalPageViews: count ?? data?.length ?? 0,
      uniqueVisitors: new Set(
        (data ?? [])
          .map((event: { visitor_id?: string | null }) => event.visitor_id)
          .filter(Boolean)
      ).size
    };
  } catch (error) {
    console.warn("Analytics summary unavailable", error);

    return {
      totalPageViews: 0,
      uniqueVisitors: 0
    };
  }
}

export function buildAnalyticsSummary(
  quotes: QuoteRow[],
  audience: { totalPageViews: number; uniqueVisitors: number } = {
    totalPageViews: 0,
    uniqueVisitors: 0
  }
): AnalyticsSummary {
  const convertedQuotes = quotes.filter((quote) =>
    ["scheduled", "completed"].includes(quote.status)
  ).length;

  return {
    totalPageViews: audience.totalPageViews,
    uniqueVisitors: audience.uniqueVisitors,
    whatsappClicks: 0,
    phoneCalls: 0,
    totalQuotes: quotes.length,
    convertedQuotes,
    quoteConversionRate:
      quotes.length === 0 ? 0 : Math.round((convertedQuotes / quotes.length) * 100),
    visitorConversionRate:
      audience.uniqueVisitors === 0
        ? 0
        : Math.round((quotes.length / audience.uniqueVisitors) * 100),
    sourceData: toChartEntries(countBy(quotes, (quote) => normalizeSource(quote.utm_source))),
    locationData: toChartEntries(countBy(quotes, (quote) => normalizeLocation(quote.location)))
      .slice(0, 8)
      .map(({ name, value }) => ({ location: name, demandes: value })),
    serviceData: toChartEntries(countServices(quotes)).map(({ name, value }) => ({
      service: getServiceLabel(name),
      demandes: value
    })),
    statusData: toChartEntries(
      countBy(quotes, (quote) => getStatusLabel(quote.status))
    ).map(({ name, value }) => ({ status: name, value }))
  };
}

function countBy<T>(items: T[], getKey: (item: T) => string) {
  return items.reduce<Record<string, number>>((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
}

function countServices(quotes: QuoteRow[]) {
  return quotes.reduce<Record<string, number>>((acc, quote) => {
    quote.services.forEach((service) => {
      acc[service] = (acc[service] ?? 0) + 1;
    });

    return acc;
  }, {});
}

function toChartEntries(counts: Record<string, number>) {
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function normalizeSource(source?: string | null) {
  const value = (source ?? "direct").toLowerCase();

  if (value.includes("tiktok")) return "TikTok Ads";
  if (value.includes("facebook") || value.includes("meta")) return "Facebook";
  if (value.includes("google")) return "Google Search";
  if (value.includes("recommand") || value.includes("referral")) {
    return "Recommandation Directe";
  }

  return "Recommandation Directe";
}

function normalizeLocation(location: string) {
  return location.trim().replace(/\s+/g, " ");
}

function normalizeQuoteRow(row: Partial<QuoteRow>): QuoteRow {
  return {
    id: row.id ?? crypto.randomUUID(),
    created_at: row.created_at ?? new Date(0).toISOString(),
    full_name: row.full_name ?? "Client NVD",
    phone: row.phone ?? "",
    location: row.location ?? "",
    services: Array.isArray(row.services) ? row.services : [],
    details: row.details ?? null,
    furniture_photo_url: row.furniture_photo_url ?? null,
    preferred_date: row.preferred_date ?? null,
    status: isQuoteStatus(row.status) ? row.status : "pending",
    utm_source: row.utm_source ?? "direct",
    utm_medium: row.utm_medium ?? null,
    utm_campaign: row.utm_campaign ?? null,
    referrer_url: row.referrer_url ?? null
  };
}

function normalizePortfolioItem(row: Partial<PortfolioItem>): PortfolioItem {
  const beforeMediaUrl = row.before_media_url ?? row.before_url ?? "";
  const afterMediaUrl = row.after_media_url ?? row.after_url ?? "";

  return {
    id: row.id ?? crypto.randomUUID(),
    created_at: row.created_at ?? new Date(0).toISOString(),
    title: row.title ?? "Réalisation NVD",
    category: row.category ?? "Portfolio",
    before_media_url: beforeMediaUrl,
    after_media_url: afterMediaUrl,
    before_url: beforeMediaUrl,
    after_url: afterMediaUrl,
    media_type: row.media_type === "video" ? "video" : "image",
    is_published: row.is_published ?? true
  };
}

function normalizeTestimonialItem(
  row: Partial<TestimonialItem>
): TestimonialItem {
  const rating = Number(row.rating ?? 5);

  return {
    id: row.id ?? crypto.randomUUID(),
    created_at: row.created_at ?? new Date(0).toISOString(),
    client_name: row.client_name ?? "Client NVD",
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
    comment: row.comment ?? "",
    service_used: row.service_used ?? "Nettoyage vapeur",
    avatar_url: row.avatar_url ?? null,
    is_published: row.is_published ?? true
  };
}

function normalizeSiteConfig(row?: Partial<SiteConfig> | null): SiteConfig {
  const fallback = getDefaultSiteConfig();

  if (!row) {
    return fallback;
  }

  return {
    id: typeof row.id === "number" ? row.id : fallback.id,
    logo_url: row.logo_url || fallback.logo_url,
    phone_primary: row.phone_primary || fallback.phone_primary,
    phone_secondary: row.phone_secondary || fallback.phone_secondary,
    whatsapp_number: row.whatsapp_number || fallback.whatsapp_number,
    hero_title: row.hero_title ?? fallback.hero_title,
    hero_background_url: row.hero_background_url ?? fallback.hero_background_url
  };
}

function normalizeSiteConfigKeyRows(rows: unknown[]): SiteConfig {
  const fallback = getDefaultSiteConfig();
  const merged = rows.reduce<Partial<SiteConfig>>((config, rawRow) => {
    const row = rawRow as Partial<SiteConfig> & {
      key?: string | null;
      value?: Record<string, unknown> | null;
    };
    const value = row.value ?? {};

    if (row.key === "site_logo") {
      return {
        ...config,
        logo_url:
          row.logo_url ||
          asOptionalString(value.logo_url) ||
          asOptionalString(value.image_url) ||
          config.logo_url
      };
    }

    return {
      ...config,
      id: row.id ?? config.id,
      logo_url:
        row.logo_url || asOptionalString(value.logo_url) || config.logo_url,
      phone_primary:
        row.phone_primary ||
        asOptionalString(value.phone_primary) ||
        asOptionalString(value.phonePrimary) ||
        config.phone_primary,
      phone_secondary:
        row.phone_secondary ||
        asOptionalString(value.phone_secondary) ||
        asOptionalString(value.phoneSecondary) ||
        config.phone_secondary,
      whatsapp_number:
        row.whatsapp_number ||
        asOptionalString(value.whatsapp_number) ||
        asOptionalString(value.whatsappNumber) ||
        config.whatsapp_number,
      hero_title:
        row.hero_title || asOptionalString(value.title) || config.hero_title,
      hero_background_url:
        row.hero_background_url ||
        asOptionalString(value.hero_background_url) ||
        asOptionalString(value.image_url) ||
        config.hero_background_url
    };
  }, fallback);

  return normalizeSiteConfig(merged);
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function isQuoteStatus(value: unknown): value is QuoteStatus {
  return (
    value === "pending" ||
    value === "contacted" ||
    value === "quoted" ||
    value === "scheduled" ||
    value === "completed" ||
    value === "cancelled"
  );
}
