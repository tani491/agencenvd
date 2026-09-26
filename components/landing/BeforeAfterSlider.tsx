import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BeforeAfterComparison } from "@/components/landing/BeforeAfterComparison";

export function BeforeAfterSlider() {
  return (
    <section id="avant-apres" className="bg-white py-20 sm:py-24">
      <div className="section-shell grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Badge variant="cyan">Avant / Après</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-nvd-blue-dark sm:text-4xl">
            Voyez la différence entre une surface tachée et une surface
            ravivée par la vapeur.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Déplacez la glissière pour comparer le résultat d'un traitement NVD
            sur textile d'ameublement.
          </p>
          <Button asChild variant="outline" className="mt-7">
            <Link href="/avant-apres">Voir toutes les réalisations</Link>
          </Button>
        </div>

        <BeforeAfterComparison
          title="Canapé textile ravivé"
          category="Démonstration vapeur"
          beforeMediaUrl="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1400&q=85"
          afterMediaUrl="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1400&q=85"
          priority
        />
      </div>
    </section>
  );
}
