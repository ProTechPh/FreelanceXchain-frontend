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
      <DialogHeader className="p-6 pb-2 border-b border-border">
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

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                <div className="flex items-center justify-between pb-2 border-b border-border/60">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{group.name}</h4>
                    <p className="text-2xs text-muted-foreground">{group.description}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={toggleAllGroup}
                  >
                    {allGroupChecked ? 'Deselect Group' : 'Select Group'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {group.items.map((item) => {
                    const checked = selectedPermissions.has(item.key);
                    const isSuperManage = item.key === 'admin:manage';
                    return (
                      <div
                        key={item.key}
                        className={`flex items-start gap-3 p-3 rounded-md border transition-colors ${
                          checked
                            ? 'border-primary/50 bg-primary/5'
                            : 'border-border/60 hover:border-border'
                        } ${isSuperManage ? 'sm:col-span-2 bg-gradient-to-r from-info/5 to-transparent border-info/30' : ''}`}
                      >
                        <Checkbox
                          id={`perm-${item.key}`}
                          checked={checked}
                          onCheckedChange={() => togglePermission(item.key)}
                          className="mt-0.5"
                        />
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <Label
                            htmlFor={`perm-${item.key}`}
                            className="text-xs font-semibold cursor-pointer block text-foreground leading-tight"
                          >
                            {item.label}
                          </Label>
                          <p className="text-2xs text-muted-foreground leading-normal">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DialogFooter className="p-4 border-t border-border flex items-center justify-between sm:justify-between bg-muted/20">
        <div className="text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{selectedPermissions.size}</span>{' '}
          of {ADMIN_PERMISSIONS.length} permissions active
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            loading={saving}
            loadingText="Saving..."
            onClick={handleSave}
          >
            Save Permissions
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
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
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
