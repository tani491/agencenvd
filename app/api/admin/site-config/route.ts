import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getDefaultSiteConfig, type SiteConfig } from "@/lib/admin/data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const urlOrEmptySchema = z.union([
  z.string().url().startsWith("https://"),
  z.literal("")
]);

const siteConfigSchema = z.object({
  logoUrl: z.string().trim().min(1).max(500).optional(),
  logo_url: z.string().trim().min(1).max(500).optional(),
  phonePrimary: z.string().trim().min(7).max(30).optional(),
  phone_primary: z.string().trim().min(7).max(30).optional(),
  phoneSecondary: z.string().trim().min(7).max(30).optional(),
  phone_secondary: z.string().trim().min(7).max(30).optional(),
  whatsappNumber: z.string().trim().min(7).max(30).optional(),
  whatsapp_number: z.string().trim().min(7).max(30).optional(),
  heroTitle: z.string().trim().max(220).optional(),
  hero_title: z.string().trim().max(220).optional(),
  heroBackgroundUrl: urlOrEmptySchema.optional(),
  hero_background_url: urlOrEmptySchema.optional(),
  key: z.string().trim().min(1).max(120).optional(),
  value: z
    .object({
      title: z.string().trim().max(220).optional(),
      subtitle: z.string().trim().max(500).optional(),
      image_url: urlOrEmptySchema.optional(),
      hero_background_url: urlOrEmptySchema.optional(),
      logo_url: z.string().trim().min(1).max(500).optional(),
      phone_primary: z.string().trim().min(7).max(30).optional(),
      phone_secondary: z.string().trim().min(7).max(30).optional(),
      whatsapp_number: z.string().trim().min(7).max(30).optional()
    })
    .passthrough()
    .optional()
});

type SiteConfigPayload = z.infer<typeof siteConfigSchema>;
type SiteConfigRow = Partial<SiteConfig> & {
  key?: string | null;
  value?: {
    title?: string | null;
    hero_background_url?: string | null;
    image_url?: string | null;
    logo_url?: string | null;
    phone_primary?: string | null;
    phone_secondary?: string | null;
    whatsapp_number?: string | null;
  } | null;
};

function withDefaults(row?: SiteConfigRow | null): SiteConfig {
  const fallback = getDefaultSiteConfig();

  if (!row) {
    return fallback;
  }

  return {
    id: typeof row.id === "number" ? row.id : fallback.id,
    logo_url: row.logo_url || row.value?.logo_url || fallback.logo_url,
    phone_primary:
      row.phone_primary || row.value?.phone_primary || fallback.phone_primary,
    phone_secondary:
      row.phone_secondary || row.value?.phone_secondary || fallback.phone_secondary,
    whatsapp_number:
      row.whatsapp_number ||
      row.value?.whatsapp_number ||
      fallback.whatsapp_number,
    hero_title: row.hero_title ?? row.value?.title ?? fallback.hero_title,
    hero_background_url:
      row.hero_background_url ??
      row.value?.hero_background_url ??
      row.value?.image_url ??
      fallback.hero_background_url
  };
}

