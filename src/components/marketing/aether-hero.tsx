"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { FreelanceXchainIcon } from "@/components/ui/freelancexchain-logo";
import { MobileEscrowPreview } from "@/components/marketing/mobile-escrow-preview";
import { ArrowRight, Sparkles as Sparkle, CircleCheck as CheckCircle, ShieldCheck, Briefcase, Menu as List, Settings as Gear, CircleQuestionMark as Question, Search as MagnifyingGlass, Check, Coins, TrendingUp as TrendUp, FileCode } from 'lucide-react';
import { useAuthStore } from "@/stores/authStore";

const trustBadges = [
  { text: "100% Smart Contract Escrow" },
  { text: "AI Skill & Proposal Matching" },
  { text: "Portable On-Chain Reputation" },
];

const mockContracts = [
  {
    id: 1,
    role: "DeFi Protocol Full-Stack DApp",
    client: "Ethereum Ecosystem",
    location: "Remote • Worldwide",
    budget: "$4,500 USDC",
    stage: "Escrow Funded (Milestone 2/3)",
    stageColor: "bg-success-subtle text-success dark:text-success border-success-border",
    match: "99% Skill Match",
    skills: ["Solidity", "Next.js", "Foundry", "Smart Escrow"],
    notes: "Employer funded $4,500 into contract escrow. Milestone 1 deliverable verified and $1,500 auto-released to wallet.",
  },
  {
    id: 2,
    role: "AI Agent Workflow Pipeline",
    client: "Modern SaaS Scaleup",
    location: "Remote • Global",
    budget: "$3,200",
    stage: "Proposal Accepted",
    stageColor: "bg-info-subtle text-info dark:text-info border-info-border",
    match: "98% Skill Match",
    skills: ["Python", "FastAPI", "Vector DB", "LLM Agents"],
    notes: "Proposal tailored by AI assistant matched client requirements perfectly. Contract workspace created and awaiting escrow deposit.",
  },
  {
    id: 3,
    role: "Smart Contract Audit & Formal Verification",
    client: "Polygon Validator Protocol",
    location: "Remote • US / EU",
    budget: "$6,000",
    stage: "Milestone Paid 🎉",
    stageColor: "bg-info-subtle text-info dark:text-info border-info-border",
    match: "99% Skill Match",
    skills: ["EVM Internals", "Security Audit", "Slither", "Formal Proofs"],
    notes: "Deliverable approved by employer. Funds released instantly on-chain and verified reputation score updated to 99.8%.",
  },
  {
    id: 4,
    role: "Design System & Web3 Component Suite",
    client: "Supabase Partner",
    location: "Remote • Global",
    budget: "$2,800",
    stage: "In Progress",
    stageColor: "bg-warning-subtle text-warning dark:text-warning border-warning-border",
    match: "96% Skill Match",
    skills: ["Figma", "Tailwind CSS", "React 19", "UX Tokens"],
    notes: "Milestone 1 submitted for client review. Milestone 2 escrow active.",
  },
];

