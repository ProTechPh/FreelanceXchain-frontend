import { FooterSection } from "@/components/ui/footer-section";
import { CallToAction } from "@/components/ui/call-to-action";
import AetherHero from "@/components/ui/aether-hero";
import { WhySection } from "@/components/ui/vercep-feature-1";
import { PainPoints } from "@/components/ui/pain-points";
import { FeaturesGrid } from "@/components/ui/features-grid";
import { ComparisonTable } from "@/components/ui/comparison-table";
import { TestimonialsMarquee } from "@/components/ui/testimonials-marquee";
import { EcosystemShowcase } from "@/components/ui/ecosystem-showcase";
import { FaqSection } from "@/components/ui/faq-section";
import Navbar from "@/components/ui/navbar";

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
