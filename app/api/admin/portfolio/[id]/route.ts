import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { deleteR2Object, getR2ObjectKeyFromPublicUrl } from "@/lib/r2";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const portfolioPatchSchema = z.object({
  title: z.string().trim().min(2).max(160).optional(),
  category: z.string().trim().min(2).max(120).optional(),
  beforeMediaUrl: z.string().url().startsWith("https://").optional(),
  afterMediaUrl: z.string().url().startsWith("https://").optional(),
  mediaType: z.enum(["image", "video"]).optional(),
  isPublished: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = portfolioPatchSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const updatePayload = {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.beforeMediaUrl !== undefined
        ? { before_media_url: body.beforeMediaUrl }
        : {}),
      ...(body.afterMediaUrl !== undefined ? { after_media_url: body.afterMediaUrl } : {}),
      ...(body.mediaType !== undefined ? { media_type: body.mediaType } : {}),
      ...(body.isPublished !== undefined ? { is_published: body.isPublished } : {})
    };

    const { data, error } = await supabase
      .from("portfolio_items")
      .update(updatePayload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
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

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const supabase = getSupabaseAdminClient();
    const { data: item, error: readError } = await supabase
      .from("portfolio_items")
      .select("before_media_url, after_media_url")
      .eq("id", id)
      .single();

    if (readError) {
      return NextResponse.json({ error: readError.message }, { status: 500 });
    }

    const { error } = await supabase.from("portfolio_items").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const mediaKeys = [
      getR2ObjectKeyFromPublicUrl(item.before_media_url),
      getR2ObjectKeyFromPublicUrl(item.after_media_url)
    ].filter(Boolean);

    await Promise.allSettled(
      mediaKeys.map((key) => deleteR2Object(key as string))
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Portfolio delete error", error);

    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
