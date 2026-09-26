import { Footer } from "@/components/Footer";
import { BeforeAfterSlider } from "@/components/landing/BeforeAfterSlider";
import { FloatingActionBar } from "@/components/landing/FloatingActionBar";
import { Hero } from "@/components/landing/Hero";
import { Navbar } from "@/components/landing/Navbar";
import { QuoteSection } from "@/components/landing/QuoteSection";
import { ServicesGrid } from "@/components/landing/ServicesGrid";

export default function PublicLandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <ServicesGrid />
      <BeforeAfterSlider />
      <QuoteSection />
      <Footer />
      <FloatingActionBar />
    </main>
  );
}
