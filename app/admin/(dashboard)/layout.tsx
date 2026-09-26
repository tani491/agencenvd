import { Droplets } from "lucide-react";
import { AdminNav } from "@/components/admin/AdminNav";
import { LogoutButton } from "@/components/admin/LogoutButton";
import { requireAdminUser } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requireAdminUser();

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen lg:grid-cols-[280px_1fr]">
        <aside className="border-r bg-white">
          <div className="sticky top-0 flex h-auto flex-col p-5 lg:h-screen">
            <div className="mb-8 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-nvd-blue-primary text-white">
                <Droplets className="h-6 w-6" />
              </div>
              <div>
                <div className="font-black text-nvd-blue-dark">NVD Admin</div>
                <div className="text-xs text-muted-foreground">CRM & CMS</div>
              </div>
            </div>
            <AdminNav />
            <div className="mt-auto grid gap-3 rounded-lg border bg-slate-50 p-3">
              <div className="text-xs font-semibold text-muted-foreground">
                Connecté en tant que
              </div>
              <div className="truncate text-sm font-bold text-nvd-blue-dark">
                {admin.email}
              </div>
              <LogoutButton />
            </div>
          </div>
        </aside>
        <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</section>
      </div>
    </main>
  );
}
