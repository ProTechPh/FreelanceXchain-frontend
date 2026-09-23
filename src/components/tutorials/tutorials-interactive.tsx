"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { CircleCheck as CheckCircle, ArrowRight, Search, User, Briefcase, ShieldCheck } from "lucide-react";

interface TutorialStep {
  step: string;
  title: string;
  description: string;
  action: string;
  href: string;
}

interface TutorialTrack {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge: string;
  description: string;
  steps: TutorialStep[];
}

interface TutorialsInteractiveProps {
  tracks: TutorialTrack[];
}

export function TutorialsInteractive({ tracks }: TutorialsInteractiveProps) {
  const reduce = useReducedMotion();
  const [activeTab, setActiveTab] = useState("freelancers");
  const [tutorialSearch, setTutorialSearch] = useState("");

  const currentTrack = tracks.find((t) => t.id === activeTab) || tracks[0];

  const filteredSteps = currentTrack.steps.filter((step) => {
    if (!tutorialSearch) return true;
    const term = tutorialSearch.toLowerCase();
    return step.title.toLowerCase().includes(term) || step.description.toLowerCase().includes(term);
  });

  return (
    <>
      {/* Track Selector Tabs */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {tracks.map((track) => (
          <button
            key={track.id}
            onClick={() => setActiveTab(track.id)}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
              activeTab === track.id
                ? "bg-primary text-primary-foreground shadow-md scale-105"
                : "bg-card border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            }`}
          >
            {track.icon}
            <span>{track.label}</span>
          </button>
        ))}
      </div>

      {/* Active Track Header & Description */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-10 mt-12">
        <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-sm">
          <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
            {currentTrack.badge}
          </span>
          <h2 className="text-2xl font-extrabold text-foreground mt-3 tracking-tight">
            {currentTrack.label} Overview
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {currentTrack.description}
          </p>
        </div>
      </section>

      {/* Steps Grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-16">
        {/* Tutorial Search */}
        <div className="relative max-w-md mx-auto mb-8">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tutorial steps..."
            value={tutorialSearch}
            onChange={(e) => setTutorialSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-full bg-card border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 shadow-xs text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {filteredSteps.length === 0 ? (
          <div className="py-12 text-center">
            <EmptyState
              icon={Search}
              title="No tutorial steps found"
              description={`No steps in the ${currentTrack.label} track matched "${tutorialSearch}". Try searching for another keyword or switch tracks.`}
              action={
                <Button variant="outline" size="sm" onClick={() => setTutorialSearch("")}>
                  Clear search
                </Button>
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSteps.map((item, idx) => (
              <motion.div
                key={item.step}
                initial={reduce ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: idx * 0.08 }}
                className="rounded-3xl bg-card border border-border/80 p-6 sm:p-8 shadow-md shadow-black/5 hover:border-primary/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-2xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center border border-primary/20">
                      {item.step}
                    </span>
                    <CheckCircle className="size-5 text-success" fill="currentColor" />
                  </div>

                  <h3 className="text-lg font-bold text-foreground tracking-tight leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between">
                  <span className="text-2xs font-medium text-muted-foreground">
                    {item.href.startsWith("/dashboard") ? "Requires sign in" : "Public page"}
                  </span>
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="rounded-full text-xs font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all cursor-pointer"
                  >
                    <Link href={item.href}>
                      {item.action}
                      <ArrowRight className="size-3 ml-1.5" strokeWidth={2.5} />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
