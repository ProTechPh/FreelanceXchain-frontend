import {
  EscrowVaultIcon,
  MilestoneScopeIcon,
  InstantSettlementIcon,
  IdentityVerificationIcon,
  ContractWorkspaceIcon,
  OnChainReputationIcon,
  VerifiedCheckIcon,
} from "@/components/ui/brand-icons";

interface FeatureDetail {
  category: string;
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  detail?: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
}

const supportingCapabilities: FeatureDetail[] = [
  {
    category: "Scoping & Bidding",
    title: "Structured Milestone Scopes",
    description: "Converts client briefs into deliverable checkpoints with binary acceptance criteria. Prevents endless revisions.",
    detail: "Defined milestones, measurable acceptance tests, and mutual sign-off before any code or design work starts.",
    Icon: MilestoneScopeIcon,
  },
  {
    category: "Settlement",
    title: "Instant Wallet Settlement",
    description: "Milestone approval releases USDC or ETH straight to your Web3 wallet within seconds. No 14-day clearance hold.",
    detail: "Direct ERC-20 transfer upon client cryptographic signature. Zero platform holdback or wire delay.",
    Icon: InstantSettlementIcon,
  },
  {
    category: "Identity & Verification",
    title: "Didit Biometric & ID Verification",
    description: "Verified human identity across 220+ countries. Sybil-resistant screening keeps bot rings and spoof profiles out.",
    detail: "Government ID validation and face match proof tied to wallet addresses without exposing private documents.",
    Icon: IdentityVerificationIcon,
  },
  {
    category: "Workspaces",
    title: "Dedicated Contract Workspaces",
    description: "File drops, review diffs, milestone check-ins, and mutual sign-offs live under a single tamper-evident contract URL.",
    detail: "Consolidated audit trail covering every message, revision request, and timestamped delivery packet.",
    Icon: ContractWorkspaceIcon,
  },
  {
    category: "Reputation",
    title: "Portable Proof of Delivery",
    description: "Finished milestones and client feedback anchor to your public wallet address. Your track record belongs to you.",
    detail: "Decentralized verifiable credentials that work across any Web3 ecosystem or client verification check.",
    Icon: OnChainReputationIcon,
  },
];

export function FeaturesGrid() {
  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Contract Infrastructure
          </p>
          <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight leading-tight text-foreground break-words">
            Designed for execution, not invoice disputes.
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
            Every transaction is backed by audited code, pre-funded escrow locks, and verified identities.
          </p>
        </div>

        {/* Asymmetrical Layout: Lead with the single strongest pillar supported by real data, then 5 supporting capabilities */}
        <div className="space-y-6">
          {/* Primary Anchor Card: Non-Custodial Smart Escrow */}
          <div className="rounded-2xl border border-primary/30 bg-card p-6 sm:p-8 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    <EscrowVaultIcon size={14} />
                    Primary Protocol Guarantee
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success-subtle text-success text-2xs font-bold border border-success-border">
                    <VerifiedCheckIcon size={12} />
                    Audited Smart Contract
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                  Non-Custodial Smart Escrow: Zero Unpaid Deliverables
                </h3>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  Traditional platforms hold your payouts in centralized accounts for 14 to 21 days, reserving the right to freeze funds on arbitrary disputes. FreelanceXchain locks client milestone funds directly inside an audited EVM smart contract before work kicks off.
                </p>

                <p className="text-xs text-foreground-subtle leading-relaxed font-medium">
                  Neither the client nor the platform can withdraw funds unilaterally once delivery begins. Milestone approval triggers instant, deterministic release directly to your self-custody wallet.
                </p>

                <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-mono">
                  <div className="rounded-lg bg-muted/60 border border-border px-3 py-2">
                    <span className="text-muted-foreground block text-2xs font-sans">Settlement Speed</span>
                    <span className="text-foreground font-bold">&lt; 15 seconds</span>
                  </div>
                  <div className="rounded-lg bg-muted/60 border border-border px-3 py-2">
                    <span className="text-muted-foreground block text-2xs font-sans">Protocol Take Rate</span>
                    <span className="text-primary font-bold">1.0% Flat</span>
                  </div>
                  <div className="rounded-lg bg-muted/60 border border-border px-3 py-2">
                    <span className="text-muted-foreground block text-2xs font-sans">Escrow Custody</span>
                    <span className="text-success font-bold">100% Non-Custodial</span>
                  </div>
                </div>
              </div>

              {/* Concrete Detail Box: On-chain Escrow State Quote & Architecture Breakdown */}
              <div className="lg:col-span-5 rounded-xl border border-border bg-muted/30 p-5 space-y-3.5 font-sans text-xs">
                <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                  <span className="font-semibold text-foreground">Live Escrow State Breakdown</span>
                  <span className="font-mono text-2xs px-2 py-0.5 rounded bg-success-subtle text-success font-bold">
                    ACTIVE ESCROW
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2 text-2xs">
                    <span className="text-muted-foreground font-mono">Contract Logic:</span>
                    <span className="font-mono text-foreground text-right font-medium">FreelanceEscrowEngineV2.sol</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-2xs">
                    <span className="text-muted-foreground font-mono">Milestone Hold:</span>
                    <span className="font-mono text-foreground text-right font-medium">Locked in Contract Vault</span>
                  </div>
                  <div className="flex items-start justify-between gap-2 text-2xs">
                    <span className="text-muted-foreground font-mono">Arbitration Window:</span>
                    <span className="font-mono text-foreground text-right font-medium">24h Mutually Agreed Timelock</span>
                  </div>
                </div>

                <div className="rounded-lg border border-border/60 bg-card p-3 space-y-1.5">
                  <p className="text-2xs text-muted-foreground font-medium uppercase tracking-wide">
                    Engineer Testimonial
                  </p>
                  <blockquote className="text-xs text-foreground italic leading-relaxed">
                    &ldquo;On standard platforms I waited two weeks after milestone sign-off to withdraw funds, losing 20% along the way. With FreelanceXchain, USDC arrives in my wallet thirty seconds after approval.&rdquo;
                  </blockquote>
                  <p className="text-2xs text-muted-foreground font-medium text-right pt-0.5">
                    — Senior Solidity Auditor (42 completed milestones)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Supporting 5 Capabilities in an Asymmetrical 2 + 3 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {supportingCapabilities.map((item, idx) => {
              const Icon = item.Icon;
              const isWide = idx === 0 || idx === 1;
              return (
                <div
                  key={item.title}
                  className={`rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between ${
                    isWide ? "lg:col-span-1" : "lg:col-span-1"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-2xs font-semibold text-primary uppercase tracking-wider">
                        {item.category}
                      </span>
                      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon size={18} />
                      </span>
                    </div>

                    <h4 className="text-base font-semibold tracking-tight text-foreground">
                      {item.title}
                    </h4>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 text-2xs text-foreground-subtle">
                    {item.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
