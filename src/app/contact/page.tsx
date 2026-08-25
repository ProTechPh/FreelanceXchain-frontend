"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/ui/navbar";
import { FooterSection } from "@/components/ui/footer-section";
import {
  Sparkle,
  ChatCircleDots,
  ShieldCheck,
  EnvelopeSimple,
  Question,
  PaperPlaneTilt,
  CheckCircle,
  FileText,
  LockKey,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

const SUPPORT_CHANNELS = [
  {
    icon: <LockKey className="size-5 text-primary" weight="bold" />,
    title: "Escrow & Contract Disputes",
    description: "Questions about milestone funds, locked smart contracts, or evidence submissions.",
    action: "Open Dispute Center",
    href: "/dashboard/freelancer/disputes",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" weight="bold" />,
    title: "Didit KYC & Verification",
    description: "Assistance with biometric verification, identity documents, or country eligibility.",
    action: "Verification Status",
    href: "/dashboard/freelancer/verification",
  },
  {
    icon: <Question className="size-5 text-primary" weight="bold" />,
    title: "Help Center & Tutorials",
    description: "Step-by-step documentation for proposals, milestone deliverables, and wallet setups.",
    action: "Browse Tutorials",
    href: "/tutorials",
  },
];

export default function ContactPage() {
  const reduce = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-12 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <Sparkle className="size-3.5 fill-primary" weight="fill" />
              <span>Direct Support & Inquiries</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              We&apos;re here to help you <br />
              <span className="text-[#717680] dark:text-muted-foreground font-semibold">
                work and hire on-chain safely.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Have questions regarding smart contract escrow, Didit verification, or customized enterprise hiring? Reach out to our dedicated support team.
            </p>
          </motion.div>
        </section>

        {/* Support Channels Grid */}
        <section className="mx-auto max-w-5xl px-6 lg:px-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SUPPORT_CHANNELS.map((channel) => (
              <div
                key={channel.title}
                className="rounded-3xl bg-card border border-border/80 p-6 shadow-sm flex flex-col justify-between hover:border-primary/50 transition-all"
              >
                <div>
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    {channel.icon}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{channel.title}</h3>
                  <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
                    {channel.description}
                  </p>
                </div>

                <Link href={channel.href} className="mt-4 pt-3 border-t border-border/50">
                  <span className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1">
                    {channel.action} →
                  </span>
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Contact Form Section */}
        <section className="mx-auto max-w-3xl px-6 lg:px-8">
          <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-10 shadow-lg shadow-black/5">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">
              Send Us a Message
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">
              Our support team typically responds within 2-4 business hours.
            </p>

            {submitted ? (
              <div className="p-8 text-center rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                <CheckCircle className="size-12 text-primary mx-auto" weight="fill" />
                <h3 className="text-lg font-bold text-foreground">Message Sent Successfully</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Thank you for contacting FreelanceXchain support. A ticket has been created and our team will get back to you at {formData.email}.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-bold mt-2"
                  onClick={() => {
                    setSubmitted(false);
                    setFormData({ name: "", email: "", category: "General Inquiry", subject: "", message: "" });
                  }}
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Your Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Satoshi Nakamoto"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="satoshi@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    >
                      <option>General Inquiry</option>
                      <option>Smart Contract Escrow</option>
                      <option>Didit KYC Verification</option>
                      <option>Dispute Resolution</option>
                      <option>Technical Bug</option>
                      <option>Partnership / Enterprise</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Subject</label>
                    <input
                      type="text"
                      required
                      placeholder="Summary of your request"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">Message</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide details about your question, contract ID, or issue..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-y"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 cursor-pointer"
                >
                  Submit Inquiry
                  <PaperPlaneTilt className="size-4 ml-2" weight="bold" />
                </Button>
              </form>
            )}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
