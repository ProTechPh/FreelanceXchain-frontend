'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { employersApi, matchingApi, projectsApi, skillsApi } from '@/lib/api';
import { UpgradeButton } from '@/components/billing/upgrade-button';
import { usePlan } from '@/hooks/use-plan';
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
import { reportFailure } from '@/lib/report-failure';
import { ChevronRight, ChevronLeft, X, Upload, FileText, Target, Sparkles, AlertCircle, Users, HandCoins } from 'lucide-react';
import { ProjectSkillSelector, type ProjectSkillCategory } from '@/components/dashboard/project-skill-selector';
import { toSkillCategories } from '@/lib/skill-taxonomy';
import { DOCUMENT_ACCEPT_STRING } from '@/lib/file-validation';
import { Field } from '@/components/ui/field';
import { UnsavedChangesDialog } from '@/components/ui/unsaved-changes';
import { BusinessProfileCompletenessAlert } from '@/components/dashboard/employer-profile-fields';
import { getFirstIncompleteTab } from '@/lib/profile-form';
import type { BusinessProfileCompleteness } from '@/types';

const steps = [
  { id: 1, title: 'Project Details & Team', icon: FileText },
  { id: 2, title: 'Review & Post', icon: Target },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skills, setSkills] = useState<ProjectSubmissionSkill[]>([]);
  const [skillCategories, setSkillCategories] = useState<ProjectSkillCategory[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [freelancerLimit, setFreelancerLimit] = useState(5);
  const [files, setFiles] = useState<File[]>([]);
  const [extractingSkills, setExtractingSkills] = useState(false);
  const { isPro } = usePlan();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Posting a project requires a complete business profile (enforced by the API too).
  const [businessCompleteness, setBusinessCompleteness] = useState<BusinessProfileCompleteness | null>(null);
  // Decided once, when the check returns: show only the gate if nothing has been
  // typed yet. Later edits (e.g. clearing every skill) never swap the form out.
  const [gateOnly, setGateOnly] = useState(false);

  // Warn if user tries to leave with unsaved changes
  const isDirty = title !== '' || description !== '' || skills.length > 0 || files.length > 0;
  const unsavedChanges = useUnsavedChangesWarning(isDirty && !isSubmitting);
  const isDirtyRef = useRef(isDirty);
  useEffect(() => {
    isDirtyRef.current = isDirty;
  }, [isDirty]);

  useEffect(() => {
    let active = true;

    const loadSkills = async () => {
      try {
        const { data } = await skillsApi.getTaxonomy();
        if (active) {
          setSkillCategories(toSkillCategories(data.categories));
        }
      } catch (error) {
        if (active) {
          reportFailure(error, 'load the skill list');
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

  useEffect(() => {
    let active = true;
    employersApi
      .getCompleteness()
      .then(({ data }) => {
        if (!active) return;
        setBusinessCompleteness(data);
        setGateOnly(!data.complete && !isDirtyRef.current);
      })
      .catch((error) => {
        // No employer profile yet: everything is missing. Other failures are left
        // to the API, which rejects the post if the profile is incomplete.
        if (
          active &&
          axios.isAxiosError(error) &&
          error.response?.status === 404 &&
          error.response.data?.error?.code === 'PROFILE_NOT_FOUND'
        ) {
          setGateOnly(!isDirtyRef.current);
          setBusinessCompleteness({
            complete: false,
            missingFields: ['companyName', 'description', 'industry', 'businessType', 'tin', 'registrationNumber', 'businessAddress', 'businessPhone', 'businessEmail', 'yearEstablished'],
            missingDocuments: ['bir_2303', 'sec_registration', 'mayors_permit'],
          });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const getForm = (): ProjectSubmissionForm => ({
    title,
    description,
    skills,
    freelancerLimit,
    budget: '',
    deadline: '',
    milestones: [],
    files,
  });

  const clearFieldError = (field: string) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const showFormError = (message: string, fieldKey?: string) => {
    setFormError(message);
    if (fieldKey) {
      setFieldErrors((current) => ({ ...current, [fieldKey]: message }));
    }
    toast.error(message);
  };

  const addSkill = (skill: ProjectSubmissionSkill) => {
    clearFieldError('skills');
    setSkills((current) => current.some((item) => item.id === skill.id)
      ? current
      : [...current, skill]);
  };

  const removeSkill = (skillId: string) => {
    setSkills((current) => current.filter((skill) => skill.id !== skillId));
  };

  const suggestSkills = async () => {
    if (!isPro) return;
    if (!description.trim()) {
      showFormError('Add a project description before suggesting skills.', 'description');
      return;
    }

    setExtractingSkills(true);
    setFormError(null);
    try {
      const { data } = await matchingApi.extractSkills(description);
      const extractedIds = new Set(data.map((skill) => skill.skillId));
      const suggestions = skillCategories.flatMap((category) => category.skills).filter((skill) => extractedIds.has(skill.id));
      setSkills((current) => {
        const selectedIds = new Set(current.map((skill) => skill.id));
        return [...current, ...suggestions.filter((skill) => !selectedIds.has(skill.id))];
      });
      clearFieldError('skills');
    } catch (error) {
      reportFailure(error, 'suggest matching skills');
    } finally {
      setExtractingSkills(false);
    }
  };

  const addFiles = (newFiles: File[]) => {
    clearFieldError('files');
    const combined = [...files, ...newFiles];
    const fileError = validateProjectFiles(combined);
    if (fileError) {
      showFormError(fileError, 'files');
      return;
    }
    setFormError(null);
    setFiles(combined);
  };

  const handleNext = () => {
    setFieldErrors({});

    if (currentStep === 1) {
      if (title.trim().length < 5) {
        showFormError('Project title must be at least 5 characters.', 'title');
        return;
      }
      if (description.trim().length < 20) {
        showFormError('Project description must be at least 20 characters.', 'description');
        return;
      }
      if (skills.length === 0) {
        showFormError('Select at least one required skill.', 'skills');
        return;
      }
      if (!freelancerLimit || freelancerLimit < 1) {
        showFormError('Please specify how many freelancers can join (minimum 1).', 'freelancerLimit');
        return;
      }
      const fileError = validateProjectFiles(files);
      if (fileError) {
        showFormError(fileError, 'files');
        return;
      }
    }

    const error = validateProjectStep(currentStep, getForm());
    if (error) {
      showFormError(error);
      return;
    }

    setFormError(null);
    setCurrentStep((step) => Math.min(2, step + 1));
  };

  const handlePrevious = () => {
    setFormError(null);
    setFieldErrors({});
    setCurrentStep((step) => Math.max(1, step - 1));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const validationError = validateProjectStep(1, getForm());
    if (validationError) {
      showFormError(validationError);
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const { csrfTokenManager } = await import('@/lib/api-client');
      await csrfTokenManager.ensureToken({ forceRefresh: true });

      await submitProject(projectsApi, getForm());
      toast.success('Project posted successfully.');
      router.push('/dashboard/employer/projects');
      router.refresh();
    } catch (error) {
      const fallback = error instanceof ProjectFormValidationError
        ? error.message
        : 'Unable to post the project. Please try again.';
      const message = getApiErrorMessage(error, fallback);
      if (axios.isAxiosError(error) && error.response?.data?.error?.code === 'BUSINESS_PROFILE_INCOMPLETE') {
        const details = error.response.data.error.details as Partial<BusinessProfileCompleteness> | undefined;
        setBusinessCompleteness({
          complete: false,
          missingFields: details?.missingFields ?? [],
          missingDocuments: details?.missingDocuments ?? [],
        });
      }
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const businessProfileIncomplete = businessCompleteness !== null && !businessCompleteness.complete;
  const businessProfileGate = businessProfileIncomplete && businessCompleteness && (
    <BusinessProfileCompletenessAlert
      completeness={businessCompleteness}
      action={
        <Button asChild size="sm">
          <Link href={`/dashboard/employer/profile?tab=${getFirstIncompleteTab(businessCompleteness)}`}>
            Complete business profile
          </Link>
        </Button>
      }
    />
  );

  // Nothing was typed when the check came back: show only the gate instead of a
  // form that cannot be posted.
  if (businessProfileIncomplete && gateOnly) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Post a new project</h1>
          <p className="text-muted-foreground">Create a project listing to find the best talent</p>
        </div>
        {businessProfileGate}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Post a new project</h1>
        <p className="text-muted-foreground">Define your project requirements and hire the best freelancers</p>
      </div>

      {businessProfileGate}

      {/* Progress Steps */}
      <div className="grid grid-cols-2 gap-2">
        {steps.map((step) => (
          <div
            key={step.id}
            aria-current={currentStep === step.id ? 'step' : undefined}
            className={`flex min-h-10 items-center justify-center gap-2 rounded-lg px-2 py-2 text-center text-sm font-medium ${
              currentStep === step.id
                ? 'gradient-primary text-white shadow-sm'
                : currentStep > step.id
                ? 'bg-success-subtle text-success border border-success/30'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            <step.icon className="h-4 w-4 shrink-0" />
            <span>{step.id}. {step.title}</span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <Card>
        <CardContent className="p-6">
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Project & Team Details</h2>
                <p className="text-sm text-muted-foreground">Provide core information about your project and team size.</p>
              </div>

              <div className="space-y-5">
                <Field
                  label="Project Title"
                  htmlFor="project-title"
                  error={fieldErrors.title}
                  required
                >
                  <Input
                    id="project-title"
                    placeholder="e.g., Full-Stack Web3 Marketplace Development"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      clearFieldError('title');
                    }}
                  />
                </Field>

                <Field
                  label="Description"
                  htmlFor="project-description"
                  error={fieldErrors.description}
                  required
                >
                  <Textarea
                    id="project-description"
                    placeholder="Detailed project description, scope of work, objectives, and deliverables..."
                    rows={6}
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      clearFieldError('description');
                    }}
                  />
                </Field>

                <div className="grid md:grid-cols-2 gap-4">
                  <Field
                    label="Freelancers Needed"
                    htmlFor="freelancer-limit"
                    description="How many freelancers can join this project? (e.g. 5 freelancers)"
                    error={fieldErrors.freelancerLimit}
                    required
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <Users className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="freelancer-limit"
                          type="number"
                          min={1}
                          max={50}
                          className="pl-9"
                          value={freelancerLimit}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            setFreelancerLimit(isNaN(val) ? 1 : Math.max(1, Math.min(50, val)));
                            clearFieldError('freelancerLimit');
                          }}
                        />
                      </div>
                      <Badge variant="outline" className="h-9 px-3 text-xs font-semibold shrink-0">
                        {freelancerLimit} {freelancerLimit === 1 ? 'Opening' : 'Openings'}
                      </Badge>
                    </div>
                  </Field>

                  {/* Flexible Agreement Callout */}
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col justify-center">
                    <div className="flex items-center gap-2 text-primary text-sm font-semibold mb-1">
                      <HandCoins className="h-4 w-4 shrink-0" />
                      <span>Negotiated Budget & Timeline</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Applicants will submit their proposed rates and delivery timelines. You can review proposals individually and release payment per freelancer based on agreed terms.
                    </p>
                  </div>
                </div>

                {/* Required Skills */}
                <div className="space-y-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <Label id="required-skills-label" className="text-sm font-medium">
                        Required skills <span className="text-destructive">*</span>
                      </Label>
                      <p id="required-skills-hint" className="text-xs text-muted-foreground">
                        Select skills to match with qualified freelancers.
                      </p>
                    </div>
                    {isPro ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={extractingSkills || !description.trim()}
                        onClick={() => void suggestSkills()}
                        className="h-8"
                      >
                        <Sparkles className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        {extractingSkills ? 'Extracting…' : 'Suggest with AI'}
                      </Button>
                    ) : (
                      <UpgradeButton
                        variant="outline"
                        size="sm"
                        source="extract-skills"
                        label="AI suggestions (Pro)"
                        className="h-8"
                      />
                    )}
                  </div>
                  {fieldErrors.skills && (
                    <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                      {fieldErrors.skills}
                    </p>
                  )}
                  <ProjectSkillSelector
                    categories={skillCategories}
                    selected={skills}
                    loading={skillsLoading}
                    onAdd={addSkill}
                    onRemove={removeSkill}
                    onClear={() => setSkills([])}
                    invalid={Boolean(fieldErrors.skills)}
                    labelledBy="required-skills-label"
                    describedBy="required-skills-hint"
                  />
                </div>

                {/* Reference Attachments */}
                <div className="space-y-2">
                  <Label htmlFor="project-files">Reference attachments (optional)</Label>
                  <label
                    htmlFor="project-files"
                    className="block cursor-pointer rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50 focus-within:border-primary"
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => {
                      event.preventDefault();
                      addFiles(Array.from(event.dataTransfer.files));
                    }}
                  >
                    <Upload className="mx-auto mb-2 h-7 w-7 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Drag files here or choose files</span>
                    <span className="mt-1 block text-xs text-muted-foreground">Up to 10 files, 10 MB each and 25 MB total</span>
                    <input
                      id="project-files"
                      type="file"
                      multiple
                      className="sr-only"
                      accept={DOCUMENT_ACCEPT_STRING}
                      onChange={(event) => {
                        addFiles(Array.from(event.target.files ?? []));
                        event.target.value = '';
                      }}
                    />
                  </label>
                  {fieldErrors.files && (
                    <p role="alert" className="flex items-start gap-1.5 text-xs font-medium text-destructive">
                      <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
                      {fieldErrors.files}
                    </p>
                  )}
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
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Review & Post Project</h2>
                <p className="text-sm text-muted-foreground">Double check your project details before publishing to the marketplace.</p>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-semibold text-sm mb-1 text-muted-foreground uppercase tracking-wide">Project Title</h3>
                  <p className="text-foreground font-medium text-base">{title || 'Not set'}</p>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-semibold text-sm mb-1 text-muted-foreground uppercase tracking-wide">Description</h3>
                  <p className="text-muted-foreground text-sm whitespace-pre-wrap">{description || 'Not set'}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">Team Capacity</h3>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="font-bold text-foreground text-base">
                        Up to {freelancerLimit} freelancer{freelancerLimit === 1 ? '' : 's'} can join
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      You can accept proposals and create individual contracts up to this limit.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">Budget & Timeline Terms</h3>
                    <div className="flex items-center gap-2">
                      <HandCoins className="h-4 w-4 text-primary" />
                      <span className="font-semibold text-foreground text-sm">
                        Agreed per freelancer
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      No pre-set milestone locking. Rates are based on each freelancer&apos;s proposal.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                  <h3 className="font-semibold text-sm mb-2 text-muted-foreground uppercase tracking-wide">Required Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <Badge key={skill.id} variant="secondary">{skill.name}</Badge>
                    ))}
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="p-4 rounded-xl bg-secondary/50 border border-border">
                    <h3 className="font-semibold text-sm mb-1 text-muted-foreground uppercase tracking-wide">Reference Attachments</h3>
                    <p className="text-sm text-muted-foreground">{files.length} file{files.length === 1 ? '' : 's'} attached.</p>
                  </div>
                )}
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
        {currentStep < 2 ? (
          <Button
            type="button"
            variant="gradient"
            onClick={handleNext}
          >
            Review Project <ChevronRight className="w-4 h-4 ml-2" />
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
            Post Project
          </Button>
        )}
      </div>

      <UnsavedChangesDialog
        guard={unsavedChanges}
        title="Leave this draft?"
        description="This project has not been posted yet. Leaving this page discards the draft."
      />
    </div>
  );
}
