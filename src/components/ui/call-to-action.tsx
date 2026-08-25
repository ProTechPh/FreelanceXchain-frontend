"use client";

import Link from "next/link";
import { ArrowRight, Sparkle, Star, CheckCircle } from "@phosphor-icons/react";
import { motion, useReducedMotion } from "motion/react";

function CallToAction() {
  const reduce = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl bg-gradient-to-br from-primary via-[#0a332a] to-[#06261f] text-white p-8 sm:p-14 text-center overflow-hidden shadow-2xl"
        >
          {/* Subtle background decorative shapes */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-bold mb-6 border border-white/15 backdrop-blur-xs">
            <Sparkle className="size-3.5 fill-emerald-300" weight="fill" />
            <span>Decentralized Freelance Economy</span>
          </div>

          {/* Title */}
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto">
            Ready to hire or get hired? <br />
            <span className="text-emerald-300">Get started with smart escrow today.</span>
          </h2>

          <p className="mt-4 text-sm sm:text-base leading-relaxed max-w-xl mx-auto text-emerald-100/80 font-normal">
            Join verified talent and top employers closing milestone contracts with AI speed, portable reputation, and Ethereum smart contract escrow.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3.5">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-white text-[#0f4c3d] font-bold text-sm shadow-lg transition-all duration-150 hover:bg-emerald-50 active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRight
                className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                weight="bold"
              />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center px-7 py-3.5 rounded-full border border-white/25 text-white font-semibold text-sm transition-all duration-150 hover:bg-white/10 active:scale-[0.98]"
            >
              Browse Projects
            </Link>
          </div>

          {/* Bottom Trust Badges */}
          <div className="mt-10 pt-8 border-t border-white/15 flex flex-wrap justify-center items-center gap-6 sm:gap-10 text-xs text-emerald-200/90 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-400" weight="fill" />
              <span>100% Smart Contract Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-emerald-400" weight="fill" />
              <span>Didit KYC in 220+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="size-4 text-amber-400 fill-amber-400" weight="fill" />
              <span>Zero Unpaid Invoices Guaranteed</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { CallToAction };

