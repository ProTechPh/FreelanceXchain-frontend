import Navbar from '@/components/layout/navbar';
import { FooterSection } from '@/components/layout/footer-section';
import { Faq5 } from '@/components/marketing/faq-5';

export const metadata = {
  title: 'FAQs | FreelanceXchain',
  description: 'Frequently asked questions about FreelanceXchain marketplace, escrow, payments, and verification.',
};

export default function FaqsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="grow pt-28 sm:pt-36 pb-20">
        <Faq5 />
      </main>
      <FooterSection />
    </div>
  );
}
