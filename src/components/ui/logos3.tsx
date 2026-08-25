"use client";

import { motion, useReducedMotion } from "motion/react";

const logos = [
  {
    name: "Ethereum",
    src: "https://cdn.worldvectorlogo.com/logos/ethereum-1.svg",
  },
  {
    name: "Cloudflare",
    src: "https://cdn.worldvectorlogo.com/logos/cloudflare-1.svg",
  },
  {
    name: "Next.js",
    src: "https://cdn.worldvectorlogo.com/logos/next-js.svg",
  },
  {
    name: "React",
    src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
  },
  {
    name: "TypeScript",
    src: "https://cdn.worldvectorlogo.com/logos/typescript.svg",
  },
  {
    name: "Vercel",
    src: "https://cdn.worldvectorlogo.com/logos/vercel.svg",
  },
];

export function Logos3() {
  const reduce = useReducedMotion();

  return (
    <section className="py-14 border-t border-border">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-8"
        >
          Built on proven technology
        </motion.p>
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5"
        >
          {logos.map((logo) => (
            <img
              key={logo.name}
              src={logo.src}
              alt={logo.name}
              className="h-6 w-auto opacity-35 hover:opacity-60 transition-opacity duration-200"
              loading="lazy"
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
