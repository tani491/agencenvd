import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { FloatingActionBar } from "@/components/landing/FloatingActionBar";
import { Navbar } from "@/components/landing/Navbar";
import { BeforeAfterComparison } from "@/components/landing/BeforeAfterComparison";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPublishedPortfolioPage } from "@/lib/portfolio";
import { cn } from "@/lib/utils";

const pageSize = 5;

type AvantApresPageProps = {
  searchParams: Promise<{
    page?: string | string[];
  }>;
};

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Avant / Après - Réalisations NVD",
  description:
    "Découvrez les réalisations avant / après de NVD, spécialiste du nettoyage vapeur et de la désinfection écologique au Sénégal."
};

export default async function AvantApresPage({ searchParams }: AvantApresPageProps) {
  const params = await searchParams;
  const requestedPage = parsePageParam(params.page);
  const { items, total, error } = await getPublishedPortfolioPage(
    requestedPage,
    pageSize
  );
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (requestedPage > totalPages && total > 0) {
    redirect(getPageHref(totalPages));
  }

  return (
    <main className="min-h-screen bg-background">
      <PageViewTracker />
      <Navbar />

      <section className="bg-white py-16 sm:py-20">
        <div className="section-shell">
          <div className="max-w-3xl">
            <Badge variant="cyan">Avant / Après</Badge>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-normal text-nvd-blue-dark sm:text-5xl">
              Nos Réalisations Avant / Après en Image
            </h1>
            <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
              Découvrez la qualité du nettoyage à vapeur NVD sur canapés,
              matelas, tapis, véhicules et surfaces textiles. Chaque comparaison
              met en évidence le soin apporté aux fibres, aux taches et à la
              désinfection écologique.
            </p>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16">
        <div className="section-shell">
          {items.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-2">
              {items.map((item, index) => (
                <BeforeAfterComparison
                  key={item.id}
                  title={item.title}
                  category={item.category}
                  beforeMediaUrl={item.before_media_url}
                  afterMediaUrl={item.after_media_url}
                  mediaType={item.media_type}
                  priority={index === 0}
                />
              ))}
            </div>
          ) : (
            <EmptyPortfolioState error={error} />
          )}

          {totalPages > 1 && (
            <Pagination currentPage={requestedPage} totalPages={totalPages} />
          )}
        </div>
      </section>

      <Footer />
      <FloatingActionBar />
    </main>
  );
}

function EmptyPortfolioState({
  error
}: {
  error: "not_configured" | "query_failed" | null;
}) {
  const message =
    error === "not_configured"
      ? "La galerie sera disponible après configuration du portfolio Supabase."
      : error === "query_failed"
      ? "Impossible de charger les réalisations pour le moment."
      : "Aucune réalisation publiée pour le moment.";

  return (
    <div className="rounded-lg border border-cyan-100 bg-white px-5 py-10 text-center shadow-nvd-soft">
      <h2 className="text-xl font-black text-nvd-blue-dark">Portfolio en préparation</h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {message}
      </p>
      <Button asChild variant="nvd" className="mt-6">
        <Link href="/#devis">Demander un devis gratuit</Link>
      </Button>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pages = getPaginationItems(currentPage, totalPages);

  return (
    <nav
      aria-label="Pagination des réalisations avant après"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <PaginationLink
        href={getPageHref(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ArrowLeft className="h-4 w-4" />
        Précédent
      </PaginationLink>

      {pages.map((page, index) =>
        page === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="grid h-10 min-w-10 place-items-center rounded-lg px-3 text-sm font-black text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Link
            key={page}
            href={getPageHref(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "grid h-10 min-w-10 place-items-center rounded-lg border px-3 text-sm font-black transition",
              page === currentPage
                ? "border-nvd-blue-primary bg-nvd-blue-primary text-white"
                : "border-cyan-100 bg-white text-nvd-blue-dark hover:border-nvd-blue-primary hover:bg-cyan-50"
            )}
          >
            {page}
          </Link>
        )
      )}

      <PaginationLink
        href={getPageHref(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Suivant
        <ArrowRight className="h-4 w-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  href,
  disabled,
  children
}: {
  href: string;
  disabled: boolean;
  children: React.ReactNode;
}) {
  const className = cn(
    "inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-black transition",
    disabled
      ? "pointer-events-none border-border bg-muted text-muted-foreground"
      : "border-cyan-100 bg-white text-nvd-blue-dark hover:border-nvd-blue-primary hover:bg-cyan-50"
  );

  if (disabled) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function getPaginationItems(currentPage: number, totalPages: number) {
  const pages: Array<number | "ellipsis"> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const shouldShow =
      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;

    if (!shouldShow) {
      if (pages[pages.length - 1] !== "ellipsis") {
        pages.push("ellipsis");
      }

      continue;
    }

    pages.push(page);
  }

  return pages;
}

function getPageHref(page: number) {
  return `/avant-apres?page=${page}`;
}

function parsePageParam(value: string | string[] | undefined) {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const parsed = Number(rawValue ?? "1");

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}
