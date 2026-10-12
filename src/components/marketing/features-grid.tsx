import {
  EscrowVaultIcon,
  MilestoneScopeIcon,
  InstantSettlementIcon,
  IdentityVerificationIcon,
  ContractWorkspaceIcon,
  OnChainReputationIcon,
} from "@/components/ui/brand-icons";

const capabilities = [
  {
    category: "Scoping & Bidding",
    title: "Structured Milestone Scopes",
    description: "Converts requirements into unambiguous deliverable checkpoints with pre-set acceptance criteria.",
    Icon: MilestoneScopeIcon,
  },
  {
    category: "Escrow Protocol",
    title: "Non-Custodial Smart Escrow",
    description: "Milestone funds lock directly in audited EVM smart contracts. Neither party can seize funds unilaterally.",
    Icon: EscrowVaultIcon,
  },
  {
    category: "Settlement",
    title: "Instant Wallet Settlement",
    description: "Funds transfer directly to your Web3 wallet in USDC or ETH upon deliverable sign-off. No withdrawal waiting periods.",
    Icon: InstantSettlementIcon,
  },
  {
    category: "Identity",
    title: "Didit Biometric & ID Verification",
    description: "Verifies client and freelancer identity across 220+ countries to block sybil spammers and fraudulent accounts.",
    Icon: IdentityVerificationIcon,
  },
  {
    category: "Collaboration",
    title: "Dedicated Workspaces",
    description: "Keep file uploads, change requests, live chat, and contract milestone statuses unified under a single link.",
    Icon: ContractWorkspaceIcon,
  },
  {
    category: "Reputation",
    title: "Portable Proof of Delivery",
    description: "Completed contracts and client ratings anchor permanently on-chain so your reputation belongs to your wallet.",
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
            Every transaction is backed by code, clear deliverable criteria, and verified identities.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {capabilities.map((item) => {
            const Icon = item.Icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-border/80 bg-card p-6 shadow-xs hover:border-primary/40 transition-colors flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xs font-semibold text-primary uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={18} />
                    </span>
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
