'use client';

import { useState } from 'react';
import { Lightbulb, Send } from 'lucide-react';
import { toast } from 'sonner';

import { skillsApi } from '@/lib/api';
import { getApiErrorMessage } from '@/lib/auth-contract';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface SuggestSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialCategory?: string;
}

export function SuggestSkillDialog({
  open,
  onOpenChange,
  initialName = '',
  initialCategory = '',
}: SuggestSkillDialogProps) {
  const [name, setName] = useState(initialName);
  const [categoryName, setCategoryName] = useState(initialCategory);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName(initialName);
    setCategoryName(initialCategory);
    setDescription('');
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!submitting) {
      if (!nextOpen) reset();
      onOpenChange(nextOpen);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDesc = description.trim();
    const trimmedCategory = categoryName.trim();

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return toast.error('Skill name must be between 2 and 100 characters.');
    }
    if (trimmedDesc.length < 5 || trimmedDesc.length > 500) {
      return toast.error('Please provide a brief description (5 to 500 characters) explaining what this skill is.');
    }

    setSubmitting(true);
    try {
      await skillsApi.suggestSkill({
        name: trimmedName,
        description: trimmedDesc,
        ...(trimmedCategory ? { categoryName: trimmedCategory } : {}),
      });
      toast.success('Skill suggestion sent to administrators for review.');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to submit skill suggestion.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="size-5 text-primary" aria-hidden="true" />
            Suggest a Skill
          </DialogTitle>
          <DialogDescription>
            Platform skills are curated by administrators to ensure accurate matching. If a technology or specialty is missing, suggest it here for admin review.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <Field label="Skill name" htmlFor="suggest-skill-name">
            <Input
              id="suggest-skill-name"
              placeholder="e.g. Solidity, Foundry, LangChain"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </Field>

          <Field label="Category (optional)" htmlFor="suggest-skill-category">
            <Input
              id="suggest-skill-category"
              placeholder="e.g. Blockchain Development, AI & ML"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              disabled={submitting}
            />
          </Field>

          <Field label="Description / Details" htmlFor="suggest-skill-description">
            <Textarea
              id="suggest-skill-description"
              rows={3}
              placeholder="Describe this skill or tool to help administrators categorize and approve it."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              required
            />
          </Field>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              <Send className="mr-2 size-4" aria-hidden="true" />
              {submitting ? 'Submitting…' : 'Submit suggestion'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
