'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, ExternalLink, Pencil, Plus, Save, Share2, Trash2, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { skillsApi, freelancersApi } from '@/lib/api';
import { useUnsavedChangesWarning } from '@/hooks/use-unsaved-changes-warning';
import { useProfileEditor } from '@/hooks/use-profile-editor';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  getFirstIncompleteTab,
  findDuplicateExperience,
  validateExperience,
  getExperienceDateErrors,
  todayDateInputValue,
  EXPERIENCE_MIN_DATE,
  type ExperienceForm,
  type FreelancerProfileForm,
} from '@/lib/profile-form';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole, WorkExperience } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { Field } from '@/components/ui/field';
import { DatePicker } from '@/components/ui/date-picker';
import { isCompleteDateValue, nextDateValue } from '@/lib/date-select';
import { UnsavedChangesBar, UnsavedChangesDialog } from '@/components/ui/unsaved-changes';
import { SuggestSkillDialog } from '@/components/dashboard/suggest-skill-dialog';
import { ProjectSkillSelector } from '@/components/dashboard/project-skill-selector';
import { SkillCategoryScope, useSkillCategoryScope } from '@/components/dashboard/skill-category-scope';
import { EmployerProfileFields } from '@/components/dashboard/employer-profile-fields';
import { useRoleSwitch } from '@/hooks/use-role-switch';
import {
  isSoftSkillCategory,
  skillNameKey,
  toSkillCategories,
  type SkillOption,
  type SkillOptionCategory,
} from '@/lib/skill-taxonomy';
import { formatDate } from '@/lib/format';

type ProfileRole = Extract<UserRole, 'employer' | 'freelancer'>;

const emptyExperience: ExperienceForm = { title: '', company: '', description: '', startDate: '', endDate: null, skills: [] };


function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