export default function AetherHero() {
  const reduce = useReducedMotion();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [selectedContract, setSelectedContract] = useState(mockContracts[0]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && isAuthenticated && !!user;
  const primaryHref = isLoggedIn ? `/dashboard/${user.role || 'freelancer'}` : '/register';
  const primaryText = isLoggedIn ? 'Go to Dashboard' : 'Get Started Free';

  const filteredContracts =
    selectedFilter === "All"
      ? mockContracts
      : mockContracts.filter((c) =>
          selectedFilter === "Escrow Funded"
            ? c.stage.includes("Escrow Funded")
            : selectedFilter === "Milestones"
            ? c.stage.includes("Milestone")
            : c.stage.includes(selectedFilter)
        );

  return (
    <section
      aria-label="Freelance marketplace introduction"
      className="relative overflow-hidden border-b border-border/40 bg-background pt-32 pb-16 lg:pt-40 lg:pb-24"
    >
      {/* Soft background glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-6xl px-4 sm:px-4 sm:px-6 lg:px-8">
        {/* Centered Hero Header */}
        <div className="text-center max-w-3xl mx-auto">
          {/* Announcement pill */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-card border border-border/80 text-xs font-semibold text-foreground mb-6 shadow-xs hover:border-primary/40 transition-colors"
          >
            <Sparkle className="size-3.5 text-primary fill-primary" fill="currentColor" />
            <span>AI Skill Matching &amp; Smart Contract Escrow</span>
            <ArrowRight className="size-3 text-muted-foreground" strokeWidth={2.5} />
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.12] sm:leading-[1.08] break-words"
          >
            Decentralize Your Freelance Career
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.16 }}
            className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto font-normal break-words"
          >
            Discover verified client projects, generate tailored proposals with AI, and get guaranteed milestone payouts locked in smart contract escrow.
          </motion.p>

          {/* Dual Action Buttons */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.24 }}
            className="mt-8 flex flex-wrap justify-center items-center gap-3.5"
          >
            <Link
              href={primaryHref}
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md transition-all duration-150 hover:bg-primary-hover hover:shadow-lg active:scale-[0.98]"
            >
              <span>{primaryText}</span>
              <ArrowRight
                className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-border/80 bg-card text-foreground font-semibold text-sm transition-all duration-150 hover:bg-muted/70 hover:border-border active:scale-[0.98]"
            >
              <Briefcase className="size-4 text-muted-foreground" fill="currentColor" />
              <span>Browse Projects</span>
            </Link>
            <Link
              href="/freelancers"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full border border-border/80 bg-card text-foreground font-semibold text-sm transition-all duration-150 hover:bg-muted/70 hover:border-border active:scale-[0.98]"
            >
              <span>Find Talent</span>
            </Link>
          </motion.div>

          {/* 3-item Trust list */}
          <motion.div
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.32 }}
            className="mt-8 flex flex-wrap justify-center items-center gap-6 sm:gap-8 text-xs sm:text-sm text-muted-foreground"
          >
            {trustBadges.map((badge) => (
              <div key={badge.text} className="flex items-center gap-2">
                <Check className="size-4 text-primary dark:text-success shrink-0" strokeWidth={2.5} />
                <span className="font-medium text-foreground">{badge.text}</span>
              </div>
            ))}
          </motion.div>
        </div>

        <MobileEscrowPreview />

        {/* FreelanceXchain Desktop Contract Workspace Mockup */}
        <motion.div
          role="region"
          aria-label="Interactive contract workspace preview"
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto mt-14 hidden max-w-5xl md:block"
        >
          {/* Floating Escrow Funded Badge Top-Right */}
          <motion.div
            animate={reduce ? undefined : { y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
            className="hidden sm:flex absolute -top-5 -right-3 z-20 items-center gap-3 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-success-subtle text-success flex items-center justify-center shrink-0">
              <ShieldCheck className="size-4" fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Smart Escrow Funded 🔒</p>
              <p className="text-2xs text-muted-foreground">$4,500 USDC locked upfront</p>
            </div>
          </motion.div>

          {/* Floating Milestone Approved Badge Bottom-Left */}
          <motion.div
            animate={reduce ? undefined : { y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 1 }}
            className="hidden sm:flex absolute -bottom-5 -left-3 z-20 items-center gap-3 px-4 py-2.5 rounded-2xl bg-card border border-border shadow-xl backdrop-blur-md"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Coins className="size-4" fill="currentColor" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Milestone Payout Released</p>
              <p className="text-2xs text-muted-foreground">$1,500 transferred to wallet instantly</p>
            </div>
          </motion.div>

          {/* Desktop App Window Container */}
          <div className="rounded-2xl border border-border/80 bg-card shadow-2xl overflow-hidden grid grid-cols-12 min-h-[460px]">
            {/* Left Sidebar */}
            <div className="col-span-12 md:col-span-3 border-b md:border-b-0 md:border-r border-border/60 bg-muted/25 p-4 flex flex-col justify-between">
              <div>
                {/* Brand Header in sidebar */}
                <div className="flex items-center gap-2 mb-6 px-2">
                  <div className="flex items-center justify-center shrink-0">
                    <FreelanceXchainIcon size={24} />
                  </div>
                  <span className="font-extrabold text-sm text-foreground tracking-tight flex items-center">
                    Freelance<span className="px-0.5 font-black text-primary">X</span>chain
                  </span>
                </div>

                {/* Sidebar Search */}
                <div className="relative mb-4">
                  <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Search projects..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-background border border-border text-xs text-muted-foreground focus:outline-none"
                  />
                </div>

                {/* Nav Items */}
                <div className="space-y-1 text-xs font-semibold">
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 text-primary">
                    <div className="flex items-center gap-2">
                      <Briefcase className="size-4" fill="currentColor" />
                      <span>Projects Feed</span>
                    </div>
                    <span className="text-2xs px-1.5 py-0.2 rounded-full bg-primary/15 font-bold">Live</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <FileCode className="size-4" strokeWidth={2.5} />
                      <span>Active Contracts</span>
                    </div>
                    <span className="text-2xs font-bold text-foreground">4</span>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <List className="size-4" strokeWidth={2.5} />
                      <span>Proposals</span>
                    </div>
                    <span className="text-2xs font-bold text-foreground">12</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted/50 cursor-pointer">
                    <TrendUp className="size-4" strokeWidth={2.5} />
                    <span>On-Chain Reputation</span>
                  </div>
                </div>
              </div>

              {/* Bottom Profile Widget */}
              <div className="pt-4 border-t border-border/50">
                <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-muted/50">
                  <div className="w-7 h-7 rounded-full bg-success-subtle text-success dark:text-success font-bold text-xs flex items-center justify-center">
                    0x
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <p className="text-xs font-bold text-foreground truncate">Alex Mercer</p>
                      <CheckCircle className="size-3 text-success" fill="currentColor" />
                    </div>
                    <p className="text-2xs text-muted-foreground font-mono truncate">0x71C...39A2 • KYC Verified</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 mt-2 px-2 text-2xs text-muted-foreground font-medium">
                  <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                    <Gear className="size-3" /> Settings
                  </span>
                  <span className="flex items-center gap-1 hover:text-foreground cursor-pointer">
                    <Question className="size-3" /> Help
                  </span>
                </div>
              </div>
            </div>

            {/* Main Area: Contract Workspace Feed */}
            <div className="col-span-12 md:col-span-9 p-6 flex flex-col justify-between bg-gradient-to-b from-background to-muted/10">
              <div>
                {/* Header bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border/50">
                  <div>
                    <p className="text-base font-bold text-foreground">Contracts &amp; Projects Workspace</p>
                    <p className="text-xs text-muted-foreground">Milestone-based smart contract escrow with automatic releases</p>
                  </div>

                  {/* Filter tabs */}
                  <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-muted/60 border border-border text-xs font-semibold">
                    {["All", "Escrow Funded", "Milestones", "Proposals"].map((f) => (
                      <button
                        key={f}
                        onClick={() => setSelectedFilter(f)}
                        className={`px-2.5 sm:px-3 py-1 rounded-lg text-2xs sm:text-xs transition-all ${
                          selectedFilter === f
                            ? "bg-background text-foreground shadow-xs font-bold"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contracts list */}
                <div className="mt-4 space-y-2.5">
                  {filteredContracts.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => setSelectedContract(c)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        selectedContract.id === c.id
                          ? "bg-primary/5 border-primary/40 shadow-xs"
                          : "bg-card border-border/70 hover:border-border hover:bg-muted/30"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center font-bold text-xs text-foreground shrink-0 border border-border/60">
                          {c.client[0]}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="text-xs font-bold text-foreground break-words">{c.role}</span>
                            <span className="text-xs text-muted-foreground truncate">• {c.client}</span>
                          </div>
                          <div className="flex items-center gap-2 text-2xs text-muted-foreground mt-0.5">
                            <span className="truncate">{c.location}</span>
                            <span>•</span>
                            <span className="font-bold text-foreground shrink-0">{c.budget}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0">
                        <span className="text-2xs font-bold text-success dark:text-success">
                          {c.match}
                        </span>
                        <span className={`text-2xs font-bold px-2.5 py-0.5 rounded-full border ${c.stageColor}`}>
                          {c.stage}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Live Contract Inspector Note */}
              <div className="mt-4 p-3 rounded-xl bg-background border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-start sm:items-center gap-2 text-muted-foreground min-w-0 flex-1">
                  <ShieldCheck className="size-4 text-success shrink-0 mt-0.5 sm:mt-0" fill="currentColor" />
                  <span className="line-clamp-2 sm:truncate break-words">
                    <strong className="text-foreground">{selectedContract.client}:</strong> {selectedContract.notes}
                  </span>
                </div>
                <span className="self-start sm:self-auto shrink-0 text-2xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10">
                  Escrow Verified
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
