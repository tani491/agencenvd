import { SettingsManager } from "@/components/admin/SettingsManager";
import { getAdminSiteConfig } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const config = await getAdminSiteConfig();

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-nvd-blue-primary">
          Paramètres & sécurité
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-nvd-blue-dark">
          Compte administrateur et coordonnées
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Gérez le mot de passe du compte connecté et les coordonnées affichées
          dans les espaces publics NVD.
        </p>
      </header>

      <SettingsManager initialConfig={config} />
    </div>
  );
}
