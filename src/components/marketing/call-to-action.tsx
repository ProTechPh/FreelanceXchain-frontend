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

          <div className="relative">
            {/* Badge */}
            <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3.5 py-1.5 text-xs font-bold text-primary-foreground backdrop-blur-xs dark:border-primary/25 dark:bg-primary/10 dark:text-foreground">
              <Sparkle className="size-3.5 fill-current text-primary-subtle dark:text-primary" aria-hidden="true" />
              <span>Decentralized Freelance Economy</span>
            </div>

            {/* Title */}
            <h2 className="mx-auto max-w-2xl break-words text-2xl font-extrabold leading-tight tracking-tight text-primary-foreground dark:text-foreground sm:text-4xl lg:text-5xl">
              Ready to hire or get hired? <br className="hidden sm:inline" />
              <span className="text-primary-subtle dark:text-primary">Get started with smart escrow today.</span>
            </h2>

            <p className="mx-auto mt-3 max-w-xl break-words text-xs font-normal leading-relaxed text-primary-foreground/80 dark:text-muted-foreground sm:mt-4 sm:text-base">
              Join verified talent and top employers closing milestone contracts with AI speed, portable reputation, and Ethereum smart contract escrow.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/register"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-card px-8 py-3.5 text-sm font-bold text-primary shadow-lg transition-all duration-150 hover:bg-primary-subtle focus-visible:outline-primary-foreground active:scale-[0.98] dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary-hover dark:focus-visible:outline-primary sm:w-auto"
              >
                <span>Get Started Free</span>
                <ArrowRight
                  className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                  strokeWidth={2.5}
                />
              </Link>
              <Link
                href="/projects"
                className="inline-flex w-full items-center justify-center rounded-full border border-primary-foreground/35 bg-primary-foreground/5 px-7 py-3.5 text-sm font-semibold text-primary-foreground transition-all duration-150 hover:bg-primary-foreground hover:text-primary focus-visible:outline-primary-foreground active:scale-[0.98] dark:border-primary/35 dark:bg-primary/5 dark:text-foreground dark:hover:bg-primary/10 dark:hover:text-foreground dark:focus-visible:outline-primary sm:w-auto"
              >
                Browse Projects
              </Link>
            </div>

            {/* Bottom Trust Badges */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 border-t border-primary-foreground/20 pt-6 text-xs font-medium text-primary-foreground/80 dark:border-primary/20 dark:text-muted-foreground sm:mt-10 sm:gap-10 sm:pt-8">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-primary-subtle dark:text-primary" strokeWidth={2.25} aria-hidden="true" />
                <span className="break-words">100% Smart Contract Escrow</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="size-4 shrink-0 text-primary-subtle dark:text-primary" strokeWidth={2.25} aria-hidden="true" />
                <span className="break-words">Didit KYC in 220+ Countries</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="size-4 shrink-0 fill-current text-primary-subtle dark:text-primary" aria-hidden="true" />
                <span className="break-words">Zero Unpaid Invoices Guaranteed</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { CallToAction };
