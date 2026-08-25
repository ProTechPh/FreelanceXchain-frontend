import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s · FreelanceXchain',
    default: 'Sign in · FreelanceXchain',
  },
};

/**
 * Auth route shell.
 *
 * The auth screens each own their full-bleed composition (split hero, centred
 * card), so this deliberately adds no chrome — its job is the `main` landmark
 * and the skip target, which were missing entirely.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <a
        href="#auth-content"
        className="sr-only z-50 focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <main id="auth-content" tabIndex={-1} className="min-h-screen outline-none">
        {children}
      </main>
    </>
  );
}
