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
        headers: {
          "X-Client-Info": "nvd-public-site-config"
        }
      }
    });

    const { data, error } = await supabase
      .from("site_config")
      .select(
        "logo_url, phone_primary, phone_secondary, whatsapp_number, hero_title, hero_background_url"
      )
      .eq("id", 1)
      .single();

    if (error) {
      console.warn("Unable to load public site config", error.message);
      return fallbackSiteConfig;
    }

    return {
      ...fallbackSiteConfig,
      ...data,
      hero_title: data.hero_title ?? fallbackSiteConfig.hero_title,
      hero_background_url:
        data.hero_background_url ?? fallbackSiteConfig.hero_background_url
    };
  } catch (error) {
    console.warn("Public site config unavailable", error);
    return fallbackSiteConfig;
  }
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
