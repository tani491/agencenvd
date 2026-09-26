"use client";

import { useEffect } from "react";

const visitorStorageKey = "nvd_visitor_id";

export function PageViewTracker() {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    const searchParams = new URLSearchParams(window.location.search);

    void fetch("/api/analytics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      keepalive: true,
      body: JSON.stringify({
        visitorId,
        path: `${window.location.pathname}${window.location.search}`,
        referrer: document.referrer,
        utmSource: searchParams.get("utm_source") ?? "direct",
        utmMedium: searchParams.get("utm_medium") ?? "",
        utmCampaign: searchParams.get("utm_campaign") ?? ""
      })
    }).catch(() => {
      // Analytics must never block the public experience.
    });
  }, []);

  return null;
}

function getOrCreateVisitorId() {
  const existing = window.localStorage.getItem(visitorStorageKey);

  if (existing) {
    return existing;
  }

  const visitorId =
    window.crypto?.randomUUID?.() ??
    `visitor-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(visitorStorageKey, visitorId);
  return visitorId;
}
