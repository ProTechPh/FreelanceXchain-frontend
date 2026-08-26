"use client";

import Link from "next/link";
import { ArrowRight, Sparkles as Sparkle, Star, CircleCheck as CheckCircle } from 'lucide-react';
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
          className="relative rounded-3xl bg-gradient-to-br from-primary via-primary to-primary text-primary-foreground p-8 sm:p-14 text-center overflow-hidden shadow-2xl"
        >
          {/* Subtle background decorative shapes */}
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-success-subtle blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-success-subtle blur-3xl pointer-events-none" />

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold mb-6 border border-white/20 backdrop-blur-xs">
            <Sparkle className="size-3.5" fill="currentColor" />
            <span>Decentralized Freelance Economy</span>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight max-w-2xl mx-auto break-words text-white">
            Ready to hire or get hired? <br className="hidden sm:inline" />
            <span className="text-white">Get started with smart escrow today.</span>
          </h2>

          <p className="mt-3 sm:mt-4 text-xs sm:text-base leading-relaxed max-w-xl mx-auto text-white/90 font-normal break-words">
            Join verified talent and top employers closing milestone contracts with AI speed, portable reputation, and Ethereum smart contract escrow.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
            <Link
              href="/register"
              className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary-foreground text-primary font-bold text-sm shadow-lg transition-all duration-150 hover:bg-success-subtle active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRight
                className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 rounded-full border border-primary-foreground/25 text-primary-foreground font-semibold text-sm transition-all duration-150 hover:bg-primary-foreground/10 active:scale-[0.98]"
            >
              Browse Projects
            </Link>
          </div>

          {/* Bottom Trust Badges */}
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-primary-foreground/15 flex flex-wrap justify-center items-center gap-4 sm:gap-10 text-xs text-white/90 font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-white shrink-0" fill="currentColor" />
              <span className="break-words">100% Smart Contract Escrow</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-white shrink-0" fill="currentColor" />
              <span className="break-words">Didit KYC in 220+ Countries</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="size-4 text-yellow-300 shrink-0" fill="currentColor" />
              <span className="break-words">Zero Unpaid Invoices Guaranteed</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { CallToAction };

