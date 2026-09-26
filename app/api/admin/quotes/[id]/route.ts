import { NextResponse } from "next/server";
import { z } from "zod";
import { getAdminAuthState } from "@/lib/admin/auth";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const quoteStatusSchema = z.object({
  status: z.enum([
    "pending",
    "contacted",
    "quoted",
    "scheduled",
    "completed",
    "cancelled"
  ])
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
    const body = quoteStatusSchema.parse(await request.json());
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("quotes")
      .update({ status: body.status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ quote: data });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Statut invalide.", issues },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
