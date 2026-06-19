import Link from "next/link";
import { MoveRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

function CallToAction() {
  return (
    <section className="py-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="relative p-12 rounded-3xl bg-card border border-border overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-5" />
          <div className="relative z-10 flex flex-col gap-6 items-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Join the Future of Work</span>
            </div>
            <h2 className="text-4xl font-bold">
              Start Earning <span className="gradient-text">Securely</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Join thousands of freelancers and employers building the future of work on FreelanceXchain.
            </p>
            <div className="flex flex-row gap-4 mt-2">
              <Link href="/login">
                <Button size="lg" variant="outline" className="px-8 h-12 text-base border-border/50 hover:bg-card">
                  Sign in
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" className="gradient-primary text-white px-8 h-12 text-base gap-2">
                  Get Started Free <MoveRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export { CallToAction };
