"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/ui/navbar";
import { FooterSection } from "@/components/ui/footer-section";
import {
  Sparkle,
  CheckCircle,
  User,
  Briefcase,
  ShieldCheck,
  ArrowRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const TUTORIAL_TRACKS = [
  {
    id: "freelancers",
    label: "For Freelancers",
    icon: <User className="size-4" weight="bold" />,
    badge: "Getting Hired & Paid",
    description: "Master the complete freelancer lifecycle: profile setup, AI proposal bidding, milestone deliverables, and instant escrow payouts.",
    steps: [
      {
        step: "01",
        title: "Complete Your Profile & Didit KYC",
        description: "Add your verified skills, portfolio attachments, hourly rate, and complete quick identity verification to receive verified talent badges.",
        action: "Edit Profile",
        href: "/dashboard/freelancer/profile",
      },
      {
        step: "02",
        title: "Discover Projects with AI Skill Matching",
        description: "Browse curated project listings matching your exact verified stack. Use skill gap analysis to optimize your relevance scores.",
        action: "Browse Projects",
        href: "/projects",
      },
      {
        step: "03",
        title: "Submit 1-Click AI Proposals",
        description: "Generate tailored milestone proposals that break down deliverables, timeline scopes, and escrow amounts in seconds.",
        action: "View Proposals",
        href: "/dashboard/freelancer/proposals",
      },
      {
        step: "04",
        title: "Deliver Work in Contract Workspaces",
        description: "Collaborate in real-time with employers, upload deliverables for each milestone, and receive instant payouts released directly to your wallet.",
        action: "Active Contracts",
        href: "/dashboard/freelancer/contracts",
      },
    ],
  },
  {
    id: "employers",
    label: "For Employers",
    icon: <Briefcase className="size-4" weight="bold" />,
    badge: "Hiring & Escrow Management",
    description: "Post projects, review AI-ranked proposals, lock upfront funds in smart contract escrow, and approve milestone deliverables safely.",
    steps: [
      {
        step: "01",
        title: "Post a Scoped Milestone Project",
        description: "Specify your project requirements, required tech stack, estimated budget, and structured milestone deadlines.",
        action: "Post Project",
        href: "/dashboard/employer/projects/new",
      },
      {
        step: "02",
        title: "Review Bids & Chat with Candidates",
        description: "Inspect applicant ratings, on-chain portfolios, and open direct messaging channels to align on scope before awarding.",
        action: "Review Proposals",
        href: "/dashboard/employer/projects",
      },
      {
        step: "03",
        title: "Fund Milestone Escrow Upfront",
        description: "Connect your Web3 wallet or use fiat on-ramp. Lock milestone funds into the Ethereum smart contract escrow.",
        action: "Manage Contracts",
        href: "/dashboard/employer/contracts",
      },
      {
        step: "04",
        title: "Approve Deliverables & Release Payouts",
        description: "Inspect submitted code or assets. Approve to trigger automatic smart contract payout release, or request structured revisions.",
        action: "Workspace Overview",
        href: "/dashboard/employer/contracts",
      },
    ],
  },
  {
    id: "security",
    label: "Security & Wallet Basics",
    icon: <ShieldCheck className="size-4" weight="bold" />,
    badge: "Account Protection",
    description: "Essential best practices for Web3 security, multi-factor authentication, and safe smart contract interactions.",
    steps: [
      {
        step: "01",
        title: "Enable Multi-Factor Authentication (MFA)",
        description: "Add TOTP 2-factor authentication via Google Authenticator or 1Password to protect account mutation actions.",
        action: "Setup MFA",
        href: "/mfa/setup",
      },
      {
        step: "02",
        title: "Never Share Seed Phrases or OTPs",
        description: "FreelanceXchain will never ask for your wallet recovery seed phrase or one-time verification tokens under any circumstances.",
        action: "Learn More",
        href: "/status",
      },
      {
        step: "03",
        title: "Use In-Platform Escrow Controls",
        description: "Always conduct milestone deposits and payments through official contract workspaces to ensure 100% dispute protection.",
        action: "View Terms",
        href: "/terms",
      },
      {
        step: "04",
        title: "Transparent Dispute Arbitration",
        description: "In the rare event of a disagreement, submit evidence through the Dispute Center where impartial arbiters review on-chain records.",
        action: "Dispute Center",
        href: "/dashboard/freelancer/disputes",
      },
    ],
  },
];

export default function TutorialsPage() {
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState("freelancers");

  const currentTrack = TUTORIAL_TRACKS.find((t) => t.id === activeTab) || TUTORIAL_TRACKS[0];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-12 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <Sparkle className="size-3.5 fill-primary" weight="fill" />
              <span>Step-by-Step Guides & Tutorials</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              Master the FreelanceXchain <br />
              <span className="text-[#717680] dark:text-muted-foreground font-semibold">
                smart escrow ecosystem.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Comprehensive walkthroughs for freelancers, employers, and Web3 developers to work, hire, and transact with total security.
            </p>

            {/* Track Selector Tabs */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {TUTORIAL_TRACKS.map((track) => (
                <button
                  key={track.id}
                  onClick={() => setActiveTab(track.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                    activeTab === track.id
                      ? "bg-primary text-primary-foreground shadow-md scale-105"
                      : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  {track.icon}
                  <span>{track.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Active Track Header & Description */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-10">
          <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-sm">
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              {currentTrack.badge}
            </span>
            <h2 className="text-2xl font-extrabold text-foreground mt-3 tracking-tight">
              {currentTrack.label} Overview
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {currentTrack.description}
            </p>
          </div>
        </section>

        {/* Steps Grid */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentTrack.steps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center border border-primary/20">
                      {item.step}
                    </span>
                    <CheckCircle className="size-5 text-emerald-500" weight="fill" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <Link href={item.href}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                    >
                      {item.action}
                      <ArrowRight className="size-3 ml-1.5" weight="bold" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
