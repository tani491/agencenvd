import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const urlOrEmptySchema = z.union([
  z.string().url().startsWith("https://"),
  z.literal("")
]);

const testimonialCreateSchema = z
  .object({
    clientName: z.string().trim().max(120).optional(),
    client_name: z.string().trim().max(120).optional(),
    rating: z.coerce.number().min(1).max(5).default(5),
    comment: z.string().trim().max(800),
    serviceUsed: z.string().trim().max(120).optional(),
    service_used: z.string().trim().max(120).optional(),
    avatarUrl: urlOrEmptySchema.optional(),
    avatar_url: urlOrEmptySchema.optional(),
    isPublished: z.boolean().optional(),
    is_published: z.boolean().optional()
  })
  .superRefine((value, ctx) => {
    if (!getClientName(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le nom du client est requis.",
        path: ["clientName"]
      });
    }

    if (!value.comment.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le commentaire est requis.",
        path: ["comment"]
      });
    }
  });

type TestimonialCreatePayload = z.infer<typeof testimonialCreateSchema>;

export async function POST(request: Request) {
  try {
    const admin = await getAdminAuthState();

    if (!admin.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const body = testimonialCreateSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const payload = {
      client_name: getClientName(body),
      rating: body.rating,
      comment: body.comment,
      service_used: getServiceUsed(body),
      avatar_url: getAvatarUrl(body),
      is_published: body.isPublished ?? body.is_published ?? true
    };
    const { data, error } = await insertTestimonial(supabase, payload);

    if (error) {
      console.warn("Erreur insertion témoignage:", error.message);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    revalidatePath("/");

    return NextResponse.json(
      { success: true, item: normalizeTestimonialResponse(data, payload) },
      { status: 201 }
    );
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { success: false, error: "Témoignage invalide.", issues },
        { status: 400 }
      );
    }

    console.warn("Exception testimonial POST:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible d'enregistrer le témoignage."
      },
      { status: 400 }
    );
  }
}

async function insertTestimonial(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: Record<string, unknown>
) {
  let candidate = { ...payload };

  for (let attempt = 0; attempt <= removableTestimonialColumns.length; attempt++) {
    const result = await supabase
      .from("testimonials")
      .insert(candidate)
      .select("*")
      .single();
    const missingColumn = getMissingOptionalTestimonialColumn(result.error);

    if (!missingColumn || !(missingColumn in candidate)) {
      return result;
    }

    const { [missingColumn]: _removed, ...nextCandidate } = candidate;
    candidate = nextCandidate;
  }

  return supabase.from("testimonials").insert(candidate).select("*").single();
}

const removableTestimonialColumns = ["is_published"] as const;

function getMissingOptionalTestimonialColumn(error: unknown) {
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
    removableTestimonialColumns.find((column) => message.includes(column)) ?? null
  );
}

function getClientName(payload: Partial<TestimonialCreatePayload>) {
  return payload.clientName ?? payload.client_name ?? "";
}

function getServiceUsed(payload: Partial<TestimonialCreatePayload>) {
  return payload.serviceUsed ?? payload.service_used ?? "Nettoyage vapeur";
}

function getAvatarUrl(payload: Partial<TestimonialCreatePayload>) {
  return payload.avatarUrl ?? payload.avatar_url ?? "";
}

function normalizeTestimonialResponse(
  data: unknown,
  fallback: Record<string, unknown>
) {
  if (!data || typeof data !== "object") {
    return fallback;
  }

  return {
    ...fallback,
    ...(data as Record<string, unknown>)
  };
}
