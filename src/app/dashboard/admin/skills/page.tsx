'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Tags, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { skillsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import type { SkillSuggestion, SkillTaxonomy } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function AdminSkillsPage() {
  const [taxonomy, setTaxonomy] = useState<SkillTaxonomy>({ categories: [] });
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [skillCategoryId, setSkillCategoryId] = useState('');
  const [skillName, setSkillName] = useState('');
  const [skillDescription, setSkillDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [{ data }, suggestionResponse] = await Promise.all([
        skillsApi.getTaxonomy(),
        skillsApi.listSuggestions().catch(() => ({ data: [] as SkillSuggestion[] })),
      ]);
      setTaxonomy(data);
      setSuggestions(suggestionResponse.data);
      if (data.categories[0]) setSkillCategoryId((current) => current || data.categories[0]!.id);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to load skill taxonomy.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const createCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim() || !categoryDescription.trim()) return toast.error('Category name and description are required.');
    setAction('category');
    try {
      await skillsApi.createCategory(categoryName.trim(), categoryDescription.trim());
      setCategoryName(''); setCategoryDescription('');
      await load();
      toast.success('Skill category created.');
    } catch (error) { toast.error(getApiErrorMessage(error, 'Unable to create category.')); }
    finally { setAction(null); }
  };

  const createSkill = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!skillCategoryId || !skillName.trim() || !skillDescription.trim()) return toast.error('Category, name, and description are required.');
    setAction('skill');
    try {
      await skillsApi.createSkill(skillCategoryId, skillName.trim(), skillDescription.trim());
      setSkillName(''); setSkillDescription('');
      await load();
      toast.success('Skill created.');
    } catch (error) { toast.error(getApiErrorMessage(error, 'Unable to create skill.')); }
    finally { setAction(null); }
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
    } catch (error) { toast.error(getApiErrorMessage(error, 'Unable to update suggestion.')); }
    finally { setAction(null); }
  };

  if (loading) return <div className="flex min-h-64 items-center justify-center" role="status"><Loader2 className="size-8 animate-spin text-primary" /></div>;
  return (
    <div className="space-y-6">
      <div><h1 className="flex items-center gap-2 text-2xl font-bold"><Tags className="size-6" />Skill taxonomy</h1><p className="text-muted-foreground">Create categories and skills, and deprecate entries that should no longer be selected.</p></div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>New category</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={createCategory}><div className="space-y-2"><Label htmlFor="category-name">Name</Label><Input id="category-name" value={categoryName} onChange={(event) => setCategoryName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="category-description">Description</Label><Textarea id="category-description" value={categoryDescription} onChange={(event) => setCategoryDescription(event.target.value)} /></div><Button type="submit" disabled={action === 'category'}><Plus className="mr-2 size-4" />Create category</Button></form></CardContent></Card>
        <Card><CardHeader><CardTitle>New skill</CardTitle></CardHeader><CardContent><form className="space-y-3" onSubmit={createSkill}><div className="space-y-2"><Label htmlFor="skill-category">Category</Label><select id="skill-category" className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm" value={skillCategoryId} onChange={(event) => setSkillCategoryId(event.target.value)}>{taxonomy.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="admin-skill-name">Name</Label><Input id="admin-skill-name" value={skillName} onChange={(event) => setSkillName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="admin-skill-description">Description</Label><Textarea id="admin-skill-description" value={skillDescription} onChange={(event) => setSkillDescription(event.target.value)} /></div><Button type="submit" disabled={action === 'skill'}><Plus className="mr-2 size-4" />Create skill</Button></form></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Custom-skill suggestions</CardTitle><p className="text-sm text-muted-foreground">Review freelancer requests for additions to the global taxonomy.</p></CardHeader><CardContent>{suggestions.length === 0 ? <p className="text-sm text-muted-foreground">No pending suggestions.</p> : <ul className="space-y-3">{suggestions.map((suggestion) => <li key={suggestion.id} className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{suggestion.skillName}</p><p className="mt-1 text-sm text-muted-foreground">{suggestion.skillDescription}</p><p className="mt-2 text-xs text-muted-foreground">Suggested by {suggestion.suggestedBy} · {suggestion.timesRequested} request{suggestion.timesRequested === 1 ? '' : 's'}{suggestion.categoryName ? ` · ${suggestion.categoryName}` : ''}</p></div><div className="flex gap-2"><Button type="button" size="sm" disabled={action === suggestion.id} onClick={() => void moderateSuggestion(suggestion.id, 'approved')}>Approve</Button><Button type="button" size="sm" variant="outline" disabled={action === suggestion.id} onClick={() => void moderateSuggestion(suggestion.id, 'rejected')}>Reject</Button></div></li>)}</ul>}</CardContent></Card>
      <div className="grid gap-5 md:grid-cols-2">{taxonomy.categories.map((category) => <Card key={category.id}><CardHeader><CardTitle>{category.name}</CardTitle><p className="text-sm text-muted-foreground">{category.description}</p></CardHeader><CardContent><ul className="space-y-2">{category.skills.map((skill) => <li key={skill.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"><div><p className="font-medium">{skill.name}</p><p className="text-sm text-muted-foreground">{skill.description}</p></div><div className="flex items-center gap-2"><Badge variant="secondary">{skill.isActive ? 'Active' : 'Deprecated'}</Badge>{skill.isActive && <Button type="button" size="icon" variant="ghost" aria-label={`Deprecate ${skill.name}`} disabled={action === skill.id} onClick={() => void deprecate(skill.id)}><Trash2 className="size-4 text-destructive" /></Button>}</div></li>)}</ul></CardContent></Card>)}</div>
    </div>
  );
}
