"use client";

import { Check } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { DesktopContractWorkspace } from "@/components/marketing/desktop-contract-workspace";
import { HeroActions } from "@/components/marketing/hero-actions";
import { MobileEscrowPreview } from "@/components/marketing/mobile-escrow-preview";

const trustBadges = [
  "Smart contract escrow",
  "Portable on-chain reputation",
];

export default function AetherHero() {
  const reduce = useReducedMotion();

  return (
    <section
      aria-label="Freelance marketplace introduction"
      className="relative overflow-hidden border-b border-border/40 bg-background pb-16 pt-32 lg:pb-24 lg:pt-40"
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[350px] w-[700px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1 text-xs font-medium text-foreground-subtle shadow-xs">
            <span className="size-2 rounded-full bg-success inline-block" aria-hidden="true" />
            <span>On-Chain Escrow &bull; USDC &amp; Native Assets &bull; Direct Settlement</span>
          </div>

          <h1 className="break-words text-3xl font-semibold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.08] lg:text-6xl text-foreground">
            Freelance contracts settled on-chain. Zero payment chase.
          </h1>

          <p className="mx-auto mt-4 max-w-xl break-words text-sm font-normal leading-relaxed text-muted-foreground sm:mt-5 sm:text-base lg:text-lg">
            Clients deposit funds into smart contract escrow before work begins. When milestones pass review, payment releases directly to your wallet in seconds.
          </p>

          <div className="mt-2">
            <HeroActions />
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:gap-8 sm:text-sm">
            {trustBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-primary dark:text-success" strokeWidth={2.5} aria-hidden="true" />
                <span className="font-medium text-foreground">{badge}</span>
              </div>
            ))}
          </div>
        </div>

        <MobileEscrowPreview />

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
        >
          <DesktopContractWorkspace />
        </motion.div>
      </div>
    </section>
  );
}
