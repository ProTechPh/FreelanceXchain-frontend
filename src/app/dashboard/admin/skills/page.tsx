'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { reportLoadFailure } from '@/lib/report-failure';
import { skillsApi } from '@/lib/api';
import { csrfTokenManager } from '@/lib/api-client';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { Skill, SkillSuggestion, SkillTaxonomy } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ListSkeleton } from '@/components/dashboard/skeletons';
import { Field } from '@/components/ui/field';
import { AdminPermissionGate } from '@/components/admin/AdminPermissionGate';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { countMeaningfulChars } from '@/lib/text-validation';

function extractApiFieldErrors(error: unknown): Record<string, string> {
  const result: Record<string, string> = {};
  if (!error || typeof error !== 'object') return result;

  const data = (error as { response?: { data?: { error?: { details?: Array<{ field?: string; message?: string }>; message?: string }; details?: Array<{ field?: string; message?: string }> } } })?.response?.data;
  const details = data?.error?.details || data?.details;

  if (Array.isArray(details) && details.length > 0) {
    const messages: string[] = [];
    for (const item of details) {
      if (item && typeof item === 'object') {
        if (item.field && item.message) {
          result[item.field] = item.message;
        }
        if (item.message) {
          messages.push(item.message);
        }
      }
    }
    if (messages.length > 0) {
      result._general = messages.join('. ');
    }
  }

  return result;
}

