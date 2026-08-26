import {
  CircleCheck,
  Coins,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { FreelanceXchainIcon } from "@/components/ui/freelancexchain-logo";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";

const dealActivity = [
  {
    icon: Sparkles,
    title: "Matched at 99%",
    detail: "Skills and scope verified",
  },
  {
    icon: ShieldCheck,
    title: "Escrow funded",
    detail: "$4,500 USDC secured",
  },
  {
    icon: Coins,
    title: "Milestone paid",
    detail: "$1,500 released instantly",
  },
];

export function MobileEscrowPreview() {
  return (
    <div
      role="region"
      aria-label="Mobile escrow workflow preview"
      className="relative mt-10 overflow-hidden rounded-2xl border border-border-strong bg-card text-left shadow-xl md:hidden"
    >
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-24 bg-primary-subtle" />

      <div className="relative flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <FreelanceXchainIcon size={26} />
          <div>
            <p className="text-xs font-bold text-foreground">Live contract</p>
            <p className="text-2xs text-muted-foreground">Protected from brief to payout</p>
          </div>
        </div>
        <StatusBadge status="active" domain="contract" label="Protected" showDot size="sm" />
      </div>

      <div className="relative p-4">
        <div className="rounded-xl border border-primary/20 bg-background/90 p-4 shadow-xs backdrop-blur-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">Ethereum Ecosystem</p>
              <p className="mt-1 text-sm font-extrabold tracking-tight text-foreground">
                DeFi protocol full-stack dApp
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-2xs font-medium text-muted-foreground">Contract value</p>
              <p className="text-sm font-extrabold tabular-nums text-foreground">$4,500</p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">Milestone 1 of 3 paid</span>
            <span className="font-bold tabular-nums text-success">33%</span>
          </div>
          <Progress
            value={33}
            label="One of three milestones paid"
            tone="success"
            size="sm"
            className="mt-2"
          />
        </div>

        <ol className="mt-4 grid gap-2" aria-label="Contract activity">
          {dealActivity.map((item) => {
            const Icon = item.icon;

            return (
              <li
                key={item.title}
                className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs font-bold text-foreground">{item.title}</span>
                  <span className="block text-2xs text-muted-foreground">{item.detail}</span>
                </span>
                <CircleCheck className="size-4 shrink-0 text-success" aria-hidden="true" />
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
