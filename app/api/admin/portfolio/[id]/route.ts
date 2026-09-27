import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
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
    const updatePayload: Record<string, unknown> = {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.category !== undefined ? { category: body.category } : {}),
      ...(body.beforeMediaUrl !== undefined
        ? { before_media_url: body.beforeMediaUrl }
        : {}),
      ...(body.afterMediaUrl !== undefined ? { after_media_url: body.afterMediaUrl } : {}),
      ...(body.mediaType !== undefined ? { media_type: body.mediaType } : {}),
      ...(body.isPublished !== undefined ? { is_published: body.isPublished } : {})
    };

    if (body.beforeMediaUrl !== undefined) {
      updatePayload.before_url = body.beforeMediaUrl;
    }

    if (body.afterMediaUrl !== undefined) {
      updatePayload.after_url = body.afterMediaUrl;
    }

    const { data, error } = await updatePortfolioItem(supabase, id, updatePayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePublicPortfolio();

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

    revalidatePublicPortfolio();

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

async function updatePortfolioItem(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  id: string,
  payload: Record<string, unknown>
) {
  const result = await supabase
    .from("portfolio_items")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (!isMissingOptionalPortfolioColumn(result.error)) {
    return result;
  }

  const {
    before_url: _beforeUrl,
    after_url: _afterUrl,
    is_hero: _isHero,
    ...safePayload
  } = payload;

  const safeResult = await supabase
    .from("portfolio_items")
    .update(safePayload)
    .eq("id", id)
    .select("*")
    .single();

  if (!isMissingOptionalPortfolioColumn(safeResult.error)) {
    return safeResult;
  }

  const { is_published: _isPublished, ...legacyPayload } = safePayload;

  return supabase
    .from("portfolio_items")
    .update(legacyPayload)
    .eq("id", id)
    .select("*")
    .single();
}

function isMissingOptionalPortfolioColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return (
    code === "PGRST204" ||
    message.includes("before_url") ||
    message.includes("after_url") ||
    message.includes("is_published") ||
    message.includes("is_hero")
  );
}

function revalidatePublicPortfolio() {
  revalidatePath("/");
  revalidatePath("/avant-apres");
}
