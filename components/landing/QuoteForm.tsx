"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  CheckCircle2,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  UploadCloud,
  User
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { NVD_CONTACT } from "@/lib/nvd";
import {
  QUOTE_SERVICE_OPTIONS,
  type QuoteServiceValue,
  type QuoteSubmissionPayload,
  getQuoteServiceLabel,
  quoteSubmissionSchema
} from "@/lib/validations/quote";

const maxUploadBytes = 80 * 1024 * 1024;
const acceptedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime"
] as const;
const acceptedFileTypes = acceptedMimeTypes.join(",");

type PresignedUploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  requiredHeaders: Record<string, string>;
};

type ApiErrorResponse = {
  error?: string;
};

export function QuoteForm() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [redirectToWhatsapp, setRedirectToWhatsapp] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<QuoteSubmissionPayload>({
    resolver: zodResolver(quoteSubmissionSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      location: "",
      services: [],
      furniturePhotoUrl: "",
      preferredDate: "",
      utmSource: "direct",
      utmMedium: "",
      utmCampaign: "",
      referrerUrl: ""
    }
  });

  const selectedServices = watch("services");
  const mediaUrl = watch("furniturePhotoUrl");

  function toggleService(service: QuoteServiceValue) {
    const nextServices = selectedServices.includes(service)
      ? selectedServices.filter((value: QuoteServiceValue) => value !== service)
      : [...selectedServices, service];

    setValue("services", nextServices, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    setUploadError("");
    setUploadProgress(0);

    if (!file) {
      return;
    }

    if (!acceptedMimeTypes.includes(file.type as (typeof acceptedMimeTypes)[number])) {
      setUploadError("Format accepté: JPG, PNG, WebP, MP4 ou MOV.");
      return;
    }

    if (file.size > maxUploadBytes) {
      setUploadError("Le fichier doit faire moins de 80 Mo.");
      return;
    }

    try {
      setIsUploading(true);
      setUploadName(file.name);

      const presignedResponse = await fetch("/api/upload/presigned", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      });

      if (!presignedResponse.ok) {
        const apiError = await readApiError(presignedResponse);
        setUploadError(apiError ?? "Impossible de générer l'URL d'upload.");
        return;
      }

      const presignedUpload =
        (await presignedResponse.json()) as PresignedUploadResponse;

      await uploadFileWithProgress({
        file,
        url: presignedUpload.uploadUrl,
        headers: presignedUpload.requiredHeaders,
        onProgress: setUploadProgress
      });

      setValue("furniturePhotoUrl", presignedUpload.publicUrl, {
        shouldDirty: true,
        shouldValidate: true
      });
      setUploadProgress(100);
    } catch (error) {
      console.error(error);
      setUploadError("L'upload a échoué. Réessayez ou envoyez la photo via WhatsApp.");
    } finally {
      setIsUploading(false);
    }
  }

  async function onSubmit(values: QuoteSubmissionPayload) {
    setFeedback(null);

    const tracking = getTrackingValues();
    const payload: QuoteSubmissionPayload = {
      ...values,
      ...tracking
    };

    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setFeedback({
        type: "error",
        message: "Impossible d'enregistrer la demande pour le moment."
      });
      return;
    }

    setFeedback({
      type: "success",
      message: "Votre demande est enregistrée. NVD vous recontacte rapidement."
    });

    if (redirectToWhatsapp) {
      window.open(buildWhatsappSummaryUrl(payload), "_blank", "noopener,noreferrer");
    }

    reset({
      fullName: "",
      phone: "",
      location: "",
      services: [],
      furniturePhotoUrl: "",
      preferredDate: "",
      utmSource: "direct",
      utmMedium: "",
      utmCampaign: "",
      referrerUrl: ""
    });
    setUploadName("");
    setUploadProgress(0);
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nom complet
          <span className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Votre nom" {...register("fullName")} />
          </span>
          {errors.fullName && (
            <span className="text-xs text-destructive">{errors.fullName.message}</span>
          )}
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Téléphone Sénégal
          <span className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-10"
              inputMode="tel"
              placeholder="+221 77 000 00 00"
              {...register("phone")}
            />
          </span>
          {errors.phone && (
            <span className="text-xs text-destructive">{errors.phone.message}</span>
          )}
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Zone / quartier
        <span className="relative">
          <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Ex: Dakar Plateau, Almadies, Parcelles"
            {...register("location")}
          />
        </span>
        {errors.location && (
          <span className="text-xs text-destructive">{errors.location.message}</span>
        )}
      </label>

      <div className="grid gap-3">
        <div className="text-sm font-semibold">Services demandés</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {QUOTE_SERVICE_OPTIONS.map((service) => {
            const selected = selectedServices.includes(service.value);

            return (
              <button
                key={service.value}
                type="button"
                aria-pressed={selected}
                onClick={() => toggleService(service.value)}
                className={cn(
                  "min-h-24 rounded-lg border p-4 text-left transition",
                  selected
                    ? "border-nvd-blue-primary bg-cyan-50 shadow-sm"
                    : "border-input bg-white hover:border-nvd-cyan hover:bg-cyan-50/40"
                )}
              >
                <span className="flex items-start justify-between gap-3">
                  <span>
                    <span className="block text-sm font-black text-nvd-blue-dark">
                      {service.label}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {service.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "grid h-6 w-6 shrink-0 place-items-center rounded-md border",
                      selected
                        ? "border-nvd-blue-primary bg-nvd-blue-primary text-white"
                        : "border-input bg-white text-transparent"
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        {errors.services && (
          <span className="text-xs text-destructive">{errors.services.message}</span>
        )}
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2 text-sm font-semibold">
          Photo ou vidéo du meuble
          <span className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-cyan-200 bg-cyan-50/40 px-4 py-6 text-center transition hover:border-nvd-blue-primary hover:bg-cyan-50">
            <UploadCloud className="mb-2 h-7 w-7 text-nvd-blue-primary" />
            <span className="text-sm font-bold text-nvd-blue-dark">
              Ajouter une image ou une vidéo
            </span>
            <span className="mt-1 text-xs text-muted-foreground">
              JPG, PNG, WebP, MP4 ou MOV jusqu'à 80 Mo
            </span>
            <input
              className="sr-only"
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileChange}
            />
          </span>
        </label>

        {(isUploading || uploadProgress > 0) && (
          <div className="grid gap-2">
            <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
              <span className="truncate">{uploadName}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-nvd-blue-primary transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {mediaUrl && !isUploading && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
            Média reçu et prêt à joindre à la demande.
          </div>
        )}

        {uploadError && <span className="text-xs text-destructive">{uploadError}</span>}
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        Date souhaitée
        <span className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-10" type="date" {...register("preferredDate")} />
        </span>
        {errors.preferredDate && (
          <span className="text-xs text-destructive">{errors.preferredDate.message}</span>
        )}
      </label>

      <label className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-3 text-sm font-semibold text-nvd-blue-dark">
        <input
          type="checkbox"
          checked={redirectToWhatsapp}
          onChange={(event) => setRedirectToWhatsapp(event.target.checked)}
          className="h-4 w-4 accent-nvd-blue-primary"
        />
        Ouvrir WhatsApp avec le récapitulatif après envoi
      </label>

      <Button
        type="submit"
        variant="nvd"
        size="lg"
        disabled={isSubmitting || isUploading}
      >
        {isSubmitting ? <Loader2 className="animate-spin" /> : <MessageCircle />}
        Envoyer ma demande
      </Button>

      {feedback && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-semibold",
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800"
              : "bg-red-50 text-red-700"
          )}
        >
          {feedback.message}
        </div>
      )}
    </form>
  );
}

