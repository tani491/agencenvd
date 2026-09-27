import { createClient } from "@supabase/supabase-js";
import {
  getOptionalSupabasePublishableKey,
  getOptionalSupabasePublicUrl
} from "@/lib/supabase/env";

export type PublicTestimonial = {
  id: string;
  created_at: string;
  client_name: string;
  rating: number;
  comment: string;
  service_used: string;
  avatar_url: string | null;
  is_published?: boolean | null;
};

export async function getPublishedTestimonials(limit = 6) {
  const supabaseUrl = getOptionalSupabasePublicUrl();
  const supabaseKey = getOptionalSupabasePublishableKey();

  if (!supabaseUrl || !supabaseKey) {
    return [];
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      fetch: noStoreFetch,
      headers: {
        "X-Client-Info": "nvd-public-testimonials"
      }
    }
  });

  let data: unknown[] | null = null;
  let error: unknown = null;

  for (const candidate of [
    { onlyPublished: true, includePublishedColumn: true },
    { onlyPublished: false, includePublishedColumn: true },
    { onlyPublished: false, includePublishedColumn: false }
  ]) {
    const result = await selectTestimonials(
      supabase,
      limit,
      candidate.onlyPublished,
      candidate.includePublishedColumn
    );

    data = result.data;
    error = result.error;

    if (!error) {
      break;
    }

    if (!isMissingPublicationColumn(error)) {
      break;
    }
  }

  if (error) {
    console.warn("Unable to load public testimonials", error);
    return [];
  }

  return (data ?? [])
    .map(normalizePublicTestimonial)
    .filter((item): item is PublicTestimonial => Boolean(item));
}

function selectTestimonials(
  supabase: ReturnType<typeof createClient<any>>,
  limit: number,
  onlyPublished: boolean,
  includePublishedColumn: boolean
) {
  let query = supabase.from("testimonials").select(
    includePublishedColumn
      ? "id, created_at, client_name, rating, comment, service_used, avatar_url, is_published"
      : "id, created_at, client_name, rating, comment, service_used, avatar_url"
  );

  if (onlyPublished) {
    query = query.eq("is_published", true);
  }

  return query.order("created_at", { ascending: false }).limit(limit);
}

function normalizePublicTestimonial(row: unknown): PublicTestimonial | null {
  if (!row || typeof row !== "object") {
    return null;
  }

  const testimonial = row as Partial<PublicTestimonial>;
  const rating = Number(testimonial.rating ?? 5);

  if (!testimonial.comment?.trim()) {
    return null;
  }

  return {
    id: testimonial.id ?? crypto.randomUUID(),
    created_at: testimonial.created_at ?? new Date(0).toISOString(),
    client_name: testimonial.client_name || "Client NVD",
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 5,
    comment: testimonial.comment,
    service_used: testimonial.service_used || "Nettoyage vapeur",
    avatar_url: testimonial.avatar_url ?? null,
    is_published: testimonial.is_published ?? true
  };
}

function isMissingPublicationColumn(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message = "message" in error ? String(error.message) : "";
  const code = "code" in error ? String(error.code) : "";

  return code === "PGRST204" || message.includes("is_published");
}

function noStoreFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, {
    ...init,
    cache: "no-store"
  });
}
