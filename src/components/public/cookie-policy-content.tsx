'use client';

import React from 'react';
import Link from 'next/link';
import { Settings, ShieldCheck, Palette, Zap, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CookiePolicyContent() {
  const handleOpenSettings = () => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-cookie-settings'));
    }
  };

  return (
    <div className="space-y-8 text-foreground">
      {/* Interactive Settings Banner */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 not-prose">
        <div className="space-y-1">
          <p className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <Settings className="size-4 text-primary" />
            Want to change your cookie settings?
          </p>
          <p className="text-xs text-muted-foreground">
            You can customize or turn off optional cookies anytime.
          </p>
        </div>
        <Button
          type="button"
          onClick={handleOpenSettings}
          className="rounded-xl bg-primary text-primary-foreground text-xs font-semibold px-4 py-2 hover:bg-primary/90 cursor-pointer shrink-0"
        >
          Open Cookie Settings
        </Button>
      </div>

      {/* Section 1: In Plain English */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">1. What are cookies in plain English?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Cookies are like small digital bookmarks saved on your computer or phone when you visit a website. They help the website remember who you are so you don&apos;t have to log in on every single page or reset your dark/light mode preference every time you visit.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          We believe in honest, privacy-first principles: <strong>we never sell your personal information, and we never track what you do on other websites</strong>.
        </p>
      </section>

      {/* Section 2: Why We Use Them */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">2. The 3 types of cookies we use</h2>
        
        <div className="grid gap-4 sm:grid-cols-3 not-prose pt-2">
          {/* Essential */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <ShieldCheck className="size-4 text-primary" />
              <span>Login & Safety</span>
            </div>
            <span className="inline-block text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Always Active
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These keep your account securely logged in, protect you from unauthorized form submissions, and block automated spam bots. The site cannot work without these.
            </p>
          </div>

          {/* Preferences */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Palette className="size-4 text-primary" />
              <span>Your Settings</span>
            </div>
            <span className="inline-block text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Optional
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These remember your personal choices, such as whether you prefer Dark Mode or Light Mode, so you don&apos;t have to change it every time.
            </p>
          </div>

          {/* Performance */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-foreground">
              <Zap className="size-4 text-primary" />
              <span>Site Speed & Health</span>
            </div>
            <span className="inline-block text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
              Optional
            </span>
            <p className="text-xs text-muted-foreground leading-relaxed">
              These tell us how fast pages load and alert us if a button is broken, helping us fix bugs quickly. They never identify you personally.
            </p>
          </div>
        </div>
      </section>

      {/* Section 3: What We Store */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">3. What we actually save on your device</h2>
        <div className="overflow-x-auto not-prose">
          <table className="w-full text-xs text-left border border-border/80 rounded-xl overflow-hidden">
            <thead className="bg-muted text-foreground font-semibold">
              <tr>
                <th className="p-3">Item</th>
                <th className="p-3">Type</th>
                <th className="p-3">How Long It Stays</th>
                <th className="p-3">What It Does in Simple Words</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-muted-foreground">
              <tr>
                <td className="p-3 font-medium text-foreground">Login Session</td>
                <td className="p-3">Essential</td>
                <td className="p-3">Until you sign out (up to 7 days)</td>
                <td className="p-3">Remembers that you are securely signed into your dashboard.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Form Security Token</td>
                <td className="p-3">Essential</td>
                <td className="p-3">Browser session</td>
                <td className="p-3">Protects contract proposals and messages from being hijacked by outside websites.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Dark / Light Mode</td>
                <td className="p-3">Your Choice</td>
                <td className="p-3">1 year</td>
                <td className="p-3">Remembers your preferred screen colors.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Cookie Choices</td>
                <td className="p-3">Your Choice</td>
                <td className="p-3">1 year</td>
                <td className="p-3">Remembers which cookie settings you selected so we don&apos;t keep bothering you with the banner.</td>
              </tr>
              <tr>
                <td className="p-3 font-medium text-foreground">Spam & Bot Defense</td>
                <td className="p-3">Essential</td>
                <td className="p-3">Browser session</td>
                <td className="p-3">Blocks fake accounts, scrapers, and automated spam attacks.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Managing Cookies */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">4. How can you control or delete them?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          You are always in control of your device:
        </p>
        <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
          <li>
            <strong>Using our site controls:</strong> You can click the &quot;Open Cookie Settings&quot; button above to toggle optional cookies on or off anytime.
          </li>
          <li>
            <strong>Using your browser:</strong> All browsers (Google Chrome, Safari, Firefox, Microsoft Edge, Brave) let you view, block, or delete cookies in their Settings or Privacy menu. Note that deleting essential login cookies will sign you out.
          </li>
        </ul>
      </section>

      {/* Section 5: Still have questions? */}
      <section className="space-y-3">
        <h2 className="text-xl font-bold text-foreground">5. Have questions?</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          If you have any questions about how we handle cookies or data, we are happy to help. You can read our full{' '}
          <Link href="/privacy" className="text-primary font-medium hover:underline">
            Privacy Policy
          </Link>{' '}
          or send a message directly to our privacy team at{' '}
          <a href="mailto:privacy@freelancexchain.com" className="text-primary font-medium hover:underline">
            privacy@freelancexchain.com
          </a>.
        </p>
      </section>
    </div>
  );
}
