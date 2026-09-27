import Image from "next/image";
import { Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getPublishedTestimonials } from "@/lib/testimonials";

export async function Testimonials() {
  const testimonials = await getPublishedTestimonials(6);

  if (!testimonials.length) {
    return null;
  }

  return (
    <section id="temoignages" className="bg-secondary/45 py-20 sm:py-24">
      <div className="section-shell">
        <div className="max-w-2xl">
          <Badge variant="eco">Témoignages clients</Badge>
          <h2 className="mt-4 text-3xl font-black tracking-normal text-nvd-blue-dark sm:text-4xl">
            Des clients dakarois qui retrouvent des espaces propres, sains et
            prêts à vivre.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article
              key={testimonial.id}
              className="grid gap-5 rounded-lg border bg-white p-5 shadow-sm"
            >
              <div className="flex items-center gap-3">
                {testimonial.avatar_url ? (
                  <Image
                    src={testimonial.avatar_url}
                    alt={testimonial.client_name}
                    width={48}
                    height={48}
                    sizes="48px"
                    className="h-12 w-12 rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="grid h-12 w-12 place-items-center rounded-lg bg-nvd-blue-primary text-sm font-black uppercase text-white">
                    {getInitials(testimonial.client_name)}
                  </div>
                )}
                <div>
                  <h3 className="font-black text-nvd-blue-dark">
                    {testimonial.client_name}
                  </h3>
                  <p className="text-sm font-semibold text-muted-foreground">
                    {testimonial.service_used}
                  </p>
                </div>
              </div>

              <div
                className="flex text-amber-400"
                aria-label={`Note ${testimonial.rating} sur 5`}
              >
                {Array.from({ length: 5 }, (_, index) => (
                  <Star
                    key={index}
                    className="h-4 w-4"
                    fill={index < Math.round(testimonial.rating) ? "currentColor" : "none"}
                  />
                ))}
              </div>

              <p className="text-sm leading-6 text-slate-700">
                &quot;{testimonial.comment}&quot;
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}
