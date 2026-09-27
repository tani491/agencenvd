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

const testimonialPatchSchema = z.object({
  clientName: z.string().trim().min(2).max(120).optional(),
  client_name: z.string().trim().min(2).max(120).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().trim().min(2).max(800).optional(),
  serviceUsed: z.string().trim().min(2).max(120).optional(),
  service_used: z.string().trim().min(2).max(120).optional(),
  avatarUrl: urlOrEmptySchema.optional(),
  avatar_url: urlOrEmptySchema.optional(),
  isPublished: z.boolean().optional(),
  is_published: z.boolean().optional()
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminAuthState();

    if (!admin.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = testimonialPatchSchema.parse(await request.json());
    const payload: Record<string, unknown> = {
      ...(body.clientName !== undefined ? { client_name: body.clientName } : {}),
      ...(body.client_name !== undefined ? { client_name: body.client_name } : {}),
      ...(body.rating !== undefined ? { rating: body.rating } : {}),
      ...(body.comment !== undefined ? { comment: body.comment } : {}),
      ...(body.serviceUsed !== undefined ? { service_used: body.serviceUsed } : {}),
      ...(body.service_used !== undefined ? { service_used: body.service_used } : {}),
      ...(body.avatarUrl !== undefined ? { avatar_url: body.avatarUrl } : {}),
      ...(body.avatar_url !== undefined ? { avatar_url: body.avatar_url } : {}),
      ...(body.isPublished !== undefined ? { is_published: body.isPublished } : {}),
      ...(body.is_published !== undefined ? { is_published: body.is_published } : {})
    };

    const supabase = getSupabaseAdminClient();
    const { data, error } = await updateTestimonial(supabase, id, payload);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    revalidatePath("/");

    return NextResponse.json({ success: true, item: data });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { success: false, error: "Témoignage invalide.", issues },
        { status: 400 }
      );
    }

    console.warn("Exception testimonial PATCH:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de modifier le témoignage."
      },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await getAdminAuthState();

    if (!admin.isAdmin) {
      return NextResponse.json(
        { success: false, error: "Non autorisé." },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("testimonials").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    revalidatePath("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn("Exception testimonial DELETE:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le témoignage."
      },
      { status: 400 }
    );
  }
}

async function updateTestimonial(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  id: string,
  payload: Record<string, unknown>
) {
  const result = await supabase
    .from("testimonials")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (!isMissingPublicationColumn(result.error)) {
    return result;
  }

  const { is_published: _isPublished, ...legacyPayload } = payload;

  return supabase
    .from("testimonials")
    .update(legacyPayload)
    .eq("id", id)
    .select("*")
    .single();
}

function isMissingPublicationColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return code === "PGRST204" || message.includes("is_published");
}
