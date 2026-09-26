import { AnalyticsCharts } from "@/components/admin/AnalyticsCharts";
import { buildAnalyticsSummary, getAdminQuotes } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminAnalyticsPage() {
  const quotes = await getAdminQuotes();
  const summary = buildAnalyticsSummary(quotes);

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-nvd-blue-primary">
          Tracking & attribution
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-nvd-blue-dark">
          Analytics des prospects NVD
        </h1>
      </header>

      <AnalyticsCharts summary={summary} />
    </div>
  );
}
