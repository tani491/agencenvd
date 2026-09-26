import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const portfolioCreateSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.string().trim().min(2).max(120),
  beforeMediaUrl: z.string().url().startsWith("https://"),
  afterMediaUrl: z.string().url().startsWith("https://"),
  mediaType: z.enum(["image", "video"]),
  isPublished: z.boolean().default(true)
});

export async function POST(request: Request) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = portfolioCreateSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("portfolio_items")
      .insert({
        title: body.title,
        category: body.category,
        before_media_url: body.beforeMediaUrl,
        after_media_url: body.afterMediaUrl,
        media_type: body.mediaType,
        is_published: body.isPublished
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data }, { status: 201 });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Média invalide.", issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
