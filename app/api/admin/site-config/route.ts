import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getDefaultSiteConfig, type SiteConfig } from "@/lib/admin/data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const siteConfigSchema = z.object({
  logoUrl: z.string().trim().min(1).max(500).optional(),
  phonePrimary: z.string().trim().min(7).max(30).optional(),
  phoneSecondary: z.string().trim().min(7).max(30).optional(),
  whatsappNumber: z.string().trim().min(7).max(30).optional(),
  heroTitle: z.string().trim().max(220).optional(),
  heroBackgroundUrl: z
    .union([z.string().url().startsWith("https://"), z.literal("")])
    .optional(),
  key: z.string().trim().min(1).max(120).optional(),
  value: z
    .object({
      title: z.string().trim().max(220).optional(),
      subtitle: z.string().trim().max(500).optional(),
      image_url: z
        .union([z.string().url().startsWith("https://"), z.literal("")])
        .optional()
    })
    .passthrough()
    .optional()
});

type SiteConfigPayload = z.infer<typeof siteConfigSchema>;
type SiteConfigRow = Partial<SiteConfig> & {
  key?: string | null;
  value?: {
    title?: string | null;
    image_url?: string | null;
  } | null;
};

function withDefaults(row?: SiteConfigRow | null): SiteConfig {
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
    hero_title: row.hero_title ?? row.value?.title ?? fallback.hero_title,
    hero_background_url:
      row.hero_background_url ?? row.value?.image_url ?? fallback.hero_background_url
  };
}

function toSiteConfigRow(body: SiteConfigPayload) {
  const fallback = getDefaultSiteConfig();
  const heroBackgroundUrl =
    body.heroBackgroundUrl ?? body.value?.image_url ?? fallback.hero_background_url ?? "";

  return {
    id: 1,
    logo_url: body.logoUrl ?? fallback.logo_url,
    phone_primary: body.phonePrimary ?? fallback.phone_primary,
    phone_secondary: body.phoneSecondary ?? fallback.phone_secondary,
    whatsapp_number: body.whatsappNumber ?? fallback.whatsapp_number,
    hero_title: body.heroTitle ?? body.value?.title ?? fallback.hero_title,
    hero_background_url: heroBackgroundUrl || null
  };
}

function toKeyValueRow(body: SiteConfigPayload) {
  const fallback = getDefaultSiteConfig();
  const siteConfigRow = toSiteConfigRow(body);

  return {
    key: body.key || "hero_section",
    value: {
      title: siteConfigRow.hero_title ?? fallback.hero_title,
      subtitle: body.value?.subtitle ?? "",
      image_url: siteConfigRow.hero_background_url ?? ""
    },
    updated_at: new Date().toISOString()
  };
}

export async function GET() {
  try {
    const admin = await getAdminAuthState();

    if (!admin.isAdmin) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const supabase = getSupabaseAdminClient();
    const byIdResult = await supabase
      .from("site_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (!byIdResult.error && byIdResult.data) {
      return NextResponse.json({
        success: true,
        data: [byIdResult.data],
        config: withDefaults(byIdResult.data)
      });
    }

    if (byIdResult.error) {
      console.warn("Erreur BDD site_config par id:", byIdResult.error.message);
    }

    const byKeyResult = await supabase
      .from("site_config")
      .select("*")
      .eq("key", "hero_section")
      .maybeSingle();

    if (!byKeyResult.error && byKeyResult.data) {
      return NextResponse.json({
        success: true,
        data: [byKeyResult.data],
        config: withDefaults(byKeyResult.data as SiteConfigRow)
      });
    }

    if (byKeyResult.error) {
      console.warn("Erreur BDD site_config par clé:", byKeyResult.error.message);
    }

    return NextResponse.json({
      success: true,
      data: [],
      config: getDefaultSiteConfig(),
      warning:
        "Configuration Supabase indisponible. Les valeurs par défaut sont utilisées."
    });
  } catch (error) {
    console.warn("Exception API site-config GET:", error);

    return NextResponse.json({
      success: true,
      data: [],
      config: getDefaultSiteConfig(),
      warning:
        "Configuration Supabase indisponible. Les valeurs par défaut sont utilisées."
    });
  }
}

export async function POST(request: Request) {
  return saveSiteConfig(request);
}

export async function PATCH(request: Request) {
  return saveSiteConfig(request);
}

async function saveSiteConfig(request: Request) {
  try {
    const admin = await getAdminAuthState();

    if (!admin.isAdmin) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }

    const body = siteConfigSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const siteConfigRow = toSiteConfigRow(body);
    const byIdResult = await supabase
      .from("site_config")
      .upsert(siteConfigRow, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (!byIdResult.error) {
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        config: withDefaults((byIdResult.data as SiteConfigRow | null) ?? siteConfigRow)
      });
    }

    console.warn("Echec upsert site_config par id:", byIdResult.error.message);

    const keyValueRow = toKeyValueRow(body);
    const byKeyResult = await supabase
      .from("site_config")
      .upsert(keyValueRow, { onConflict: "key" })
      .select("*")
      .maybeSingle();

    if (byKeyResult.error) {
      console.warn("Echec upsert site_config par clé:", byKeyResult.error.message);

      return NextResponse.json(
        {
          success: false,
          error:
            byIdResult.error.message ||
            byKeyResult.error.message ||
            "Configuration Supabase indisponible."
        },
        { status: 400 }
      );
    }

    revalidatePath("/");

    return NextResponse.json({
      success: true,
      config: withDefaults((byKeyResult.data as SiteConfigRow | null) ?? keyValueRow),
      data: byKeyResult.data ?? keyValueRow
    });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { success: false, error: "Configuration invalide.", issues },
        { status: 400 }
      );
    }

    console.warn("Exception API site-config mutation:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Configuration Supabase indisponible."
      },
      { status: 400 }
    );
  }
}
