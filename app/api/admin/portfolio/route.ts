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
  beforeMediaUrl: z.string().url().startsWith("https://").optional(),
  beforeUrl: z.string().url().startsWith("https://").optional(),
  before_media_url: z.string().url().startsWith("https://").optional(),
  afterMediaUrl: z.string().url().startsWith("https://").optional(),
  afterUrl: z.string().url().startsWith("https://").optional(),
  after_media_url: z.string().url().startsWith("https://").optional(),
  mediaType: z.enum(["image", "video"]),
  isPublished: z.boolean().default(true)
}).superRefine((value, ctx) => {
  if (!getBeforeUrl(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "L'image avant est requise.",
      path: ["beforeMediaUrl"]
    });
  }

  if (!getAfterUrl(value)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "L'image après est requise.",
      path: ["afterMediaUrl"]
    });
  }
});

type PortfolioCreatePayload = z.infer<typeof portfolioCreateSchema>;

export async function POST(request: Request) {
  const admin = await getAdminAuthState();

  if (!admin.isAdmin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = portfolioCreateSchema.parse(await request.json());
    const beforeUrl = getBeforeUrl(body);
    const afterUrl = getAfterUrl(body);
    const supabase = getSupabaseAdminClient();
    const insertPayload: PortfolioInsertPayload = {
      title: body.title || "Réalisation NVD",
      category: body.category || "Canapés",
      before_url: beforeUrl,
      before_media_url: beforeUrl,
      after_url: afterUrl,
      after_media_url: afterUrl,
      is_published: body.isPublished,
      is_hero: false,
      media_type: body.mediaType,
    };
    const { data, error } = await insertPortfolioItem(supabase, insertPayload);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    revalidatePublicPortfolio();

    return NextResponse.json(
      { item: normalizePortfolioItemResponse(data, body.isPublished) },
      { status: 201 }
    );
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

type PortfolioInsertPayload = {
  title: string;
  category: string;
  before_url: string;
  before_media_url: string;
  after_url: string;
  after_media_url: string;
  media_type: "image" | "video";
  is_published: boolean;
  is_hero: boolean;
};

async function insertPortfolioItem(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: PortfolioInsertPayload
) {
  let candidate: Record<string, unknown> = { ...payload };

  for (let attempt = 0; attempt <= removablePortfolioColumns.length; attempt++) {
    const result = await supabase
      .from("portfolio_items")
      .insert(candidate)
      .select("*")
      .single();
    const missingColumn = getMissingOptionalPortfolioColumn(result.error);

    if (!missingColumn || !(missingColumn in candidate)) {
      return result;
    }

    const { [missingColumn]: _removed, ...nextCandidate } = candidate;
    candidate = nextCandidate;
  }

  return supabase.from("portfolio_items").insert(candidate).select("*").single();
}

const removablePortfolioColumns = [
  "before_url",
  "after_url",
  "is_published",
  "is_hero"
] as const;

function getMissingOptionalPortfolioColumn(error: unknown) {
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

  return (
    removablePortfolioColumns.find((column) => message.includes(column)) ?? null
  );
}

function getBeforeUrl(payload: Partial<PortfolioCreatePayload>) {
  return payload.beforeMediaUrl ?? payload.beforeUrl ?? payload.before_media_url ?? "";
}

function getAfterUrl(payload: Partial<PortfolioCreatePayload>) {
  return payload.afterMediaUrl ?? payload.afterUrl ?? payload.after_media_url ?? "";
}

function normalizePortfolioItemResponse(data: unknown, isPublished: boolean) {
  if (!data || typeof data !== "object") {
    return data;
  }

  const row = data as Record<string, unknown>;
  const beforeMediaUrl =
    typeof row.before_media_url === "string" && row.before_media_url
      ? row.before_media_url
      : row.before_url;
  const afterMediaUrl =
    typeof row.after_media_url === "string" && row.after_media_url
      ? row.after_media_url
      : row.after_url;

  return {
    ...row,
    before_media_url: typeof beforeMediaUrl === "string" ? beforeMediaUrl : "",
    after_media_url: typeof afterMediaUrl === "string" ? afterMediaUrl : "",
    is_published: isPublished
  };
}

function revalidatePublicPortfolio() {
  revalidatePath("/");
  revalidatePath("/avant-apres");
}
