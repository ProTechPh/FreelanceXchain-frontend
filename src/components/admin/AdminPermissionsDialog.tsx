'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { ADMIN_PERMISSIONS, type AdminPermission, type AdminUser } from '@/types';
import { ShieldCheck, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

interface AdminPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onPermissionsSaved: (updatedUser: AdminUser) => void;
}

import {
  PERMISSION_GROUPS,
  PRESETS,
  getInitialAdminPermissions,
  type PermissionGroup,
} from '@/lib/admin-permissions';

export { PERMISSION_GROUPS, PRESETS, type PermissionGroup };

interface AdminPermissionsFormProps {
  user: AdminUser;
  onPermissionsSaved: (updatedUser: AdminUser) => void;
  onCancel: () => void;
}

function AdminPermissionsForm({
  user,
  onPermissionsSaved,
  onCancel,
}: AdminPermissionsFormProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<AdminPermission>>(() =>
    getInitialAdminPermissions(user)
  );
  const [saving, setSaving] = useState(false);

  const togglePermission = (key: AdminPermission) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const applyPreset = (presetPerms: AdminPermission[]) => {
    setSelectedPermissions(new Set(presetPerms));
  };

  const isPresetActive = (presetPerms: AdminPermission[]) => {
    if (presetPerms.length !== selectedPermissions.size) return false;
    return presetPerms.every((p) => selectedPermissions.has(p));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const permsArray = Array.from(selectedPermissions);
      const { data } = await adminApi.updateUserPermissions(user.id, permsArray);
      toast.success(`Updated permissions for ${user.name || user.email}`);
      onPermissionsSaved(data);
      onCancel();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update permissions';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const hasSuperAdminPerm = selectedPermissions.has('admin:manage');

  return (
    <>
      <DialogHeader className="shrink-0 border-b border-border px-5 pt-5 pr-12 pb-4 text-left">
        <div className="flex items-center gap-2">
          <Key className="size-5 text-primary" />
          <DialogTitle>Admin Permissions</DialogTitle>
        </div>
        <DialogDescription className="text-sm">
          Manage granular module access for{' '}
          <span className="font-semibold text-foreground">{user.name || user.email}</span>
          {user.email && <span className="text-muted-foreground block text-xs mt-0.5">{user.email}</span>}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
        {/* Quick Presets */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Role Presets
          </Label>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const active = isPresetActive(preset.permissions);
              return (
                <Button
                  key={preset.name}
                  type="button"
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => applyPreset(preset.permissions)}
                >
                  {active && <CheckCircle2 className="size-3.5" />}
                  {preset.name}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Super Admin Notice */}
        {hasSuperAdminPerm ? (
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-info/30 bg-info/5 text-xs text-info leading-relaxed">
            <ShieldCheck className="size-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">Super Administrator Privileges Active:</span>{' '}
              <span className="text-muted-foreground">
                With <code className="bg-info/10 px-1 py-0.5 rounded text-[11px]">admin:manage</code> assigned, this user has full access across all platform modules and can assign permissions to other admins.
              </span>
            </div>
          </div>
        ) : selectedPermissions.size === 0 ? (
          <div className="flex items-start gap-3 p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/5 text-xs text-amber-500 leading-relaxed">
            <AlertTriangle className="size-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-foreground">No Permissions Assigned:</span>{' '}
              <span className="text-muted-foreground">
                This admin will only see their personal overview dashboard and will have zero access to administrative modules.
              </span>
            </div>
          </div>
        ) : null}

        {/* Categorized Permissions */}
        <div className="space-y-5">
          {PERMISSION_GROUPS.map((group) => {
            const allGroupChecked = group.items.every((item) => selectedPermissions.has(item.key));

            const toggleAllGroup = () => {
              setSelectedPermissions((prev) => {
                const next = new Set(prev);
                if (allGroupChecked) {
                  group.items.forEach((item) => next.delete(item.key));
                } else {
                  group.items.forEach((item) => next.add(item.key));
                }
                return next;
              });
            };

            return (
              <div
                key={group.name}
                className="rounded-lg border border-border bg-card p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-foreground">{group.name}</h4>
                    <p className="text-xs text-muted-foreground">{group.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 shrink-0 text-xs"
                    aria-label={`${allGroupChecked ? 'Clear' : 'Select all'} ${group.name} permissions`}
                    onClick={toggleAllGroup}
                  >
                    {allGroupChecked ? 'Clear all' : 'Select all'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.map((item) => {
                    const checked = selectedPermissions.has(item.key);
                    const isSuperManage = item.key === 'admin:manage';
                    return (
                      <label
                        key={item.key}
                        htmlFor={`perm-${item.key}`}
                        className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors focus-within:ring-2 focus-within:ring-ring/50 ${
                          checked
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border/60 hover:border-border hover:bg-muted/40'
                        } ${isSuperManage ? 'sm:col-span-2 bg-gradient-to-r from-info/5 to-transparent border-info/30' : ''}`}
                      >
                        <Checkbox
                          id={`perm-${item.key}`}
                          checked={checked}
                          onCheckedChange={() => togglePermission(item.key)}
                          className="mt-0.5"
                        />
                        <span className="min-w-0 flex-1 space-y-0.5">
                          <span className="block text-sm font-medium leading-snug text-foreground">
                            {item.label}
                          </span>
                          <span className="block text-xs leading-normal text-muted-foreground">
                            {item.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The shared footer uses negative margins to line up with the dialog's
          default padding; this dialog is p-0, so they are reset here. */}
      <DialogFooter className="mx-0 mb-0 shrink-0 flex-col items-stretch gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground" aria-live="polite">
          <span className="font-medium text-foreground tabular-nums">{selectedPermissions.size}</span>{' '}
          of {ADMIN_PERMISSIONS.length} permissions active
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            loading={saving}
            loadingText="Saving…"
            onClick={handleSave}
          >
            Save permissions
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function AdminPermissionsDialog({
  open,
  onOpenChange,
  user,
  onPermissionsSaved,
}: AdminPermissionsDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-1rem)] w-[calc(100%-1rem)] max-w-[calc(100%-1rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh] sm:w-full sm:max-w-2xl">
        <AdminPermissionsForm
          key={`${user.id}-${open}`}
          user={user}
          onPermissionsSaved={onPermissionsSaved}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
