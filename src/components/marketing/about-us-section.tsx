"use client";

import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Sparkles as Sparkle, ShieldCheck, Brain, Globe, Lock as LockKey } from 'lucide-react';
import { Button } from "@/components/ui/button";

const PILLARS = [
  {
    icon: <LockKey className="size-6 text-primary" strokeWidth={2.5} />,
    title: "100% Smart Contract Escrow",
    description:
      "Funds are deposited upfront into audited Ethereum & Polygon smart contracts. Payments are auto-released upon deliverable approval — eliminating ghosting, chargebacks, and payment delays forever.",
  },
  {
    icon: <Brain className="size-6 text-primary" strokeWidth={2.5} />,
    title: "AI Proposal & Skill Matching",
    description:
      "Our AI analyzes employer project scopes and matches verified developer portfolios, drafting tailored milestone estimates and deliverable breakdowns in 3.2 seconds.",
  },
  {
    icon: <Globe className="size-6 text-primary" strokeWidth={2.5} />,
    title: "Portable On-Chain Reputation",
    description:
      "Every completed milestone and rating is permanently engraved on-chain. Your reputation is your sovereign asset — it travels with your wallet and cannot be banned or seized by a centralized entity.",
  },
  {
    icon: <ShieldCheck className="size-6 text-primary" strokeWidth={2.5} />,
    title: "Global Biometric Didit KYC",
    description:
      "Seamless identity verification covering 220+ countries and territories. Employers and freelancers collaborate with guaranteed authenticity, eliminating bots and malicious actors.",
  },
];

const STATS = [
  { value: "$10M+", label: "Secured in Smart Escrow" },
  { value: "99.8%", label: "Milestone Payout Completion" },
  { value: "220+", label: "Countries Supported" },
  { value: "0%", label: "Risk of Unpaid Approved Work" },
];

export default function AboutUsSection() {
  const reduce = useReducedMotion();

  return (
    <div className="w-full">
      {/* Hero Intro */}
      <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-16 text-center">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
            <Sparkle className="size-3.5 fill-primary" fill="currentColor" />
            <span>Our Mission & Web3 Vision</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            Building the trustless standard <br />
            <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
              for the global freelance economy.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            FreelanceXchain was built to fix broken Web2 freelance platforms. By fusing Ethereum smart contract escrow with AI-assisted proposal bidding, we protect freelancers from non-payment and give employers verifiable talent.
          </p>
        </motion.div>
      </section>

      {/* Stats Counter Bar */}
      <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="p-6 rounded-3xl bg-card border border-border/80 shadow-md shadow-black/5 text-center"
            >
              <p className="text-2xl sm:text-3xl font-extrabold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-semibold">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Four Core Pillars */}
      <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            How We Empower Freelancers & Employers
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            The four architectural foundations that make FreelanceXchain fast, safe, and trustless.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PILLARS.map((pillar, idx) => (
            <motion.div
              key={pillar.title}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: idx * 0.05 }}
              className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                {pillar.icon}
              </div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">{pillar.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                {pillar.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Bottom Mission CTA */}
      <section className="mx-auto max-w-5xl px-6 lg:px-8">
        <div className="rounded-3xl bg-primary text-primary-foreground p-8 sm:p-12 text-center relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-primary-foreground">
              Ready to work with zero payment risk?
            </h3>
            <p className="text-sm sm:text-base text-primary-foreground/80 leading-relaxed">
              Join thousands of Web3 engineers, designers, and employers transacting safely through smart contract escrow.
            </p>
            <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
              <Link href="/register">
                <Button className="rounded-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-xs font-bold px-6 py-3 shadow-md">
                  Get Started Free
                </Button>
              </Link>
              <Link href="/projects">
                <Button variant="outline" className="rounded-full border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 text-xs font-bold px-6 py-3">
                  Browse Open Projects
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
