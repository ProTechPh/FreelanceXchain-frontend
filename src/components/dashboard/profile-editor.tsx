'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Briefcase, Pencil, Plus, Save, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { employersApi, freelancersApi, skillsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import {
  validateEmployerProfile,
  validateExperience,
  validateFreelancerProfile,
  type EmployerProfileForm,
  type ExperienceForm,
  type FreelancerProfileForm,
} from '@/lib/profile-form';
import { useAuthStore } from '@/stores/authStore';
import type { EmployerProfile, FreelancerProfile, Skill, UserRole, WorkExperience } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DetailSkeleton } from '@/components/dashboard/skeletons';
import { Field } from '@/components/ui/field';

type ProfileRole = Extract<UserRole, 'employer' | 'freelancer'>;

const emptyFreelancerForm: FreelancerProfileForm = {
  bio: '',
  hourlyRate: 1,
  availability: 'available',
};
const emptyEmployerForm: EmployerProfileForm = { companyName: '', description: '', industry: '' };
const emptyExperience: ExperienceForm = { title: '', company: '', description: '', startDate: '', endDate: null };

function dateInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 10) : '';
}

export function ProfileEditor({ role }: { role: ProfileRole }) {
  const user = useAuthStore((state) => state.user);
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [freelancerForm, setFreelancerForm] = useState<FreelancerProfileForm>(emptyFreelancerForm);
  const [employerForm, setEmployerForm] = useState<EmployerProfileForm>(emptyEmployerForm);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState('');
  const [skillYears, setSkillYears] = useState(1);
  const [experienceForm, setExperienceForm] = useState<ExperienceForm>(emptyExperience);
  const [editingExperienceId, setEditingExperienceId] = useState<string | null>(null);
  const [showExperienceForm, setShowExperienceForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      if (role === 'freelancer') {
        const { data } = await freelancersApi.getProfile();
        setFreelancerProfile(data);
        setFreelancerForm({ bio: data.bio, hourlyRate: data.hourlyRate, availability: data.availability });
      } else {
        const { data } = await employersApi.getProfile();
        setEmployerProfile(data);
        setEmployerForm({ companyName: data.companyName, description: data.description, industry: data.industry });
      }
    } catch (error) {
      if (role === 'freelancer' && axios.isAxiosError(error) && error.response?.status === 404) {
        setFreelancerProfile(null);
        setFreelancerForm(emptyFreelancerForm);
      } else {
        setLoadError(getApiErrorMessage(error, 'Unable to load your profile.'));
      }
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    // Profile state is initialized from the authenticated role endpoint.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (role !== 'freelancer') return;
    skillsApi.getTaxonomy()
      .then(({ data }) => setSkills(data.categories.flatMap((category) => category.skills)))
      .catch(() => setSkills([]));
  }, [role]);

  const claimedSkillNames = useMemo(
    () => new Set((freelancerProfile?.skills ?? []).map((skill) => skill.name.toLowerCase())),
    [freelancerProfile?.skills],
  );
  const availableSkills = skills.filter((skill) => !claimedSkillNames.has(skill.name.toLowerCase()));
  const identityProfile = role === 'freelancer' ? freelancerProfile : employerProfile;

  const saveProfile = async () => {
    const validationError = role === 'freelancer'
      ? validateFreelancerProfile(freelancerForm)
      : validateEmployerProfile(employerForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setSaving(true);
    try {
      if (role === 'freelancer') {
        const response = freelancerProfile
          ? await freelancersApi.updateProfile(freelancerForm)
          : await freelancersApi.createProfile(freelancerForm);
        setFreelancerProfile(response.data);
      } else {
        const { data } = await employersApi.updateProfile(employerForm);
        setEmployerProfile(data);
      }
      toast.success('Profile saved.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save your profile.'));
    } finally {
      setSaving(false);
    }
  };

  const addSkill = async () => {
    const skill = skills.find((candidate) => candidate.id === selectedSkillId);
    if (!skill || skillYears < 0) {
      toast.error('Choose a skill and enter valid years of experience.');
      return;
    }

    setActionId('add-skill');
    try {
      const { data } = await freelancersApi.addSkills([{ name: skill.name, yearsOfExperience: skillYears }]);
      setFreelancerProfile(data);
      setSelectedSkillId('');
      setSkillYears(1);
      toast.success('Skill added.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to add this skill.'));
    } finally {
      setActionId(null);
    }
  };

  const removeSkill = async (name: string) => {
    setActionId(`skill:${name}`);
    try {
      const { data } = await freelancersApi.removeSkill(name);
      setFreelancerProfile(data);
      toast.success('Skill removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to remove this skill.'));
    } finally {
      setActionId(null);
    }
  };

  const editExperience = (experience: WorkExperience) => {
    setEditingExperienceId(experience.id);
    setExperienceForm({
      title: experience.title,
      company: experience.company,
      description: experience.description,
      startDate: dateInputValue(experience.startDate),
      endDate: dateInputValue(experience.endDate) || null,
    });
    setShowExperienceForm(true);
  };

  const resetExperienceForm = () => {
    setEditingExperienceId(null);
    setExperienceForm(emptyExperience);
    setShowExperienceForm(false);
  };

  const saveExperience = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateExperience(experienceForm);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setActionId('experience');
    try {
      const response = editingExperienceId
        ? await freelancersApi.updateExperience(editingExperienceId, experienceForm)
        : await freelancersApi.addExperience(experienceForm);
      setFreelancerProfile(response.data);
      resetExperienceForm();
      toast.success(editingExperienceId ? 'Experience updated.' : 'Experience added.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save this experience.'));
    } finally {
      setActionId(null);
    }
  };

  const removeExperience = async (id: string) => {
    setActionId(`experience:${id}`);
    try {
      const { data } = await freelancersApi.removeExperience(id);
      setFreelancerProfile(data);
      toast.success('Experience removed.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to remove this experience.'));
    } finally {
      setActionId(null);
    }
  };

  if (loading) {
    return <DetailSkeleton label="Loading profile" />;
  }

  if (loadError) {
    return (
      <Card><CardContent className="space-y-4 py-12 text-center"><p className="text-muted-foreground">{loadError}</p><Button variant="outline" onClick={() => void loadProfile()}>Try again</Button></CardContent></Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 className="text-2xl font-extrabold tracking-tight text-foreground">Profile</h1><p className="text-muted-foreground">Keep the information shown to marketplace participants up to date.</p></div>
        <Button type="button" onClick={() => void saveProfile()} loading={saving} loadingText="Saving…"><Save className="size-4" aria-hidden="true" />Save profile</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5" />Account identity</CardTitle></CardHeader>
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

      {role === 'freelancer' ? (
        <>
          <Card>
            <CardHeader><CardTitle>Professional details</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2"><Label htmlFor="profile-bio">Bio</Label><Textarea id="profile-bio" value={freelancerForm.bio} onChange={(event) => setFreelancerForm((current) => ({ ...current, bio: event.target.value }))} rows={5} /></div>
              <Field label="Hourly rate (USD)" htmlFor="hourly-rate">
<Input id="hourly-rate" type="number" min="1" value={freelancerForm.hourlyRate} onChange={(event) => setFreelancerForm((current) => ({ ...current, hourlyRate: Number(event.target.value) }))} />
</Field>
              <div className="space-y-2"><Label htmlFor="availability">Availability</Label><select id="availability" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={freelancerForm.availability} onChange={(event) => setFreelancerForm((current) => ({ ...current, availability: event.target.value as FreelancerProfileForm['availability'] }))}><option value="available">Available</option><option value="busy">Busy</option><option value="unavailable">Unavailable</option></select></div>
            </CardContent>
          </Card>

          {freelancerProfile && (
            <Card>
              <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                <div className="flex flex-wrap gap-2">
                  {(freelancerProfile.skills ?? []).map((skill) => (
                    <Badge key={skill.name} variant="secondary" className="gap-2 py-1.5 pl-3 pr-1">
                      {skill.name} · {skill.yearsOfExperience}y
                      <Button type="button" size="icon" variant="ghost" className="size-6" aria-label={`Remove ${skill.name}`} disabled={actionId === `skill:${skill.name}`} onClick={() => void removeSkill(skill.name)}><Trash2 className="size-3" /></Button>
                    </Badge>
                  ))}
                  {freelancerProfile.skills.length === 0 && <p className="text-sm text-muted-foreground">No skills added yet.</p>}
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_160px_auto] sm:items-end">
                  <div className="space-y-2"><Label htmlFor="new-skill">Add skill</Label><select id="new-skill" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={selectedSkillId} onChange={(event) => setSelectedSkillId(event.target.value)}><option value="">Choose a skill</option>{availableSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}</select></div>
                  <Field label="Years" htmlFor="skill-years">
<Input id="skill-years" type="number" min="0" step="0.5" value={skillYears} onChange={(event) => setSkillYears(Number(event.target.value))} />
</Field>
                  <Button type="button" variant="outline" disabled={!selectedSkillId || actionId === 'add-skill'} onClick={() => void addSkill()}><Plus className="mr-2 size-4" />Add</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {freelancerProfile && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between"><CardTitle className="flex items-center gap-2"><Briefcase className="size-5" />Experience</CardTitle><Button type="button" variant="outline" size="sm" onClick={() => { resetExperienceForm(); setShowExperienceForm(true); }}><Plus className="mr-2 size-4" />Add experience</Button></CardHeader>
              <CardContent className="space-y-4">
                {(freelancerProfile.experience ?? []).map((experience) => (
                  <div key={experience.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div><p className="font-semibold">{experience.title}</p><p className="text-sm text-muted-foreground">{experience.company} · {new Date(experience.startDate).toLocaleDateString()} – {experience.endDate ? new Date(experience.endDate).toLocaleDateString() : 'Present'}</p><p className="mt-2 text-sm">{experience.description}</p></div>
                    <div className="flex gap-1"><Button type="button" size="icon" variant="ghost" aria-label={`Edit ${experience.title}`} onClick={() => editExperience(experience)}><Pencil className="size-4" /></Button><Button type="button" size="icon" variant="ghost" aria-label={`Delete ${experience.title}`} disabled={actionId === `experience:${experience.id}`} onClick={() => void removeExperience(experience.id)}><Trash2 className="size-4 text-destructive" /></Button></div>
                  </div>
                ))}
                {freelancerProfile.experience.length === 0 && <p className="text-sm text-muted-foreground">No experience added yet.</p>}

                {showExperienceForm && (
                  <form className="grid gap-4 rounded-lg border border-border p-4 sm:grid-cols-2" onSubmit={saveExperience}>
                    <Field label="Job title" htmlFor="experience-title">
<Input id="experience-title" value={experienceForm.title} onChange={(event) => setExperienceForm((current) => ({ ...current, title: event.target.value }))} />
</Field>
                    <Field label="Company" htmlFor="experience-company">
<Input id="experience-company" value={experienceForm.company} onChange={(event) => setExperienceForm((current) => ({ ...current, company: event.target.value }))} />
</Field>
                    <Field label="Start date" htmlFor="experience-start">
<Input id="experience-start" type="date" value={experienceForm.startDate} onChange={(event) => setExperienceForm((current) => ({ ...current, startDate: event.target.value }))} />
</Field>
                    <Field label="End date (optional)" htmlFor="experience-end">
<Input id="experience-end" type="date" value={experienceForm.endDate ?? ''} onChange={(event) => setExperienceForm((current) => ({ ...current, endDate: event.target.value || null }))} />
</Field>
                    <div className="space-y-2 sm:col-span-2"><Label htmlFor="experience-description">Description</Label><Textarea id="experience-description" value={experienceForm.description} onChange={(event) => setExperienceForm((current) => ({ ...current, description: event.target.value }))} /></div>
                    <div className="flex gap-2 sm:col-span-2"><Button type="submit" disabled={actionId === 'experience'}>{editingExperienceId ? 'Update experience' : 'Add experience'}</Button><Button type="button" variant="ghost" onClick={resetExperienceForm}>Cancel</Button></div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle>Company details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" htmlFor="company-name">
<Input id="company-name" value={employerForm.companyName} onChange={(event) => setEmployerForm((current) => ({ ...current, companyName: event.target.value }))} />
</Field>
            <Field label="Industry" htmlFor="industry">
<Input id="industry" value={employerForm.industry} onChange={(event) => setEmployerForm((current) => ({ ...current, industry: event.target.value }))} />
</Field>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="company-description">Company description</Label><Textarea id="company-description" rows={6} value={employerForm.description} onChange={(event) => setEmployerForm((current) => ({ ...current, description: event.target.value }))} /></div>
            {employerProfile && <p className="text-xs text-muted-foreground sm:col-span-2">Company profile last updated {new Date(employerProfile.updatedAt).toLocaleString()}.</p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