function uploadFileWithProgress({
  file,
  url,
  headers,
  onProgress
}: {
  file: File;
  url: string;
  headers: Record<string, string>;
  onProgress: (progress: number) => void;
}) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", url);

    Object.entries(headers).forEach(([name, value]) => {
      xhr.setRequestHeader(name, value);
    });

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }

      reject(new Error(`Upload failed with status ${xhr.status}`));
    };

    xhr.onerror = () => reject(new Error("Upload network error"));
    xhr.send(file);
  });
}

async function readApiError(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorResponse;
    return data.error;
  } catch {
    return null;
  }
}

function getTrackingValues() {
  const searchParams = new URLSearchParams(window.location.search);

  return {
    utmSource: searchParams.get("utm_source") ?? "direct",
    utmMedium: searchParams.get("utm_medium") ?? "",
    utmCampaign: searchParams.get("utm_campaign") ?? "",
    referrerUrl: document.referrer
  };
}

function buildWhatsappSummaryUrl(values: QuoteSubmissionPayload) {
  const serviceLabels = values.services.map(getQuoteServiceLabel).join(", ");
  const whatsappBaseUrl = NVD_CONTACT.whatsappHref.split("?")[0];
  const message = [
    "Bonjour NVD, je souhaite un devis.",
    `Nom: ${values.fullName}`,
    `Téléphone: ${values.phone}`,
    `Zone: ${values.location}`,
    `Services: ${serviceLabels}`,
    values.preferredDate ? `Date souhaitée: ${values.preferredDate}` : "",
    values.furniturePhotoUrl ? `Média: ${values.furniturePhotoUrl}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return `${whatsappBaseUrl}?text=${encodeURIComponent(message)}`;
}
