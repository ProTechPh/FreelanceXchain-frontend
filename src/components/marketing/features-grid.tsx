"use client";

import { motion, useReducedMotion } from "motion/react";
import { ShieldCheck, RefreshCw as ArrowsClockwise, LayoutGrid as SquaresFour, FileText, Sparkles as Sparkle, ChartBar, Zap as Lightning, Smartphone as DeviceMobile } from 'lucide-react';

const features = [
  {
    icon: FileText,
    title: "AI Proposal Assistant",
    description: "Generates custom proposals, milestone deliverables, and estimated scopes tailored to client specifications.",
  },
  {
    icon: Sparkle,
    title: "AI Skill Gap Analysis",
    description: "Analyzes required project skills against your verified portfolio to maximize win rates.",
  },
  {
    icon: Lightning,
    title: "1-Click Milestone Bidding",
    description: "Submit tailored proposals to open projects in seconds without repetitive forms.",
  },
  {
    icon: SquaresFour,
    title: "Contract Workspaces",
    description: "Manage milestones, deliverable uploads, revision requests, and payouts in dedicated workspaces.",
  },
  {
    icon: ShieldCheck,
    title: "Smart Contract Escrow",
    description: "Milestone funds are locked in Ethereum smart contracts and released automatically on approval.",
  },
  {
    icon: ArrowsClockwise,
    title: "Real-Time Direct Chat",
    description: "Message verified employers and freelancers instantly with real-time WebSocket sync.",
  },
  {
    icon: ChartBar,
    title: "On-Chain Reputation",
    description: "Immutable ratings and verified work history recorded permanently on the blockchain.",
  },
  {
    icon: DeviceMobile,
    title: "Global Didit KYC",
    description: "Biometric and government ID verification across 220+ countries for trusted collaboration.",
  },
];

export function FeaturesGrid() {
  const reduce = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-b border-border/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-14"
        >
          <p className="text-xs font-bold text-primary uppercase tracking-wider mb-2">
            Powerful Platform Architecture
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-foreground break-words">
            The freelance engine built for trust
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
            Everything you need to discover high-value projects, submit winning proposals, and get paid with zero escrow risk.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.35,
                  delay: i * 0.04,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="rounded-2xl border border-border/80 bg-card p-5 transition-all duration-150 hover:border-primary/40 hover:bg-muted/40 shadow-xs"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                  <Icon className="size-5" fill="currentColor" />
                </div>
                <h3 className="text-sm font-bold tracking-tight text-foreground mb-1.5">
                  {feature.title}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
