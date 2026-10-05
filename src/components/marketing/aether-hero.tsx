"use client";

import { Check, Sparkles } from "lucide-react";
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
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-semibold text-foreground shadow-xs hover:border-primary/40 transition-colors"
          >
            <Sparkles className="size-3.5 fill-primary text-primary" aria-hidden="true" />
            <span>AI Skill Matching &amp; Smart Contract Escrow</span>
          </motion.div>

          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="break-words text-3xl font-extrabold leading-[1.12] tracking-tight sm:text-5xl sm:leading-[1.08] lg:text-6xl"
          >
            Decentralize Your Freelance Career
          </motion.h1>

          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mx-auto mt-4 max-w-xl break-words text-sm font-normal leading-relaxed text-muted-foreground sm:mt-5 sm:text-base lg:text-lg"
          >
            Discover verified client projects, generate tailored proposals with AI, and get guaranteed milestone payouts locked in smart contract escrow.
          </motion.p>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
          >
            <HeroActions />
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground sm:gap-8 sm:text-sm"
          >
            {trustBadges.map((badge) => (
              <div key={badge} className="flex items-center gap-2">
                <Check className="size-4 shrink-0 text-primary dark:text-success" strokeWidth={2.5} aria-hidden="true" />
                <span className="font-medium text-foreground">{badge}</span>
              </div>
            ))}
          </motion.div>
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
