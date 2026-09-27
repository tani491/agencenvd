"use client";

import { useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Pencil,
  Save,
  Trash2,
  UploadCloud,
  Video,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PortfolioItem, SiteConfig } from "@/lib/admin/data";

type UploadFolder = "portfolio" | "hero";

type UploadResponse = {
  publicUrl?: string;
  error?: string;
};

type Feedback = {
  type: "success" | "error";
  message: string;
} | null;

export function MediaManager({
  initialItems,
  initialConfig
}: {
  initialItems: PortfolioItem[];
  initialConfig: SiteConfig;
}) {
  const [items, setItems] = useState(initialItems);
  const [config, setConfig] = useState(initialConfig);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Canapés");
  const [beforeMediaUrl, setBeforeMediaUrl] = useState("");
  const [afterMediaUrl, setAfterMediaUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingHero, setIsSavingHero] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [editingId, setEditingId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editBeforeMediaUrl, setEditBeforeMediaUrl] = useState("");
  const [editAfterMediaUrl, setEditAfterMediaUrl] = useState("");
  const [updatingId, setUpdatingId] = useState("");
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function handleUpload(
    file: File,
    target: "hero" | "before" | "after"
  ) {
    setUploadingTarget(target);
    setFeedback(null);

    try {
      const publicUrl = await uploadMedia(
        file,
        target === "hero" ? "hero" : "portfolio"
      );

      if (target === "hero") {
        setConfig((current) => ({
          ...current,
          hero_background_url: publicUrl
        }));
      }

      if (target === "before") {
        setBeforeMediaUrl(publicUrl);
      }

      if (target === "after") {
        setAfterMediaUrl(publicUrl);
      }
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: getUploadErrorMessage(error)
      });
    } finally {
      setUploadingTarget("");
    }
  }

  async function saveHeroConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingHero(true);
    setFeedback(null);

    await persistHeroConfig(config.hero_background_url ?? "", "Hero public mis à jour.");
  }

  async function deleteHeroImage() {
    const confirmed = window.confirm("Supprimer l'image Hero de la vitrine ?");

    if (!confirmed) {
      return;
    }

    setIsSavingHero(true);
    setFeedback(null);

    await persistHeroConfig("", "Image Hero supprimée.");
  }

  async function persistHeroConfig(heroBackgroundUrl: string, successMessage: string) {
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
          heroBackgroundUrl
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setFeedback({
          type: "error",
          message: payload?.error ?? "Impossible d'enregistrer le Hero."
        });
        return;
      }

      if (payload?.config) {
        setConfig(payload.config as SiteConfig);
      } else {
        setConfig((current) => ({
          ...current,
          hero_background_url: heroBackgroundUrl || null
        }));
      }

      setFeedback({
        type: "success",
        message: successMessage
      });
    } catch (error) {
      console.error(error);
      setFeedback({
        type: "error",
        message: "Impossible d'enregistrer le Hero."
      });
    } finally {
      setIsSavingHero(false);
    }
  }

  async function createPortfolioItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setFeedback(null);

    const response = await fetch("/api/admin/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        category,
        beforeUrl: beforeMediaUrl,
        before_media_url: beforeMediaUrl,
        beforeMediaUrl,
        afterUrl: afterMediaUrl,
        after_media_url: afterMediaUrl,
        afterMediaUrl,
        mediaType: "image",
        isPublished
      })
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: payload?.error ?? "Impossible d'ajouter la paire avant/après."
      });
      setIsCreating(false);
      return;
    }

    setItems((current) => [payload.item as PortfolioItem, ...current]);
    setTitle("");
    setCategory("Canapés");
    setBeforeMediaUrl("");
    setAfterMediaUrl("");
    setIsPublished(true);
    setFeedback({
      type: "success",
      message: "Paire avant/après ajoutée au portfolio."
    });
    setIsCreating(false);
  }

  function startEditingPortfolioItem(item: PortfolioItem) {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditCategory(item.category);
    setEditBeforeMediaUrl(item.before_media_url);
    setEditAfterMediaUrl(item.after_media_url);
    setFeedback(null);
  }

  function cancelEditingPortfolioItem() {
    setEditingId("");
    setEditTitle("");
    setEditCategory("");
    setEditBeforeMediaUrl("");
    setEditAfterMediaUrl("");
  }

  async function updatePortfolioItem(
    event: React.FormEvent<HTMLFormElement>,
    item: PortfolioItem
  ) {
    event.preventDefault();
    setUpdatingId(item.id);
    setFeedback(null);

    const response = await fetch(`/api/admin/portfolio/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: editTitle,
        category: editCategory,
        beforeMediaUrl: editBeforeMediaUrl,
        afterMediaUrl: editAfterMediaUrl
      })
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: payload?.error ?? "Impossible de modifier cette réalisation."
      });
      setUpdatingId("");
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id ? (payload.item as PortfolioItem) : currentItem
      )
    );
    cancelEditingPortfolioItem();
    setFeedback({
      type: "success",
      message: "Réalisation modifiée."
    });
    setUpdatingId("");
  }

  async function togglePublish(item: PortfolioItem) {
    const response = await fetch(`/api/admin/portfolio/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ isPublished: !item.is_published })
    });

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: "Impossible de modifier la publication."
      });
      return;
    }

    setItems((current) =>
      current.map((currentItem) =>
        currentItem.id === item.id
          ? { ...currentItem, is_published: !item.is_published }
          : currentItem
      )
    );
  }

  async function deletePortfolioItem(item: PortfolioItem) {
    const confirmed = window.confirm(
      `Supprimer définitivement "${item.title}" du portfolio ?`
    );

    if (!confirmed) {
      return;
    }

    setDeletingId(item.id);
    setFeedback(null);

    const response = await fetch(`/api/admin/portfolio/${item.id}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: "Impossible de supprimer cette réalisation."
      });
      setDeletingId("");
      return;
    }

    setItems((current) => current.filter((currentItem) => currentItem.id !== item.id));
    setFeedback({
      type: "success",
      message: "Réalisation supprimée."
    });
    setDeletingId("");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Hero de la landing page</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={saveHeroConfig}>
            <UploadPanel
              label="Image principale Hero"
              value={config.hero_background_url ?? ""}
              accept="image/*"
              isUploading={uploadingTarget === "hero"}
              onFile={(file) => handleUpload(file, "hero")}
            />

            {config.hero_background_url && (
              <div className="relative aspect-video overflow-hidden rounded-lg border bg-slate-100">
                <Image
                  src={config.hero_background_url}
                  alt="Fond actuel du Hero NVD"
                  fill
                  sizes="(max-width: 1280px) 100vw, 540px"
                  className="object-cover"
                  unoptimized
                />
              </div>
            )}

            <label className="grid gap-2 text-sm font-semibold">
              URL image Hero
              <Input
                value={config.hero_background_url ?? ""}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    hero_background_url: event.target.value
                  }))
                }
              />
            </label>

            <label className="grid gap-2 text-sm font-semibold">
              Titre Hero
              <Textarea
                value={config.hero_title ?? ""}
                onChange={(event) =>
                  setConfig((current) => ({
                    ...current,
                    hero_title: event.target.value
                  }))
                }
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <Button type="submit" variant="nvd" size="lg" disabled={isSavingHero}>
                {isSavingHero ? <Loader2 className="animate-spin" /> : <Save />}
                Enregistrer le Hero
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="lg"
                disabled={isSavingHero || !config.hero_background_url}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void deleteHeroImage();
                }}
              >
                <Trash2 />
                Supprimer l'image
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avant / Après publiés</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={createPortfolioItem}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Titre
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Catégorie
                <Input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  required
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <UploadPanel
                label="Image avant"
                value={beforeMediaUrl}
                accept="image/*"
                isUploading={uploadingTarget === "before"}
                onFile={(file) => handleUpload(file, "before")}
              />
              <UploadPanel
                label="Image après"
                value={afterMediaUrl}
                accept="image/*"
                isUploading={uploadingTarget === "after"}
                onFile={(file) => handleUpload(file, "after")}
              />
            </div>

            <label className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-3 text-sm font-semibold">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(event) => setIsPublished(event.target.checked)}
                className="h-4 w-4 accent-nvd-blue-primary"
              />
              Publier immédiatement sur la vitrine
            </label>

            <Button
              type="submit"
              variant="nvd"
              size="lg"
              disabled={isCreating || !beforeMediaUrl || !afterMediaUrl}
            >
              {isCreating ? <Loader2 className="animate-spin" /> : <ImagePlus />}
              Ajouter la paire
            </Button>
          </form>

          {feedback && (
            <div
              className={`mt-4 rounded-lg px-4 py-3 text-sm font-semibold ${
                feedback.type === "success"
                  ? "bg-emerald-50 text-emerald-800"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {feedback.message}
            </div>
          )}

          <div className="mt-8 grid gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="grid gap-3 rounded-lg border bg-white p-3 sm:grid-cols-[96px_1fr_auto]"
              >
                <MediaThumb item={item} />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-black text-nvd-blue-dark">{item.title}</div>
                    <Badge variant={item.media_type === "video" ? "cyan" : "secondary"}>
                      {item.media_type === "video" ? "Vidéo" : "Image"}
                    </Badge>
                    <Badge variant={item.is_published ? "eco" : "outline"}>
                      {item.is_published ? "Publié" : "Masqué"}
                    </Badge>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.category}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      startEditingPortfolioItem(item);
                    }}
                  >
                    <Pencil />
                    Modifier
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void togglePublish(item);
                    }}
                  >
                    {item.is_published ? "Dépublier" : "Publier"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void deletePortfolioItem(item);
                    }}
                    disabled={deletingId === item.id}
                  >
                    {deletingId === item.id ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Trash2 />
                    )}
                    Supprimer
                  </Button>
                </div>
                {editingId === item.id && (
                  <form
                    className="grid gap-3 border-t pt-3 sm:col-span-3 sm:grid-cols-2"
                    onSubmit={(event) => updatePortfolioItem(event, item)}
                  >
                    <label className="grid gap-2 text-sm font-semibold">
                      Titre
                      <Input
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      Catégorie
                      <Input
                        value={editCategory}
                        onChange={(event) => setEditCategory(event.target.value)}
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      URL image avant
                      <Input
                        value={editBeforeMediaUrl}
                        onChange={(event) =>
                          setEditBeforeMediaUrl(event.target.value)
                        }
                        required
                      />
                    </label>
                    <label className="grid gap-2 text-sm font-semibold">
                      URL image après
                      <Input
                        value={editAfterMediaUrl}
                        onChange={(event) => setEditAfterMediaUrl(event.target.value)}
                        required
                      />
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2">
                      <Button
                        type="submit"
                        variant="nvd"
                        size="sm"
                        disabled={updatingId === item.id}
                      >
                        {updatingId === item.id ? (
                          <Loader2 className="animate-spin" />
                        ) : (
                          <Save />
                        )}
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEditingPortfolioItem}
                      >
                        <X />
                        Annuler
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UploadPanel({
  label,
  value,
  accept,
  isUploading,
  onFile
}: {
  label: string;
  value: string;
  accept: string;
  isUploading: boolean;
  onFile: (file: File) => void;
}) {
  return (
    <label className="grid gap-2 text-sm font-semibold">
      {label}
      <span className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cyan-200 bg-cyan-50/40 px-4 py-5 text-center transition hover:border-nvd-blue-primary">
        {isUploading ? (
          <Loader2 className="mb-2 h-6 w-6 animate-spin text-nvd-blue-primary" />
        ) : (
          <UploadCloud className="mb-2 h-6 w-6 text-nvd-blue-primary" />
        )}
        <span className="text-xs text-muted-foreground">
          {value ? "Média chargé" : "Uploader une image"}
        </span>
        {value && <CheckCircle2 className="mt-2 h-5 w-5 text-nvd-eco-green" />}
        <input
          className="sr-only"
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
          }}
        />
      </span>
    </label>
  );
}

function MediaThumb({ item }: { item: PortfolioItem }) {
  if (item.media_type === "video") {
    return (
      <div className="grid aspect-video place-items-center rounded-md bg-slate-900 text-white">
        <Video className="h-5 w-5" />
      </div>
    );
  }

  return (
    <Image
      className="aspect-video rounded-md object-cover"
      src={item.after_media_url}
      alt={item.title}
      width={160}
      height={90}
      sizes="96px"
      unoptimized
    />
  );
}

async function uploadMedia(file: File, folder: UploadFolder) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await fetch("/api/admin/upload/presigned", {
    method: "POST",
    body: formData
  });
  const payload = (await response.json().catch(() => null)) as UploadResponse | null;

  if (!response.ok) {
    throw new Error(
      payload?.error ?? `Upload refusé par le serveur (${response.status}).`
    );
  }

  if (!payload?.publicUrl) {
    throw new Error("Upload terminé sans URL publique.");
  }

  return payload.publicUrl;
}

function getUploadErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Upload média impossible pour le moment.";
}
