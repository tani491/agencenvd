import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getValidationIssues } from "@/lib/validations/errors";

export const runtime = "nodejs";

const analyticsEventSchema = z.object({
  visitorId: z.string().trim().min(8).max(120),
  path: z.string().trim().min(1).max(260),
  referrer: z.string().trim().max(500).optional(),
  utmSource: z.string().trim().max(120).optional(),
  utmMedium: z.string().trim().max(120).optional(),
  utmCampaign: z.string().trim().max(160).optional()
});

export async function POST(request: Request) {
  try {
    const payload = analyticsEventSchema.parse(await request.json());
    const userAgent = request.headers.get("user-agent") ?? null;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from("analytics_events").insert({
      visitor_id: payload.visitorId,
      path: payload.path.startsWith("/") ? payload.path : `/${payload.path}`,
      referrer_url: payload.referrer || null,
      utm_source: payload.utmSource || "direct",
      utm_medium: payload.utmMedium || null,
      utm_campaign: payload.utmCampaign || null,
      user_agent: userAgent
    });

    if (error) {
      console.warn("Analytics event insert failed", error.message);
      return new NextResponse(null, { status: 204 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      return NextResponse.json(
        { error: "Evénement analytics invalide.", issues },
        { status: 400 }
      );
    }

    console.warn("Analytics route unavailable", error);

    return new NextResponse(null, { status: 204 });
  }
}
