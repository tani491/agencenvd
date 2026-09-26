import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import {
  buildAnalyticsSummary,
  getAdminQuotes,
  getAudienceSummary
} from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [quotes, audience] = await Promise.all([
    getAdminQuotes(),
    getAudienceSummary()
  ]);
  const summary = buildAnalyticsSummary(quotes, audience);

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-nvd-blue-primary">
          Vue d'ensemble
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-nvd-blue-dark">
          Analytics & performance commerciale
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Suivez les visites, les demandes de devis et la conversion réelle du
          site NVD.
        </p>
      </header>

      <AnalyticsCharts summary={summary} />
    </div>
  );
}
