import Link from 'next/link';
import { ArrowLeft, ExternalLink, Activity, Shield, Clock } from 'lucide-react';

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

      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold gradient-text mb-3">System Status</h1>
          <p className="text-muted-foreground">
            Real-time operational status of FreelanceX services.
          </p>
        </div>

        <div className="space-y-4 mb-10">
          <div className="rounded-xl border border-border p-6 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">FreelanceX API</h3>
              <p className="text-sm text-muted-foreground">Core backend services</p>
            </div>
            <a
              href={STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
            >
              Details <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="rounded-xl border border-border p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Clock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold mb-2">Full Status Dashboard</h2>
          <p className="text-sm text-muted-foreground mb-6">
            View detailed uptime history, response times, and incident reports.
          </p>
          <a
            href={STATUS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg gradient-primary text-white font-medium hover:opacity-90 transition-opacity"
          >
            View on UptimeRobot
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        <div className="text-center mt-8">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            Monitored 24/7 by UptimeRobot
          </div>
        </div>
      </main>
    </div>
  );
}
