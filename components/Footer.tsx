import Link from "next/link";
import {
  ArrowUpRight,
  Instagram,
  MapPin,
  MessageCircle,
  Music2,
  Phone
} from "lucide-react";
import { NVD_CONTACT } from "@/lib/nvd";

const footerLinks = [
  { label: "Accueil", href: "/", external: false },
  { label: "Nos Réalisations", href: "/avant-apres", external: false },
  { label: "Devis WhatsApp", href: NVD_CONTACT.whatsappHref, external: true },
  { label: "Mentions Légales", href: "/mentions-legales", external: false }
] as const;

const socialLinks = [
  {
    label: "TikTok",
    href: NVD_CONTACT.tiktokHref,
    icon: Music2
  },
  {
    label: "Instagram",
    href: NVD_CONTACT.instagramHref,
    icon: Instagram
  },
  {
    label: "WhatsApp",
    href: NVD_CONTACT.whatsappHref,
    icon: MessageCircle
  }
] as const;

function FooterLogo() {
  return (
    <Link href="/" className="inline-flex items-center gap-3" aria-label="NVD Accueil">
      <span className="relative grid h-12 w-12 place-items-center overflow-hidden rounded-lg bg-white text-nvd-blue-dark">
        <span className="absolute bottom-0 h-5 w-full bg-nvd-blue-primary" />
        <span className="absolute bottom-3 h-4 w-14 rounded-[50%] bg-nvd-cyan/80" />
        <span className="relative text-sm font-black tracking-normal">NVD</span>
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-black uppercase tracking-normal text-white">
          NVD
        </span>
        <span className="block text-xs font-medium text-cyan-100">
          Nettoyage vapeur & désinfection
        </span>
      </span>
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="bg-nvd-blue-dark pb-24 text-white md:pb-0">
      <div className="section-shell grid gap-10 py-12 sm:py-14 lg:grid-cols-[1.15fr_0.75fr_1fr]">
        <div>
          <FooterLogo />
          <p className="mt-5 max-w-md text-sm leading-6 text-cyan-50/82">
            Spécialiste du nettoyage à vapeur & désinfection écologique de
            meubles, matelas et véhicules au Sénégal.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {socialLinks.map((social) => {
              const Icon = social.icon;

              return (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/14 bg-white/8 text-white transition hover:border-nvd-cyan hover:bg-nvd-cyan hover:text-nvd-blue-dark"
                  aria-label={social.label}
                  title={social.label}
                >
                  <Icon className="h-5 w-5" />
                </a>
              );
            })}
          </div>
        </div>

        <nav aria-label="Navigation rapide">
          <h2 className="text-sm font-black uppercase tracking-normal text-cyan-100">
            Navigation
          </h2>
          <div className="mt-5 grid gap-3 text-sm font-semibold text-white/84">
            {footerLinks.map((link) =>
              link.external ? (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition hover:text-nvd-cyan"
                >
                  {link.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-2 transition hover:text-nvd-cyan"
                >
                  {link.label}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              )
            )}
          </div>
        </nav>

        <div>
          <h2 className="text-sm font-black uppercase tracking-normal text-cyan-100">
            Coordonnées
          </h2>
          <div className="mt-5 grid gap-4 text-sm leading-6 text-white/84">
            <a
              href={NVD_CONTACT.phonePrimaryHref}
              className="flex items-start gap-3 transition hover:text-nvd-cyan"
            >
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-nvd-cyan" />
              <span>
                {NVD_CONTACT.phonePrimaryInternationalDisplay} /{" "}
                {NVD_CONTACT.phoneMobileInternationalDisplay}
              </span>
            </a>
            <p className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-nvd-cyan" />
              <span>Dakar, Sénégal</span>
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="section-shell py-5 text-xs font-semibold text-cyan-50/70">
          © 2026 NVD Nettoyage Vapeur & Désinfection. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