function toSiteConfigRow(body: SiteConfigPayload) {
  const fallback = getDefaultSiteConfig();
  const heroBackgroundUrl =
    body.heroBackgroundUrl ??
    body.hero_background_url ??
    body.value?.hero_background_url ??
    body.value?.image_url ??
    fallback.hero_background_url ??
    "";

  return {
    id: 1,
    logo_url: body.logoUrl ?? body.logo_url ?? body.value?.logo_url ?? fallback.logo_url,
    phone_primary:
      body.phonePrimary ??
      body.phone_primary ??
      body.value?.phone_primary ??
      fallback.phone_primary,
    phone_secondary:
      body.phoneSecondary ??
      body.phone_secondary ??
      body.value?.phone_secondary ??
      fallback.phone_secondary,
    whatsapp_number:
      body.whatsappNumber ??
      body.whatsapp_number ??
      body.value?.whatsapp_number ??
      fallback.whatsapp_number,
    hero_title:
      body.heroTitle ?? body.hero_title ?? body.value?.title ?? fallback.hero_title,
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
      image_url: siteConfigRow.hero_background_url ?? "",
      hero_background_url: siteConfigRow.hero_background_url ?? "",
      logo_url: siteConfigRow.logo_url,
      phone_primary: siteConfigRow.phone_primary,
      phone_secondary: siteConfigRow.phone_secondary,
      whatsapp_number: siteConfigRow.whatsapp_number
    },
    logo_url: siteConfigRow.logo_url,
    phone_primary: siteConfigRow.phone_primary,
    phone_secondary: siteConfigRow.phone_secondary,
    whatsapp_number: siteConfigRow.whatsapp_number,
    hero_title: siteConfigRow.hero_title,
    hero_background_url: siteConfigRow.hero_background_url,
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

    if (byKeyResult.error || byIdResult.error) {
      console.warn(
        "site_config fallback par défaut:",
        [byKeyResult.error?.message, byIdResult.error?.message]
          .filter(Boolean)
          .join(" | ")
      );
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
    const keyValueRow = toKeyValueRow(body);
    const byKeyResult = await upsertSiteConfig(
      supabase,
      keyValueRow,
      "key",
      removableKeyValueColumns
    );

    if (!byKeyResult.error) {
      revalidatePath("/");

      return NextResponse.json({
        success: true,
        config: withDefaults((byKeyResult.data as SiteConfigRow | null) ?? keyValueRow),
        data: byKeyResult.data ?? keyValueRow
      });
    }

    const siteConfigRow = toSiteConfigRow(body);
    const byIdResult = await upsertSiteConfig(
      supabase,
      siteConfigRow,
      "id",
      []
    );

    if (byIdResult.error) {
      console.warn(
        "site_config upsert indisponible:",
        [byKeyResult.error.message, byIdResult.error.message].join(" | ")
      );

      return NextResponse.json(
        {
          success: false,
          error:
            byKeyResult.error.message ||
            byIdResult.error.message ||
            "Configuration Supabase indisponible."
        },
        { status: 400 }
      );
    }

    revalidatePath("/");

    return NextResponse.json({
      success: true,
      config: withDefaults((byIdResult.data as SiteConfigRow | null) ?? siteConfigRow),
      data: byIdResult.data ?? siteConfigRow
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

const removableKeyValueColumns = [
  "logo_url",
  "phone_primary",
  "phone_secondary",
  "whatsapp_number",
  "hero_title",
  "hero_background_url",
  "updated_at"
] as const;

async function upsertSiteConfig(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: Record<string, unknown>,
  onConflict: string,
  removableColumns: readonly string[]
) {
  let candidate = { ...payload };

  for (let attempt = 0; attempt <= removableColumns.length; attempt++) {
    const result = await supabase
      .from("site_config")
      .upsert(candidate, { onConflict })
      .select("*")
      .maybeSingle();
    const missingColumn = getMissingSiteConfigColumn(
      result.error,
      removableColumns
    );

    if (!missingColumn || !(missingColumn in candidate)) {
      return result;
    }

    const { [missingColumn]: _removed, ...nextCandidate } = candidate;
    candidate = nextCandidate;
  }

  return supabase
    .from("site_config")
    .upsert(candidate, { onConflict })
    .select("*")
    .maybeSingle();
}

function getMissingSiteConfigColumn(
  error: unknown,
  removableColumns: readonly string[]
) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";
  const isSchemaCacheMiss =
    code === "PGRST204" ||
    message.includes("Could not find") ||
    message.includes("schema cache");

  if (!isSchemaCacheMiss) {
    return null;
  }

  return removableColumns.find((column) => message.includes(column)) ?? null;
}
