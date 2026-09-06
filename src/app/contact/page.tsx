"use client";

import React, { useState, useCallback } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import Navbar from "@/components/layout/navbar";
import { FooterSection } from "@/components/layout/footer-section";
import { Sparkles as Sparkle, ShieldCheck, CircleQuestionMark as Question, Send as PaperPlaneTilt, CircleCheck as CheckCircle, Lock as LockKey } from 'lucide-react';
import { Button } from "@/components/ui/button";

const SUPPORT_CHANNELS = [
  {
    icon: <LockKey className="size-5 text-primary" strokeWidth={2.5} />,
    title: "Escrow & Contract Disputes",
    description: "Questions about milestone funds, locked smart contracts, or evidence submissions.",
    action: "Open Dispute Center",
    href: "/dashboard/freelancer/disputes",
  },
  {
    icon: <ShieldCheck className="size-5 text-primary" strokeWidth={2.5} />,
    title: "Didit KYC & Verification",
    description: "Assistance with biometric verification, identity documents, or country eligibility.",
    action: "Verification Status",
    href: "/dashboard/freelancer/verification",
  },
  {
    icon: <Question className="size-5 text-primary" strokeWidth={2.5} />,
    title: "Help Center & Tutorials",
    description: "Step-by-step documentation for proposals, milestone deliverables, and wallet setups.",
    action: "Browse Tutorials",
    href: "/tutorials",
  },
];

const SUPPORT_EMAIL = "support@freelancexchain.com";

export default function ContactPage() {
  const reduce = useReducedMotion();
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "General Inquiry",
    subject: "",
    message: "",
  });

  const validate = useCallback(() => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Please enter a valid email address.";
    if (!formData.subject.trim()) newErrors.subject = "Subject is required.";
    if (!formData.message.trim()) newErrors.message = "Message is required.";
    else if (formData.message.trim().length < 10) newErrors.message = "Message must be at least 10 characters.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const mailtoBody = [
        `Category: ${formData.category}`,
        `Name: ${formData.name}`,
        `Email: ${formData.email}`,
        "",
        formData.message,
      ].join("\n");

      const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[${formData.category}] ${formData.subject}`)}&body=${encodeURIComponent(mailtoBody)}`;
      window.location.href = mailtoUrl;

      setSubmitted(true);
    } catch {
      setErrors({ submit: "Something went wrong. Please try again or email us directly." });
    } finally {
      setSubmitting(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="grow pt-28 sm:pt-36 pb-20">
        {/* Header Hero */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-12 text-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-bold mb-4 border border-primary/20 shadow-xs">
              <Sparkle className="size-3.5 fill-primary" fill="currentColor" />
              <span>Direct Support & Inquiries</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight text-foreground">
              We&apos;re here to help you <br className="hidden sm:inline" />
              <span className="text-muted-foreground dark:text-muted-foreground font-semibold">
                work and hire on-chain safely.
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Have questions regarding smart contract escrow, Didit verification, or customized enterprise hiring? Reach out to our dedicated support team.
            </p>
          </motion.div>
        </section>

        {/* Support Channels Grid */}
        <section className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 mb-12">
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
        <section className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-card border border-border/80 p-6 sm:p-10 shadow-lg shadow-black/5">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight mb-2">
              Send Us a Message
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">
              Our support team typically responds within 2-4 business hours.
            </p>

            {submitted ? (
              <div className="p-8 text-center rounded-2xl bg-primary/10 border border-primary/20 space-y-3">
                <CheckCircle className="size-12 text-primary mx-auto" fill="currentColor" />
                <h3 className="text-lg font-bold text-foreground">Message Ready to Send</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Your email client should open with the message pre-filled. If it doesn&apos;t, you can reach us at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium hover:underline">{SUPPORT_EMAIL}</a>.
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
              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-name" className="text-xs font-bold text-foreground">Your Name</label>
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="e.g. Satoshi Nakamoto"
                      value={formData.name}
                      onChange={(e) => updateField("name", e.target.value)}
                      aria-invalid={Boolean(errors.name)}
                      aria-describedby={errors.name ? "contact-name-error" : undefined}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground border-border/80"
                    />
                    {errors.name && <p id="contact-name-error" className="text-xs text-destructive" role="alert">{errors.name}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="contact-email" className="text-xs font-bold text-foreground">Email Address</label>
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="satoshi@example.com"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? "contact-email-error" : undefined}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground border-border/80"
                    />
                    {errors.email && <p id="contact-email-error" className="text-xs text-destructive" role="alert">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="contact-category" className="text-xs font-bold text-foreground">Category</label>
                    <select
                      id="contact-category"
                      value={formData.category}
                      onChange={(e) => updateField("category", e.target.value)}
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
                    <label htmlFor="contact-subject" className="text-xs font-bold text-foreground">Subject</label>
                    <input
                      id="contact-subject"
                      type="text"
                      placeholder="Summary of your request"
                      value={formData.subject}
                      onChange={(e) => updateField("subject", e.target.value)}
                      aria-invalid={Boolean(errors.subject)}
                      aria-describedby={errors.subject ? "contact-subject-error" : undefined}
                      className="w-full px-4 py-2.5 rounded-xl bg-background border text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground border-border/80"
                    />
                    {errors.subject && <p id="contact-subject-error" className="text-xs text-destructive" role="alert">{errors.subject}</p>}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="contact-message" className="text-xs font-bold text-foreground">Message</label>
                  <textarea
                    id="contact-message"
                    rows={4}
                    placeholder="Provide details about your question, contract ID, or issue..."
                    value={formData.message}
                    onChange={(e) => updateField("message", e.target.value)}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    className="w-full px-4 py-2.5 rounded-xl bg-background border border-border/80 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 text-foreground resize-y"
                  />
                  {errors.message && <p id="contact-message-error" className="text-xs text-destructive" role="alert">{errors.message}</p>}
                </div>

                {errors.submit && <p className="text-xs text-destructive" role="alert">{errors.submit}</p>}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm shadow-md hover:bg-primary/90 cursor-pointer"
                >
                  {submitting ? "Opening email client..." : "Submit Inquiry"}
                  <PaperPlaneTilt className="size-4 ml-2" strokeWidth={2.5} />
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Or email us directly at{" "}
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-medium hover:underline">{SUPPORT_EMAIL}</a>
                </p>
              </form>
            )}
          </div>
        </section>
      </main>

      <FooterSection />
    </div>
  );
}
