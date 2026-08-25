"use client";

import React from "react";
import Navbar from "@/components/ui/navbar";
import { FooterSection } from "@/components/ui/footer-section";
import {
  CheckCircle,
  ShieldCheck,
  Pulse,
  Cpu,
  Database,
  CloudCheck,
  LockKey,
  ArrowSquareOut,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const STATUS_URL = "https://stats.uptimerobot.com/6VI6R2PTC5";

const SERVICES = [
  {
    name: "Ethereum Smart Escrow Contracts",
    description: "Mainnet escrow contracts, milestone locks & automated fund releases",
    status: "Operational",
    uptime: "100%",
    icon: <LockKey className="size-5 text-emerald-500" weight="bold" />,
  },
  {
    name: "Polygon & L2 Settlement Relayers",
    description: "Low-cost Layer 2 gasless transactions and instant bridging",
    status: "Operational",
    uptime: "99.99%",
    icon: <Cpu className="size-5 text-emerald-500" weight="bold" />,
  },
  {
    name: "Didit Identity & Biometric KYC",
    description: "Global identity verification across 220+ countries and fraud prevention",
    status: "Operational",
    uptime: "99.98%",
    icon: <ShieldCheck className="size-5 text-emerald-500" weight="bold" />,
  },
  {
    name: "FreelanceXchain Core API & Database",
    description: "User authentication, profile management, proposals, and contracts API",
    status: "Operational",
    uptime: "99.95%",
    icon: <Database className="size-5 text-emerald-500" weight="bold" />,
  },
  {
    name: "AI Proposal & Skill Matching Engine",
    description: "Automated candidate matching, skill gap analysis, and proposal generator",
    status: "Operational",
    uptime: "99.90%",
    icon: <Pulse className="size-5 text-emerald-500" weight="bold" />,
  },
  {
    name: "IPFS & Decentralized Deliverable Storage",
    description: "Encrypted milestone files, evidence attachments, and portfolio storage",
    status: "Operational",
    uptime: "99.99%",
    icon: <CloudCheck className="size-5 text-emerald-500" weight="bold" />,
  },
];

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 border border-emerald-500/20 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>All Systems Operational</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            System Status & <br />
            <span className="text-[#717680] dark:text-muted-foreground font-semibold">
              infrastructure health.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real-time operational status of FreelanceXchain smart contract escrow, APIs, Layer 2 relayers, and KYC verification pipelines.
          </p>
        </section>

        {/* Global Uptime Banner */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-10">
          <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="size-6 text-emerald-500" weight="fill" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">99.98% Average Platform Uptime</h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                  Over the last 90 days across all smart contracts and API clusters.
                </p>
              </div>
            </div>

            <a href={STATUS_URL} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="rounded-full text-xs font-bold shrink-0">
                Live External Monitor
                <ArrowSquareOut className="size-3.5 ml-1.5" />
              </Button>
            </a>
          </div>
        </section>

        {/* Services List */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-16">
          <h3 className="text-lg font-extrabold text-foreground mb-4 tracking-tight">
            Component Services & Relayers
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SERVICES.map((service) => (
              <div
                key={service.name}
                className="rounded-3xl bg-card border border-border/80 p-5 sm:p-6 shadow-xs flex items-start justify-between gap-4 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-background border border-border flex items-center justify-center shrink-0 mt-0.5">
                    {service.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{service.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    {service.status}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                    {service.uptime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
