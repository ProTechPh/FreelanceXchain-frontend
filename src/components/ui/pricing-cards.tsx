"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check, Sparkle, Lightning } from "@phosphor-icons/react";

export function PricingCards() {
  const reduce = useReducedMotion();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "weekly">("monthly");

  const plans = [
    {
      name: "Basic",
      badge: null,
      subtitle: "For light job seekers testing the market.",
      price: billingCycle === "monthly" ? "19.99" : "4.99",
      period: billingCycle === "monthly" ? "/ month" : "/ week",
      credits: billingCycle === "monthly" ? "80 applications / month" : "20 applications / week",
      description: "Perfect if you’re applying occasionally or exploring new roles.",
      features: [
        "Tailored resume for every role",
        "AI cover letter generation",
        "Unified application tracker",
        "Curated daily job matches",
        "Web & mobile cross-sync",
      ],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      badge: "Popular",
      subtitle: "For active job seekers ready to move fast.",
      price: billingCycle === "monthly" ? "39.99" : "9.99",
      period: billingCycle === "monthly" ? "/ month" : "/ week",
      credits: billingCycle === "monthly" ? "200 applications / month" : "50 applications / week",
      description: "Ideal if you’re applying weekly and want to stay top of mind with every opportunity.",
      features: [
        "Everything in Basic",
        "200 tailored applications",
        "Instant 1-Click / Swipe apply",
        "Smart contract escrow support",
        "Priority recruiter alerts",
        "Live status change notifications",
      ],
      cta: "Start with Pro",
      popular: true,
    },
    {
      name: "Ultra",
      badge: "20% OFF",
      subtitle: "For go-getters ready to land their next role.",
      price: billingCycle === "monthly" ? "79.99" : "19.99",
      originalPrice: billingCycle === "monthly" ? "99.99" : "24.99",
      period: billingCycle === "monthly" ? "/ month" : "/ week",
      credits: billingCycle === "monthly" ? "600 applications / month" : "150 applications / week",
      description: "Go all in. Apply to more roles, faster — and let Sprout handle the busywork.",
      features: [
        "Everything in Pro",
        "600 tailored applications",
        "Unlimited resume tailoring",
        "AI Agent auto-fill workflows",
        "Direct interview scheduling sync",
        "VIP concierge support",
      ],
      cta: "Go Ultra",
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="py-20 sm:py-28 bg-background border-b border-border/40">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-2xl mx-auto mb-10"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3 border border-primary/20">
            <Sparkle className="size-3.5 fill-primary" weight="fill" />
            <span>Transparent Pricing</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
            <span className="text-foreground">Choose your pace: </span>
            <span className="text-[#717680] dark:text-muted-foreground">
              Plans that scale with your ambition.
            </span>
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            Sprout’s flexible plans give you weekly or monthly credits to search, apply, and land jobs — faster. No contracts. No surprises.
          </p>

          {/* Weekly / Monthly Toggle */}
          <div className="mt-8 inline-flex items-center p-1 rounded-2xl bg-muted/80 border border-border">
            <button
              onClick={() => setBillingCycle("weekly")}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "weekly"
                  ? "bg-background text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>Monthly</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  billingCycle === "monthly"
                    ? "bg-emerald-400/20 text-emerald-100"
                    : "bg-emerald-500/10 text-emerald-600"
                }`}
              >
                Save 25%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.4,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`rounded-2xl border p-7 flex flex-col justify-between transition-all duration-200 ${
                plan.popular
                  ? "border-primary bg-card shadow-lg ring-2 ring-primary/20"
                  : "border-border/80 bg-card hover:border-primary/40 shadow-xs"
              }`}
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                  {plan.badge && (
                    <span
                      className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full ${
                        plan.popular
                          ? "bg-primary text-primary-foreground"
                          : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-5 min-h-[32px]">
                  {plan.subtitle}
                </p>

                {/* Price Display */}
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-muted-foreground">$</span>
                    <span className="text-4xl font-extrabold tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    {plan.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-1.5">
                        ${plan.originalPrice}
                      </span>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">
                      {plan.period}
                    </span>
                  </div>
                  {/* Credits pill */}
                  <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-primary/5 text-primary text-xs font-bold border border-primary/10">
                    <Lightning className="size-3.5" weight="fill" />
                    <span>{plan.credits}</span>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground/90 leading-relaxed mb-6 pt-2 border-t border-border/50">
                  {plan.description}
                </p>

                {/* Features checklist */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-xs text-foreground/90 font-medium">
                      <Check
                        className="size-4 mt-0.5 shrink-0 text-emerald-600"
                        weight="bold"
                      />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Button */}
              <Link
                href="/register"
                className={`w-full inline-flex items-center justify-center py-3 rounded-xl font-bold text-xs transition-all duration-150 active:scale-[0.98] ${
                  plan.popular
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md shadow-primary/20"
                    : "border border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Sprout Inclusions Banner */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-12 max-w-5xl mx-auto rounded-2xl border border-border/80 bg-muted/20 p-6 sm:p-8"
        >
          <div className="text-center mb-6">
            <h4 className="text-sm font-bold text-foreground">
              No upsells. No paywalls — just everything you need to apply better and move forward.
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span><strong className="text-foreground">End-to-end apply:</strong> Review first, or tap to apply</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span><strong className="text-foreground">Tailored cover letters:</strong> Personalized for every role</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span><strong className="text-foreground">Resume tailoring:</strong> Adapts to match each role</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span><strong className="text-foreground">Application tracking:</strong> See every app & what’s next</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span><strong className="text-foreground">Real-time updates:</strong> Instant recruiter notifications</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className="size-4 text-emerald-500 shrink-0" weight="bold" />
              <span><strong className="text-foreground">Mobile & web access:</strong> Stay synced across any device</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
