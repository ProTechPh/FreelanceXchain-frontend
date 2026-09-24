'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Check, Search, X } from 'lucide-react';

import { skillsApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { SkillCategory } from '@/types';

interface SkillPickerProps {
  id?: string;
  /** Selected skill names, exactly as they appear in the catalog. */
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}

/**
 * Multi-select over the platform skill catalog. Matching compares skills by
 * name, so a free-typed "ReactJS" never lines up with the catalog's "React";
 * choosing from the list is the only way in. Names already on an item that are
 * not in the catalog stay visible as chips so they can still be removed.
 */
export function SkillPicker({ id, value, onChange, placeholder = 'Search skills…' }: SkillPickerProps) {
  const [categories, setCategories] = useState<SkillCategory[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    skillsApi
      .getTaxonomy()
      .then(({ data }) => {
        if (!active) return;
        setCategories(
          (data.categories ?? [])
            .map((category) => ({ ...category, skills: (category.skills ?? []).filter((skill) => skill.isActive !== false) }))
            .filter((category) => category.skills.length > 0),
        );
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  const selected = useMemo(() => new Set(value.map((name) => name.toLowerCase())), [value]);

  const toggle = (name: string) => {
    const key = name.toLowerCase();
    onChange(selected.has(key) ? value.filter((item) => item.toLowerCase() !== key) : [...value, name]);
    setQuery('');
    inputRef.current?.focus();
  };

  const remove = (name: string) => onChange(value.filter((item) => item !== name));

  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Selected skills">
          {value.map((name) => (
            <li key={name}>
              <Badge variant="secondary" className="gap-1 py-1 pl-2.5 pr-1 text-xs">
                {name}
                <button
                  type="button"
                  aria-label={`Remove ${name}`}
                  className="rounded-sm p-0.5 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => remove(name)}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {status === 'loading' ? (
        <div role="status" className="space-y-2">
          <Skeleton className="h-10 w-full rounded-md" />
          <span className="sr-only">Loading skills</span>
        </div>
      ) : status === 'error' ? (
        <p role="alert" className="rounded-md border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground">
          The skill list could not be loaded. Close and reopen this form to try again.
        </p>
      ) : (
        <CommandPrimitive
          className="rounded-md border border-input bg-background focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50"
          // Plain substring match on skill and category names; cmdk's default
          // fuzzy scoring would also match against the id baked into `value`.
          filter={(_value, search, keywords) =>
            (keywords ?? []).some((keyword) => keyword.toLowerCase().includes(search.trim().toLowerCase())) ? 1 : 0
          }
          onKeyDown={(event) => {
            if (event.key === 'Backspace' && !query && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
        >
          <div className="flex items-center gap-2 px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <CommandPrimitive.Input
              ref={inputRef}
              id={id}
              value={query}
              onValueChange={(next) => {
                setQuery(next);
                setOpen(true);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              placeholder={placeholder}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          {open && (
            <CommandPrimitive.List className="max-h-60 overflow-y-auto border-t border-border p-1">
              <CommandPrimitive.Empty className="px-3 py-4 text-center text-sm text-muted-foreground">
                No matching skill in the catalog.
              </CommandPrimitive.Empty>
              {categories.map((category) => (
                <CommandPrimitive.Group
                  key={category.id}
                  heading={category.name}
                  className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-2xs [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-muted-foreground"
                >
                  {category.skills.map((skill) => {
                    const isSelected = selected.has(skill.name.toLowerCase());
                    return (
                      <CommandPrimitive.Item
                        key={skill.id}
                        value={`${skill.name} ${skill.id}`}
                        keywords={[skill.name, category.name]}
                        // Keep focus in the input so the list stays open for the next pick.
                        onMouseDown={(event) => event.preventDefault()}
                        onSelect={() => toggle(skill.name)}
                        className="flex cursor-pointer items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm outline-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                      >
                        {skill.name}
                        <Check className={cn('size-4 text-primary', isSelected ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
                      </CommandPrimitive.Item>
                    );
                  })}
                </CommandPrimitive.Group>
              ))}
            </CommandPrimitive.List>
          )}
        </CommandPrimitive>
      )}
    </div>
  );
}
