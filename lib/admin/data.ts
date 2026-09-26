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
  media_type: "image" | "video";
  is_published: boolean;
};

export type SiteConfig = {
  id: number;
  logo_url: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  hero_title: string | null;
};

export type AnalyticsSummary = {
  totalQuotes: number;
  convertedQuotes: number;
  conversionRate: number;
  sourceData: Array<{ name: string; value: number }>;
  locationData: Array<{ location: string; demandes: number }>;
  serviceData: Array<{ service: string; demandes: number }>;
  statusData: Array<{ status: string; value: number }>;
};

export async function getAdminQuotes() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quotes")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as QuoteRow[];
}

export async function getAdminPortfolioItems() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as PortfolioItem[];
}

export async function getAdminSiteConfig() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as SiteConfig;
}

export function buildAnalyticsSummary(quotes: QuoteRow[]): AnalyticsSummary {
  const convertedQuotes = quotes.filter((quote) =>
    ["scheduled", "completed"].includes(quote.status)
  ).length;

  return {
    totalQuotes: quotes.length,
    convertedQuotes,
    conversionRate:
      quotes.length === 0 ? 0 : Math.round((convertedQuotes / quotes.length) * 100),
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
