"use client";

import { cn } from "@/lib/utils";
import { Icons } from "./icons";
import { Marquee } from "./marquee";
import { motion } from "motion/react";

const marqueeData = [
  "How do I get paid securely on-chain?",
  "What makes this different from other platforms?",
  "How does the AI matching work?",
  "Is my identity verified and safe?",
  "What fees does the platform charge?",
  "How are disputes resolved fairly?",
  "Can I work from anywhere in the world?",
  "How is my reputation calculated?",
  "What blockchain technology is used?",
  "How do smart contracts protect me?",
  "What skills are in highest demand?",
  "How do I build my on-chain reputation?",
];

const features = [
  {
    description:
      "No hidden fees, no complicated onboarding — just a clean platform that lets you start working or hiring in minutes.",
    icon: Icons.shield,
    title: "We keep it simple",
  },
  {
    description:
      "Every feature is designed around smart contracts, AI matching, and on-chain reputation to deliver real, measurable results.",
    icon: Icons.trendingUp,
    title: "We focus on real results",
  },
  {
    description:
      "Built by a team that understands both blockchain technology and the freelance economy, with proven strategies that work.",
    icon: Icons.brain,
    title: "We know what works",
  },
  {
    description:
      "From your first project to scaling your business, we provide ongoing support and a reputation that follows you everywhere.",
    icon: Icons.users,
    title: "With you all the way",
  },
];

export function WhySection() {
  const m1 = marqueeData.slice(0, marqueeData.length / 3);
  const m2 = marqueeData.slice(
    marqueeData.length / 3,
    (marqueeData.length / 3) * 2,
  );

  return (
    <section className="relative bg-background py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl flex-col items-start justify-center space-y-4 mb-6">
          <h2 className="max-w-3xl font-bold text-4xl sm:text-5xl lg:text-6xl tracking-tight">
            Removing the roadblocks to your{" "}
            <span className="gradient-text">success</span>
          </h2>
          <p className="max-w-xl text-base md:text-lg text-muted-foreground">
            We filter out the noise, focus on what truly matters, and give you
            the clarity that lets your career shine.
          </p>
        </div>

        {/* Marquee strip */}
        <div className="relative overflow-hidden mb-12">
          <div className="absolute left-0 z-10 h-full w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="absolute right-0 z-10 h-full w-16 bg-gradient-to-l from-background to-transparent" />
          <div className="flex flex-col gap-1">
            <Marquee className="[--duration:45s] [--gap:0.5rem]" repeat={4}>
              {m1.map((q) => (
                <div
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-sm text-muted-foreground"
                  key={q}
                >
                  {q}
                </div>
              ))}
            </Marquee>
            <Marquee className="[--duration:50s] [--gap:0.5rem]" repeat={4} reverse>
              {m2.map((q) => (
                <div
                  className="rounded-md border border-white/[0.07] bg-white/[0.03] px-3 py-1 text-sm text-muted-foreground"
                  key={q}
                >
                  {q}
                </div>
              ))}
            </Marquee>
          </div>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 — large, col-span-2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-2 rounded-2xl border border-white/[0.07] bg-card p-8 hover:border-white/[0.12] transition-colors duration-300 min-h-[220px] flex flex-col justify-between"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] mb-8">
              <Icons.shield className="size-5 text-foreground/60" />
            </div>
            <div>
              <h3 className="font-semibold text-xl sm:text-2xl tracking-tight mb-2">
                {features[0].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {features[0].description}
              </p>
            </div>
          </motion.div>

          {/* Card 2 — small, col-span-1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/[0.07] bg-card p-8 hover:border-white/[0.12] transition-colors duration-300 min-h-[220px] flex flex-col justify-between"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] mb-8">
              <Icons.trendingUp className="size-5 text-foreground/60" />
            </div>
            <div>
              <h3 className="font-semibold text-xl tracking-tight mb-2">
                {features[1].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {features[1].description}
              </p>
            </div>
          </motion.div>

          {/* Card 3 — small, col-span-1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl border border-white/[0.07] bg-card p-8 hover:border-white/[0.12] transition-colors duration-300 min-h-[220px] flex flex-col justify-between"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] mb-8">
              <Icons.brain className="size-5 text-foreground/60" />
            </div>
            <div>
              <h3 className="font-semibold text-xl tracking-tight mb-2">
                {features[2].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {features[2].description}
              </p>
            </div>
          </motion.div>

          {/* Card 4 — large, col-span-2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-2 rounded-2xl border border-white/[0.07] bg-card p-8 hover:border-white/[0.12] transition-colors duration-300 min-h-[220px] flex flex-col justify-between"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] mb-8">
              <Icons.users className="size-5 text-foreground/60" />
            </div>
            <div>
              <h3 className="font-semibold text-xl sm:text-2xl tracking-tight mb-2">
                {features[3].title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                {features[3].description}
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
