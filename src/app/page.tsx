import { Testimonials } from '@/components/ui/testimonials-columns-1';
import { Logos3 } from '@/components/ui/logos3';
import { FooterSection } from '@/components/ui/footer-section';
import { CallToAction } from '@/components/ui/call-to-action';
import AetherHero from '@/components/ui/aether-hero';
import { HowItWorks } from '@/components/ui/how-it-works';
import { WhySection } from '@/components/ui/vercep-feature-1';
import Navbar from '@/components/ui/navbar';

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main>
        <AetherHero
          title="Decentralize Your Freelance Career"
          subtitle="Get matched with projects using AI, secure payments with smart contracts, and build an immutable reputation on-chain."
          ctaLabel="Find Work"
          ctaHref="/register"
          secondaryCtaLabel="Hire Talent"
          secondaryCtaHref="/register"
          align="left"
          overlayGradient="linear-gradient(105deg, #000000cc 0%, #000000aa 40%, #00000044 70%, transparent 100%)"
        />
        <WhySection />
        <HowItWorks />
        <Testimonials />
        <Logos3 />
        <CallToAction />
      </main>

      {/* Footer */}
      <FooterSection />
    </div>
  );
}
