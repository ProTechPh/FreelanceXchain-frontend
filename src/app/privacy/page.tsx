import { InfoPage } from "@/components/public/info-page";

export const metadata = {
  title: "Privacy Policy | FreelanceXchain",
  description: "How FreelanceXchain manages data, Didit KYC verification, on-chain public records, and privacy protections.",
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy Policy"
      badge="Data & Privacy Standards"
      intro="Our transparent policies on how FreelanceXchain handles personal data, biometric KYC verification, and public blockchain transactions. Last updated August 2026."
    >
      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Jump to section">
        {['What Information We Process', 'How We Use Your Information', 'Public Blockchain Records', 'Data Security & Storage', 'Your Privacy Rights'].map((label, i) => (
          <a key={i} href={`#section-${i + 1}`} className="px-3 py-1.5 rounded-full bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors">
            {label}
          </a>
        ))}
      </nav>

      <section id="section-1" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. What Information We Process</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We collect basic profile data (name, email, portfolio links, skill tags), project proposals, milestone deliverables, contract communications, wallet addresses, and Didit identity verification statuses (verifying government IDs across 220+ countries without storing unencrypted raw documents).
        </p>
      </section>

      <section id="section-2" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. How We Use Your Information</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Your information enables core platform functionality: running AI skill matching algorithms, calculating on-chain reputation scores, enforcing smart contract escrow releases, preventing fraudulent accounts, and providing live contract updates.
        </p>
      </section>

      <section id="section-3" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. Public Blockchain Records & Data Immutability</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Please note that transactions committed to the Ethereum or Polygon blockchain (such as smart contract escrow deposits, milestone payout hashes, and reputation ratings) are public, transparent, and cannot be modified or deleted by design.
        </p>
      </section>

      <section id="section-4" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. Data Security & Storage</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          All off-chain data (such as proposal drafts and private workspace chat) is encrypted in transit and at rest using modern encryption standards. We do not sell your personal data to third-party advertisers.
        </p>
      </section>

      <section id="section-5" className="scroll-mt-32 space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Your Privacy Rights & Controls</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You can update your profile information, manage communication preferences, and disconnect connected Web3 wallets at any time through your dashboard settings.
        </p>
      </section>
    </InfoPage>
  );
}
