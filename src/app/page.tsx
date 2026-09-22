import dynamic from 'next/dynamic';
import { FooterSection } from "@/components/layout/footer-section";
import { CallToAction } from "@/components/marketing/call-to-action";
import AetherHero from "@/components/marketing/aether-hero";
import { WhySection } from "@/components/marketing/vercep-feature-1";
import { PainPoints } from "@/components/marketing/pain-points";
import { FeaturesGrid } from "@/components/marketing/features-grid";
import Navbar from "@/components/layout/navbar";

const EcosystemShowcase = dynamic(
  () => import("@/components/marketing/ecosystem-showcase").then((mod) => mod.EcosystemShowcase),
  { loading: () => <div className="h-[560px] bg-muted/20 animate-shimmer rounded-none" aria-hidden="true" /> }
);
const ComparisonTable = dynamic(
  () => import("@/components/marketing/comparison-table").then((mod) => mod.ComparisonTable),
  { loading: () => <div className="h-[480px] mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20"><div className="h-full bg-muted/20 animate-shimmer rounded-2xl" aria-hidden="true" /></div> }
);
const FaqSection = dynamic(
  () => import("@/components/marketing/faq-section").then((mod) => mod.FaqSection),
  { loading: () => <div className="h-[400px] mx-auto max-w-3xl px-4 py-20"><div className="h-full bg-muted/20 animate-shimmer rounded-2xl" aria-hidden="true" /></div> }
);

export default function Home() {
  return (
    <div className="min-h-screen">
      <Navbar />

      <main id="main-content" tabIndex={-1} className="outline-none">
        <AetherHero />
        <PainPoints />
        <WhySection />
        <FeaturesGrid />
        <EcosystemShowcase />
        <ComparisonTable />
        <FaqSection />
        <CallToAction />
      </main>

      <FooterSection />
    </div>
  );
}
