"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const services = [
  {
    title: "Nettoyage & Désinfection Fauteuils & Canapés",
    description: "Tissu, cuir, velours."
  },
  {
    title: "Traitement Anti-acariens & Nettoyage Matelas",
    description: "Vapeur haute température, odeurs et allergènes ciblés."
  },
  {
    title: "Lavage & Ravivement Tapis & Moquettes",
    description: "Fibres ravivées, taches traitées, séchage maîtrisé."
  },
  {
    title: "Detailing & Nettoyage Vapeur Intérieur Auto",
    description: "Sièges, plafonnier, tapis, coffre et plastiques intérieurs."
  },
  {
    title: "Désinfection & Nettoyage de Locaux / Bureaux",
    description: "Espaces professionnels, surfaces de contact et sanitaires."
  }
] as const;

export function ServicesGrid() {
  return (
    <section id="services" className="py-20 sm:py-24">
      <div className="section-shell">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-nvd-blue-primary">
            Services NVD
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-normal text-nvd-blue-dark sm:text-4xl">
            Une méthode vapeur adaptée aux surfaces du quotidien.
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Chaque intervention combine aspiration, injection vapeur,
            extraction et désinfection selon le support traité.
          </p>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -6 }}
            >
              <Card className="h-full overflow-hidden border-cyan-100 bg-white transition-shadow hover:shadow-nvd-soft">
                <CardHeader>
                  <CardTitle className="text-xl leading-7 text-nvd-blue-dark">
                    {service.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {service.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
