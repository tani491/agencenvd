import { MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuoteForm } from "@/components/landing/QuoteForm";
import {
  buildTelHref,
  buildWhatsappHref,
  formatSenegalPhone,
  getPublicSiteConfig
} from "@/lib/site-config";

export async function QuoteSection() {
  const config = await getPublicSiteConfig();
  const whatsappHref = buildWhatsappHref(
    config.whatsapp_number,
    "Bonjour NVD, je souhaite un devis"
  );

  return (
    <section id="devis" className="bg-nvd-wave py-20 text-white sm:py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-100">
            Devis gratuit
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-normal sm:text-4xl">
            Décrivez la surface, NVD vous répond rapidement.
          </h2>
          <p className="mt-4 max-w-xl text-base leading-7 text-white/82">
            Une photo et quelques détails suffisent pour estimer le traitement
            vapeur le plus adapté.
          </p>

          <div id="contact" className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-white text-nvd-blue-dark hover:bg-cyan-50"
            >
              <a href={buildTelHref(config.phone_primary)}>
                <Phone />
                {formatSenegalPhone(config.phone_primary)}
              </a>
            </Button>
            <Button asChild variant="whatsapp" size="lg">
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle />
                WhatsApp {formatSenegalPhone(config.whatsapp_number)}
              </a>
            </Button>
          </div>
        </div>

        <Card className="border-white/20 bg-white text-nvd-blue-dark shadow-nvd-soft">
          <CardHeader>
            <CardTitle>Demande de devis intelligent</CardTitle>
          </CardHeader>
          <CardContent>
            <QuoteForm whatsappNumber={config.whatsapp_number} />
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
