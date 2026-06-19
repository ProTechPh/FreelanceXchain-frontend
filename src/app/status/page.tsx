import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const metadata = {
  title: 'System Status | FreelanceX',
  description: 'Check the current operational status of FreelanceX services.',
};

const STATUS_URL = 'https://stats.uptimerobot.com/6VI6R2PTC5';

export default function StatusPage() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="font-bold text-lg gradient-text">FreelanceX</span>
          </Link>
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text mb-3">System Status</h1>
          <p className="text-muted-foreground">
            Monitor the real-time operational status of all FreelanceX services.
          </p>
        </div>

        <div className="rounded-xl border border-border overflow-hidden">
          <iframe
            src={STATUS_URL}
            className="w-full h-[800px] border-0"
            title="FreelanceX System Status"
          />
        </div>

        <div className="text-center mt-6">
          <a
            href={STATUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Open in new tab
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </main>
    </div>
  );
}
