import dynamic from 'next/dynamic';
import { FooterSection } from "@/components/layout/footer-section";
import { CallToAction } from "@/components/marketing/call-to-action";
import AetherHero from "@/components/marketing/aether-hero";
import { WhySection } from "@/components/marketing/vercep-feature-1";
import { PainPoints } from "@/components/marketing/pain-points";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import Navbar from "@/components/layout/navbar";

const EcosystemShowcase = dynamic(
  () => import("@/components/marketing/ecosystem-showcase").then((mod) => mod.EcosystemShowcase)
);
const ComparisonTable = dynamic(
  () => import("@/components/marketing/comparison-table").then((mod) => mod.ComparisonTable)
);
const TestimonialsMarquee = dynamic(
  () => import("@/components/marketing/testimonials-marquee").then((mod) => mod.TestimonialsMarquee)
);
const FaqSection = dynamic(
  () => import("@/components/marketing/faq-section").then((mod) => mod.FaqSection)
);

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
