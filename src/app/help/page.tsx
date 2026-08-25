import Link from "next/link";
import { InfoPage } from "@/components/public/info-page";

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
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Account Access & Security</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Need help logging in? Use <Link href="/forgot-password" className="text-primary font-bold hover:underline">Password Recovery</Link> to reset credentials, or use <Link href="/passwordless" className="text-primary font-bold hover:underline">Passwordless Sign In</Link> for magic link authentication. For extra protection, configure multi-factor authentication in your account settings.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Didit Global Identity Verification</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Before releasing escrow milestones or posting high-value contracts, users may need to complete Didit biometric KYC verification. Go to your dashboard verification tab to start or review your current verification status.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Contracts, Workspaces & Escrow Payouts</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Manage all ongoing contracts from your dashboard. Employers fund milestone deposits securely into smart contract escrow. Once deliverables are reviewed and accepted, payouts are immediately released to the freelancer&apos;s wallet.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">Opening a Dispute</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If a deliverable does not match the agreed project scope, a verified participant can open a dispute directly within the contract workspace. Both parties provide evidence, and neutral protocol arbiters conduct on-chain reviews.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">System Health & Live Monitoring</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you encounter connection issues or transaction delays, check our <Link href="/status" className="text-primary font-bold hover:underline">System Status</Link> page for real-time uptime reports across our API and blockchain relayers.
        </p>
      </section>
    </InfoPage>
  );
}
