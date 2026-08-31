'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { portfolioApi } from '@/lib/api';
import { safeAttachmentUrl } from '@/lib/attachment-presentation';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { reportLoadFailure } from '@/lib/report-failure';
import { getWebsitePreviewUrl, isValidHttpUrl } from '@/lib/portfolio-utils';
import { useAuthStore } from '@/stores/authStore';
import type { PortfolioItem } from '@/types';
import { toast } from 'sonner';
import {
  Plus,
  ExternalLink,
  Edit,
  Trash2,
  Globe,
  Image as ImageIcon,
  Tag,
} from 'lucide-react';
import { CardGridSkeleton } from '@/components/dashboard/skeletons';
import { EmptyState } from '@/components/ui/empty-state';

interface FormState {
  title: string;
  description: string;
  projectUrl: string;
  skills: string;
  completedAt: string;
}

const EMPTY_FORM: FormState = { title: '', description: '', projectUrl: '', skills: '', completedAt: '' };

export default function PortfolioPage() {
  const currentUser = useAuthStore((state) => state.user);
  const [items, setItems] = useState<PortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentUser) return;
    const { data } = await portfolioApi.getByFreelancer(currentUser.id);
    setItems(Array.isArray(data) ? data : []);
  }, [currentUser]);

  // Reported here rather than inside the loader so the toast's Retry can call it
  // again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'your portfolio', run);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }
    run();
    return () => {
      active = false;
    };
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFiles([]);
    setDialogOpen(true);
  };

  const openEdit = (item: PortfolioItem) => {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      projectUrl: item.projectUrl ?? '',
      skills: (item.skills || []).join(', '),
      completedAt: item.completedAt ? item.completedAt.slice(0, 10) : '',
    });
    setFiles([]);
    setDialogOpen(true);
  };

  const livePreviewUrl = useMemo(() => {
    if (!form.projectUrl || !isValidHttpUrl(form.projectUrl)) return null;
    return getWebsitePreviewUrl(form.projectUrl);
  }, [form.projectUrl]);

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    if (!editingId && files.length === 0 && !form.projectUrl.trim()) {
      toast.error('Please upload at least one image or provide a project URL.');
      return;
    }

    setSubmitting(true);
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);

      if (editingId) {
        const updatePayload: Record<string, unknown> = {
          title: form.title,
          description: form.description,
          projectUrl: form.projectUrl || undefined,
          skills,
          completedAt: form.completedAt || undefined,
        };

        // If projectUrl changed or image was not custom, allow setting preview
        if (form.projectUrl && (!files || files.length === 0)) {
          updatePayload.images = [{
            url: getWebsitePreviewUrl(form.projectUrl),
            filename: 'website-preview.png',
          }];
        }

        const { data: updated } = await portfolioApi.update(editingId, updatePayload);
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)));
        toast.success('Portfolio item updated');
      } else {
        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('description', form.description);
        if (form.projectUrl) formData.append('projectUrl', form.projectUrl);
        formData.append('skills', skills.join(','));
        if (form.completedAt) formData.append('completedAt', form.completedAt);
        files.forEach((file) => formData.append('files', file));

        const { data: created } = await portfolioApi.create(formData);
        setItems((prev) => [created, ...prev]);
        toast.success('Portfolio item added');
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, editingId ? 'Failed to update portfolio item' : 'Failed to add portfolio item'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this portfolio item? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await portfolioApi.delete(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success('Portfolio item deleted');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete portfolio item'));
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <CardGridSkeleton count={6} label="Loading portfolio" />;
  }

  const liveProjectCount = items.filter((i) => i.projectUrl).length;
  const uniqueSkillCount = new Set(items.flatMap((i) => i.skills || [])).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best projects and work samples.</p>
        </div>
        <Button variant="gradient" onClick={openCreate}>
          <Plus className="w-4 h-4 mr-2" /> Add Portfolio Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{items.length}</p>
                <p className="text-xs text-muted-foreground">Portfolio Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan/10 flex items-center justify-center">
                <Globe className="w-5 h-5 text-cyan" />
              </div>
              <div>
                <p className="text-2xl font-bold">{liveProjectCount}</p>
                <p className="text-xs text-muted-foreground">Live Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-warning-subtle flex items-center justify-center">
                <Tag className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{uniqueSkillCount}</p>
                <p className="text-xs text-muted-foreground">Skills Showcased</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Grid */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          </div>
          <EmptyState
            icon={ImageIcon}
            title="No portfolio items yet"
            description="Work samples are the first thing employers look at. Add a few to strengthen every proposal you send."
          />
          <Button variant="gradient" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add your first project
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => {
            const previewImage = (item.projectUrl ? getWebsitePreviewUrl(item.projectUrl) : null) || item.images?.[0]?.url;

            return (
              <Card key={item.id} className="group bg-card border-border overflow-hidden flex flex-col transition-all hover:border-primary/40">
                {/* Clean Browser Bar */}
                <div className="bg-muted/80 border-b border-border px-3.5 py-2 flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
                    <span className="ml-2 font-mono text-xs truncate max-w-[200px] sm:max-w-[280px]">
                      {item.projectUrl ? item.projectUrl.replace(/^https?:\/\//, '') : item.title}
                    </span>
                  </div>
                </div>

                {/* Preview Image Container */}
                <div className="aspect-video bg-muted/40 relative overflow-hidden group">
                  {previewImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewImage}
                      alt={item.title}
                      className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.01]"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget;
                        try {
                          const parsed = new URL(target.src);
                          const isMicrolink = parsed.hostname === 'api.microlink.io' || parsed.hostname.endsWith('.microlink.io');
                          if (item.projectUrl && !isMicrolink) {
                            target.src = getWebsitePreviewUrl(item.projectUrl);
                          }
                        } catch {
                          if (item.projectUrl) {
                            target.src = getWebsitePreviewUrl(item.projectUrl);
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground/50">
                      <Globe className="w-12 h-12 mb-2" />
                      <span className="text-xs">No preview available</span>
                    </div>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute bottom-3 left-3 flex gap-2 z-10">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-background/90 backdrop-blur shadow-sm hover:bg-background"
                      onClick={() => openEdit(item)}
                    >
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-background/90 backdrop-blur shadow-sm text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" /> {deletingId === item.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </div>

                <CardContent className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.projectUrl && safeAttachmentUrl(item.projectUrl) && (
                        <Button asChild variant="outline" size="sm" className="h-8 gap-1.5 text-xs shrink-0">
                          <a
                            href={safeAttachmentUrl(item.projectUrl)!}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Open ${item.title} project link`}
                          >
                            <span>Open</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>

                    {item.completedAt && (
                      <p className="text-xs text-muted-foreground mb-3">
                        Completed {new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </p>
                    )}

                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-border">
                    {(item.skills || []).map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="portfolio-title">Project Title *</Label>
              <Input
                id="portfolio-title"
                placeholder="e.g. Decentralized Escrow Protocol"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio-desc">Description *</Label>
              <Textarea
                id="portfolio-desc"
                placeholder="Describe what you built..."
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio-url">Project URL (optional)</Label>
              <Input
                id="portfolio-url"
                placeholder="https://..."
                value={form.projectUrl}
                onChange={(e) => setForm((f) => ({ ...f, projectUrl: e.target.value }))}
              />
            </div>

            {/* Clean Live Preview Container */}
            {livePreviewUrl && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="bg-muted/80 border-b border-border px-3 py-1.5 flex items-center text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-destructive/60" />
                    <div className="w-2 h-2 rounded-full bg-warning/60" />
                    <div className="w-2 h-2 rounded-full bg-success/60" />
                    <span className="ml-2 font-mono text-xs text-muted-foreground truncate max-w-[240px]">
                      {form.projectUrl}
                    </span>
                  </div>
                </div>
                <div className="aspect-[16/9] bg-muted/20 relative overflow-hidden flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={livePreviewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover object-top"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="portfolio-skills">Skills (comma separated)</Label>
              <Input
                id="portfolio-skills"
                placeholder="Solidity, React, TypeScript"
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="portfolio-date">Completion date (optional)</Label>
              <Input
                id="portfolio-date"
                type="date"
                value={form.completedAt}
                onChange={(e) => setForm((f) => ({ ...f, completedAt: e.target.value }))}
              />
            </div>

            {!editingId && (
              <div className="space-y-2">
                <Label htmlFor="portfolio-images">Images (optional if Project URL is provided)</Label>
                <Input
                  id="portfolio-images"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} loading={submitting} loadingText="Saving…">
                {editingId ? 'Save changes' : 'Add item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
