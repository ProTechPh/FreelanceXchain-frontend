'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
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
import { useAuthStore } from '@/stores/authStore';
import type { PortfolioItem } from '@/types';
import { toast } from 'sonner';
import { Plus, ExternalLink, Edit, Trash2, Globe, Image as ImageIcon, Tag, Loader2 } from 'lucide-react';

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
    try {
      const { data } = await portfolioApi.getByFreelancer(currentUser.id);
      setItems(data);
    } catch {
      toast.error('Failed to load portfolio');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
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
      skills: item.skills.join(', '),
      completedAt: item.completedAt ? item.completedAt.slice(0, 10) : '',
    });
    setFiles([]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    if (!editingId && files.length === 0) {
      toast.error('At least one image is required');
      return;
    }

    setSubmitting(true);
    try {
      const skills = form.skills.split(',').map((s) => s.trim()).filter(Boolean);

      if (editingId) {
        const { data: updated } = await portfolioApi.update(editingId, {
          title: form.title,
          description: form.description,
          projectUrl: form.projectUrl || undefined,
          skills,
          completedAt: form.completedAt || undefined,
        });
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
    } catch {
      toast.error(editingId ? 'Failed to update portfolio item' : 'Failed to add portfolio item');
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
    } catch {
      toast.error('Failed to delete portfolio item');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const liveProjectCount = items.filter((i) => i.projectUrl).length;
  const uniqueSkillCount = new Set(items.flatMap((i) => i.skills)).size;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Portfolio</h1>
          <p className="text-muted-foreground">Showcase your best work</p>
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
          <p className="text-muted-foreground">No portfolio items yet</p>
          <Button variant="gradient" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-2" /> Add your first project
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="bg-card border-border overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-primary/20 to-cyan/20 flex items-center justify-center relative">
                {item.images[0]?.url ? (
                  <Image src={item.images[0].url} alt={item.title} fill className="object-cover" />
                ) : (
                  <Globe className="w-16 h-16 text-muted-foreground/50" />
                )}
                <div className="absolute bottom-3 left-3 flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/80 backdrop-blur"
                    onClick={() => openEdit(item)}
                  >
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/80 backdrop-blur text-destructive"
                    onClick={() => handleDelete(item.id)}
                    disabled={deletingId === item.id}
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> {deletingId === item.id ? 'Deleting…' : 'Delete'}
                  </Button>
                </div>
              </div>

              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                    {item.completedAt && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(item.completedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                  {item.projectUrl && safeAttachmentUrl(item.projectUrl) && (
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                      <a href={safeAttachmentUrl(item.projectUrl)!} target="_blank" rel="noopener noreferrer" aria-label={`Open ${item.title} project link`}>
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4">{item.description}</p>

                <div className="flex flex-wrap gap-1.5">
                  {item.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                placeholder="Project title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What did you build?"
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Project URL (optional)</Label>
              <Input
                placeholder="https://..."
                value={form.projectUrl}
                onChange={(e) => setForm((f) => ({ ...f, projectUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Skills (comma separated)</Label>
              <Input
                placeholder="React, Solidity, TypeScript"
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Completed date (optional)</Label>
              <Input
                type="date"
                value={form.completedAt}
                onChange={(e) => setForm((f) => ({ ...f, completedAt: e.target.value }))}
              />
            </div>
            {!editingId && (
              <div className="space-y-2">
                <Label>Images</Label>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                />
                <p className="text-xs text-muted-foreground">At least one image is required. Images can&apos;t be changed after creation.</p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving…' : editingId ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
