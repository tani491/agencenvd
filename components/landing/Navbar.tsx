import Link from "next/link";
import Image from "next/image";
import { Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/landing/MobileNav";
import { NAV_LINKS } from "@/lib/nvd";
import {
  buildTelHref,
  buildWhatsappHref,
  getPublicSiteConfig
} from "@/lib/site-config";

function NvdLogo({ logoUrl }: { logoUrl: string }) {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="NVD Accueil">
      <span className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-lg bg-white shadow-nvd-soft ring-1 ring-slate-200">
        <Image
          src={logoUrl}
          alt="Logo NVD"
          fill
          sizes="44px"
          className="object-contain p-1.5"
          priority
          unoptimized
        />
      </span>
      <span className="hidden leading-tight sm:block">
        <span className="block text-sm font-black uppercase tracking-normal text-nvd-blue-dark">
          NVD
        </span>
        <span className="block text-xs font-medium text-muted-foreground">
          Nettoyage vapeur & désinfection
        </span>
      </span>
    </Link>
  );
}

export async function Navbar() {
  const config = await getPublicSiteConfig();
  const whatsappHref = buildWhatsappHref(
    config.whatsapp_number,
    "Bonjour NVD, je souhaite un devis"
  );

  return (
    <header className="sticky top-0 z-50 border-b border-white/70 bg-white/95 shadow-sm backdrop-blur-xl">
      <div className="section-shell flex h-20 items-center justify-between gap-4">
        <NvdLogo logoUrl={config.logo_url} />

        <nav className="hidden items-center gap-6 text-sm font-semibold text-nvd-blue-dark lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors hover:text-nvd-blue-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <MobileNav links={NAV_LINKS} />

        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild variant="outline" size="sm">
            <a href={buildTelHref(config.phone_primary)}>
              <Phone />
              Appeler
            </a>
          </Button>
          <Button asChild variant="whatsapp" size="sm">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
            >
              <Send />
              WhatsApp
            </a>
          </Button>
        </div>
      </div>
    </header>
  );
}
