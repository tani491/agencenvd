import Image from "next/image";
import { ArrowRight, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NVD_CONTACT } from "@/lib/nvd";

const trustBadges = [
  "🌿 100% Écologique",
  "⚡ Intervention 24h",
  "✨ Satisfaction Garantie"
] as const;

export function Hero() {
  return (
    <section
      id="accueil"
      className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden"
    >
      <Image
        src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1800&q=85"
        alt="Technicien professionnel préparant un nettoyage vapeur"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-nvd-blue-dark/95 via-nvd-blue-dark/78 to-nvd-blue-primary/34" />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="section-shell relative z-10 flex min-h-[calc(100svh-5rem)] items-center py-16">
        <div className="max-w-3xl text-white">
          <Badge className="mb-6 border-white/20 bg-white/12 text-white backdrop-blur">
            Nettoyage vapeur professionnel au Sénégal
          </Badge>
          <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-normal sm:text-5xl lg:text-6xl">
            Le spécialiste du nettoyage à vapeur & désinfection écologique au
            Sénégal.
          </h1>
          <p className="mt-6 max-w-2xl text-lg font-medium leading-8 text-white/88 sm:text-xl">
            Fauteuils, matelas, tapis, véhicules. Élimination des bactéries et
            taches à 99.9%.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {trustBadges.map((badge) => (
              <span
                key={badge}
                className="rounded-lg border border-white/20 bg-white/12 px-3 py-2 text-sm font-semibold text-white backdrop-blur"
              >
                {badge}
              </span>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="nvd" size="lg">
              <a href="#devis">
                Demander un Devis Gratuit
                <ArrowRight />
              </a>
            </Button>
            <Button
              asChild
              variant="whatsapp"
              size="lg"
              className="bg-white text-nvd-blue-dark hover:bg-cyan-50"
            >
              <a
                href={NVD_CONTACT.whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                Contact WhatsApp Direct
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
