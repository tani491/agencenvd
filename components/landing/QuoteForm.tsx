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
  User
} from "lucide-react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  QUOTE_SERVICE_OPTIONS,
  type QuoteServiceValue,
  type QuoteSubmissionPayload,
  getQuoteServiceLabel,
  quoteSubmissionSchema
} from "@/lib/validations/quote";

export function QuoteForm({ whatsappNumber }: { whatsappNumber: string }) {
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
      preferredDate: ""
    }
  });

  const selectedServices = watch("services") ?? [];

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

  async function onSubmit(values: QuoteSubmissionPayload) {
    setFeedback(null);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(values)
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
        window.open(
          buildWhatsappSummaryUrl(values, whatsappNumber),
          "_blank",
          "noopener,noreferrer"
        );
      }

      reset({
        fullName: "",
        phone: "",
        location: "",
        services: [],
        preferredDate: ""
      });
    } catch (error) {
      console.error("Quote submission failed", error);
      setFeedback({
        type: "error",
        message: "La demande n'a pas pu être envoyée. Réessayez dans un instant."
      });
    }
  }

  return (
    <form className="grid gap-5" noValidate onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Nom complet
          <span className="relative block w-full">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-10" placeholder="Votre nom" {...register("fullName")} />
          </span>
          {errors.fullName && (
            <span className="text-xs text-destructive">{errors.fullName.message}</span>
          )}
        </label>

        <label className="grid gap-2 text-sm font-semibold">
          Téléphone Sénégal
          <span className="relative block w-full">
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
        <span className="relative block w-full">
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

      <label className="grid min-w-0 gap-2 text-sm font-semibold">
        Date souhaitée
        <span className="relative block w-full min-w-0">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="w-full min-w-0 pl-10"
            type="date"
            min={new Date().toISOString().slice(0, 10)}
            {...register("preferredDate")}
          />
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

      <Button type="submit" variant="nvd" size="lg" disabled={isSubmitting}>
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

function buildWhatsappSummaryUrl(
  values: QuoteSubmissionPayload,
  whatsappNumber: string
) {
  const serviceLabels = values.services.map(getQuoteServiceLabel).join(", ");
  const whatsappBaseUrl = `https://wa.me/${toWhatsappDigits(whatsappNumber)}`;
  const message = [
    "Bonjour NVD, je souhaite un devis.",
    `Nom: ${values.fullName}`,
    `Téléphone: ${values.phone}`,
    `Adresse / zone à Dakar: ${values.location}`,
    `Services: ${serviceLabels}`,
    values.preferredDate ? `Date souhaitée: ${values.preferredDate}` : ""
  ]
    .filter(Boolean)
    .join("\n");

  return `${whatsappBaseUrl}?text=${encodeURIComponent(message)}`;
}

function toWhatsappDigits(number: string) {
  const digits = number.replace(/\D/g, "");

  if (digits.startsWith("00221")) {
    return digits.slice(2);
  }

  if (digits.startsWith("221")) {
    return digits;
  }

  return `221${digits}`;
}
