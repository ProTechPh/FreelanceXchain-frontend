"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  Brain,
  Lightning,
  Kanban,
  ShieldCheck,
  Sparkle,
  CheckCircle,
  FileText,
  PaperPlaneTilt,
  Coins,
  TrendUp,
  GlobeHemisphereWest,
} from "@phosphor-icons/react";

export function WhySection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="py-20 sm:py-28 bg-background border-b border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Sparkle className="size-3.5 fill-primary" weight="fill" />
            <span>Decentralized Freelance Engine</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            Built for real results: <br />
            <span className="text-primary font-bold">
              Everything freelancing should’ve been.
            </span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            A high-trust marketplace combining AI skill discovery, tailored milestone proposals, and Ethereum smart contract escrow.
          </p>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: AI Tailored Proposals & Scopes (Large 2-col) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-2 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-7 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Brain className="size-5" weight="fill" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    AI-Powered Discovery
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    AI Skill Matching & Tailored Proposals
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                FreelanceXchain analyzes project specifications and matches your verified skills, creating targeted milestone proposals with custom deliverables and timeline estimates.
              </p>
            </div>

            {/* Visual preview box */}
            <div className="rounded-xl border border-border bg-background p-4 space-y-3 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  <Sparkle className="size-3.5 text-primary" weight="fill" />
                  Tailored Proposal Scope
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 font-bold">
                  Skill Match: 99%
                </span>
              </div>
              <p className="text-muted-foreground font-sans text-xs leading-relaxed">
                &ldquo;Milestone 1: Scaffold smart contract escrow protocol with audited OpenZeppelin primitives. Milestone 2: Frontend workspace integration with real-time milestone release triggers...&rdquo;
              </p>
              <div className="flex items-center gap-2 pt-1 font-sans text-[11px] text-muted-foreground">
                <CheckCircle className="size-4 text-emerald-500 shrink-0" weight="fill" />
                <span>Verified Match: Solidity, Next.js 15, Smart Escrow, TypeScript</span>
              </div>
            </div>
          </motion.div>

          {/* Bento Card 2: 1-Click Proposal Submission (1-col) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-1 rounded-2xl border border-border/80 bg-card p-7 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <PaperPlaneTilt className="size-5" weight="fill" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Instant Submissions
              </span>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5 mb-2">
                1-Click Proposal Pitch
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Connect your profile and portfolio once. Review AI-optimized milestone bids and submit directly to verified employers in seconds.
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2 shadow-sm">
                <Lightning className="size-5" weight="fill" />
              </div>
              <p className="text-xs font-bold text-foreground">3.2 Seconds Average</p>
              <p className="text-[11px] text-muted-foreground">From review to proposal submission</p>
            </div>
          </motion.div>

          {/* Bento Card 3: Milestone Contract Tracking (1-col) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-1 rounded-2xl border border-border/80 bg-card p-7 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Kanban className="size-5" weight="fill" />
              </div>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                Live Workspace
              </span>
              <h3 className="text-xl font-bold tracking-tight text-foreground mt-0.5 mb-2">
                Milestone Contract Workspaces
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Every project runs in a dedicated workspace. Track funded milestones, submit deliverables, request revisions, and chat in real-time.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border/50">
                <span className="font-semibold text-foreground">Active Workspaces (4)</span>
                <span className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                <span className="font-bold">Escrow Funded ($14,500)</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
            </div>
          </motion.div>

          {/* Bento Card 4: Smart Escrow & Security (Large 2-col) */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-2 rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-muted/30 p-7 flex flex-col justify-between shadow-xs hover:border-primary/40 transition-colors"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" weight="fill" />
                </div>
                <div>
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Guaranteed Protection
                  </span>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    Smart Contract Escrow & On-Chain Reputation
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Never chase an invoice or risk unpaid work. Milestone payments are locked upfront in audited smart contracts and released automatically upon your deliverable approval.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border/80">
                <p className="font-bold text-foreground">100% Escrow</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Funds locked upfront</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/80">
                <p className="font-bold text-foreground">On-Chain Reputation</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Portable across Web3</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/80">
                <p className="font-bold text-foreground">Global Didit KYC</p>
                <p className="text-muted-foreground text-[11px] mt-0.5">Verified across 220+ countries</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
