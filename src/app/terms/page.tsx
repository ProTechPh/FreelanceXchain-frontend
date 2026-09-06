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
      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Jump to section">
        {['Accounts & Identity', 'Projects & Escrow', 'Payouts & Disputes', 'Conduct & Prohibited', 'Platform Evolution'].map((label, i) => (
          <a key={i} href={`#section-${i + 1}`} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
            {label}
          </a>
        ))}
      </nav>

      <section id="section-1" className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. Marketplace Accounts & Identity Verification</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          To access the FreelanceXchain marketplace, you must provide accurate registration details, secure your authentication credentials, and complete Didit identity verification where required. You are responsible for all actions conducted through your wallet address and authenticated session.
        </p>
      </section>

      <section id="section-2" className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Projects, Proposals & Milestone Escrow</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Employers must specify truthful project scopes, budgets, and milestone deliverables. Freelancers commit to submitting original, high-quality deliverables. Once an employer accepts a proposal and deposits funds into the Ethereum smart contract escrow, those funds are held trustlessly until milestone completion is approved or an arbitration decision is made.
        </p>
      </section>

      <section id="section-3" className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Automated Payouts & Dispute Resolution</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Milestone payouts are automatically executed on-chain upon client deliverable approval. In the event of a scope disagreement, either party may trigger the Dispute Center. Both parties submit evidence, and verified arbiters review project milestones on-chain to determine fair fund allocation.
        </p>
      </section>

      <section id="section-4" className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Acceptable Conduct & Prohibited Activities</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Users agree not to engage in fraud, harassment, malicious code deployment, intellectual property infringement, or attempts to circumvent in-platform smart contract escrow controls. Violations may result in KYC credential flagging and account suspension.
        </p>
      </section>

      <section id="section-5" className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Platform Evolution & Multi-Chain Support</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FreelanceXchain may upgrade smart contract architectures, add Layer 2 network integrations (e.g. Polygon, Arbitrum, Base, Optimism), and refine protocol parameters to optimize gas efficiency and user safety.
        </p>
      </section>
    </InfoPage>
  );
}
