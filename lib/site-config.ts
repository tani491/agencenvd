import { createClient } from "@supabase/supabase-js";
import {
  getOptionalSupabasePublishableKey,
  getOptionalSupabasePublicUrl
} from "@/lib/supabase/env";

export type PublicSiteConfig = {
  logo_url: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  hero_title: string;
  hero_background_url: string;
};

export const fallbackSiteConfig: PublicSiteConfig = {
  logo_url: "/logo-nvd.svg",
  phone_primary: "778609143",
  phone_secondary: "788605633",
  whatsapp_number: "778609143",
  hero_title: "Le spécialiste du nettoyage à vapeur & désinfection écologique au Sénégal.",
  hero_background_url:
    "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=85"
};

export async function getPublicSiteConfig(): Promise<PublicSiteConfig> {
  const supabaseUrl = getOptionalSupabasePublicUrl();
  const supabaseKey = getOptionalSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    return fallbackSiteConfig;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      global: {
        fetch: noStoreFetch,
        headers: {
          "X-Client-Info": "nvd-public-site-config"
        }
      }
    });

    const keyedConfig = await loadKeyedSiteConfig(supabase);

    if (keyedConfig) {
      return withPublicDefaults(keyedConfig);
    }

    return withPublicDefaults(await loadDirectSiteConfig(supabase));
  } catch (error) {
    console.warn("Public site config unavailable", error);
    return fallbackSiteConfig;
  }
}

async function loadDirectSiteConfig(
  supabase: ReturnType<typeof createClient<any>>
): Promise<Partial<PublicSiteConfig> | null> {
  const { data, error } = await supabase
    .from("site_config")
    .select(
      "logo_url, phone_primary, phone_secondary, whatsapp_number, hero_title, hero_background_url"
    )
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return null;
  }

  return data;
}

async function loadKeyedSiteConfig(
  supabase: ReturnType<typeof createClient<any>>
): Promise<Partial<PublicSiteConfig> | null> {
  const { data, error } = await supabase
    .from("site_config")
    .select("*")
    .in("key", ["hero_section", "site_logo", "contact_info"]);

  if (error || !data?.length) {
    return null;
  }

  return data.reduce<Partial<PublicSiteConfig>>((config, row) => {
    const siteConfigRow = row as Record<string, unknown>;
    const value = asSiteConfigValue(siteConfigRow.value);

    if (siteConfigRow.key === "site_logo") {
      return {
        ...config,
        logo_url:
          asOptionalString(siteConfigRow.logo_url) ||
          asOptionalString(value.logo_url) ||
          asOptionalString(value.image_url) ||
          config.logo_url
      };
    }

    if (siteConfigRow.key === "contact_info") {
      return {
        ...config,
        phone_primary:
          asOptionalString(value.phone_primary) ||
          asOptionalString(value.phonePrimary) ||
          config.phone_primary,
        phone_secondary:
          asOptionalString(value.phone_secondary) ||
          asOptionalString(value.phoneSecondary) ||
          config.phone_secondary,
        whatsapp_number:
          asOptionalString(value.whatsapp_number) ||
          asOptionalString(value.whatsappNumber) ||
          config.whatsapp_number
      };
    }

    return {
      ...config,
      logo_url:
        asOptionalString(siteConfigRow.logo_url) ||
        asOptionalString(value.logo_url) ||
        config.logo_url,
      phone_primary:
        asOptionalString(siteConfigRow.phone_primary) ||
        asOptionalString(value.phone_primary) ||
        config.phone_primary,
      phone_secondary:
        asOptionalString(siteConfigRow.phone_secondary) ||
        asOptionalString(value.phone_secondary) ||
        config.phone_secondary,
      whatsapp_number:
        asOptionalString(siteConfigRow.whatsapp_number) ||
        asOptionalString(value.whatsapp_number) ||
        config.whatsapp_number,
      hero_title:
        asOptionalString(siteConfigRow.hero_title) ||
        asOptionalString(value.title) ||
        config.hero_title,
      hero_background_url:
        asOptionalString(siteConfigRow.hero_background_url) ||
        asOptionalString(value.hero_background_url) ||
        asOptionalString(value.image_url) ||
        config.hero_background_url
    };
  }, {});
}

function withPublicDefaults(config?: Partial<PublicSiteConfig> | null) {
  return {
    ...fallbackSiteConfig,
    ...config,
    logo_url: config?.logo_url || fallbackSiteConfig.logo_url,
    phone_primary: config?.phone_primary || fallbackSiteConfig.phone_primary,
    phone_secondary: config?.phone_secondary || fallbackSiteConfig.phone_secondary,
    whatsapp_number: config?.whatsapp_number || fallbackSiteConfig.whatsapp_number,
    hero_title: config?.hero_title || fallbackSiteConfig.hero_title,
    hero_background_url:
      config?.hero_background_url || fallbackSiteConfig.hero_background_url
  };
}

function asSiteConfigValue(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {} as Record<string, unknown>;
  }

  return value as Record<string, unknown>;
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

export function buildWhatsappHref(number: string, message: string) {
  return `https://wa.me/221${toSenegalLocalDigits(number)}?text=${encodeURIComponent(
    message
  )}`;
}

export function buildTelHref(number: string) {
  return `tel:+221${toSenegalLocalDigits(number)}`;
}

export function formatSenegalPhone(number: string) {
  const digits = toSenegalLocalDigits(number);

  if (digits.length !== 9) {
    return number;
  }

  return `+221 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(
    5,
    7
  )} ${digits.slice(7, 9)}`;
}

function toSenegalLocalDigits(number: string) {
  const digits = number.replace(/\D/g, "");

  if (digits.startsWith("00221")) {
    return digits.slice(5);
  }

  if (digits.startsWith("221")) {
    return digits.slice(3);
  }

  return digits;
}

function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    cache: "no-store"
  });
}
