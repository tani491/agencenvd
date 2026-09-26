import { QUOTE_SERVICE_OPTIONS } from "@/lib/validations/quote";

export const quoteStatusOptions = [
  { value: "pending", label: "Nouveau" },
  { value: "contacted", label: "Contacté" },
  { value: "quoted", label: "Devis envoyé" },
  { value: "scheduled", label: "Planifié" },
  { value: "completed", label: "Terminé" },
  { value: "cancelled", label: "Annulé" }
] as const;

export type QuoteStatusValue = (typeof quoteStatusOptions)[number]["value"];

export function getStatusLabel(status: string) {
  return quoteStatusOptions.find((option) => option.value === status)?.label ?? status;
}

export function getServiceLabel(service: string) {
  return QUOTE_SERVICE_OPTIONS.find((option) => option.value === service)?.label ?? service;
}