export function ProfileEditor({
  role,
  onboarding = false,
}: {
  role: ProfileRole;
  /** Employer only: "Become an employer" setup for a freelancer, finishing with a role switch. */
  onboarding?: boolean;
}) {
  const user = useAuthStore((state) => state.user);
  const { switchTo, switching } = useRoleSwitch();
  const router = useRouter();
  const pathname = usePathname();
  const {
    freelancerProfile,
    employerProfile,
    freelancerForm,
    employerForm,
    loading,
    saving,
    error: loadError,
    isDirty,
    updateFreelancerField,
    updateEmployerField,
    setFreelancerProfile,
    save: saveProfile,
    reset: discardChanges,
    reload: reloadProfile,
  } = useProfileEditor(role);

  const [skillCategories, setSkillCategories] = useState<SkillOptionCategory[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(role === 'freelancer');
  const [experienceForm, setExperienceForm] = useState<ExperienceForm>(emptyExperience);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  // "I currently work here": the entry has no end date and shows as Present.
  const [currentlyWorking, setCurrentlyWorking] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [suggestSkillOpen, setSuggestSkillOpen] = useState(false);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  // Skill changes save one at a time so quick clicks never overwrite each other.
  const skillQueue = useRef<Promise<void>>(Promise.resolve());
  // Blocks a second submit (double click, Enter + click) before the first one finishes.
  const savingExperience = useRef(false);

  const loadSkillCategories = useCallback(
    () =>
      skillsApi
        .getTaxonomy()
        .then(({ data }) => setSkillCategories(toSkillCategories(data.categories)))
        .catch(() => setSkillCategories([]))
        .finally(() => setSkillsLoading(false)),
    []
  );

  useEffect(() => {
    if (role !== 'freelancer') return;
    void loadSkillCategories();
  }, [role, loadSkillCategories]);

  const catalogByName = useMemo(() => {
    const options = new Map<string, SkillOption>();
    for (const category of skillCategories) {
      for (const skill of category.skills) options.set(skillNameKey(skill.name), skill);
    }
    return options;
  }, [skillCategories]);

  // Catalog skills keep their catalog id; anything else (legacy or custom names) stays removable.
  const toSkillOptions = useCallback(
    (names: string[]): SkillOption[] =>
      names.map((name) => catalogByName.get(skillNameKey(name)) ?? { id: `legacy:${name}`, name }),
    [catalogByName]
  );

  const profileSkills = useMemo(() => freelancerProfile?.skills ?? [], [freelancerProfile?.skills]);
  const profileSkillOptions = useMemo(
    () => toSkillOptions(profileSkills.map((skill) => skill.name)),
    [profileSkills, toSkillOptions]
  );
  const profileSkillByOptionId = useMemo(
    () => new Map(profileSkillOptions.map((option, index) => [option.id, profileSkills[index]!])),
    [profileSkillOptions, profileSkills]
  );
  const experienceSkillOptions = useMemo(
    () => toSkillOptions(experienceForm.skills),
    [experienceForm.skills, toSkillOptions]
  );
  // The job position narrows the technical skills to its categories; soft skills always show.
  const positionScope = useSkillCategoryScope(experienceForm.title, skillCategories);

  const softSkillNames = useMemo(
    () =>
      new Set(
        skillCategories
          .filter((category) => isSoftSkillCategory(category.name))
          .flatMap((category) => category.skills.map((skill) => skillNameKey(skill.name)))
      ),
    [skillCategories]
  );
  const workHistorySkillNames = useMemo(
    () =>
      new Set((freelancerProfile?.experience ?? []).flatMap((entry) => entry.skills.map((name) => skillNameKey(name)))),
    [freelancerProfile?.experience]
  );
  // Skills outside the catalog count as technical.
  const skillGroups = useMemo(
    () => [
      { label: 'Technical', listLabel: 'Technical skills', skills: profileSkills.filter((skill) => !softSkillNames.has(skillNameKey(skill.name))) },
      { label: 'Soft', listLabel: 'Soft skills', skills: profileSkills.filter((skill) => softSkillNames.has(skillNameKey(skill.name))) },
    ],
    [profileSkills, softSkillNames]
  );
  const identityProfile = role === 'freelancer' ? freelancerProfile : employerProfile;

  const unsavedChanges = useUnsavedChangesWarning(isDirty && !saving, { onSave: saveProfile });

  const queueSkillChange = (change: () => Promise<void>) => {
    skillQueue.current = skillQueue.current.then(change, change);
  };

  const addSkill = (skill: SkillOption) =>
    queueSkillChange(async () => {
      try {
        const { data } = await freelancersApi.addSkills([{ name: skill.name, yearsOfExperience: 0 }]);
        setFreelancerProfile(data);
      } catch (error) {
        toast.error(getApiErrorMessage(error, `Unable to add ${skill.name}.`));
      }
    });

  const removeSkill = (name: string) =>
    queueSkillChange(async () => {
      try {
        const { data } = await freelancersApi.removeSkill(name);
        setFreelancerProfile(data);
        if (data.skills.some((skill) => skillNameKey(skill.name) === skillNameKey(name))) {
          toast.info(`${name} is still listed in your work history — remove it there.`);
        }
      } catch (error) {
        toast.error(getApiErrorMessage(error, `Unable to remove ${name}.`));
      }
    });

  const removeSkillFromSummary = (event: React.MouseEvent<HTMLButtonElement>) => {
    const name = event.currentTarget.dataset.skill;
    if (name) removeSkill(name);
  };

  const removeSkillOption = (optionId: string) => {
    const skill = profileSkillByOptionId.get(optionId);
    if (!skill) return;
    if (!skill.addedManually) {
      toast.info(`${skill.name} comes from your work history — remove it there.`);
      return;
    }
    removeSkill(skill.name);
  };

  const today = todayDateInputValue();
  const experienceDateErrors = getExperienceDateErrors(experienceForm, today);
  // The end date has to be at least a day after the start date.
  const earliestEndDate = isCompleteDateValue(experienceForm.startDate)
    ? nextDateValue(experienceForm.startDate)
    : EXPERIENCE_MIN_DATE;
  const noEndDateAvailable = earliestEndDate > today && !experienceForm.endDate;

  const changeCurrentlyWorking = (checked: boolean) => {
    setCurrentlyWorking(checked);
    if (checked) setExperienceForm((current) => ({ ...current, endDate: null }));
  };

  const editExperience = (experience: WorkExperience) => {
    setEditingExperienceId(experience.id);
    positionScope.reset();
    setExperienceForm({
      title: experience.title,
      company: experience.company,
      description: experience.description,
      startDate: dateInputValue(experience.startDate),
      endDate: dateInputValue(experience.endDate) || null,
      skills: experience.skills ?? [],
    });
    setCurrentlyWorking(!experience.endDate);
    setShowExperienceForm(true);
  };

  const resetExperienceForm = () => {
    setEditingExperienceId(null);
    setExperienceForm(emptyExperience);
    setCurrentlyWorking(false);
    positionScope.reset();
    setShowExperienceForm(false);
  };

  const saveExperience = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (savingExperience.current) return;
    const validationError = validateExperience(experienceForm, undefined, { currentlyWorking });
    if (validationError) {
      toast.error(validationError);
      return;
    }
    if (findDuplicateExperience(experienceForm, freelancerProfile?.experience ?? [], editingExperienceId)) {
      toast.error('This work history entry is already on your profile.');
      return;
    }

    savingExperience.current = true;
    setActionId('experience');
    try {
      const response = editingExperienceId
        ? await freelancersApi.updateExperience(editingExperienceId, experienceForm)
        : await freelancersApi.addExperience(experienceForm);
      setFreelancerProfile(response.data);
      resetExperienceForm();
      toast.success(editingExperienceId ? 'Work history updated.' : 'Work history added.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save this work history entry.'));
    } finally {
      savingExperience.current = false;
      setActionId(null);
    }
  };

  const removeExperience = async (id: string) => {
    setActionId(`experience:${id}`);
    try {
      const { data } = await freelancersApi.removeExperience(id);
      setFreelancerProfile(data);
      toast.success('Work history removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to remove this work history entry.'));
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <DetailSkeleton label="Loading profile" />;
  }

  if (loadError) {
    return (
      <Card>
        <CardContent className="space-y-4 py-12 text-center">
          <p className="text-muted-foreground">{loadError}</p>
          <Button variant="outline" onClick={() => void saveProfile()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Last step of "Become an employer": save any edits, then switch. If the
  // server still finds gaps, jump to the first step that has them.
  const finishOnboarding = async () => {
    if (isDirty && !(await saveProfile())) return;
    await switchTo('employer', {
      onIncomplete: (gaps) => {
        router.replace(`${pathname}?tab=${getFirstIncompleteTab(gaps)}`, { scroll: false });
      },
    });
  };

  const identityCard = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5" />
          Account identity
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <Field label="Verified name" htmlFor="profile-name">
          <Input id="profile-name" value={identityProfile?.name || user?.name || ''} disabled />
        </Field>
        <Field label="Nationality" htmlFor="profile-nationality">
          <Input id="profile-nationality" value={identityProfile?.nationality || 'Not available'} disabled />
        </Field>
        <Field label="Email" htmlFor="profile-email">
          <Input id="profile-email" value={user?.email ?? ''} disabled />
        </Field>
      </CardContent>
    </Card>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {onboarding ? (
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Become an employer</h1>
            <p className="text-muted-foreground">
              Add your business information and documents. Once everything required is in, you can start acting as an
              employer — and switch back to freelancer any time.
            </p>
          </div>
        ) : (
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Profile</h1>
            <p className="text-muted-foreground">Keep the information shown to marketplace participants up to date.</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {role === 'freelancer' && user?.id && (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href={`/freelancers/${user.id}`} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 size-3.5" aria-hidden="true" />
                  View public profile
                </Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const url = `${window.location.origin}/freelancers/${user.id}`;
                    void navigator.clipboard.writeText(url);
                    toast.success('Public profile link copied to clipboard!');
                  }
                }}
              >
                <Share2 className="mr-1.5 size-3.5" aria-hidden="true" />
                Share link
              </Button>
            </>
          )}
          <Button
            type="button"
            variant={onboarding ? 'outline' : 'default'}
            onClick={() => void saveProfile()}
            loading={saving}
            loadingText="Saving…"
            disabled={!isDirty}
          >
            <Save className="size-4" aria-hidden="true" />
            Save profile
          </Button>
        </div>
      </div>

      {role === 'freelancer' ? (
        <>
          {identityCard}
          <Card>
            <CardHeader>
              <CardTitle>Professional details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  value={freelancerForm.bio}
                  onChange={(event) => updateFreelancerField('bio', event.target.value)}
                  rows={5}
                />
              </div>
              <Field label="Hourly rate (PHP)" htmlFor="hourly-rate">
                <Input
                  id="hourly-rate"
                  type="number"
                  min="1"
                  value={freelancerForm.hourlyRate}
                  onChange={(event) => updateFreelancerField('hourlyRate', Number(event.target.value))}
                />
              </Field>
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <select
                  id="availability"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  value={freelancerForm.availability}
                  onChange={(event) =>
                    updateFreelancerField('availability', event.target.value as FreelancerProfileForm['availability'])
                  }
                >
                  <option value="available">Available</option>
                  <option value="busy">Busy</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {freelancerProfile && (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="size-5" />
                    Work History
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Saved as soon as you add, update or remove an entry. Skills you list here are added to your Skills.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="shrink-0 self-start"
                  onClick={() => {
                    resetExperienceForm();
                    setShowExperienceForm(true);
                  }}
                >
                  <Plus className="mr-2 size-4" />
                  Add work history
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(freelancerProfile.experience ?? []).map((experience) => (
                  <div key={experience.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold">{experience.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {experience.company} · {formatDate(experience.startDate)} – {experience.endDate ? formatDate(experience.endDate) : 'Present'}
                      </p>
                      <p className="mt-2 text-sm">{experience.description}</p>
                      {experience.skills.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {[
                            { label: 'Technical', skills: experience.skills.filter((name) => !softSkillNames.has(skillNameKey(name))) },
                            { label: 'Soft', skills: experience.skills.filter((name) => softSkillNames.has(skillNameKey(name))) },
                          ]
                            .filter((group) => group.skills.length > 0)
                            .map((group) => (
                              <div key={group.label} className="flex flex-wrap items-center gap-1.5">
                                <span className="w-20 shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  {group.label}
                                </span>
                                <ul className="flex flex-wrap gap-1.5" aria-label={`${group.label} skills used as ${experience.title}`}>
                                  {group.skills.map((skill) => (
                                    <li key={skill}>
                                      <Badge variant="outline">{skill}</Badge>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="touch-manipulation"
                        aria-label={`Edit ${experience.title}`}
                        onClick={() => editExperience(experience)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="touch-manipulation"
                        aria-label={`Delete ${experience.title}`}
                        disabled={actionId === `experience:${experience.id}`}
                        onClick={() => void removeExperience(experience.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
                {freelancerProfile.experience.length === 0 && <p className="text-sm text-muted-foreground">No work history added yet.</p>}

                {showExperienceForm && (
                  <form className="grid grid-cols-1 gap-4 rounded-lg border border-border p-4 sm:grid-cols-2" onSubmit={saveExperience}>
                    <Field label="Job position" htmlFor="experience-title">
                      <Input
                        id="experience-title"
                        placeholder="e.g. Mobile Developer, Senior iOS Engineer"
                        value={experienceForm.title}
                        onChange={(event) => setExperienceForm((current) => ({ ...current, title: event.target.value }))}
                      />
                    </Field>
                    <Field label="Company" htmlFor="experience-company">
                      <Input
                        id="experience-company"
                        value={experienceForm.company}
                        onChange={(event) => setExperienceForm((current) => ({ ...current, company: event.target.value }))}
                      />
                    </Field>
                    <Field label="Start date" htmlFor="experience-start" error={experienceDateErrors.startDate}>
                      <DatePicker
                        label="Start date"
                        min={EXPERIENCE_MIN_DATE}
                        max={today}
                        value={experienceForm.startDate}
                        onChange={(startDate) => setExperienceForm((current) => ({ ...current, startDate }))}
                      />
                    </Field>
                    <Field
                      label="End date"
                      htmlFor="experience-end"
                      error={currentlyWorking ? undefined : experienceDateErrors.endDate}
                      disabled={currentlyWorking || noEndDateAvailable}
                    >
                      <DatePicker
                        label="End date"
                        min={earliestEndDate}
                        max={today}
                        value={currentlyWorking ? '' : experienceForm.endDate ?? ''}
                        onChange={(endDate) => setExperienceForm((current) => ({ ...current, endDate: endDate || null }))}
                      />
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="experience-current"
                          checked={currentlyWorking}
                          onCheckedChange={(checked) => changeCurrentlyWorking(Boolean(checked))}
                        />
                        <Label htmlFor="experience-current" className="text-sm font-normal">
                          I currently work here
                        </Label>
                      </div>
                      {noEndDateAvailable && !currentlyWorking && (
                        <p className="text-xs text-muted-foreground">
                          Your start date is today, so tick &quot;I currently work here&quot;.
                        </p>
                      )}
                    </Field>
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="experience-description">Description</Label>
                      <Textarea
                        id="experience-description"
                        value={experienceForm.description}
                        onChange={(event) => setExperienceForm((current) => ({ ...current, description: event.target.value }))}
                      />
                    </div>
                    <div className="min-w-0 space-y-2 sm:col-span-2">
                      <p id="experience-skills-label" className="text-sm font-medium">
                        Skills used in this role
                      </p>
                      <p id="experience-skills-hint" className="text-xs text-muted-foreground">
                        Pick the technical and soft skills you used. They are added to your Skills automatically.
                      </p>
                      <SkillCategoryScope
                        scope={positionScope}
                        hasText={Boolean(experienceForm.title.trim())}
                        emptyText="Type your job position to narrow these skills."
                        noMatchText="No match for your job position — showing all technical skills."
                      />
                      <ProjectSkillSelector
                        categories={positionScope.scopedCategories}
                        selected={experienceSkillOptions}
                        loading={skillsLoading}
                        labelledBy="experience-skills-label"
                        describedBy="experience-skills-hint"
                        onAdd={(skill) =>
                          setExperienceForm((current) => ({ ...current, skills: [...current.skills, skill.name] }))
                        }
                        onRemove={(skillId) => {
                          const removed = experienceSkillOptions.find((option) => option.id === skillId);
                          if (!removed) return;
                          setExperienceForm((current) => ({
                            ...current,
                            skills: current.skills.filter((name) => skillNameKey(name) !== skillNameKey(removed.name)),
                          }));
                        }}
                        splitSoftSkills
                        showSelectedPanel={false}
                      />
                    </div>
                    <div className="flex gap-2 sm:col-span-2">
                      <Button type="submit" disabled={actionId === 'experience'}>
                        {editingExperienceId ? 'Update work history' : 'Add work history'}
                      </Button>
                      <Button type="button" variant="ghost" onClick={resetExperienceForm}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {freelancerProfile && (
            <Card>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <CardTitle id="profile-skills-label">Skills</CardTitle>
                  <p id="profile-skills-hint" className="text-sm text-muted-foreground">
                    Skills from your work history are added automatically.
                  </p>
                </div>
                <Button
                  type="button"
                  variant={skillPickerOpen ? 'default' : 'outline'}
                  size="sm"
                  className="shrink-0 self-start"
                  aria-expanded={skillPickerOpen}
                  aria-controls="profile-skill-picker"
                  onClick={() => setSkillPickerOpen((open) => !open)}
                >
                  {skillPickerOpen ? (
                    'Done'
                  ) : (
                    <>
                      <Plus className="mr-2 size-4" />
                      Add skills
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileSkills.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No skills yet. Add them here or through your work history.</p>
                ) : (
                  skillGroups
                    .filter((group) => group.skills.length > 0)
                    .map((group) => (
                      <section key={group.label} className="space-y-2">
                        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{group.label}</h3>
                        <ul className="flex flex-wrap gap-2" aria-label={group.listLabel}>
                          {group.skills.map((skill) => {
                            const fromWorkHistory = workHistorySkillNames.has(skillNameKey(skill.name));
                            return (
                              <li key={skill.name}>
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 py-1 pl-3 text-sm ${fromWorkHistory ? 'pr-3' : 'pr-1'}`}
                                >
                                  {skill.name}
                                  {skill.yearsOfExperience > 0 && (
                                    <span className="text-xs text-muted-foreground">· {skill.yearsOfExperience}y</span>
                                  )}
                                  {fromWorkHistory ? (
                                    <span title="From your work history" className="inline-flex text-muted-foreground">
                                      <Briefcase className="size-3.5" aria-hidden="true" />
                                      <span className="sr-only">(from your work history)</span>
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      aria-label={`Remove ${skill.name}`}
                                      data-skill={skill.name}
                                      onClick={removeSkillFromSummary}
                                      className="rounded-full p-0.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    >
                                      <X className="size-3.5" aria-hidden="true" />
                                    </button>
                                  )}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </section>
                    ))
                )}
                {skillPickerOpen && (
                  <div id="profile-skill-picker">
                    <ProjectSkillSelector
                      categories={skillCategories}
                      selected={profileSkillOptions}
                      loading={skillsLoading}
                      labelledBy="profile-skills-label"
                      describedBy="profile-skills-hint"
                      onAdd={addSkill}
                      onRemove={removeSkillOption}
                      splitSoftSkills
                      showSelectedPanel={false}
                      showUnlistedPicks={false}
                    />
                  </div>
                )}
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="size-3.5" aria-hidden="true" />
                    From your work history
                  </span>
                  <button
                    type="button"
                    onClick={() => setSuggestSkillOpen(true)}
                    className="font-medium text-primary underline underline-offset-4 hover:opacity-85 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    Can&apos;t find your skill? Suggest it
                  </button>
                </div>
                <SuggestSkillDialog
                  open={suggestSkillOpen}
                  onOpenChange={setSuggestSkillOpen}
                  onSkillSuggested={async () => {
                    await reloadProfile();
                    await loadSkillCategories();
                  }}
                />
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <EmployerProfileFields
          form={employerForm}
          profile={employerProfile}
          updateField={updateEmployerField}
          identityCard={identityCard}
          onboarding={onboarding ? { onFinish: () => void finishOnboarding(), finishing: saving || switching === 'employer' } : undefined}
        />
      )}

      <UnsavedChangesBar visible={isDirty} saving={saving} onCancel={discardChanges} onSave={() => void saveProfile()} />
      <UnsavedChangesDialog guard={unsavedChanges} saving={saving} />
    </div>
  );
}
