import { FooterSection } from "@/components/layout/footer-section";
import { CallToAction } from "@/components/marketing/call-to-action";
import AetherHero from "@/components/marketing/aether-hero";
import { WhySection } from "@/components/marketing/vercep-feature-1";
import { PainPoints } from "@/components/marketing/pain-points";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import { ComparisonTable } from "@/components/marketing/comparison-table";
import { TestimonialsMarquee } from "@/components/marketing/testimonials-marquee";
import { EcosystemShowcase } from "@/components/marketing/ecosystem-showcase";
import { FaqSection } from "@/components/marketing/faq-section";
import Navbar from "@/components/layout/navbar";

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main>
        <AetherHero />
        <PainPoints />
        <WhySection />
        <FeaturesGrid />
        <EcosystemShowcase />
        <ComparisonTable />
        <TestimonialsMarquee />
        <FaqSection />
        <CallToAction />
      </main>

      <FooterSection />
    </div>
  );
}
