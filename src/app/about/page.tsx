import AboutUsSection from '@/components/marketing/about-us-section';
import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';

export const metadata = {
  title: 'About Us | FreelanceXchain',
  description: 'Learn about the mission, values, and smart contract escrow infrastructure powering FreelanceXchain.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="grow pt-28 sm:pt-36 pb-20">
        <AboutUsSection />
      </main>
      <FooterSection />
    </div>
  );
}
