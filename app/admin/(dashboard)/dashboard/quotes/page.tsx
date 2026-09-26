import { Inbox } from "lucide-react";
import { QuotesDataTable } from "@/components/admin/QuotesDataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminQuotes } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage() {
  const quotes = await getAdminQuotes();
  const pendingCount = quotes.filter((quote) => quote.status === "pending").length;

  return (
    <div className="grid gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-nvd-blue-primary">
            CRM prospection
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-normal text-nvd-blue-dark">
            Demandes de devis entrantes
          </h1>
        </div>
        <div className="rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-slate-700">
          {pendingCount} nouvelle(s) demande(s)
        </div>
      </header>

      <Card>
        <CardHeader className="flex-row items-center gap-3 space-y-0">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-50 text-nvd-blue-primary">
            <Inbox className="h-5 w-5" />
          </div>
          <CardTitle>Pipeline devis</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotesDataTable quotes={quotes} />
        </CardContent>
      </Card>
    </div>
  );
}
