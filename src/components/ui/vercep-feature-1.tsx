"use client";

import { cn } from "@/lib/utils";
import { Icons } from "./icons";
import { Marquee } from "./marquee";

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
  const m3 = marqueeData.slice((marqueeData.length / 3) * 2);

  return (
    <section className="relative bg-background py-20 sm:py-40">
      <div className="mx-auto max-w-full">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-center space-y-4 px-5 text-center md:px-10">
          <h2 className="max-w-3xl font-medium text-4xl sm:text-5xl lg:text-6xl">
            Removing the roadblocks to your{" "}
            <span className="gradient-text">success</span>
          </h2>
          <p className="max-w-xl text-base md:text-lg text-muted-foreground">
            It's easy to get lost in a sea of conflicting opinions about
            freelancing. We filter out the noise, focus on what truly matters,
            and give you the clarity that lets your career shine.
          </p>
          <div className="relative mx-auto max-w-3xl overflow-hidden">
            <div className="absolute left-0 z-50 h-full w-20 bg-linear-to-r from-background" />
            <div className="absolute right-0 z-50 h-full w-20 bg-linear-to-l from-background" />

            <div className="-mx-6 flex w-screen flex-col md:-mx-10 lg:-mx-16">
              <Marquee className="[--duration:45s] [--gap:0.75rem]" repeat={4}>
                {m1.map((q) => (
                  <div
                    className="rounded-none border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
                    key={q}
                  >
                    {q}
                  </div>
                ))}
              </Marquee>

              <Marquee
                className="[--duration:50s] [--gap:0.75rem]"
                repeat={4}
                reverse
              >
                {m2.map((q) => (
                  <div
                    className="rounded-none border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
                    key={q}
                  >
                    {q}
                  </div>
                ))}
              </Marquee>

              <Marquee className="[--duration:42s] [--gap:0.75rem]" repeat={4}>
                {m3.map((q) => (
                  <div
                    className="rounded-none border border-border bg-card px-3 py-1 text-sm text-muted-foreground"
                    key={q}
                  >
                    {q}
                  </div>
                ))}
              </Marquee>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 divide-dashed divide-border border-border border-t border-dashed sm:grid-cols-2 sm:divide-x lg:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                className="flex flex-col gap-5 px-5 py-8 last:border-b-0 lg:border-b-0 lg:px-6 lg:py-10"
                key={feature.title}
              >
                <Icon className="size-12 text-primary" />

                <div className="flex flex-col gap-2 pt-10 lg:pt-20">
                  <h3 className="font-medium text-2xl tracking-tight sm:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
