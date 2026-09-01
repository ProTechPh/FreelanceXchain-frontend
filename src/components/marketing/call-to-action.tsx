"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Sparkles as Sparkle, ShieldCheck, Globe, ReceiptText } from 'lucide-react';
import { motion, useReducedMotion } from "motion/react";
import { useAuthStore } from "@/stores/authStore";

function CallToAction() {
  const reduce = useReducedMotion();
  const { user, isAuthenticated } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isLoggedIn = mounted && isAuthenticated && !!user;
  const primaryHref = isLoggedIn ? `/dashboard/${user.role || 'freelancer'}` : '/register';
  const primaryText = isLoggedIn ? 'Go to Dashboard' : 'Get Started Free';

  return (
    <section className="bg-gradient-to-b from-background via-primary-subtle/30 to-background py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative isolate overflow-hidden rounded-3xl border border-gradient-foreground/10 bg-gradient-to-br from-gradient-from via-gradient-via to-gradient-to p-8 text-center text-gradient-foreground shadow-2xl sm:p-14"
        >
          {/* Controlled highlights keep the gradient dimensional without washing out its content. */}
          <div className="pointer-events-none absolute -right-28 -top-32 size-80 rounded-full bg-gradient-foreground/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-36 -left-24 size-72 rounded-full bg-gradient-foreground/10 blur-3xl" />
          <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-gradient-foreground/40 to-transparent" />

          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-gradient-foreground/25 bg-gradient-foreground/10 px-3.5 py-1.5 text-xs font-bold text-gradient-foreground backdrop-blur-xs">
            <Sparkle className="size-3.5 fill-current text-primary-subtle dark:text-primary-active" aria-hidden="true" />
            <span>Decentralized Freelance Economy</span>
          </div>

          {/* Title */}
          <h2 className="mx-auto max-w-2xl break-words text-2xl font-extrabold leading-tight tracking-tight text-gradient-foreground sm:text-4xl lg:text-5xl">
            Ready to hire or get hired? <br className="hidden sm:inline" />
            <span className="text-primary-subtle dark:text-primary-active">Get started with smart escrow today.</span>
          </h2>

          <p className="mx-auto mt-3 max-w-xl break-words text-xs font-normal leading-relaxed text-gradient-foreground/85 sm:mt-4 sm:text-base">
            Join verified talent and top employers closing milestone contracts with AI speed, portable reputation, and Ethereum smart contract escrow.
          </p>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-3">
            <Link
              href={primaryHref}
              className="group inline-flex items-center justify-center gap-2 w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-foreground text-gradient-from font-bold text-sm shadow-lg transition-all duration-150 hover:bg-gradient-foreground/90 active:scale-[0.98]"
            >
              <span>{primaryText}</span>
              <ArrowRight
                className="size-4 transition-transform duration-150 group-hover:translate-x-1"
                strokeWidth={2.5}
              />
            </Link>
            <Link
              href="/projects"
              className="inline-flex items-center justify-center w-full sm:w-auto px-7 py-3.5 rounded-full border border-gradient-foreground/35 text-gradient-foreground font-semibold text-sm transition-all duration-150 hover:bg-gradient-foreground/10 active:scale-[0.98]"
            >
              Browse Projects
            </Link>
          </div>

          {/* Bottom Trust Badges */}
          {/* Outline icons at a single weight and a single colour tier: they mark
              each claim without competing with the copy. Filling them collapses
              the glyph into a blob and loses the distinction between the three. */}
          <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gradient-foreground/20 flex flex-wrap justify-center items-center gap-x-6 gap-y-3 sm:gap-x-10 text-xs text-gradient-foreground/90 font-medium">
            {[
              { Icon: ShieldCheck, label: '100% Smart Contract Escrow' },
              { Icon: Globe, label: 'Didit KYC in 220+ Countries' },
              { Icon: ReceiptText, label: 'Zero Unpaid Invoices Guaranteed' },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon
                  className="size-4 shrink-0 text-gradient-foreground/70"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <span className="break-words">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { CallToAction };
