"use client";

import { motion, useReducedMotion } from "motion/react";
import { Check, Sparkle } from "@phosphor-icons/react";

const matrixRows = [
  {
    feature: "Milestone Escrow Guarantee",
    freelanceXchain: "100% Smart Contract Escrow",
    web2Platforms: "High fee custody lock",
    directInvoicing: "Zero protection (unpaid risk)",
  },
  {
    feature: "Platform Take Rate / Fees",
    freelanceXchain: "Low transparent fees",
    web2Platforms: "10% – 20% platform cut",
    directInvoicing: "Bank & wire transfer fees",
  },
  {
    feature: "AI Proposal & Scope Assistant",
    freelanceXchain: "Tailored milestone scopes",
    web2Platforms: "Manual copy-pasting",
    directInvoicing: "Manual contract drafting",
  },
  {
    feature: "Reputation Portability",
    freelanceXchain: "On-chain immutable record",
    web2Platforms: "Platform lock-in",
    directInvoicing: "No verifiable track record",
  },
  {
    feature: "Global Identity & Trust",
    freelanceXchain: "Didit KYC (220+ countries)",
    web2Platforms: "Slow manual review",
    directInvoicing: "Unverified anonymous parties",
  },
  {
    feature: "Payment Settlement Speed",
    freelanceXchain: "Instant upon milestone approval",
    web2Platforms: "5 – 14 day escrow hold",
    directInvoicing: "30 – 90 day invoice lag",
  },
  {
    feature: "Dispute Transparency",
    freelanceXchain: "Cryptographic arbitration",
    web2Platforms: "Opaque support ticket",
    directInvoicing: "Costly legal claims",
  },
  {
    feature: "Payment Currency Options",
    freelanceXchain: "USDC, ETH, Polygon & Fiat",
    web2Platforms: "Fiat only + FX markups",
    directInvoicing: "Fragmented wire accounts",
  },
  {
    feature: "Dedicated Contract Workspaces",
    freelanceXchain: "Milestone deliverables & chat",
    web2Platforms: "Clunky legacy interface",
    directInvoicing: "Messy email threads",
  },
];

export function ComparisonTable() {
  const reduce = useReducedMotion();

  return (
    <section id="compare" className="py-20 sm:py-28 bg-background border-b border-border/40 scroll-mt-20">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Sparkle className="size-3.5 fill-primary" weight="fill" />
            <span>Why Choose Us</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground break-words">
            FreelanceXchain vs. The Rest
          </h2>
          <p className="mt-3 text-xs sm:text-base text-muted-foreground max-w-xl mx-auto break-words">
            See why freelancers and employers choose FreelanceXchain over traditional 20%-fee platforms and unprotected direct invoicing.
          </p>
        </motion.div>

        {/* Mobile scroll hint */}
        <div className="block sm:hidden text-center mb-3">
          <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-3 py-1 rounded-full border border-border/60">
            Swipe sideways to view full comparison →
          </span>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-border/80 bg-card overflow-x-auto shadow-sm"
        >
          <div className="min-w-[620px]">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-2 px-6 py-5 border-b border-border bg-muted/40 items-center">
              <div className="col-span-5 text-xs sm:text-sm font-bold text-foreground">
                Key Capabilities
              </div>
              <div className="col-span-3 text-center">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-extrabold shadow-xs">
                  FreelanceXchain
                </span>
              </div>
              <div className="col-span-2 text-center text-xs font-semibold text-muted-foreground">
                Legacy Web2 (Upwork/Fiverr)
              </div>
              <div className="col-span-2 text-center text-xs font-semibold text-muted-foreground">
                Unprotected Invoicing
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/50">
              {matrixRows.map((row) => (
                <div
                  key={row.feature}
                  className="grid grid-cols-12 gap-2 px-6 py-4 items-center text-xs sm:text-sm hover:bg-muted/20 transition-colors"
                >
                  <div className="col-span-5 font-semibold text-foreground break-words">
                    {row.feature}
                  </div>

                  {/* FreelanceXchain Column (Highlighted) */}
                  <div className="col-span-3 text-center px-2 py-1.5 rounded-xl bg-primary/5 text-primary font-bold text-xs flex items-center justify-center gap-1.5 border border-primary/10">
                    <Check className="size-4 text-emerald-600 shrink-0" weight="bold" />
                    <span className="truncate">{row.freelanceXchain}</span>
                  </div>

                  {/* Legacy Web2 */}
                  <div className="col-span-2 text-center text-muted-foreground text-xs px-1 break-words">
                    {row.web2Platforms}
                  </div>

                  {/* Direct Invoicing */}
                  <div className="col-span-2 text-center text-muted-foreground/70 text-xs px-1 break-words">
                    {row.directInvoicing}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
