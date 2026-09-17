import { InfoPage } from "@/components/public/info-page";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | FreelanceXchain",
  description: "Terms of Service governing the FreelanceXchain decentralized freelance protocol, smart contract milestone escrow, dispute arbitration, and platform usage.",
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms of Service"
      badge="Legal & Protocol Agreement"
      intro="The terms, escrow obligations, dispute resolution protocols, and liabilities that apply when accessing the FreelanceXchain decentralized platform. Last updated September 2026."
    >
      <nav className="flex flex-wrap gap-2 mb-8 not-prose" aria-label="Jump to section">
        {[
          { id: "section-1", label: "1. Acceptance & Eligibility" },
          { id: "section-2", label: "2. Escrow & Smart Contracts" },
          { id: "section-3", label: "3. Milestone Payouts & Approvals" },
          { id: "section-4", label: "4. Disputes & Arbitration" },
          { id: "section-5", label: "5. Non-Custodial Wallets & Gas" },
          { id: "section-6", label: "6. Platform Fees & Transparency" },
          { id: "section-7", label: "7. Intellectual Property" },
          { id: "section-8", label: "8. Prohibited Conduct" },
          { id: "section-9", label: "9. Disclaimers & Liability" },
          { id: "section-10", label: "10. Governing Law & Arbitration" },
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
        <h2 className="text-xl font-bold text-foreground">1. Acceptance of Terms & Eligibility</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          By accessing freelancexchain.com, interacting with FreelanceXchain smart contracts, or connecting a Web3 wallet, you enter into a legally binding agreement governing the use of the <strong>FreelanceXchain Protocol</strong> (&quot;FreelanceXchain&quot;, &quot;we&quot;, &quot;us&quot;). If you do not agree to all terms, do not access or use our services.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Age & Capacity:</strong> You expressly represent and warrant that you are at least 18 years of age (or the legal age of majority in your jurisdiction) and possess full legal capacity to enter into binding agreements.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Sanctions & Restricted Jurisdictions:</strong> You certify that you are not a resident of, or located in, any country or territory subject to comprehensive sanctions enforced by OFAC, the European Union, the United Kingdom, or the United Nations, nor are you listed on any restricted party lists.
        </p>
      </section>

      <section id="section-2" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Escrow Architecture & Smart Contracts</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FreelanceXchain provides decentralized smart contract escrow software. When an employer engages a freelancer, project funds are deposited into an on-chain escrow smart contract rather than held in a pooled custodial bank account.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Autonomous Holding:</strong> Deposited escrow tokens are held strictly by cryptographic code on supported networks (Ethereum, Polygon, Arbitrum, Base, Optimism).</li>
          <li><strong>Non-Custodial:</strong> FreelanceXchain does not act as a traditional custodian, bank, or fiduciary, and cannot arbitrarily seize or unilaterally withdraw client deposits outside protocol-defined rules.</li>
          <li><strong>Funding Commitment:</strong> Employers agree that once milestone funds are deposited, they are locked until milestone completion approval, mutual cancellation, or dispute resolution.</li>
        </ul>
      </section>

      <section id="section-3" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Milestone Deliverables, Approvals & Releases</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each contract defines one or more discrete milestones with clear deliverables, acceptance criteria, and payout amounts:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Submission:</strong> Freelancers submit deliverables via the workspace dashboard.</li>
          <li><strong>Review Window:</strong> Employers have an agreed inspection window (standard 14 calendar days) to approve deliverables or request revisions based on agreed specifications.</li>
          <li><strong>Automatic Release:</strong> If an employer neither approves nor raises a dispute within the designated review window after deliverable submission, the smart contract may be programmed to auto-release the milestone funds to protect freelancers from client abandonment.</li>
        </ul>
      </section>

      <section id="section-4" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Dispute Resolution & Decentralized Arbitration</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If parties cannot agree on deliverable completion, either party may trigger the FreelanceXchain Dispute Center:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Evidence Submission:</strong> Both parties have 7 calendar days to upload deliverable evidence, contract chat logs, and revision requests.</li>
          <li><strong>Arbitration Mechanism:</strong> Verified neutral arbiters review submitted milestone criteria against deliverables and execute a binding on-chain distribution (full release to freelancer, full refund to employer, or proportional split).</li>
          <li><strong>Finality:</strong> Arbiter rulings executed on-chain are final, binding, and cannot be reversed by platform staff.</li>
        </ul>
      </section>

      <section id="section-5" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Non-Custodial Wallets, Keys & Gas Fees</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You are solely responsible for maintaining the confidentiality and security of your Web3 private keys, seed phrases, and connected wallet software.
        </p>
        <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 text-xs text-muted-foreground space-y-2">
          <p className="font-semibold text-foreground">Network Gas Fees:</p>
          <p>
            All blockchain interactions (such as wallet signatures, token approvals, escrow deposits, milestone releases, and claim transactions) require network transaction fees (&quot;gas&quot;) paid directly to decentralized network validators. Gas fees fluctuate based on network demand and are strictly non-refundable by FreelanceXchain under any circumstances.
          </p>
        </div>
      </section>

      <section id="section-6" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Transparent Platform Fees</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FreelanceXchain is committed to 100% transparent fee structures without hidden charges:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Freelancers:</strong> 0% platform service commission on standard milestone earnings. Freelancers receive 100% of approved escrow funds less third-party network gas costs.</li>
          <li><strong>Employers:</strong> Clear, upfront payment processing and protocol fees disclosed before deposit confirmation (see our <Link href="/pricing" className="text-primary font-semibold hover:underline">Pricing Page</Link>).</li>
          <li><strong>No Hidden Surcharges:</strong> No surprise monthly inactivity fees, withdrawal surcharges, or hidden exchange markups.</li>
        </ul>
      </section>

      <section id="section-7" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Intellectual Property & Deliverable Ownership</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Deliverable Transfer:</strong> Unless otherwise expressly agreed in a written contract between the employer and freelancer, full copyright, intellectual property, and title to approved deliverables automatically transfer to the employer upon complete release and confirmation of the corresponding milestone escrow payment.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <strong>Pre-existing IP:</strong> Freelancers retain ownership of their pre-existing frameworks, open-source libraries, and reusable tooling, granting employers a perpetual, non-exclusive license to use such embedded materials as incorporated into the deliverable.
        </p>
      </section>

      <section id="section-8" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Prohibited Conduct & Fair Marketplace Rules</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Users agree strictly not to engage in:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>Creating fake accounts, submitting fabricated proposals, or posting fraudulent or manipulated reviews.</li>
          <li>Reputation wash trading (colluding with affiliated wallets to inflate star ratings or project counts).</li>
          <li>Deploying malicious code, security exploits, or attempting to compromise smart contracts.</li>
          <li>Evading escrow requirements by soliciting off-platform untracked payments for platform-matched contracts.</li>
          <li>Harassment, hate speech, or violations of applicable employment and labor regulations.</li>
        </ul>
      </section>

      <section id="section-9" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">9. Disclaimers of Warranties & Limitation of Liability</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          THE PLATFORM, PROTOCOL, SMART CONTRACTS, AND ALL ASSOCIATED SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE MAXIMUM EXTENT PERMITTED BY LAW, FREELANCEXCHAIN DISCLAIMS ALL WARRANTIES, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          IN NO EVENT SHALL FREELANCEXCHAIN, ITS OFFICERS, DIRECTORS, EMPLOYEES, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, CRYPTOGRAPHIC ASSETS, GAS FEES, OR BLOCKCHAIN NETWORK REORGANIZATIONS, EXCEEDING THE TOTAL FEES PAID BY YOU TO FREELANCEXCHAIN IN THE PRIOR 12 MONTHS OR $100 USD (WHICHEVER IS GREATER).
        </p>
      </section>

      <section id="section-10" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">10. Governing Law, Dispute Resolution & Legal Contact</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          These Terms of Service are governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles. Any dispute arising from these Terms not settled via decentralized platform arbitration shall be resolved through confidential, binding commercial arbitration administered by JAMS or the American Arbitration Association (AAA).
        </p>
        <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 text-xs sm:text-sm space-y-1 text-foreground">
          <p className="font-bold">FreelanceXchain Protocol</p>
          <p className="text-muted-foreground">Decentralized Freelance Marketplace & Smart Escrow</p>
          <p className="text-muted-foreground">Global Operations (Remote-First Decentralized Platform)</p>
          <p className="text-muted-foreground">Legal & Contract Inquiries: <a href="mailto:legal@freelancexchain.com" className="text-primary font-medium hover:underline">legal@freelancexchain.com</a></p>
        </div>
      </section>
    </InfoPage>
  );
}
