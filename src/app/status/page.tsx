import React from "react";
import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { UptimeRobotWidget } from "@/components/status/uptime-robot-widget";
import { ComponentServicesList } from "@/components/status/component-services-list";

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-success-subtle text-success dark:text-success text-xs font-bold mb-4 border border-success-border shadow-xs">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>All Systems Operational</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
            System Status & <br className="hidden sm:inline" />
            <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
              infrastructure health.
            </span>
          </h1>

          <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Real-time operational status of FreelanceXchain smart contract escrow, APIs, Layer 2 relayers, and KYC verification pipelines.
          </p>
        </section>

        {/* Live Embedded UptimeRobot Monitor */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-10">
          <UptimeRobotWidget />
        </section>

        {/* Live Component Services & Relayers List */}
        <ComponentServicesList />
      </main>

      <FooterSection />
    </div>
  );
}
