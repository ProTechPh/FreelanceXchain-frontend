"use client";

import { ListFilter, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Skill } from "@/types";
import type { MarketplaceFilters } from "@/lib/marketplace-search";

type MobileFilterDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  kind: "project" | "freelancer";
  skills: Skill[];
  filters: MarketplaceFilters;
  onFilterChange: (next: MarketplaceFilters) => void;
  onApply: () => void;
  onReset: () => void;
  savedSearchName: string;
  onSavedSearchNameChange: (name: string) => void;
  onSaveSearch: (event?: React.SyntheticEvent) => void | Promise<void>;
  savingSearch: boolean;
  hasUser: boolean;
};

export function MobileFilterDialog({
  open,
  onOpenChange,
  kind,
  skills,
  filters,
  onFilterChange,
  onApply,
  onReset,
  savedSearchName,
  onSavedSearchNameChange,
  onSaveSearch,
  savingSearch,
  hasUser,
}: MobileFilterDialogProps) {
  const updateBudget = (field: "minBudget" | "maxBudget", value: string) => {
    const next = { ...filters };
    if (value === "") delete next[field];
    else next[field] = Number(value);
    onFilterChange(next);
  };

  const isInvalidBudget =
    filters.minBudget !== undefined &&
    filters.maxBudget !== undefined &&
    filters.minBudget > filters.maxBudget;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListFilter className="size-4 text-primary" />
            Filter {kind === "project" ? "Projects" : "Freelancers"}
          </DialogTitle>
          <DialogDescription>
            Adjust your search criteria to find matching {kind === "project" ? "projects" : "freelancers"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="mobile-skill-select" className="text-xs font-semibold text-foreground">
              Skill
            </Label>
            <div className="relative">
              <select
                id="mobile-skill-select"
                aria-label="Skill"
                value={filters.skillIds[0] ?? ""}
                onChange={(event) => {
                  const val = event.target.value;
                  onFilterChange({ ...filters, skillIds: val ? [val] : [] });
                }}
                className="h-10 w-full appearance-none border border-input bg-background px-3 pr-10 text-sm text-foreground rounded-md hover:border-foreground/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <option value="">All skills</option>
                {skills.map((skill) => (
                  <option key={skill.id} value={skill.id}>
                    {skill.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
          </div>

          {kind === "project" && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mobile-min-budget" className="text-xs font-semibold text-foreground">
                  Min budget ($)
                </Label>
                <Input
                  id="mobile-min-budget"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={filters.minBudget ?? ""}
                  onChange={(e) => updateBudget("minBudget", e.target.value)}
                  placeholder="500"
                  className="rounded-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mobile-max-budget" className="text-xs font-semibold text-foreground">
                  Max budget ($)
                </Label>
                <Input
                  id="mobile-max-budget"
                  type="number"
                  min="0"
                  inputMode="numeric"
                  value={filters.maxBudget ?? ""}
                  onChange={(e) => updateBudget("maxBudget", e.target.value)}
                  placeholder="5000"
                  className="rounded-md"
                />
              </div>
            </div>
          )}

          {isInvalidBudget && (
            <p className="text-xs text-destructive">Min budget cannot exceed max budget</p>
          )}

          {hasUser && (
            <div className="pt-3 border-t border-border space-y-2">
              <Label htmlFor="mobile-saved-name" className="text-xs font-semibold text-muted-foreground">
                Save as Search Preset
              </Label>
              <div className="flex gap-2">
                <Input
                  id="mobile-saved-name"
                  value={savedSearchName}
                  onChange={(event) => onSavedSearchNameChange(event.target.value)}
                  placeholder="e.g. React & Solidity gigs"
                  className="text-xs h-9 rounded-md flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSaveSearch}
                  disabled={!savedSearchName.trim() || savingSearch}
                  className="text-xs h-9"
                >
                  Save
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Button variant="outline" onClick={onReset} className="flex-1">
            Reset
          </Button>
          <Button
            onClick={onApply}
            disabled={isInvalidBudget}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
