import type { PublicSiteConfig } from "@/lib/site-config";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://nvdnettoyage.online";

const offerServices = [
  "Nettoyage de canapés",
  "Nettoyage de matelas",
  "Nettoyage de tapis",
  "Nettoyage intérieur de véhicules",
  "Nettoyage de bureaux et locaux"
] as const;

const servedAreas = [
  "Dakar",
  "Almadies",
  "Plateau",
  "Mermoz",
  "Sacré-Cœur",
  "Ngor",
  "Sénégal"
] as const;

export function JsonLd({ config }: { config: PublicSiteConfig }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "CleaningService"],
    "@id": `${siteUrl}/#nvd-cleaning-service`,
    name: "NVD - Nettoyage Vapeur & Désinfection",
    url: siteUrl,
    logo: toAbsoluteUrl(config.logo_url),
    image: toAbsoluteUrl(config.hero_background_url || config.logo_url),
    telephone: toInternationalPhone(config.whatsapp_number || config.phone_primary),
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Dakar",
      addressCountry: "SN"
    },
    areaServed: servedAreas.map((area) => ({
      "@type": "Place",
      name: area
    })),
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Prestations de nettoyage vapeur NVD",
      itemListElement: offerServices.map((service, index) => ({
        "@type": "Offer",
        position: index + 1,
        itemOffered: {
          "@type": "Service",
          name: service,
          serviceType: service
        }
      }))
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c")
      }}
    />
  );
}

function toAbsoluteUrl(value: string) {
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return siteUrl;
  }
}

function toInternationalPhone(number: string) {
  const digits = number.replace(/\D/g, "");

  if (digits.startsWith("00221")) {
    return `+${digits.slice(2)}`;
  }

  if (digits.startsWith("221")) {
    return `+${digits}`;
  }

  return `+221${digits}`;
}
