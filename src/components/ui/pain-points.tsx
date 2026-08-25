"use client";

import { motion, useReducedMotion } from "motion/react";
import { X } from "@phosphor-icons/react";

const painPoints = [
  "Chasing clients for unpaid milestone invoices",
  "Excessive 15–20% traditional platform fees",
  "Arbitrary account suspensions and payment holds",
  "Fake reviews and unverified client profiles",
  "Rewriting custom proposals from scratch nonstop",
  "Disputes decided by slow, opaque support reps",
  "Platform lock-in losing your hard-earned reputation",
  "Low-ball bidding wars with unverified spammers",
  "Ghosting after completing scoped deliverables",
  "Slow international bank wires and currency fees",
  "Unclear milestone scopes and feature creep",
  "No escrow protection on contract revisions",
  "Manual invoice generation and tracking spreadsheets",
  "Lack of verifiable proof of past on-chain delivery",
  "Burnout pitching to dead & ghost project listings",
];

export function PainPoints() {
  const reduce = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 bg-muted/20 border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-2">
            The Problem
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            Tired of freelance friction? <br />
            <span className="text-muted-foreground font-semibold">
              Here’s what’s really holding you back.
            </span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Delayed payouts, 20% platform cuts, and fake reviews shouldn&apos;t exist in 2026. The traditional freelancing system is broken.
          </p>
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-w-5xl mx-auto"
        >
          {painPoints.map((point, i) => (
            <motion.div
              key={point}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                duration: 0.3,
                delay: i * 0.025,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-card border border-border/80 text-xs sm:text-sm font-medium text-foreground/85 shadow-xs hover:border-destructive/30 hover:bg-muted/40 transition-colors"
            >
              <span className="shrink-0 h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center text-xs font-bold">
                <X className="size-3.5" weight="bold" />
              </span>
              <span>{point}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
