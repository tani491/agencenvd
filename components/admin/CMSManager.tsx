"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle2, ImagePlus, Loader2, Save, UploadCloud, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { PortfolioItem, SiteConfig } from "@/lib/admin/data";

type CloudinarySignature = {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
};

export function CMSManager({
  initialItems,
  initialConfig
}: {
  initialItems: PortfolioItem[];
  initialConfig: SiteConfig;
}) {
  const [items, setItems] = useState(initialItems);
  const [config, setConfig] = useState(initialConfig);
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Fauteuils");
  const [beforeMediaUrl, setBeforeMediaUrl] = useState("");
  const [afterMediaUrl, setAfterMediaUrl] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [uploadingTarget, setUploadingTarget] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function handleMediaUpload(file: File, target: "before" | "after" | "logo") {
    setUploadingTarget(target);
    setFeedback("");

    try {
      const secureUrl = await uploadToCloudinary(
        file,
        target === "logo" ? "nvd/branding" : "nvd/portfolio"
      );

      if (target === "before") setBeforeMediaUrl(secureUrl);
      if (target === "after") setAfterMediaUrl(secureUrl);
      if (target === "logo") setConfig((current) => ({ ...current, logo_url: secureUrl }));
    } catch (error) {
      console.error(error);
      setFeedback("Upload Cloudinary impossible pour le moment.");
    } finally {
      setUploadingTarget("");
    }
  }

  async function createPortfolioItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setFeedback("");

    const response = await fetch("/api/admin/portfolio", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        category,
        beforeMediaUrl,
        afterMediaUrl,
        mediaType,
        isPublished
      })
    });

    const payload = await response.json();

    if (!response.ok) {
      setFeedback(payload.error ?? "Impossible d'ajouter le média.");
      setIsCreating(false);
      return;
    }

    setItems((current) => [payload.item as PortfolioItem, ...current]);
    setTitle("");
    setBeforeMediaUrl("");
    setAfterMediaUrl("");
    setIsPublished(true);
    setFeedback("Média ajouté au CMS.");
    setIsCreating(false);
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
      setFeedback("Impossible de modifier la publication.");
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

  async function saveSiteConfig(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingConfig(true);
    setFeedback("");

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
        heroTitle: config.hero_title ?? ""
      })
    });

    if (!response.ok) {
      setFeedback("Impossible d'enregistrer la configuration.");
      setIsSavingConfig(false);
      return;
    }

    setFeedback("Configuration système enregistrée.");
    setIsSavingConfig(false);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <Card>
        <CardHeader>
          <CardTitle>Gestion du slider public</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={createPortfolioItem}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-semibold">
                Titre
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Canapé ravivé à Dakar"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-semibold">
                Catégorie
                <Input
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  placeholder="Fauteuils, Matelas, Auto..."
                  required
                />
              </label>
            </div>

            <label className="grid gap-2 text-sm font-semibold">
              Type média
              <Select value={mediaType} onValueChange={(value) => setMediaType(value as "image" | "video")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Images avant / après</SelectItem>
                  <SelectItem value="video">Vidéos démonstration</SelectItem>
                </SelectContent>
              </Select>
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <UploadPanel
                label={mediaType === "image" ? "Image avant" : "Vidéo avant"}
                value={beforeMediaUrl}
                accept={mediaType === "image" ? "image/*" : "video/*"}
                isUploading={uploadingTarget === "before"}
                onFile={(file) => handleMediaUpload(file, "before")}
              />
              <UploadPanel
                label={mediaType === "image" ? "Image après" : "Vidéo après"}
                value={afterMediaUrl}
                accept={mediaType === "image" ? "image/*" : "video/*"}
                isUploading={uploadingTarget === "after"}
                onFile={(file) => handleMediaUpload(file, "after")}
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
              Ajouter au portfolio
            </Button>
          </form>

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
                  <div className="mt-1 text-sm text-muted-foreground">{item.category}</div>
                </div>
                <Button variant="outline" size="sm" onClick={() => togglePublish(item)}>
                  {item.is_published ? "Dépublier" : "Publier"}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration système</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={saveSiteConfig}>
            <UploadPanel
              label="Logo NVD"
              value={config.logo_url}
              accept="image/*"
              isUploading={uploadingTarget === "logo"}
              onFile={(file) => handleMediaUpload(file, "logo")}
            />
            <label className="grid gap-2 text-sm font-semibold">
              URL logo
              <Input
                value={config.logo_url}
                onChange={(event) =>
                  setConfig((current) => ({ ...current, logo_url: event.target.value }))
                }
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
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
                />
              </label>
            </div>
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
              />
            </label>
            <label className="grid gap-2 text-sm font-semibold">
              Titre hero vitrine
              <Textarea
                value={config.hero_title ?? ""}
                onChange={(event) =>
                  setConfig((current) => ({ ...current, hero_title: event.target.value }))
                }
              />
            </label>
            <Button type="submit" variant="nvd" size="lg" disabled={isSavingConfig}>
              {isSavingConfig ? <Loader2 className="animate-spin" /> : <Save />}
              Enregistrer la configuration
            </Button>
          </form>

          {feedback && (
            <div className="mt-4 rounded-lg bg-cyan-50 px-4 py-3 text-sm font-semibold text-nvd-blue-dark">
              {feedback}
            </div>
          )}
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
          {value ? "Média chargé" : "Uploader sur Cloudinary"}
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

async function uploadToCloudinary(file: File, folder: string) {
  const signatureResponse = await fetch("/api/admin/upload/cloudinary-signature", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ folder })
  });

  if (!signatureResponse.ok) {
    throw new Error("Cloudinary signature failed");
  }

  const signature = (await signatureResponse.json()) as CloudinarySignature;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/auto/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  if (!uploadResponse.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const uploaded = (await uploadResponse.json()) as { secure_url: string };
  return uploaded.secure_url;
}
