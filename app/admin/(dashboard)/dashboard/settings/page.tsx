"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@supabase/ssr";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SiteConfig = {
  id: number;
  logo_url: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp_number: string;
  hero_title: string | null;
  hero_background_url: string | null;
};

type Feedback = {
  type: "success" | "error" | "info";
  message: string;
} | null;

type SiteConfigResponse = {
  config?: SiteConfig;
  error?: string;
};

const fallbackConfig: SiteConfig = {
  id: 1,
  logo_url: "/logo-nvd.svg",
  phone_primary: "778609143",
  phone_secondary: "788605633",
  whatsapp_number: "778609143",
  hero_title: "Le spécialiste du nettoyage à vapeur & désinfection écologique au Sénégal.",
  hero_background_url: ""
};

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<SiteConfig>(fallbackConfig);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [contactFeedback, setContactFeedback] = useState<Feedback>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSavingContacts, setIsSavingContacts] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadConfig() {
      try {
        const response = await fetch("/api/admin/site-config", {
          cache: "no-store"
        });
        const payload = (await response.json().catch(() => null)) as
          | SiteConfigResponse
          | null;

        if (!isMounted) {
          return;
        }

        if (response.ok && payload?.config) {
          setConfig({
            ...fallbackConfig,
            ...payload.config
          });
          return;
        }

        setContactFeedback({
          type: "info",
          message:
            payload?.error ??
            "Coordonnées par défaut chargées. La table de configuration n'est pas encore disponible."
        });
      } catch {
        if (!isMounted) {
          return;
        }

        setContactFeedback({
          type: "info",
          message:
            "Coordonnées par défaut chargées. La configuration distante est indisponible."
        });
      } finally {
        if (isMounted) {
          setIsLoadingConfig(false);
        }
      }
    }

    void loadConfig();

    return () => {
      isMounted = false;
    };
  }, []);

  async function updatePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordFeedback(null);

    if (newPassword.length < 8) {
      setPasswordFeedback({
        type: "error",
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères."
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordFeedback({
        type: "error",
        message: "La confirmation ne correspond pas au nouveau mot de passe."
      });
      return;
    }

    setIsUpdatingPassword(true);

    try {
      const supabase = createSupabaseBrowserClient();

      if (!supabase) {
        setPasswordFeedback({
          type: "error",
          message:
            "Configuration Supabase navigateur manquante. Vérifiez les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
        });
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        setPasswordFeedback({
          type: "error",
          message: error.message || "Impossible de modifier le mot de passe."
        });
        return;
      }

      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({
        type: "success",
        message: "Mot de passe administrateur mis à jour."
      });
    } catch (error) {
      console.error(error);
      setPasswordFeedback({
        type: "error",
        message: "Le changement de mot de passe est indisponible pour le moment."
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  }

  async function saveContacts(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setContactFeedback(null);
    setIsSavingContacts(true);

    try {
      const response = await fetch("/api/admin/site-config", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          logoUrl: config.logo_url || fallbackConfig.logo_url,
          phonePrimary: config.phone_primary,
          phoneSecondary: config.phone_secondary,
          whatsappNumber: config.whatsapp_number,
          heroTitle: config.hero_title ?? "",
          heroBackgroundUrl: config.hero_background_url ?? ""
        })
      });
      const payload = (await response.json().catch(() => null)) as
        | SiteConfigResponse
        | null;

      if (!response.ok) {
        setContactFeedback({
          type: "error",
          message:
            payload?.error ??
            "Impossible d'enregistrer les coordonnées pour le moment."
        });
        return;
      }

      if (payload?.config) {
        setConfig({
          ...fallbackConfig,
          ...payload.config
        });
      }

      setContactFeedback({
        type: "success",
        message: "Coordonnées NVD enregistrées."
      });
    } catch (error) {
      console.error(error);
      setContactFeedback({
        type: "error",
        message: "Erreur réseau pendant l'enregistrement."
      });
    } finally {
      setIsSavingContacts(false);
    }
  }

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

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sécurité du compte</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={updatePassword}>
              <label className="grid gap-2 text-sm font-semibold">
                Nouveau mot de passe
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Confirmer le nouveau mot de passe
                <Input
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  minLength={8}
                  required
                />
              </label>
              <Button
                type="submit"
                variant="nvd"
                size="lg"
                disabled={isUpdatingPassword}
              >
                {isUpdatingPassword ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <ShieldCheck />
                )}
                Mettre à jour le mot de passe
              </Button>
            </form>

            <FeedbackMessage feedback={passwordFeedback} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Coordonnées publiques</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={saveContacts}>
              <label className="grid gap-2 text-sm font-semibold">
                Téléphone principal
                <Input
                  value={config.phone_primary}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      phone_primary: event.target.value
                    }))
                  }
                  disabled={isLoadingConfig}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Téléphone secondaire
                <Input
                  value={config.phone_secondary}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      phone_secondary: event.target.value
                    }))
                  }
                  disabled={isLoadingConfig}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Numéro WhatsApp
                <Input
                  value={config.whatsapp_number}
                  onChange={(event) =>
                    setConfig((current) => ({
                      ...current,
                      whatsapp_number: event.target.value
                    }))
                  }
                  disabled={isLoadingConfig}
                  required
                />
              </label>
              <Button
                type="submit"
                variant="nvd"
                size="lg"
                disabled={isSavingContacts || isLoadingConfig}
              >
                {isSavingContacts ? <Loader2 className="animate-spin" /> : <Save />}
                Enregistrer les coordonnées
              </Button>
            </form>

            <FeedbackMessage feedback={contactFeedback} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function createSupabaseBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) {
    return null;
  }

  const className =
    feedback.type === "success"
      ? "bg-emerald-50 text-emerald-800"
      : feedback.type === "info"
      ? "bg-cyan-50 text-nvd-blue-dark"
      : "bg-red-50 text-red-700";

  return (
    <div className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${className}`}>
      {feedback.message}
    </div>
  );
}
