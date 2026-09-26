import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const siteConfigSchema = z.object({
  logoUrl: z.string().trim().min(1).max(500),
  phonePrimary: z.string().trim().min(7).max(30),
  phoneSecondary: z.string().trim().min(7).max(30),
  whatsappNumber: z.string().trim().min(7).max(30),
  heroTitle: z.string().trim().max(220).optional()
});

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
        hero_title: body.heroTitle ?? null
      })
      .eq("id", 1)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ config: data });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Configuration invalide.", issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
