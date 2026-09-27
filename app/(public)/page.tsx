import { Footer } from "@/components/Footer";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { BeforeAfterSlider } from "@/components/landing/BeforeAfterSlider";
import { FloatingActionBar } from "@/components/landing/FloatingActionBar";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { QuoteSection } from "@/components/landing/QuoteSection";
import { ServicesGrid } from "@/components/landing/ServicesGrid";
import { Testimonials } from "@/components/Testimonials";

export const revalidate = 60;

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <PageViewTracker />
      <Navbar />
      <Hero />
      <ServicesGrid />
      <BeforeAfterSlider />
      <Testimonials />
      <QuoteSection />
      <Footer />
      <FloatingActionBar />
    </main>
  );
}
