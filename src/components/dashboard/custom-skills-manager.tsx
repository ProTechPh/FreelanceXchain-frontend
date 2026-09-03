'use client';

import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { reportLoadFailure } from '@/lib/report-failure';
import { skillsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { validateCustomSkill } from '@/lib/custom-skill';
import type { UserCustomSkill } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Field } from '@/components/ui/field';

const emptyDraft = { name: '', description: '', yearsOfExperience: 0, categoryName: '', suggestForGlobal: false };

export function CustomSkillsManager() {
  const [skills, setSkills] = useState<UserCustomSkill[]>([]);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await skillsApi.listCustom();
    setSkills(data);
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'your custom skills', run);
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

  const reset = () => {
    setEditingId(null);
    setDraft(emptyDraft);
  };

  const edit = (skill: UserCustomSkill) => {
    setEditingId(skill.id);
    setDraft({ name: skill.name, description: skill.description, yearsOfExperience: skill.yearsOfExperience, categoryName: skill.categoryName ?? '', suggestForGlobal: skill.suggestedForGlobal });
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateCustomSkill(draft);
    if (validationError) return toast.error(validationError);

    setActionId('save');
    const categoryName = draft.categoryName.trim();
    try {
      if (editingId) {
        await skillsApi.updateCustom(editingId, { name: draft.name.trim(), description: draft.description.trim(), yearsOfExperience: draft.yearsOfExperience, ...(categoryName ? { categoryName } : {}) });
        toast.success('Custom skill updated.');
      } else {
        await skillsApi.createCustom({ name: draft.name.trim(), description: draft.description.trim(), yearsOfExperience: draft.yearsOfExperience, ...(categoryName ? { categoryName } : {}), suggestForGlobal: draft.suggestForGlobal });
        toast.success(draft.suggestForGlobal ? 'Custom skill created and suggested to administrators.' : 'Custom skill created.');
      }
      reset();
      await load();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to save this custom skill.'));
    } finally {
      setActionId(null);
    }
  };

  const remove = async (skill: UserCustomSkill) => {
    if (!window.confirm(`Delete the custom skill “${skill.name}”?`)) return;
    setActionId(skill.id);
    try {
      await skillsApi.deleteCustom(skill.id);
      setSkills((current) => current.filter((item) => item.id !== skill.id));
      toast.success('Custom skill deleted.');
      if (editingId === skill.id) reset();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to delete this custom skill.'));
    } finally {
      setActionId(null);
    }
  };

  return (
    <Card className="mx-auto max-w-5xl">
      <CardHeader><CardTitle className="flex items-center gap-2"><Lightbulb className="size-5 text-primary" />Custom skills</CardTitle><p className="text-sm text-muted-foreground">Add specialties missing from the global taxonomy and optionally suggest them for platform-wide review.</p></CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-2">
        <form className="space-y-4 rounded-lg border border-border p-4" onSubmit={save}>
          <h3 className="font-semibold">{editingId ? 'Edit custom skill' : 'New custom skill'}</h3>
          <Field label="Name" htmlFor="custom-skill-name">
<Input id="custom-skill-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} />
</Field>
          <Field label="Description" htmlFor="custom-skill-description">
<Textarea id="custom-skill-description" rows={4} value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} />
</Field>
          <div className="grid grid-cols-1 gap-3 xs:grid-cols-2"><Field label="Years" htmlFor="custom-skill-years">
<Input id="custom-skill-years" type="number" min="0" max="50" step="0.5" value={draft.yearsOfExperience} onChange={(event) => setDraft((current) => ({ ...current, yearsOfExperience: Number(event.target.value) }))} />
</Field><Field label="Category (optional)" htmlFor="custom-skill-category">
<Input id="custom-skill-category" value={draft.categoryName} onChange={(event) => setDraft((current) => ({ ...current, categoryName: event.target.value }))} />
</Field></div>
          {!editingId && <label className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={draft.suggestForGlobal} onChange={(event) => setDraft((current) => ({ ...current, suggestForGlobal: event.target.checked }))} /><span><span className="font-medium">Suggest for the global taxonomy</span><span className="block text-muted-foreground">Administrators can review popular requests.</span></span></label>}
          <div className="flex gap-2"><Button type="submit" disabled={actionId === 'save'}><Plus className="mr-2 size-4" />{editingId ? 'Save changes' : 'Add custom skill'}</Button>{editingId && <Button type="button" variant="ghost" onClick={reset}>Cancel</Button>}</div>
        </form>

        <div className="space-y-3">
          {loading && <p role="status" className="text-sm text-muted-foreground">Loading custom skills…</p>}
          {!loading && skills.length === 0 && <p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No custom skills yet.</p>}
          {skills.map((skill) => (
            <div key={skill.id} className="rounded-lg border border-border p-4">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{skill.name}</p><p className="mt-1 text-sm text-muted-foreground">{skill.description}</p></div><div className="flex gap-1"><Button type="button" variant="ghost" size="icon" aria-label={`Edit ${skill.name}`} onClick={() => edit(skill)}><Pencil className="size-4" /></Button><Button type="button" variant="ghost" size="icon" aria-label={`Delete ${skill.name}`} disabled={actionId === skill.id} onClick={() => void remove(skill)}><Trash2 className="size-4 text-destructive" /></Button></div></div>
              <div className="mt-3 flex flex-wrap gap-2"><Badge variant="secondary">{skill.yearsOfExperience} years</Badge>{skill.categoryName && <Badge variant="outline">{skill.categoryName}</Badge>}{skill.suggestedForGlobal && <Badge>Suggested globally</Badge>}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
