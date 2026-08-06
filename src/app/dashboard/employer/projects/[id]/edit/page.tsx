'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import type { Project, ProjectStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    projectsApi.get(projectId).then(({ data }) => {
      setProject(data);
      setTitle(data.title);
      setDescription(data.description);
      setBudget(String(data.budget));
      setDeadline(data.deadline.slice(0, 10));
      setStatus(data.status);
    }).catch((error) => toast.error(getApiErrorMessage(error, 'Unable to load this project.'))).finally(() => setLoading(false));
  }, [projectId]);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (title.trim().length < 5) return toast.error('Project title must be at least 5 characters.');
    if (description.trim().length < 20) return toast.error('Project description must be at least 20 characters.');
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) return toast.error('Budget must be greater than 0.');
    if (!deadline) return toast.error('Choose a deadline.');
    setSaving(true);
    try {
      await projectsApi.update(projectId, {
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
        deadline: `${deadline}T23:59:59.999Z`,
        status,
      });
      toast.success('Project updated.');
      router.push('/dashboard/employer/projects');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update this project. It may be locked by an accepted proposal.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  if (!project) return <Card><CardContent className="py-12 text-center text-muted-foreground">Project unavailable.</CardContent></Card>;
  const verified = user?.kycStatus === 'approved' || user?.kycStatus === 'completed';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link href="/dashboard/employer/projects"><ArrowLeft className="mr-2 size-4" />Back to projects</Link></Button>
      <Card><CardHeader><CardTitle>Edit project</CardTitle></CardHeader><CardContent>
        {!verified ? <div className="space-y-3 py-6 text-center"><p className="text-muted-foreground">Identity verification is required by the backend before project updates.</p><Button asChild><Link href="/dashboard/employer/verification">Complete verification</Link></Button></div> : (
          <form className="space-y-4" onSubmit={save}>
            <div className="space-y-2"><Label htmlFor="edit-title">Title</Label><Input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="edit-description">Description</Label><Textarea id="edit-description" rows={7} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="edit-budget">Budget</Label><Input id="edit-budget" type="number" min="1" value={budget} onChange={(event) => setBudget(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="edit-deadline">Deadline</Label><Input id="edit-deadline" type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></div></div>
            <div className="space-y-2"><Label htmlFor="edit-status">Status</Label><select id="edit-status" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}><option value="draft">Draft</option><option value="open">Open</option><option value="cancelled">Cancelled</option></select></div>
            <Button type="submit" disabled={saving}><Save className="mr-2 size-4" />{saving ? 'Saving…' : 'Save changes'}</Button>
          </form>
        )}
      </CardContent></Card>
    </div>
  );
}
