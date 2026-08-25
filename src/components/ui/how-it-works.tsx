"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  MagnifyingGlass,
  Handshake,
  Wallet,
} from "@phosphor-icons/react";

const steps = [
  {
    icon: MagnifyingGlass,
    number: "01",
    title: "Create your profile",
    description:
      "Build your profile with skills and portfolio. AI helps optimize it, and your identity gets verified across 180+ countries.",
  },
  {
    icon: Handshake,
    number: "02",
    title: "Get matched or browse",
    description:
      "AI matches you with projects based on skills and reputation. Or browse the marketplace and apply directly.",
  },
  {
    icon: Wallet,
    number: "03",
    title: "Work and get paid",
    description:
      "Complete milestones, get paid through smart contract escrow, and build an on-chain reputation that follows you.",
  },
];

export function HowItWorks() {
  const reduce = useReducedMotion();

  return (
    <section id="how-it-works" className="py-20 sm:py-28 bg-muted/50">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mb-14"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
            How it works
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Three steps between you and your next milestone.
          </p>
        </motion.div>

        <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-12">
          {/* Connecting line (desktop only) */}
          <div
            className="hidden md:block absolute top-[1.5rem] left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-border"
            aria-hidden="true"
          />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground relative z-10">
                    <Icon className="size-5" weight="regular" />
                  </div>
                  <span className="text-xs font-semibold text-primary tracking-wider uppercase">
                    Step {step.number}
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-foreground mb-1.5">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
