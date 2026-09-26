"use client";

import { useState } from "react";
import { Loader2, Save, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import type { SiteConfig } from "@/lib/admin/data";

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function SettingsManager({ initialConfig }: { initialConfig: SiteConfig }) {
  const [config, setConfig] = useState(initialConfig);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);
  const [contactFeedback, setContactFeedback] = useState<Feedback>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isSavingContacts, setIsSavingContacts] = useState(false);

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
      const supabase = createClient();
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

      setCurrentPassword("");
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
          logoUrl: config.logo_url,
          phonePrimary: config.phone_primary,
          phoneSecondary: config.phone_secondary,
          whatsappNumber: config.whatsapp_number,
          heroTitle: config.hero_title ?? "",
          heroBackgroundUrl: config.hero_background_url ?? ""
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setContactFeedback({
          type: "error",
          message: payload?.error ?? "Impossible d'enregistrer les coordonnées."
        });
        return;
      }

      if (payload?.config) {
        setConfig(payload.config as SiteConfig);
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
    <div className="grid gap-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sécurité du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={updatePassword}>
            <label className="grid gap-2 text-sm font-semibold">
              Mot de passe actuel
              <Input
                type="password"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
            </label>
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
            <Button type="submit" variant="nvd" size="lg" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
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
                required
              />
            </label>
            <Button type="submit" variant="nvd" size="lg" disabled={isSavingContacts}>
              {isSavingContacts ? <Loader2 className="animate-spin" /> : <Save />}
              Enregistrer les coordonnées
            </Button>
          </form>

          <FeedbackMessage feedback={contactFeedback} />
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackMessage({ feedback }: { feedback: Feedback }) {
  if (!feedback) {
    return null;
  }

  return (
    <div
      className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
        feedback.type === "success"
          ? "bg-emerald-50 text-emerald-800"
          : "bg-red-50 text-red-700"
      }`}
    >
      {feedback.message}
    </div>
  );
}
