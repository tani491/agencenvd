import { MessageCircle, Phone } from "lucide-react";
import {
  buildTelHref,
  buildWhatsappHref,
  getPublicSiteConfig
} from "@/lib/site-config";

export async function FloatingActionBar() {
  const config = await getPublicSiteConfig();
  const whatsappHref = buildWhatsappHref(
    config.whatsapp_number,
    "Bonjour NVD, je souhaite un devis"
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/30 bg-white/94 p-3 shadow-[0_-12px_32px_rgba(15,44,89,0.14)] backdrop-blur md:hidden">
      <div className="grid grid-cols-2 gap-3">
        <a
          href={whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-nvd-eco-green px-3 text-sm font-black text-white"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
        <a
          href={buildTelHref(config.phone_secondary)}
          className="flex h-12 items-center justify-center gap-2 rounded-lg bg-nvd-blue-primary px-3 text-sm font-black text-white"
        >
          <Phone className="h-4 w-4" />
          Appeler
        </a>
      </div>
    </div>
  );
}
