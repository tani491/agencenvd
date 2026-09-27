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
    const normalizedPath = payload.path.startsWith("/")
      ? payload.path
      : `/${payload.path}`;
    const { error } = await insertAnalyticsEvent(supabase, {
      visitor_id: payload.visitorId,
      path: normalizedPath,
      page_path: normalizedPath,
      referrer_url: payload.referrer || null,
      utm_source: payload.utmSource || "direct",
      utm_medium: payload.utmMedium || null,
      utm_campaign: payload.utmCampaign || null,
      user_agent: userAgent
    });

    if (error) {
      if (!isMissingOptionalAnalyticsColumn(error)) {
        console.warn("Analytics event insert failed", error.message);
      }

      return NextResponse.json({ recorded: false }, { status: 200 });
    }

    return NextResponse.json({ recorded: true }, { status: 200 });
  } catch (error) {
    const issues = getValidationIssues(error);

    if (issues) {
      console.warn("Invalid analytics event ignored", issues);
      return NextResponse.json({ recorded: false }, { status: 200 });
    }

    console.warn("Analytics route unavailable", error);

    return NextResponse.json({ recorded: false }, { status: 200 });
  }
}

async function insertAnalyticsEvent(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payload: Record<string, unknown>
) {
  const { page_path: _pagePath, ...pathPayload } = payload;
  const firstResult = await supabase.from("analytics_events").insert(pathPayload);

  if (!isMissingOptionalAnalyticsColumn(firstResult.error)) {
    return firstResult;
  }

  const { path: _path, ...pagePathPayload } = payload;
  const secondResult = await supabase.from("analytics_events").insert(pagePathPayload);

  if (!isMissingOptionalAnalyticsColumn(secondResult.error)) {
    return secondResult;
  }

  const {
    path: _removedPath,
    page_path: _removedPagePath,
    referrer_url: _removedReferrerUrl,
    utm_source: _removedUtmSource,
    utm_medium: _removedUtmMedium,
    utm_campaign: _removedUtmCampaign,
    user_agent: _removedUserAgent,
    ...minimalPayload
  } = payload;

  return supabase.from("analytics_events").insert(minimalPayload);
}

function isMissingOptionalAnalyticsColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return (
    code === "PGRST204" ||
    message.includes("path") ||
    message.includes("page_path") ||
    message.includes("referrer_url") ||
    message.includes("utm_source") ||
    message.includes("utm_medium") ||
    message.includes("utm_campaign") ||
    message.includes("user_agent")
  );
}
