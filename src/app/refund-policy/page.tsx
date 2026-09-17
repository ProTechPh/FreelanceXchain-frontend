import { InfoPage } from "@/components/public/info-page";
import Link from "next/link";

export const metadata = {
  title: "Refund & Escrow Policy | FreelanceXchain",
  description: "Official Refund and Escrow Cancellation Policy for FreelanceXchain: milestone cancellations, arbiter refunds, platform fees, and network gas fee rules.",
};

export default function RefundPolicyPage() {
  return (
    <InfoPage
      title="Refund & Escrow Policy"
      badge="Transparent Escrow Terms"
      intro="Our comprehensive policy governing milestone escrow refunds, project cancellations, dispute awards, and blockchain transaction finality. Last updated September 2026."
    >
      <nav className="flex flex-wrap gap-2 mb-8 not-prose" aria-label="Jump to section">
        {[
          { id: "section-1", label: "1. Escrow Refund Framework" },
          { id: "section-2", label: "2. Cancellation Before Start" },
          { id: "section-3", label: "3. Mutual Milestone Cancellation" },
          { id: "section-4", label: "4. Dispute Arbitration Refunds" },
          { id: "section-5", label: "5. Non-Refundable Gas Fees" },
          { id: "section-6", label: "6. Platform Subscription Fees" },
          { id: "section-7", label: "7. How to Request a Refund" },
        ].map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            {item.label}
          </a>
        ))}
      </nav>

      <section id="section-1" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Escrow-Based Refund Framework</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Unlike traditional web platforms that hold funds in commingled bank accounts, FreelanceXchain executes financial transactions via decentralized smart contracts. When an employer creates a contract, funds are locked securely in an autonomous milestone escrow vault until explicitly released upon deliverable approval or refunded according to the terms herein.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This architecture ensures that neither party can unilaterally take deposited funds without mutual consent or neutral dispute arbitration.
        </p>
      </section>

      <section id="section-2" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Cancellation Prior to Project Commencement</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>100% Escrow Refund:</strong> If an employer funds an escrow contract and the chosen freelancer has not yet accepted the proposal or commenced work, the employer may cancel the contract directly from their employer dashboard.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Upon cancellation, 100% of the deposited principal escrow tokens (USDC, USDT, or ETH) are instantly returned to the employer&apos;s originating Web3 wallet via smart contract refund transaction.
        </p>
      </section>

      <section id="section-3" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Mutual Milestone Cancellation</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If an active project is interrupted or parties mutually agree to discontinue work:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Completed & Approved Milestones:</strong> Any milestone previously submitted by the freelancer and approved by the employer is final and cannot be refunded.</li>
          <li><strong>Unstarted or Incomplete Milestones:</strong> Upon mutual written confirmation in the contract workspace, unreleased milestone funds held in the escrow contract are unlocked and returned to the employer.</li>
          <li><strong>Partial Deliverables:</strong> Parties may agree via mutual agreement to release a pro-rata percentage to the freelancer for hours or deliverables completed, with the remainder refunded to the employer.</li>
        </ul>
      </section>

      <section id="section-4" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Dispute Arbitration Refunds</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If an employer rejects a deliverable and the freelancer disputes the rejection, either party may escalate to the <Link href="/dashboard/employer/disputes" className="text-primary font-semibold hover:underline">Dispute Center</Link>.
        </p>
        <div className="p-4 rounded-2xl bg-card border border-border/80 text-xs sm:text-sm space-y-2 text-foreground">
          <p className="font-semibold">Arbitration Determination:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>If the arbiter finds that the deliverable met agreed milestone specifications, escrow funds are disbursed to the freelancer.</li>
            <li>If the arbiter finds the deliverable failed agreed specifications or was not delivered, the escrow funds are refunded to the employer.</li>
            <li>In mixed cases, the arbiter may execute an equitable proportional distribution (e.g. 50/50 split).</li>
          </ul>
        </div>
      </section>

      <section id="section-5" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Non-Refundable Blockchain Gas Fees</h2>
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground space-y-2">
          <p className="text-sm font-semibold">Important Gas Fee Disclosure:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Network transaction fees (&quot;gas&quot;) paid to miners or validators on the Ethereum, Polygon, Arbitrum, Base, or Optimism networks are required by the underlying blockchain protocol to compute state changes. FreelanceXchain does not receive or control these network fees. Consequently, gas fees paid during deposit, approval, dispute submission, or refund claims are strictly non-refundable.
          </p>
        </div>
      </section>

      <section id="section-6" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Platform Subscriptions & Tier Upgrades</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you purchase optional premium platform features (such as Pro employer analytics, enterprise KYC badge packages, or priority job placement), you are eligible for a full refund within <strong>14 calendar days</strong> of initial purchase provided the premium features have not been materially consumed. To request a subscription refund, email <a href="mailto:billing@freelancexchain.com" className="text-primary font-semibold hover:underline">billing@freelancexchain.com</a>.
        </p>
      </section>

      <section id="section-7" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. How to Initiate an Escrow Refund</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You can request or trigger a contract refund through the following steps:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-sm text-muted-foreground">
          <li>Navigate to your <strong>Contracts Dashboard</strong> and select the relevant contract ID.</li>
          <li>Click <strong>Request Contract Cancellation & Refund</strong> in the milestone actions panel.</li>
          <li>If the freelancer agrees, sign the wallet confirmation to withdraw the refunded tokens from the escrow vault.</li>
          <li>If a disagreement arises, click <strong>Open Dispute</strong> to submit evidence to the decentralized arbitration panel.</li>
        </ol>
        <p className="text-xs text-muted-foreground mt-4">
          Need assistance? Reach our billing and escrow support team at <a href="mailto:support@freelancexchain.com" className="text-primary font-medium hover:underline">support@freelancexchain.com</a>.
        </p>
      </section>
    </InfoPage>
  );
}
