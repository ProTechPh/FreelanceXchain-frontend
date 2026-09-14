'use client';

import { ExternalLink, Paperclip } from 'lucide-react';
import type { Project } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import type { AttachmentPreviewTarget } from '@/components/ui/attachment-preview-dialog';

interface ProjectDescriptionCardProps {
  project: Project;
  onPreviewAttachment: (target: AttachmentPreviewTarget) => void;
}

export function ProjectDescriptionCard({ project, onPreviewAttachment }: ProjectDescriptionCardProps) {
  return (
    <>
      {/* Description */}
      <Card className="rounded-2xl border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-foreground">Project Description</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
            {project.description}
          </p>
        </CardContent>
      </Card>

      {/* Attachments */}
      {project.attachments && project.attachments.length > 0 && (
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <Paperclip className="size-5" />
              Reference Attachments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {project.attachments.map((attachment) => {
                const url = safeAttachmentUrl(attachment.url);
                return (
                  <div
                    key={`${attachment.filename}-${attachment.url}`}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-background/50 border border-border/50"
                  >
                    <span className="min-w-0 truncate text-sm">
                      {attachment.filename}
                      <span className="text-xs text-muted-foreground ml-2">
                        ({formatFileSize(attachment.size)})
                      </span>
                    </span>
                    {url ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="rounded-full min-h-[44px] sm:min-h-0 sm:h-8 hover:text-primary hover:bg-primary/10"
                        onClick={() =>
                          onPreviewAttachment({
                            filename: attachment.filename,
                            url: attachment.url,
                            size: attachment.size,
                          })
                        }
                      >
                        View <ExternalLink className="ml-1.5 h-3 w-3" />
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">Unavailable</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skills Required */}
      {project.requiredSkills && project.requiredSkills.length > 0 && (
        <Card className="rounded-2xl border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-foreground">Skills Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {project.requiredSkills.map((skill) => (
                <span
                  key={skill.skillId ?? skill.skillName}
                  className="px-3 py-1 rounded-full bg-secondary/50 border border-border text-xs font-medium text-foreground"
                >
                  {skill.skillName}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
