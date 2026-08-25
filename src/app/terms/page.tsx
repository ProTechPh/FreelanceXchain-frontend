import { InfoPage } from "@/components/public/info-page";

export const metadata = {
  title: "Terms of Service | FreelanceXchain",
  description: "The rules and agreements governing the FreelanceXchain decentralized freelance marketplace and smart contract escrow.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      badge="Legal & Platform Agreement"
      intro="The governance rules, milestone escrow commitments, and user rights that apply when using FreelanceXchain. Last updated August 2026."
    >
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Marketplace Accounts & Identity Verification</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          To access the FreelanceXchain marketplace, you must provide accurate registration details, secure your authentication credentials, and complete Didit identity verification where required. You are responsible for all actions conducted through your wallet address and authenticated session.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Projects, Proposals & Milestone Escrow</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Employers must specify truthful project scopes, budgets, and milestone deliverables. Freelancers commit to submitting original, high-quality deliverables. Once an employer accepts a proposal and deposits funds into the Ethereum smart contract escrow, those funds are held trustlessly until milestone completion is approved or an arbitration decision is made.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Automated Payouts & Dispute Resolution</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Milestone payouts are automatically executed on-chain upon client deliverable approval. In the event of a scope disagreement, either party may trigger the Dispute Center. Both parties submit evidence, and verified arbiters review project milestones on-chain to determine fair fund allocation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Acceptable Conduct & Prohibited Activities</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Users agree not to engage in fraud, harassment, malicious code deployment, intellectual property infringement, or attempts to circumvent in-platform smart contract escrow controls. Violations may result in KYC credential flagging and account suspension.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Platform Evolution & Multi-Chain Support</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FreelanceXchain may upgrade smart contract architectures, add Layer 2 network integrations (e.g. Polygon, Arbitrum, Base, Optimism), and refine protocol parameters to optimize gas efficiency and user safety.
        </p>
      </section>
    </InfoPage>
  );
}
