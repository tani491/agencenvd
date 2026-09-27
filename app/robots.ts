import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://nvdnettoyage.online";

export default function robots(): MetadataRoute.Robots {
  const adminDisallow = ["/admin", "/admin/"];

  return {
    rules: [
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "GPTBot",
          "OAI-SearchBot",
          "ChatGPT-User",
          "PerplexityBot"
        ],
        allow: "/",
        disallow: adminDisallow
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: adminDisallow
      }
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl
  };
}
