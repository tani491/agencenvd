import type { MetadataRoute } from "next";
import { getPublishedPortfolioCategories } from "@/lib/portfolio";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://nvdnettoyage.online";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const categories = await getPublishedPortfolioCategories();
  const routes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: `${siteUrl}/avant-apres`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9
    }
  ];

  categories.forEach((category) => {
    const url = new URL("/avant-apres", siteUrl);
    url.searchParams.set("categorie", slugifyCategory(category));

    routes.push({
      url: url.toString(),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8
    });
  });

  return routes;
}

function slugifyCategory(category: string) {
  return category
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
