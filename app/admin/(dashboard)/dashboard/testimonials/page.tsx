import { TestimonialsManager } from "@/components/admin/TestimonialsManager";
import { getAdminTestimonials } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export default async function AdminTestimonialsPage() {
  const testimonials = await getAdminTestimonials();

  return (
    <div className="grid gap-6">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.14em] text-nvd-blue-primary">
          CMS témoignages
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-nvd-blue-dark">
          Témoignages clients
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Ajoutez, modifiez ou supprimez les avis affichés sur la vitrine
          publique NVD.
        </p>
      </header>

      <TestimonialsManager initialItems={testimonials} />
    </div>
  );
}
