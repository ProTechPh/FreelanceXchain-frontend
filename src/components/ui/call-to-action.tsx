"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";

function CallToAction() {
  return (
    <section className="relative overflow-hidden bg-[oklch(0.08_0.005_280)] py-24 sm:py-32">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,oklch(0.62_0.26_280/0.10),transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-16 right-1/3 w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,oklch(0.75_0.15_210/0.06),transparent_70%)] blur-3xl" />
      </div>

      {/* Horizontal rule top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — headline + sub */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] text-white mb-6">
              Start building your{" "}
              <span className="gradient-text">on-chain career</span>{" "}
              today.
            </h2>
            <p className="text-lg text-white/60 leading-relaxed max-w-md mb-10">
              Join thousands of freelancers and employers who've moved their work on-chain. No platform lock-in, no hidden fees — just work that pays.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              <Link href="/register">
                <Button
                  size="lg"
                  className="gradient-primary text-white h-12 px-8 text-base font-semibold glow-primary hover:scale-[1.03] hover:opacity-90 transition-all duration-200"
                >
                  Get Started Free <ArrowRight className="ml-2 w-4 h-4" weight="light" />
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 px-8 text-base border-white/20 text-white hover:bg-white/[0.08] hover:border-white/30 transition-colors duration-200"
                >
                  Sign in
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right — decorative stat cards */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex flex-col gap-4"
          >
            {[
              { value: "2,400+", label: "Active freelancers on the platform", accent: "primary" },
              { value: "$1.2M+", label: "Secured in smart contract escrow", accent: "cyan" },
              { value: "180+", label: "Countries with verified members", accent: "primary" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-5 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-6 py-5 backdrop-blur-sm hover:border-white/[0.12] transition-colors duration-300"
              >
                <span className={`text-3xl font-extrabold tracking-tight ${stat.accent === "cyan" ? "text-cyan" : "gradient-text"}`}>
                  {stat.value}
                </span>
                <span className="text-sm text-white/50 leading-snug">{stat.label}</span>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>

      {/* Horizontal rule bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </section>
  );
}

export { CallToAction };