export default function AdminSkillsPage() {
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomy>({ categories: [] });
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryNameError, setCategoryNameError] = useState<string | null>(null);
  const [categoryDescError, setCategoryDescError] = useState<string | null>(null);

  const [skillCategoryId, setSkillCategoryId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [skillCategoryError, setSkillCategoryError] = useState<string | null>(null);
  const [skillNameError, setSkillNameError] = useState<string | null>(null);
  const [skillDescError, setSkillDescError] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);

  const [editingSkill, setEditingSkill] = useState<{
    id: string;
    name: string;
    description: string;
    categoryId: string;
  } | null>(null);

  const categoryItems = useMemo(
    () =>
      taxonomy.categories.reduce<Record<string, string>>((acc, cat) => {
        acc[cat.id] = cat.name;
        return acc;
      }, {}),
    [taxonomy.categories]
  );

  const load = useCallback(async () => {
    const [{ data }, suggestionResponse] = await Promise.all([
      skillsApi.getTaxonomy(),
      skillsApi.listSuggestions().catch(() => ({ data: [] as SkillSuggestion[] })),
    ]);
    setTaxonomy(data);
    setSuggestions(suggestionResponse.data);
    if (data.categories.length > 0) {
      setSkillCategoryId((current) => {
        const exists = data.categories.some((c) => c.id === current);
        return exists ? current : data.categories[0]!.id;
      });
    }
  }, []);

  // Reported here rather than inside the loader so the toast's Retry can
  // call it again; a self-reference inside the callback is not allowed.
  useEffect(() => {
    let active = true;
    void csrfTokenManager.ensureToken();
    function run() {
      load()
        .catch((error) => {
          if (active) reportLoadFailure(error, 'the skill taxonomy', run);
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

  const createCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = categoryName.trim();
    const trimmedDesc = categoryDescription.trim();

    if (!trimmedName || countMeaningfulChars(trimmedName) < 3) {
      const msg = !trimmedName ? 'Category name is required.' : 'Category name must include at least 3 letters or numbers.';
      setCategoryNameError(msg);
      toast.error(msg);
      return;
    }
    if (!trimmedDesc) {
      setCategoryDescError('Category description is required.');
      toast.error('Category description is required.');
      return;
    }

    setAction('category');
    try {
      const response = await skillsApi.createCategory(trimmedName, trimmedDesc);
      const newCategory = response.data;
      setCategoryName('');
      setCategoryDescription('');
      setCategoryNameError(null);
      setCategoryDescError(null);
      if (newCategory) {
        setTaxonomy((prev) => ({
          ...prev,
          categories: [
            ...prev.categories.filter((c) => c.id !== newCategory.id),
            { ...newCategory, skills: newCategory.skills || [] },
          ],
        }));
      }
      await load();
      toast.success('Skill category created.');
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error);
      if (fieldErrors.name) setCategoryNameError(fieldErrors.name);
      if (fieldErrors.description) setCategoryDescError(fieldErrors.description);
      const apiMsg = fieldErrors._general || getApiErrorMessage(error, 'Unable to create category.');
      toast.error(apiMsg);
    } finally {
      setAction(null);
    }
  };

  const createSkill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = skillName.trim();
    const trimmedDesc = skillDescription.trim();

    if (!skillCategoryId || !trimmedName || !trimmedDesc) {
      if (!skillCategoryId) setSkillCategoryError('Please select a category.');
      if (!trimmedName) setSkillNameError('Skill name is required.');
      if (!trimmedDesc) setSkillDescError('Skill description is required.');
      return toast.error('Select a category and enter both a name and description before creating the skill.');
    }

    setAction('skill');
    try {
      const response = await skillsApi.createSkill(skillCategoryId, trimmedName, trimmedDesc);
      const newSkill = response.data;
      setSkillName('');
      setSkillDescription('');
      setSkillNameError(null);
      setSkillDescError(null);
      if (newSkill) {
        setTaxonomy((prev) => ({
          ...prev,
          categories: prev.categories.map((c) =>
            c.id === skillCategoryId
              ? {
                  ...c,
                  skills: [...c.skills.filter((s) => s.id !== newSkill.id), newSkill],
                }
              : c
          ),
        }));
      }
      await load();
      toast.success('Skill created.');
    } catch (error) {
      const fieldErrors = extractApiFieldErrors(error);
      if (fieldErrors.name) setSkillNameError(fieldErrors.name);
      if (fieldErrors.categoryId) setSkillCategoryError(fieldErrors.categoryId);
      if (fieldErrors.description) setSkillDescError(fieldErrors.description);
      const apiMsg = fieldErrors._general || getApiErrorMessage(error, 'Unable to create skill.');
      toast.error(apiMsg);
    } finally {
      setAction(null);
    }
  };

  const deprecate = async (id: string) => {
    setAction(id);
    try { await skillsApi.deprecate(id); await load(); toast.success('Skill deprecated.'); }
    catch (error) { toast.error(getApiErrorMessage(error, 'Unable to deprecate skill.')); }
    finally { setAction(null); }
  };

  const moderateSuggestion = async (id: string, status: 'approved' | 'rejected') => {
    setAction(id);
    try {
      await skillsApi.moderateSuggestion(id, status);
      setSuggestions((current) => current.filter((suggestion) => suggestion.id !== id));
      toast.success(`Suggestion ${status}.`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update suggestion.'));
    } finally {
      setAction(null);
    }
  };

  const startEditSkill = (skill: Skill, categoryId: string) => {
    setEditingSkill({
      id: skill.id,
      name: skill.name,
      description: skill.description,
      categoryId,
    });
  };

  const saveEditedSkill = async () => {
    if (!editingSkill) return;
    if (!editingSkill.name.trim()) {
      toast.error('Skill name is required.');
      return;
    }
    setAction('save-skill');
    try {
      await skillsApi.updateSkill(editingSkill.id, {
        categoryId: editingSkill.categoryId,
        name: editingSkill.name.trim(),
        description: editingSkill.description.trim(),
      });
      await load();
      toast.success('Skill updated successfully.');
      setEditingSkill(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update skill.'));
    } finally {
      setAction(null);
    }
  };

  if (loading) return <ListSkeleton rows={6} label="Loading skills" />;
  return (
    <AdminPermissionGate permission="skills:manage" title="Skills Taxonomy">
      <div className="space-y-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Tags className="size-6" />Skill taxonomy</h1><p className="text-muted-foreground">Create categories and skills, and deprecate entries that should no longer be selected.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>New category</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={createCategory}><Field label="Name" htmlFor="category-name">
<Input
  id="category-name"
  aria-label="Category name"
  name="categoryName"
  placeholder="e.g. Frontend Development"
  value={categoryName}
  onChange={(event) => {
    const val = event.target.value;
    setCategoryName(val);
    if (countMeaningfulChars(val) >= 3) {
      setCategoryNameError(null);
    } else if (val.trim().length > 0) {
      setCategoryNameError('Category name must include at least 3 letters or numbers.');
    }
  }}
  aria-invalid={Boolean(categoryNameError || (categoryName.length > 0 && countMeaningfulChars(categoryName) < 3))}
/>
{(categoryNameError || (categoryName.length > 0 && countMeaningfulChars(categoryName) < 3)) && (
  <p className="text-xs text-destructive mt-1" role="alert">
    {categoryNameError || 'Category name must include at least 3 letters or numbers.'}
  </p>
)}
</Field><Field label="Description" htmlFor="category-description">
<Textarea
  id="category-description"
  aria-label="Category description"
  name="categoryDescription"
  placeholder="Overview of this skill category..."
  value={categoryDescription}
  onChange={(event) => {
    setCategoryDescription(event.target.value);
    if (event.target.value.trim().length > 0) {
      setCategoryDescError(null);
    }
  }}
  aria-invalid={Boolean(categoryDescError)}
/>
{categoryDescError && (
  <p className="text-xs text-destructive mt-1" role="alert">{categoryDescError}</p>
)}
</Field><Button type="submit" loading={action === 'category'} loadingText="Creating category…"><Plus className="mr-2 size-4" />Create category</Button></form></CardContent></Card>
        <Card><CardHeader><CardTitle>New skill</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={createSkill}><Field label="Category" htmlFor="skill-category">
<Select
  items={categoryItems}
  value={skillCategoryId}
  onValueChange={(val) => {
    if (val) {
      setSkillCategoryId(val);
      setSkillCategoryError(null);
    }
  }}
>
  <SelectTrigger id="skill-category" className="w-full">
    <SelectValue placeholder="Select a category">
      {(val) => (val && categoryItems[val] ? categoryItems[val] : val)}
    </SelectValue>
  </SelectTrigger>
  <SelectContent>
    {taxonomy.categories.length === 0 ? (
      <SelectItem value="none" disabled>No categories available</SelectItem>
    ) : (
      taxonomy.categories.map((category) => (
        <SelectItem key={category.id} value={category.id}>
          {category.name}
        </SelectItem>
      ))
    )}
  </SelectContent>
</Select>
{skillCategoryError && (
  <p className="text-xs text-destructive mt-1" role="alert">{skillCategoryError}</p>
)}
</Field><Field label="Name" htmlFor="admin-skill-name">
<Input
  id="admin-skill-name"
  aria-label="Skill name"
  name="name"
  placeholder="e.g. TypeScript"
  value={skillName}
  onChange={(event) => {
    setSkillName(event.target.value);
    if (event.target.value.trim().length > 0) {
      setSkillNameError(null);
    }
  }}
  aria-invalid={Boolean(skillNameError)}
/>
{skillNameError && (
  <p className="text-xs text-destructive mt-1" role="alert">{skillNameError}</p>
)}
</Field><Field label="Description" htmlFor="admin-skill-description">
<Textarea
  id="admin-skill-description"
  aria-label="Skill description"
  name="description"
  placeholder="Brief overview of skill application and proficiency..."
  value={skillDescription}
  onChange={(event) => {
    setSkillDescription(event.target.value);
    if (event.target.value.trim().length > 0) {
      setSkillDescError(null);
    }
  }}
  aria-invalid={Boolean(skillDescError)}
/>
{skillDescError && (
  <p className="text-xs text-destructive mt-1" role="alert">{skillDescError}</p>
)}
</Field><Button type="submit" loading={action === 'skill'} loadingText="Creating skill…"><Plus className="mr-2 size-4" />Create skill</Button></form></CardContent></Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Custom-skill suggestions</CardTitle>
          <p className="text-sm text-muted-foreground">Review freelancer requests for additions to the global taxonomy.</p>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pending suggestions.</p>
          ) : (
            <ul className="space-y-3">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div>
                    <p className="font-semibold">{suggestion.skillName}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{suggestion.skillDescription}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Suggested by {suggestion.suggestedBy} · {suggestion.timesRequested} request{suggestion.timesRequested === 1 ? '' : 's'}
                      {suggestion.categoryName ? ` · Suggested Category: ${suggestion.categoryName}` : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={action === suggestion.id}
                      onClick={() => void moderateSuggestion(suggestion.id, 'approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={action === suggestion.id}
                      onClick={() => void moderateSuggestion(suggestion.id, 'rejected')}
                    >
                      Reject
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-5 md:grid-cols-2">
        {taxonomy.categories.map((category) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{category.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {category.skills.map((skill) => (
                  <li
                    key={skill.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{skill.name}</p>
                      <p className="text-sm text-muted-foreground">{skill.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{skill.isActive ? 'Active' : 'Deprecated'}</Badge>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 sm:size-8 touch-manipulation"
                        aria-label={`Edit ${skill.name}`}
                        onClick={() => startEditSkill(skill, category.id)}
                      >
                        <Pencil className="size-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                      {skill.isActive && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="size-9 sm:size-8 touch-manipulation"
                          aria-label={`Deprecate ${skill.name}`}
                          disabled={action === skill.id}
                          onClick={() => void deprecate(skill.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>


      {/* Edit Skill Dialog */}
      <Dialog
        open={Boolean(editingSkill)}
        onOpenChange={(open) => {
          if (!open) setEditingSkill(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>
              Update skill name, description, or move it to a different category.
            </DialogDescription>
          </DialogHeader>

          {editingSkill && (
            <div className="space-y-3 py-2">
              <div className="space-y-1">
                <Label htmlFor="edit-skill-category" className="text-xs">Category</Label>
                <Select
                  items={categoryItems}
                  value={editingSkill.categoryId}
                  onValueChange={(val) => {
                    if (val) setEditingSkill({ ...editingSkill, categoryId: val });
                  }}
                >
                  <SelectTrigger id="edit-skill-category" className="w-full">
                    <SelectValue placeholder="Select category">
                      {(val) => (val && categoryItems[val] ? categoryItems[val] : val)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {taxonomy.categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-skill-name" className="text-xs">Skill Name</Label>
                <Input
                  id="edit-skill-name"
                  value={editingSkill.name}
                  onChange={(e) =>
                    setEditingSkill({ ...editingSkill, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-skill-desc" className="text-xs">Skill Description</Label>
                <Textarea
                  id="edit-skill-desc"
                  rows={3}
                  value={editingSkill.description}
                  onChange={(e) =>
                    setEditingSkill({ ...editingSkill, description: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingSkill(null)}
              disabled={action === 'save-skill'}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void saveEditedSkill()}
              loading={action === 'save-skill'}
              loadingText="Saving…"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </AdminPermissionGate>
  );
}
