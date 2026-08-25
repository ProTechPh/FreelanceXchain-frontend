'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { matchingApi, projectsApi, skillsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { formatFileSize } from '@/lib/attachment-presentation';
import {
  ProjectFormValidationError,
  submitProject,
  validateProjectFiles,
  validateProjectStep,
  type ProjectSubmissionForm,
  type ProjectSubmissionSkill,
} from '@/lib/project-submission';
import { toast } from 'sonner';
import { ChevronRight, ChevronLeft, Plus, X, Upload, FileText, DollarSign, Clock, Target, Sparkles } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Field } from '@/components/ui/field';

const steps = [
  { id: 1, title: 'Project Details', icon: FileText },
  { id: 2, title: 'Milestones', icon: Target },
  { id: 3, title: 'Budget & Timeline', icon: DollarSign },
  { id: 4, title: 'Review & Post', icon: FileText },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<ProjectSubmissionSkill[]>([]);
  const [skillOptions, setSkillOptions] = useState<ProjectSubmissionSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [milestones, setMilestones] = useState([
    { title: '', description: '', amount: '' },
  ]);
  const [files, setFiles] = useState<File[]>([]);
  const [extractingSkills, setExtractingSkills] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSkills = async () => {
      try {
        const { data } = await skillsApi.getTaxonomy();
        if (active) {
          setSkillOptions(
            data.categories.flatMap((category) =>
              category.skills.map((skill) => ({ id: skill.id, name: skill.name })),
            ),
          );
        }
      } catch (error) {
        if (active) {
          toast.error(getApiErrorMessage(error, 'Unable to load the skill list. Please refresh and try again.'));
        }
      } finally {
        if (active) setSkillsLoading(false);
      }
    };

    void loadSkills();
    return () => {
      active = false;
    };
  }, []);

  const getForm = (): ProjectSubmissionForm => ({
    title,
    description,
    skills,
    budget,
    deadline,
    milestones,
    files,
  });

  const showFormError = (message: string) => {
    setFormError(message);
    toast.error(message);
  };

  const addSkill = (skill: ProjectSubmissionSkill) => {
    setSkills((current) => current.some((item) => item.id === skill.id)
      ? current
      : [...current, skill]);
  };

  const removeSkill = (skillId: string) => {
    setSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  const suggestSkills = async () => {
    if (!description.trim()) {
      showFormError('Add a project description before suggesting skills.');
      return;
    }

    setExtractingSkills(true);
    setFormError(null);
    try {
      const { data } = await matchingApi.extractSkills(description);
      const extractedIds = new Set(data.map((skill) => skill.skillId));
      const suggestions = skillOptions.filter((skill) => extractedIds.has(skill.id));
      setSkills((current) => {
        const selectedIds = new Set(current.map((skill) => skill.id));
        return [...current, ...suggestions.filter((skill) => !selectedIds.has(skill.id))];
      });
      toast.success(
        suggestions.length > 0
          ? `Added ${suggestions.length} suggested skill${suggestions.length === 1 ? '' : 's'}.`
          : 'No additional taxonomy skills were found in the description.',
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to suggest skills right now.'));
    } finally {
      setExtractingSkills(false);
    }
  };

  const addFiles = (selected: File[]) => {
    const next = [...files, ...selected].filter(
      (file, index, all) => all.findIndex((candidate) => (
        candidate.name === file.name && candidate.size === file.size && candidate.lastModified === file.lastModified
      )) === index,
    );
    const error = validateProjectFiles(next);
    if (error) {
      showFormError(error);
      return;
    }
    setFormError(null);
    setFiles(next);
  };

  const addMilestone = () => {
    setMilestones([...milestones, { title: '', description: '', amount: '' }]);
  };

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: string, value: string) => {
    const updated = [...milestones];
    (updated[index] as Record<string, string>)[field] = value;
    setMilestones(updated);
  };

  const handleNext = () => {
    const error = validateProjectStep(currentStep, getForm());
    if (error) {
      showFormError(error);
      return;
    }

    setFormError(null);
    setCurrentStep((step) => Math.min(4, step + 1));
  };

  const handlePrevious = () => {
    setFormError(null);
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const validationError = validateProjectStep(4, getForm());
    if (validationError) {
      showFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      await submitProject(projectsApi, getForm());
      toast.success('Project posted successfully.');
      router.push('/dashboard/employer/projects');
      router.refresh();
    } catch (error) {
      const fallback = error instanceof ProjectFormValidationError
        ? error.message
        : 'Unable to post the project. Please try again.';
      const message = getApiErrorMessage(error, fallback);
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Post a new project</h1>
        <p className="text-muted-foreground">Create a project listing to find the best talent</p>
      </div>

      {/* Progress Steps */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.id}
            aria-current={currentStep === step.id ? 'step' : undefined}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center ${
              currentStep === step.id
                ? 'gradient-primary text-primary-foreground'
                : currentStep > step.id
                ? 'bg-success-subtle text-success'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            <step.icon className="h-4 w-4 shrink-0" />
            <span className="text-sm font-medium">{step.title}</span>
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Project Details</h2>
                <div className="space-y-4">
                  <Field label="Project Title" htmlFor="title">
<Input
                      id="title"
                      placeholder="e.g., E-commerce Platform Development"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
</Field>
                  <Field label="Description" htmlFor="description">
<Textarea
                      id="description"
                      placeholder="Describe your project in detail..."
                      rows={6}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
</Field>
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Label id="required-skills-label">Required Skills</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        loading={extractingSkills}
                        loadingText="Analysing…"
                        disabled={skillsLoading || !description.trim()}
                        onClick={() => void suggestSkills()}
                      >
                        <Sparkles className="size-4" aria-hidden="true" />
                        Suggest from description
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {skills.map((skill) => (
                        <Badge key={skill.id} variant="secondary" className="text-sm py-1.5 px-3">
                          {skill.name}
                          <button
                            type="button"
                            aria-label={`Remove ${skill.name}`}
                            className="ml-1 rounded-sm hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            onClick={() => removeSkill(skill.id)}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2" aria-labelledby="required-skills-label">
                      {skillsLoading && (
                        <span role="status" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <span className="sr-only">Loading skills</span>
                        </span>
                      )}
                      {!skillsLoading && skillOptions
                        .filter((option) => !skills.some((skill) => skill.id === option.id))
                        .slice(0, 8)
                        .map((skill) => (
                          <button
                            key={skill.id}
                            type="button"
                            className={badgeVariants({
                              variant: 'outline',
                              className: 'h-auto cursor-pointer hover:bg-primary/10',
                            })}
                            onClick={() => addSkill(skill)}
                          >
                            + {skill.name}
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="project-files">Reference attachments (optional)</Label>
                    <label
                      htmlFor="project-files"
                      className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50 focus-within:border-primary"
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        addFiles(Array.from(event.dataTransfer.files));
                      }}
                    >
                      <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Drag files here or choose files</span>
                      <span className="mt-1 block text-xs text-muted-foreground">Up to 10 files, 10 MB each and 25 MB total</span>
                      <input
                        id="project-files"
                        type="file"
                        multiple
                        className="sr-only"
                        accept=".pdf,.doc,.docx,.xlsx,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.webp,.zip,.rar,.7z,.mp4,.webm,.mov"
                        onChange={(event) => {
                          addFiles(Array.from(event.target.files ?? []));
                          event.target.value = '';
                        }}
                      />
                    </label>
                    {files.length > 0 && (
                      <ul className="space-y-2" aria-label="Selected project attachments">
                        {files.map((file) => (
                          <li key={`${file.name}-${file.size}-${file.lastModified}`} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                            <span className="min-w-0 truncate">{file.name} <span className="text-muted-foreground">({formatFileSize(file.size)})</span></span>
                            <Button type="button" size="icon" variant="ghost" aria-label={`Remove ${file.name}`} onClick={() => setFiles((current) => current.filter((candidate) => candidate !== file))}>
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Milestones</h2>
                <Button type="button" variant="outline" size="sm" onClick={addMilestone}>
                  <Plus className="w-4 h-4 mr-2" /> Add Milestone
                </Button>
              </div>
              <div className="space-y-4">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-xl bg-secondary/50 border border-border"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium">Milestone {index + 1}</span>
                      {milestones.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove milestone ${index + 1}`}
                          className="h-8 w-8 text-destructive"
                          onClick={() => removeMilestone(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-${index}-title`}>Title</Label>
                        <Input
                          id={`milestone-${index}-title`}
                          placeholder="e.g., UI Design"
                          value={milestone.title}
                          onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`milestone-${index}-amount`}>Amount ($)</Label>
                        <Input
                          id={`milestone-${index}-amount`}
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="0.00"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label htmlFor={`milestone-${index}-description`}>Description</Label>
                        <Textarea
                          id={`milestone-${index}-description`}
                          placeholder="Describe the deliverables..."
                          rows={2}
                          value={milestone.description}
                          onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Budget & Timeline</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Field label="Total Budget ($)" htmlFor="budget">
<Input
                      id="budget"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="0.00"
                      value={budget}
                      onChange={(e) => setBudget(e.target.value)}
                    />
</Field>
                  <Field label="Deadline" htmlFor="deadline">
<Input
                      id="deadline"
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                    />
</Field>
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-2 text-primary mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Rush Project?</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enable rush mode to attract freelancers faster. A rush fee will be added to your budget.
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h3 className="font-medium mb-3">Budget Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Milestones Total</span>
                        <span>
                          ${milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Platform Fee (5%)</span>
                        <span>
                          ${(milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) * 0.05).toFixed(2)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-medium">
                        <span>Total</span>
                        <span className="text-primary">
                          ${(milestones.reduce((sum, m) => sum + (parseFloat(m.amount) || 0), 0) * 1.05).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold">Review & Post</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Project Title</h3>
                  <p className="text-muted-foreground">{title || 'Not set'}</p>
                </div>
                {files.length > 0 && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h3 className="font-medium mb-2">Reference attachments</h3>
                    <p className="text-sm text-muted-foreground">{files.length} file{files.length === 1 ? '' : 's'} will be shared with freelancers.</p>
                  </div>
                )}
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Description</h3>
                  <p className="text-muted-foreground">{description || 'Not set'}</p>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                    ))}
                  </div>
                </div>
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-medium mb-2">Milestones</h3>
                  <div className="space-y-2">
                    {milestones.map((m, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span>{m.title || `Milestone ${i + 1}`}</span>
                        <span className="font-medium">${m.amount || '0'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {formError && (
        <p id="project-form-error" role="alert" className="text-sm font-medium text-destructive">
          {formError}
        </p>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1 || isSubmitting}
        >
          <ChevronLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        {currentStep < 4 ? (
          <Button
            type="button"
            variant="gradient"
            onClick={handleNext}
          >
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            type="button"
            variant="gradient"
            aria-describedby={formError ? 'project-form-error' : undefined}
            loading={isSubmitting}
            loadingText="Posting…"
            onClick={() => void handleSubmit()}
          >
            Post project
          </Button>
        )}
      </div>
    </div>
  );
}
