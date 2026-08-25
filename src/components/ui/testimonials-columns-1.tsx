"use client";

import { motion, useReducedMotion } from "motion/react";

const testimonials = [
  {
    text: "Smart contract escrow means I never have to chase a client for payment again. Funds release the moment I deliver.",
    name: "Briana Patton",
    role: "UI/UX Designer",
    image: "https://randomuser.me/api/portraits/women/1.jpg",
  },
  {
    text: "The AI matching is scarily accurate. Within a day I had three proposals from developers who actually fit what I needed.",
    name: "Bilal Ahmed",
    role: "Startup Founder",
    image: "https://randomuser.me/api/portraits/men/2.jpg",
  },
  {
    text: "My on-chain reputation followed me from project to project. New clients can see my whole track record without me having to pitch.",
    name: "Saman Malik",
    role: "Full-Stack Developer",
    image: "https://randomuser.me/api/portraits/women/3.jpg",
  },
];

export function Testimonials() {
  const reduce = useReducedMotion();

  return (
    <section className="py-20 sm:py-28 bg-background">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-xl mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-foreground">
            What people are saying
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Real results from freelancers and employers on the platform.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.4,
                delay: i * 0.06,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="rounded-xl border border-border bg-card p-6 flex flex-col transition-colors duration-150 hover:bg-muted/50"
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <svg
                    key={j}
                    className="size-3.5 text-primary fill-current"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-5 flex-1">
                {t.text}
              </p>

              <div className="flex items-center gap-3 pt-4 border-t border-border">
                <img
                  src={t.image}
                  alt={t.name}
                  className="h-9 w-9 rounded-full object-cover"
                  loading="lazy"
                />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.role}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
