"use client";

import { motion, useReducedMotion } from "motion/react";
import { Brain, Zap as Lightning, Kanban, ShieldCheck, Sparkles as Sparkle, CircleCheck as CheckCircle, Send as PaperPlaneTilt } from 'lucide-react';

export function WhySection() {
  const reduce = useReducedMotion();

  return (
    <section id="features" className="py-20 sm:py-28 bg-background border-b border-border/40 scroll-mt-[5.5rem]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Protocol Architecture
          </p>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight leading-tight text-foreground break-words">
            How work gets agreed, locked, and settled.
          </h2>
          <p className="mt-3 sm:mt-4 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed break-words">
            Clear acceptance criteria upfront. Escrow funded before execution starts. Instant release upon client approval.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Bento Card 1: Milestone Scoping (Large 2-col) */}
          <div className="md:col-span-2 rounded-2xl border border-border/80 bg-card p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Brain className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Milestone Scoping
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Structured Deliverables &amp; Acceptance Criteria
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Parse client specifications into clear milestone tranches with defined criteria and timeline bounds so both parties agree before contracts are signed.
              </p>
            </div>

            {/* Visual preview box */}
            <div className="rounded-xl border border-border bg-background p-4 space-y-3 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-border/60 pb-2 text-2xs text-muted-foreground font-sans">
                <span className="flex items-center gap-1.5 text-foreground font-semibold">
                  Sample Milestone Breakdown
                </span>
                <span className="px-2 py-0.5 rounded-full bg-success-subtle text-success font-semibold">
                  Funded Escrow: 4,000 USDC
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-sans text-muted-foreground">
                <p className="text-foreground font-medium">Milestone 1: Smart contract escrow deployment on Arbitrum</p>
                <p className="text-2xs text-muted-foreground">Deliverable: Verified source code on Arbiscan &bull; Passing test suite (98% coverage)</p>
              </div>
              <div className="flex items-center gap-2 pt-1 font-sans text-2xs text-muted-foreground">
                <CheckCircle className="size-4 text-success shrink-0" />
                <span>Verified Match: Solidity, Hardhat, OpenZeppelin Escrow</span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: 1-Click Proposal Submission (1-col) */}
          <div className="md:col-span-1 rounded-2xl border border-border/80 bg-card p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <PaperPlaneTilt className="size-5" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Instant Bidding
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground mt-0.5 mb-2">
                Fast Milestone Proposals
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Review suggested milestone breakdown, adjust hours and deliverable scope, and submit directly to the client without redundant paperwork.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/40 p-4 text-center">
              <div className="w-10 h-10 mx-auto rounded-full bg-primary text-primary-foreground flex items-center justify-center mb-2 shadow-xs">
                <Lightning className="size-5" />
              </div>
              <p className="text-xs font-semibold text-foreground">Zero Manual Paperwork</p>
              <p className="text-2xs text-muted-foreground">Direct wallet-to-contract workflow</p>
            </div>
          </div>

          {/* Bento Card 3: Milestone Contract Tracking (1-col) */}
          <div className="md:col-span-1 rounded-2xl border border-border/80 bg-card p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4">
                <Kanban className="size-5" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Live Collaboration
              </span>
              <h3 className="text-xl font-semibold tracking-tight text-foreground mt-0.5 mb-2">
                Contract Workspaces
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Every project has a dedicated workspace to submit deliverables, review diffs, approve milestone release, or open dispute arbitration.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/60 border border-border/50">
                <span className="font-semibold text-foreground">Active Milestones</span>
                <span className="text-2xs font-semibold text-foreground-subtle">2 In Progress</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-success-subtle border border-success-border text-success dark:text-success">
                <span className="font-bold">Locked in Escrow</span>
                <span className="font-mono text-2xs font-semibold">14,500 USDC</span>
              </div>
            </div>
          </div>

          {/* Bento Card 4: Smart Escrow & Security (Large 2-col) */}
          <div className="md:col-span-2 rounded-2xl border border-border/80 bg-card p-7 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Non-Custodial Guarantee
                  </span>
                  <h3 className="text-xl font-semibold tracking-tight text-foreground">
                    Smart Contract Escrow &amp; Verifiable Track Record
                  </h3>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Funds lock into audited smart contracts before work begins. Upon deliverable sign-off, the smart contract settles payment immediately to your wallet with no 14-day clearance lag.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-background border border-border/80">
                <p className="font-semibold text-foreground">Non-Custodial Escrow</p>
                <p className="text-muted-foreground text-2xs mt-0.5">Funds locked in contract upfront</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/80">
                <p className="font-semibold text-foreground">On-Chain Reputation</p>
                <p className="text-muted-foreground text-2xs mt-0.5">Verifiable on-chain work history</p>
              </div>
              <div className="p-3 rounded-xl bg-background border border-border/80">
                <p className="font-semibold text-foreground">Didit KYC Verification</p>
                <p className="text-muted-foreground text-2xs mt-0.5">Verified across 220+ countries</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
