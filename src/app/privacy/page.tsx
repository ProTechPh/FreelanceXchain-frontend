import { InfoPage } from "@/components/public/info-page";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | FreelanceXchain",
  description: "Comprehensive Privacy Policy for FreelanceXchain: data collection, Didit KYC biometric processing, blockchain immutability, sub-processors, and user rights under GDPR and CCPA.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      badge="GDPR & CCPA Compliant"
      intro="Our transparent commitment to protecting your personal data, managing Didit biometric identity verification, and navigating public blockchain records. Last updated September 2026."
    >
      <nav className="flex flex-wrap gap-2 mb-8 not-prose" aria-label="Jump to section">
        {[
          { id: "section-1", label: "1. Data Controller & Scope" },
          { id: "section-2", label: "2. Information We Collect" },
          { id: "section-3", label: "3. Legal Basis (GDPR)" },
          { id: "section-4", label: "4. How We Use Data" },
          { id: "section-5", label: "5. Blockchain & Immutability" },
          { id: "section-6", label: "6. Sub-Processors & Third Parties" },
          { id: "section-7", label: "7. Data Retention" },
          { id: "section-8", label: "8. Your Rights (GDPR & CCPA)" },
          { id: "section-9", label: "9. Children's Privacy (18+)" },
          { id: "section-10", label: "10. Contact & DPO" },
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
        <h2 className="text-xl font-bold text-foreground">1. Data Controller & Scope</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          This Privacy Policy describes how <strong>FreelanceXchain Protocol</strong> (&quot;FreelanceXchain&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) manages and protects personal data when you access or use our decentralized freelance marketplace, web applications, smart contracts, and related services at freelancexchain.com.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FreelanceXchain operates globally as a remote-first, decentralized protocol for smart contract freelance escrow. For the purposes of data protection regulations (including GDPR and CCPA), FreelanceXchain manages personal data processed through off-chain platform services in accordance with this policy.
        </p>
      </section>

      <section id="section-2" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. Information We Collect</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We collect personal data that you provide directly, data generated automatically through platform usage, and verification data processed via certified identity partners:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>Account & Profile Data:</strong> Email address, hashed authentication credentials, full name, professional role (freelancer or employer), bio, portfolio links, skill tags, and notification preferences.
          </li>
          <li>
            <strong>Web3 Wallet & Public Cryptographic Keys:</strong> Public Ethereum/Polygon blockchain wallet addresses (e.g. MetaMask, WalletConnect, Coinbase Wallet). We <em>never</em> request, collect, or store your private keys or seed phrases.
          </li>
          <li>
            <strong>Identity & Biometric KYC Data (Didit):</strong> When required by AML/KYC regulations for escrow participation, identity document verification (passports, national IDs, driver&apos;s licenses) and facial liveness biometrics are processed directly by our certified identity partner, Didit. FreelanceXchain receives cryptographically signed verification tokens and verification status attributes (verified, tier, country of issue) without storing raw unencrypted biometric scans on our application databases.
          </li>
          <li>
            <strong>Contracts, Proposals & Milestone Deliverables:</strong> Scope descriptions, deliverable attachments, milestone release requests, communication timestamps, and dispute evidence logs.
          </li>
          <li>
            <strong>Technical & Device Data:</strong> Anonymized IP addresses, browser types, device identifiers, session cookies, and security telemetry collected via Cloudflare Turnstile to prevent automated abuse and Sybil attacks.
          </li>
        </ul>
      </section>

      <section id="section-3" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Legal Basis for Processing (GDPR Art. 6)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We process personal data only when lawful under applicable data protection regulations:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Contractual Necessity:</strong> To create your account, match skills, lock funds in escrow, release milestone payouts, and enforce platform Terms of Service.</li>
          <li><strong>Legal Obligations:</strong> Compliance with anti-money laundering (AML), counter-terrorist financing (CTF), tax reporting, and fraud prevention requirements.</li>
          <li><strong>Legitimate Interests:</strong> Protecting platform integrity, resolving escrow disputes, improving matchmaking algorithms, and ensuring cybersecurity.</li>
          <li><strong>Consent:</strong> For non-essential cookies, opt-in promotional communications, and specific identity document verifications where local law mandates explicit consent.</li>
        </ul>
      </section>

      <section id="section-4" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. How We Use Your Information</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your information is utilized strictly to provide transparent, secure marketplace operations:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li>Facilitating trustless smart contract escrow agreements between employers and freelancers.</li>
          <li>Generating portable on-chain and off-chain reputation scores based on completed milestones and verified reviews.</li>
          <li>Preventing account takeovers, fraudulent bids, fake reviews, and unauthorized platform scraping.</li>
          <li>Facilitating neutral dispute arbitration when requested by either party to an escrow agreement.</li>
          <li>Sending critical transactional updates (e.g. proposal approvals, milestone deposits, dispute notices).</li>
        </ul>
      </section>

      <section id="section-5" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Public Blockchain Records & Immutability Notice</h2>
        <div className="p-4 rounded-2xl bg-warning-subtle border border-warning-border text-foreground space-y-2">
          <p className="text-sm font-semibold">Important Web3 Disclosure:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            By interacting with FreelanceXchain smart contracts, you acknowledge that transactions committed to public distributed ledgers (including Ethereum, Polygon, Arbitrum, Base, and Optimism) are permanent, irreversible, and publicly inspectable by anyone. Your public wallet address, deposited escrow amounts, milestone timestamps, and on-chain arbitration verdicts cannot be modified, deleted, or erased by FreelanceXchain or any third party.
          </p>
        </div>
      </section>

      <section id="section-6" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">6. Sub-Processors & Third-Party Service Providers</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We work with verified sub-processors bound by strict Data Processing Agreements (DPAs):
        </p>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-xs text-left border border-border/80 rounded-xl overflow-hidden">
            <thead className="bg-muted text-foreground font-semibold">
              <tr>
                <th className="p-3">Partner / Provider</th>
                <th className="p-3">Role & Purpose</th>
                <th className="p-3">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-foreground">Didit Identity</td>
                <td className="p-3">Government ID & Biometric KYC Verification</td>
                <td className="p-3">EU / United Kingdom</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Appwrite Cloud / Self-Hosted</td>
                <td className="p-3">Encrypted database storage and user profiles</td>
                <td className="p-3">EU / United States</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Cloudflare, Inc.</td>
                <td className="p-3">DDoS mitigation, CDN, Turnstile bot prevention</td>
                <td className="p-3">Global / United States</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Alchemy / Infura</td>
                <td className="p-3">Blockchain RPC nodes & transaction relaying</td>
                <td className="p-3">United States / Global</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="section-7" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">7. Data Retention & Minimization</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We retain off-chain personal data only for as long as necessary to fulfill the operational purposes described in this policy, comply with financial audit rules (typically 5 to 7 years for billing and invoice records under tax laws), or until you request account deletion. When data is no longer required, it is securely deleted or irreversibly anonymized.
        </p>
      </section>

      <section id="section-8" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">8. Your Privacy Rights (GDPR & CCPA/CPRA)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Depending on your location, you hold legal rights regarding your personal data:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-sm text-muted-foreground">
          <li><strong>Right of Access & Portability:</strong> Request a copy of your personal data in a structured, machine-readable format.</li>
          <li><strong>Right to Rectification:</strong> Update inaccurate or incomplete profile details directly in your Dashboard settings.</li>
          <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request the permanent deletion of your off-chain profile and data.</li>
          <li><strong>Right to Restrict or Object:</strong> Object to processing for direct marketing or withdraw prior consent at any time.</li>
          <li><strong>Non-Discrimination:</strong> We do not discriminate against users exercising CCPA/CPRA privacy rights.</li>
        </ul>
        <p className="text-sm text-muted-foreground leading-relaxed mt-2">
          To submit a formal data request or exercise your erasure rights, visit your <Link href="/dashboard/freelancer/settings" className="text-primary font-semibold hover:underline">Account Settings</Link> or email our Data Protection Officer at <a href="mailto:privacy@freelancexchain.com" className="text-primary font-semibold hover:underline">privacy@freelancexchain.com</a>.
        </p>
      </section>

      <section id="section-9" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">9. Children&apos;s Privacy (Strict 18+ Requirement)</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          FreelanceXchain is strictly intended for individuals who are at least 18 years old (or the legal age of majority in their jurisdiction) and have legal capacity to enter into binding financial contracts. We do not knowingly solicit or collect data from children under the age of 18 pursuant to COPPA and GDPR Article 8. Accounts found to belong to minors will be terminated immediately.
        </p>
      </section>

      <section id="section-10" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">10. Contact Information & Data Protection Officer</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you have questions, complaints, or inquiries regarding our data protection practices, you may contact our dedicated Data Protection Officer (DPO):
        </p>
        <div className="p-5 rounded-2xl bg-muted/60 border border-border/80 text-xs sm:text-sm space-y-1 text-foreground">
          <p className="font-bold">FreelanceXchain Protocol</p>
          <p className="text-muted-foreground">Privacy & Data Protection Desk</p>
          <p className="text-muted-foreground">Global Operations (Remote-First Decentralized Platform)</p>
          <p className="text-muted-foreground">Privacy Inquiries: <a href="mailto:privacy@freelancexchain.com" className="text-primary font-medium hover:underline">privacy@freelancexchain.com</a></p>
          <p className="text-muted-foreground">Legal Department: <a href="mailto:legal@freelancexchain.com" className="text-primary font-medium hover:underline">legal@freelancexchain.com</a></p>
        </div>
      </section>
    </InfoPage>
  );
}
