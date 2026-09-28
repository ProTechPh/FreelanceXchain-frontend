import Link from "next/link";
import { InfoPage } from "@/components/public/info-page";
import { SupportFaqSection } from '@/components/support/support-faq-section';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: "Help Center | FreelanceXchain",
  description: "Quick access guides for account recovery, Didit verification, contract escrow, and disputes.",
};

export default function HelpPage() {
  return (
    <InfoPage
      title="Help Center"
      badge="Support & Account Guides"
      intro="Direct routes and troubleshooting guidance for common account, contract, and verification tasks."
    >
      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Help center sections">
        <a href="#guides" className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
          Quick guides
        </a>
        <a href="#faq" className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
          Frequently asked questions
        </a>
        {['Account Access', 'Identity Verification', 'Contracts & Escrow', 'Opening a Dispute', 'System Health'].map((label, i) => (
          <a key={i} href={`#section-${i + 1}`} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
            {label}
          </a>
        ))}
      </nav>

      <section id="guides" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">Quick platform guides</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Start with the topic closest to what you are trying to do. Signed-in users can also launch the product tour from the account menu for an interactive walkthrough.
        </p>
      </section>

      <section id="section-1" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">Account Access & Security</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Need help logging in? Use <Link href="/forgot-password" className="text-primary font-bold hover:underline">Password Recovery</Link> to reset credentials, or use <Link href="/passwordless" className="text-primary font-bold hover:underline">Passwordless Sign In</Link> for magic link authentication. For extra protection, configure multi-factor authentication in your account settings.
        </p>
      </section>

      <section id="section-2" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">Didit Global Identity Verification</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Before releasing escrow milestones or posting high-value contracts, users may need to complete Didit biometric KYC verification. Go to your dashboard verification tab to start or review your current verification status.
        </p>
      </section>

      <section id="section-3" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">Contracts, Workspaces & Escrow Payouts</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Manage all ongoing contracts from your dashboard. Employers fund milestone deposits securely into smart contract escrow. Once deliverables are reviewed and accepted, payouts are immediately released to the freelancer&apos;s wallet.
        </p>
      </section>

      <section id="section-4" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">Opening a Dispute</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If a deliverable does not match the agreed project scope, a verified participant can open a dispute directly within the contract workspace. Both parties provide evidence, and neutral protocol arbiters conduct on-chain reviews.
        </p>
      </section>

      <section id="section-5" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">System Health & Live Monitoring</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you encounter connection issues or transaction delays, check our <Link href="/status" className="text-primary font-bold hover:underline">System Status</Link> page for real-time uptime reports across our API and blockchain relayers.
        </p>
      </section>

      <section id="faq" className="not-prose scroll-mt-32 border-t border-border pt-8">
        <SupportFaqSection />
      </section>

      <section id="contact-support" className="not-prose scroll-mt-32 rounded-2xl border border-border bg-secondary/30 p-6 text-center">
        <h2 className="text-lg font-bold text-foreground">Still need help?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact support for account access questions, or sign in to submit and track a support ticket from your dashboard.
        </p>
        <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
          <Button asChild variant="outline"><Link href="/contact">Contact support</Link></Button>
          <Button asChild variant="gradient"><Link href="/login">Sign in</Link></Button>
        </div>
      </section>
    </InfoPage>
  );
}
