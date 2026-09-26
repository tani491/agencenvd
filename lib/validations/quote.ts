import { z } from "zod";

export const quoteServiceValues = [
  "canapes",
  "matelas",
  "tapis",
  "auto",
  "locaux"
] as const;

export type QuoteServiceValue = (typeof quoteServiceValues)[number];

export const QUOTE_SERVICE_OPTIONS: Array<{
  value: QuoteServiceValue;
  label: string;
  description: string;
}> = [
  {
    value: "canapes",
    label: "Fauteuils & Canapés",
    description: "Tissu, cuir, velours"
  },
  {
    value: "matelas",
    label: "Matelas anti-acariens",
    description: "Traitement vapeur haute température"
  },
  {
    value: "tapis",
    label: "Tapis & Moquettes",
    description: "Lavage, ravivement et extraction"
  },
  {
    value: "auto",
    label: "Intérieur auto",
    description: "Detailing vapeur habitacle"
  },
  {
    value: "locaux",
    label: "Locaux / Bureaux",
    description: "Désinfection des espaces professionnels"
  }
];

export const quoteServiceSchema = z.enum(quoteServiceValues);

export const quoteSubmissionSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom complet.")
    .max(120, "Le nom est trop long."),
  phone: z
    .string()
    .trim()
    .min(8, "Indiquez un numéro de téléphone.")
    .refine(isValidSenegalPhone, "Utilisez un numéro mobile Sénégal valide."),
  location: z
    .string()
    .trim()
    .min(2, "Indiquez votre quartier ou région.")
    .max(160, "La localisation est trop longue."),
  services: z
    .array(quoteServiceSchema)
    .min(1, "Sélectionnez au moins un service.")
    .max(5, "Trop de services sélectionnés."),
  preferredDate: z
    .union([
      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide."),
      z.literal("")
    ])
    .optional()
    .refine((value: string | undefined) => !value || value >= todayIsoDate(), {
      message: "Choisissez une date à venir."
    })
});

export type QuoteSubmissionPayload = z.infer<typeof quoteSubmissionSchema>;

export function normalizeSenegalPhone(phone: string) {
  const compact = phone.replace(/[\s().-]/g, "");

  if (compact.startsWith("+221")) {
    return compact;
  }

  if (compact.startsWith("00221")) {
    return `+221${compact.slice(5)}`;
  }

  if (compact.startsWith("221")) {
    return `+${compact}`;
  }

  if (compact.startsWith("7")) {
    return `+221${compact}`;
  }

  return compact;
}

export function isValidSenegalPhone(phone: string) {
  return /^\+2217[05678][0-9]{7}$/.test(normalizeSenegalPhone(phone));
}

export function emptyToNull(value?: string | null) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function getQuoteServiceLabel(value: QuoteServiceValue) {
  return QUOTE_SERVICE_OPTIONS.find((service) => service.value === value)?.label ?? value;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}
