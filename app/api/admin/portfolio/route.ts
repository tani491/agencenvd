import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const portfolioCreateSchema = z.object({
  title: z.string().trim().max(160).optional(),
  category: z.string().trim().max(120).optional(),
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
    const insertPayload = {
      title: body.title || "Réalisation NVD",
      category: body.category || "Canapés",
      before_media_url: body.beforeMediaUrl,
      after_media_url: body.afterMediaUrl,
      media_type: body.mediaType,
      is_published: body.isPublished
    };
    const { data, error } = await insertPortfolioItem(supabase, insertPayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePublicPortfolio();

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

async function insertPortfolioItem(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: {
    title: string;
    category: string;
    before_media_url: string;
    after_media_url: string;
    media_type: "image" | "video";
    is_published: boolean;
  }
) {
  const extendedPayload = {
    ...payload,
    after_url: payload.after_media_url,
    is_hero: false
  };
  const extendedResult = await supabase
    .from("portfolio_items")
    .insert(extendedPayload)
    .select("*")
    .single();

  if (!isMissingOptionalPortfolioColumn(extendedResult.error)) {
    return extendedResult;
  }

  return supabase.from("portfolio_items").insert(payload).select("*").single();
}

function isMissingOptionalPortfolioColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return (
    code === "PGRST204" ||
    message.includes("after_url") ||
    message.includes("is_hero")
  );
}

function revalidatePublicPortfolio() {
  revalidatePath("/");
  revalidatePath("/avant-apres");
}
