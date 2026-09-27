import type { Metadata, Viewport } from "next";
import { JsonLd } from "@/components/JsonLd";
import { getPublicSiteConfig } from "@/lib/site-config";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://nvdnettoyage.online";
const siteName = "NVD - Nettoyage Vapeur & Désinfection";
const siteDescription =
  "NVD nettoie et désinfecte canapés, matelas, tapis, véhicules et locaux à Dakar avec une méthode vapeur écologique.";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getPublicSiteConfig();
  const imageUrl = toAbsoluteUrl(config.hero_background_url || config.logo_url);

  return {
    metadataBase: new URL(siteUrl),
    applicationName: siteName,
    title: {
      default: `${siteName} au Sénégal`,
      template: `%s | ${siteName}`
    },
    description: siteDescription,
    keywords: [
      "nettoyage vapeur Dakar",
      "désinfection Sénégal",
      "nettoyage canapé Dakar",
      "nettoyage matelas Dakar",
      "nettoyage tapis Dakar",
      "nettoyage voiture Dakar",
      "NVD nettoyage"
    ],
    alternates: {
      canonical: "/"
    },
    openGraph: {
      title: `${siteName} au Sénégal`,
      description: siteDescription,
      url: siteUrl,
      siteName,
      locale: "fr_SN",
      type: "website",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: "Nettoyage vapeur professionnel NVD à Dakar"
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: `${siteName} au Sénégal`,
      description: siteDescription,
      images: [imageUrl]
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1
      }
    }
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover"
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const config = await getPublicSiteConfig();

  return (
    <html lang="fr">
      <body>
        <JsonLd config={config} />
        {children}
      </body>
    </html>
  );
}

function toAbsoluteUrl(value: string) {
  try {
    return new URL(value, siteUrl).toString();
  } catch {
    return siteUrl;
  }
}
