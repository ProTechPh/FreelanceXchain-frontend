import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Right - Branding */}
      <div className="hidden lg:flex flex-1 items-center justify-center bg-card border-l border-border relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="relative z-10 text-center px-12">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4 gradient-text">FreelanceXchain</h2>
          <p className="text-muted-foreground text-lg">
            The decentralized freelance marketplace powered by blockchain and AI.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold gradient-text">$2.4M+</p>
              <p className="text-xs text-muted-foreground">Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold gradient-text">12K+</p>
              <p className="text-xs text-muted-foreground">Freelancers</p>
            </div>
            <div>
              <p className="text-2xl font-bold gradient-text">85+</p>
              <p className="text-xs text-muted-foreground">Countries</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
