'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Upload, X, FileText, Image as ImageIcon, Trash2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { projectsApi, fileUploadsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { useAuthStore } from '@/stores/authStore';
import { hasApprovedKyc } from '@/lib/kyc-eligibility';
import { formatFileSize, safeAttachmentUrl } from '@/lib/attachment-presentation';
import type { Project, ProjectStatus, Attachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TOTAL_SIZE = 25 * 1024 * 1024; // 25MB

export default function EditProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id ?? '';
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('draft');
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newFilePreviews, setNewFilePreviews] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    projectsApi
      .get(projectId)
      .then(({ data }) => {
        setProject(data);
        setTitle(data.title);
        setDescription(data.description);
        setBudget(String(data.budget));
        setDeadline(data.deadline.slice(0, 10));
        setStatus(data.status);
        setExistingAttachments(data.attachments || []);
      })
      .catch((error) => toast.error(getApiErrorMessage(error, 'Unable to load this project.')))
      .finally(() => setLoading(false));
  }, [projectId]);

  // Generate image previews for newly selected image files
  useEffect(() => {
    const urls: Record<string, string> = {};
    newFiles.forEach((file) => {
      if (file.type.startsWith('image/')) {
        urls[file.name + file.lastModified] = URL.createObjectURL(file);
      }
    });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNewFilePreviews(urls);

    return () => {
      Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newFiles]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const totalCount = existingAttachments.length + newFiles.length + files.length;
    if (totalCount > MAX_FILES) {
      toast.error(`You can attach a maximum of ${MAX_FILES} files in total.`);
      return;
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`File "${file.name}" exceeds the 10MB limit.`);
        return;
      }
    }

    const currentTotalSize =
      existingAttachments.reduce((sum, a) => sum + (a.size || 0), 0) +
      newFiles.reduce((sum, f) => sum + f.size, 0) +
      files.reduce((sum, f) => sum + f.size, 0);

    if (currentTotalSize > MAX_TOTAL_SIZE) {
      toast.error('Total attachments size exceeds the 25MB limit.');
      return;
    }

    setNewFiles((prev) => [...prev, ...files]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeExistingAttachment = (index: number) => {
    setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (title.trim().length < 5) return toast.error('Project title must be at least 5 characters.');
    if (description.trim().length < 20) return toast.error('Project description must be at least 20 characters.');
    if (!Number.isFinite(Number(budget)) || Number(budget) <= 0) return toast.error('Budget must be greater than 0.');
    if (!deadline) return toast.error('Choose a deadline.');

    setSaving(true);
    try {
      let finalAttachments: Attachment[] = [...existingAttachments];

      // Upload newly added files if any
      if (newFiles.length > 0) {
        setUploadingProgress(true);
        const uploaded = await Promise.all(
          newFiles.map(async (file) => {
            const formData = new FormData();
            formData.append('bucket', 'project-attachments');
            formData.append('files', file);
            const { data } = await fileUploadsApi.upload(formData);
            return {
              url: data.url,
              filename: file.name,
              size: file.size,
              mimeType: file.type || 'application/octet-stream',
            };
          })
        );
        finalAttachments = [...finalAttachments, ...uploaded];
      }

      await projectsApi.update(projectId, {
        title: title.trim(),
        description: description.trim(),
        budget: Number(budget),
        deadline: `${deadline}T23:59:59.999Z`,
        status,
        attachments: finalAttachments,
      });

      toast.success('Project and attachments updated successfully!');
      router.push('/dashboard/employer/projects');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update this project. It may be locked by an accepted proposal.'));
    } finally {
      setSaving(false);
      setUploadingProgress(false);
    }
  };

  if (loading) return <DetailSkeleton label="Loading project" />;
  if (!project)
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">Project unavailable.</CardContent>
      </Card>
    );

  const verified = hasApprovedKyc(user?.kycStatus);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-12">
      <Button asChild variant="ghost" className="-ml-3">
        <Link href="/dashboard/employer/projects">
          <ArrowLeft className="mr-2 size-4" />
          Back to projects
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Edit project</CardTitle>
          <CardDescription>Update your project scope, budget, timeline, and reference images or attachments.</CardDescription>
        </CardHeader>
        <CardContent>
          {!verified ? (
            <div className="space-y-3 py-6 text-center">
              <p className="text-muted-foreground">Identity verification is required by the backend before project updates.</p>
              <Button asChild>
                <Link href="/dashboard/employer/verification">Complete verification</Link>
              </Button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={save}>
              <Field label="Title" htmlFor="edit-title">
                <Input id="edit-title" value={title} onChange={(event) => setTitle(event.target.value)} />
              </Field>

              <Field label="Description" htmlFor="edit-description">
                <Textarea
                  id="edit-description"
                  rows={6}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Budget (ETH)" htmlFor="edit-budget">
                  <Input
                    id="edit-budget"
                    type="number"
                    min="0.0001"
                    step="any"
                    value={budget}
                    onChange={(event) => setBudget(event.target.value)}
                  />
                </Field>
                <Field label="Deadline" htmlFor="edit-deadline">
                  <Input
                    id="edit-deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                  />
                </Field>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <select
                  id="edit-status"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as ProjectStatus)}
                >
                  <option value="draft">Draft</option>
                  <option value="open">Open</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Project Images & Attachments Section */}
              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-semibold text-foreground">Project Images & Attachments</Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Upload project mockup images, specifications, or requirement briefs (PNG, JPG, PDF, DOCX, MD).
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {existingAttachments.length + newFiles.length} / {MAX_FILES}
                  </Badge>
                </div>

                {/* Existing Attachments Gallery */}
                {existingAttachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Attachments</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {existingAttachments.map((att, index) => {
                        const isImage = att.mimeType?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp)$/i.test(att.filename);
                        const safeUrl = safeAttachmentUrl(att.url);

                        return (
                          <div
                            key={att.url || index}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card/60 gap-3 group hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImage && safeUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={safeUrl}
                                  alt={att.filename}
                                  className="size-10 rounded-lg object-cover border border-border shrink-0"
                                />
                              ) : (
                                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                  {isImage ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate text-foreground">{att.filename}</p>
                                <p className="text-3xs text-muted-foreground">{formatFileSize(att.size || 0)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {safeUrl && (
                                <Button asChild size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-foreground">
                                  <a href={safeUrl} target="_blank" rel="noopener noreferrer" title="View file">
                                    <ExternalLink className="size-3.5" />
                                  </a>
                                </Button>
                              )}
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => removeExistingAttachment(index)}
                                title="Remove attachment"
                              >
                                <Trash2 className="size-3.5" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Newly Added Files Preview */}
                {newFiles.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider">New Files To Upload</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {newFiles.map((file, index) => {
                        const isImage = file.type.startsWith('image/');
                        const previewUrl = newFilePreviews[file.name + file.lastModified];

                        return (
                          <div
                            key={file.name + index}
                            className="flex items-center justify-between p-2.5 rounded-xl border border-primary/30 bg-primary/5 gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isImage && previewUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={previewUrl}
                                  alt={file.name}
                                  className="size-10 rounded-lg object-cover border border-primary/20 shrink-0"
                                />
                              ) : (
                                <div className="size-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                                  {isImage ? <ImageIcon className="size-5" /> : <FileText className="size-5" />}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-xs font-medium truncate text-foreground">{file.name}</p>
                                <p className="text-3xs text-muted-foreground">{formatFileSize(file.size)} • Ready to upload</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                              onClick={() => removeNewFile(index)}
                              title="Cancel file"
                            >
                              <X className="size-3.5" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Upload Button / Dropzone */}
                {existingAttachments.length + newFiles.length < MAX_FILES && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar,.7z,.mp4,.webm,.mov,image/*"
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border hover:border-primary/50 bg-secondary/20 hover:bg-secondary/40 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                    >
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <Upload className="size-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Click to upload images or documents</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Attach up to {MAX_FILES - (existingAttachments.length + newFiles.length)} more files (10MB max each)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <Button type="submit" loading={saving} loadingText={uploadingProgress ? 'Uploading files…' : 'Saving…'}>
                  <Save className="size-4" aria-hidden="true" />
                  Save changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
