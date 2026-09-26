import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  emptyToNull,
  normalizeSenegalPhone,
  quoteSubmissionSchema
} from "@/lib/validations/quote";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payload = quoteSubmissionSchema.parse(body);
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase
      .from("quotes")
      .insert({
        full_name: payload.fullName.trim(),
        phone: normalizeSenegalPhone(payload.phone),
        location: payload.location.trim(),
        details: emptyToNull(payload.details),
        services: payload.services,
        furniture_photo_url: emptyToNull(payload.furniturePhotoUrl),
        preferred_date: emptyToNull(payload.preferredDate),
        status: "pending",
        utm_source: emptyToNull(payload.utmSource) ?? "direct",
        utm_medium: emptyToNull(payload.utmMedium),
        utm_campaign: emptyToNull(payload.utmCampaign),
        referrer_url: emptyToNull(payload.referrerUrl)
      })
      .select("id, created_at")
      .single();

    if (error) {
      console.error("Supabase quote insert error", error);

      return NextResponse.json(
        { error: "Impossible d'enregistrer le devis." },
        { status: 500 }
      );
    }

    return NextResponse.json({ quote: data }, { status: 201 });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Demande invalide.", issues },
        { status: 400 }
      );
    }

    console.error("Quote API error", error);

    return NextResponse.json(
      { error: "Erreur serveur lors de l'enregistrement." },
      { status: 500 }
    );
  }
}
