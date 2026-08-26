"use client";

import Link from "next/link";
import { ArrowRight, Sparkles as Sparkle, Star, CircleCheck as CheckCircle } from 'lucide-react';
import { motion, useReducedMotion } from "motion/react";

function CallToAction() {
  const reduce = useReducedMotion();

  return (
    <section className="bg-gradient-to-b from-background via-primary-subtle/30 to-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative isolate overflow-hidden rounded-3xl border border-primary-foreground/10 bg-gradient-to-br from-primary-active via-primary to-primary-hover p-8 text-center text-primary-foreground shadow-2xl dark:border-primary/20 dark:from-card dark:via-primary-subtle dark:to-card dark:text-foreground sm:p-14"
        >
          {/* Controlled highlights keep the gradient dimensional without washing out its content. */}
          <div className="pointer-events-none absolute -right-28 -top-32 size-80 rounded-full bg-primary-foreground/10 blur-3xl dark:bg-primary/10" />
          <div className="pointer-events-none absolute -bottom-36 -left-24 size-72 rounded-full bg-primary-foreground/10 blur-3xl dark:bg-primary/10" />
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary-foreground/40 to-transparent dark:via-primary/40" />

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

            <p className="mx-auto mt-3 max-w-xl break-words text-xs font-normal leading-relaxed text-primary-foreground/80 dark:text-muted-foreground sm:mt-4 sm:text-base">
              Join verified talent and top employers closing milestone contracts with AI speed, portable reputation, and Ethereum smart contract escrow.
            </p>

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
