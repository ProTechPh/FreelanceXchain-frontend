'use client';

import type { Project } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatAmount } from '@/lib/format';

interface ProjectMilestonesCardProps {
  milestones: NonNullable<Project['milestones']>;
}

export function ProjectMilestonesCard({ milestones }: ProjectMilestonesCardProps) {
  if (!milestones || milestones.length === 0) return null;

  return (
    <Card className="rounded-2xl border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground">Milestones</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {milestones.map((milestone, i) => (
            <div
              key={milestone.id}
              className="p-4 rounded-xl bg-secondary/20 border border-border/60"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="size-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{milestone.title}</h4>
                    {milestone.description && (
                      <p className="text-xs text-muted-foreground mt-1">{milestone.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={milestone.status} domain="milestone" size="sm" />
                  <p className="font-bold text-sm text-primary">{formatAmount(milestone.amount)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
