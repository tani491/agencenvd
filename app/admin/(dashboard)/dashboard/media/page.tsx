import { MediaManager } from "@/components/admin/MediaManager";
import {
  getAdminPortfolioItems,
  getAdminSiteConfig,
  getDefaultSiteConfig
} from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminMediaPage() {
  const [itemsResult, configResult] = await Promise.allSettled([
    getAdminPortfolioItems(),
    getAdminSiteConfig()
  ]);
  const items = itemsResult.status === "fulfilled" ? itemsResult.value : [];
  const config =
    configResult.status === "fulfilled"
      ? configResult.value
      : getDefaultSiteConfig();

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-nvd-blue-primary">
          CMS médias & Hero
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-nvd-blue-dark">
          Images publiques et réalisations avant / après
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Remplacez le fond principal de la landing page, ajoutez des paires
          avant/après et contrôlez leur publication.
        </p>
      </header>

      <MediaManager initialItems={items} initialConfig={config} />
    </div>
  );
}
