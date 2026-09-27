import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getDefaultSiteConfig } from "@/lib/admin/data";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const siteConfigSchema = z.object({
  logoUrl: z.string().trim().min(1).max(500),
  phonePrimary: z.string().trim().min(7).max(30),
  phoneSecondary: z.string().trim().min(7).max(30),
  whatsappNumber: z.string().trim().min(7).max(30),
  heroTitle: z.string().trim().max(220).optional(),
  heroBackgroundUrl: z
    .union([z.string().url().startsWith("https://"), z.literal("")])
    .optional()
});

export async function GET() {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_config")
      .select("*")
      .eq("id", 1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({
        config: getDefaultSiteConfig(),
        warning:
          "Configuration Supabase indisponible. Les valeurs par défaut sont utilisées."
      });
    }

    return NextResponse.json({
      config: {
        ...getDefaultSiteConfig(),
        ...data
      }
    });
  } catch (error) {
    console.warn("Unable to read site config", error);

    return NextResponse.json({
      config: getDefaultSiteConfig(),
      warning:
        "Configuration Supabase indisponible. Les valeurs par défaut sont utilisées."
    });
  }
}

export async function PATCH(request: Request) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = siteConfigSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("site_config")
      .update({
        logo_url: body.logoUrl,
        phone_primary: body.phonePrimary,
        phone_secondary: body.phoneSecondary,
        whatsapp_number: body.whatsappNumber,
        hero_title: body.heroTitle ?? null,
        hero_background_url: body.heroBackgroundUrl || null
      })
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 503 });
    }

    revalidatePath("/");

    return NextResponse.json({ config: data });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Configuration invalide.", issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Configuration Supabase indisponible." },
      { status: 503 }
    );
  }
}
