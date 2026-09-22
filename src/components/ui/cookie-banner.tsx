'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Cookie, ShieldCheck, Settings, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface CookiePreferences {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'flx_cookie_consent';

export function CookieBanner() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    functional: true,
    analytics: true,
    timestamp: '',
  });

  // Don't show cookie consent banner inside dashboard pages (user is already authenticated)
  const isDashboard = pathname?.startsWith('/dashboard');

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    // Check if consent was already recorded asynchronously to avoid cascading renders
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        // Delay slightly for smooth page entrance
        timer = setTimeout(() => setIsOpen(true), 800);
      } else {
        const parsed = JSON.parse(stored) as CookiePreferences;
        timer = setTimeout(() => setPreferences(parsed), 0);
      }
    } catch {
      timer = setTimeout(() => setIsOpen(true), 0);
    }

    // Listen for custom event to re-open settings from footer or policy page
    const handleReopen = () => {
      setShowPreferences(true);
      setIsOpen(true);
    };
    window.addEventListener('open-cookie-settings', handleReopen);
    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('open-cookie-settings', handleReopen);
    };
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const updated = {
      ...prefs,
      essential: true, // Always true
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }
    setPreferences(updated);
    setIsOpen(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: '',
    });
  };

  const handleRejectNonEssential = () => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: '',
    });
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  if (isDashboard || !isOpen) return null;

  return (
    <aside
      role="region"
      aria-label="Cookie and Privacy Consent"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="rounded-2xl border border-border/80 bg-background/95 backdrop-blur-md p-5 sm:p-6 shadow-2xl shadow-black/20 text-foreground">
        {!showPreferences ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary shrink-0">
                <Cookie className="size-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm sm:text-base font-bold text-foreground">
                  Your Privacy & Cookie Choices
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  We use cookies to keep you signed in, protect your account from spam, and make our site run smoothly. We never sell your personal data or track you across other websites. Learn more in our{' '}
                  <Link href="/cookies" className="text-primary font-semibold hover:underline">
                    Cookie Policy
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-primary font-semibold hover:underline">
                    Privacy Policy
                  </Link>.
                </p>
              </div>
            </div>

            {/* Equal prominence action buttons to avoid dark patterns (Item 9) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPreferences(true)}
                className="text-xs font-semibold rounded-xl"
              >
                <Settings className="size-3.5 mr-1.5" />
                Customize
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRejectNonEssential}
                className="text-xs font-semibold rounded-xl hover:bg-muted"
              >
                Reject Optional
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleAcceptAll}
                className="text-xs font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Check className="size-3.5 mr-1.5" />
                Accept All
              </Button>
            </div>
          </div>
        ) : (
          /* Granular Preferences View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2 font-bold text-sm text-foreground">
                <ShieldCheck className="size-4 text-primary" />
                <span>Manage Cookie Preferences</span>
              </div>
              <button
                type="button"
                onClick={() => setShowPreferences(false)}
                aria-label="Close preferences"
                className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs max-h-60 overflow-y-auto pr-1">
              {/* Essential */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground flex items-center gap-1.5">
                    <span>Necessary for Login & Safety</span>
                    <span className="text-2xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-bold">Always On</span>
                  </div>
                  <p className="text-muted-foreground leading-relaxed">
                    Keeps you signed in safely and blocks spam and bots. The site cannot work without these.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked
                  disabled
                  aria-label="Necessary for Login and Safety (Required)"
                  className="mt-1 rounded accent-primary cursor-not-allowed opacity-70"
                />
              </div>

              {/* Functional */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">Preferences & Appearance</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Remembers your choices, like dark or light mode and navigation settings.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="pref-functional"
                  checked={preferences.functional}
                  onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                  className="mt-1 rounded accent-primary cursor-pointer"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/60">
                <div className="space-y-0.5">
                  <div className="font-semibold text-foreground">Site Performance & Improvements</div>
                  <p className="text-muted-foreground leading-relaxed">
                    Helps us find and fix bugs and keep pages loading fast. We never track you on other sites.
                  </p>
                </div>
                <input
                  type="checkbox"
                  id="pref-analytics"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="mt-1 rounded accent-primary cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/60">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPreferences(false)}
                className="text-xs rounded-xl"
              >
                Back
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleSavePreferences}
                className="text-xs rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Save Preferences
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
