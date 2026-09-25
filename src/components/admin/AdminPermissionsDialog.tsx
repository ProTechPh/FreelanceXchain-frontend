'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { ADMIN_PERMISSIONS, type AdminPermission, type AdminUser } from '@/types';
import { Shield, ShieldCheck, CheckCircle2, AlertTriangle, Key } from 'lucide-react';

interface AdminPermissionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onPermissionsSaved: (updatedUser: AdminUser) => void;
}

export interface PermissionGroup {
  name: string;
  description: string;
  items: {
    key: AdminPermission;
    label: string;
    description: string;
  }[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    name: 'KYC & Verification',
    description: 'Identity verification reviews and document management',
    items: [
      {
        key: 'kyc:view',
        label: 'View KYC Queue',
        description: 'Inspect user submissions, identity documents, and verification history',
      },
      {
        key: 'kyc:manage',
        label: 'Manage KYC Reviews',
        description: 'Approve, reject, request resubmission, or perform manual verification',
      },
    ],
  },
  {
    name: 'User Management',
    description: 'Account directory, status moderation, and profile administration',
    items: [
      {
        key: 'users:view',
        label: 'View Users',
        description: 'Search and inspect user accounts, roles, and profiles',
      },
      {
        key: 'users:manage',
        label: 'Manage Users',
        description: 'Suspend, unsuspend, verify, and modify user account statuses',
      },
    ],
  },
  {
    name: 'Disputes & Resolution',
    description: 'Contract conflicts, evidence, and mediation',
    items: [
      {
        key: 'disputes:view',
        label: 'View Disputes',
        description: 'Browse dispute cases, timelines, and submitted evidence',
      },
      {
        key: 'disputes:manage',
        label: 'Resolve Disputes',
        description: 'Make dispute rulings, trigger refund or payout disbursements',
      },
    ],
  },
  {
    name: 'Operations & Security',
    description: 'System metrics, audit trails, and administrative access',
    items: [
      {
        key: 'admin:manage',
        label: 'Admin Management (Super Admin)',
        description: 'Assign granular permissions and manage admin accounts',
      },
      {
        key: 'system:view',
        label: 'System Health',
        description: 'Monitor service health, database stats, and API uptime',
      },
      {
        key: 'audit:view',
        label: 'Security & Audit Logs',
        description: 'Search administrative logs, audit trails, and security alerts',
      },
    ],
  },
  {
    name: 'Insights & Support',
    description: 'Analytics, user feedback, tickets, and taxonomy',
    items: [
      {
        key: 'analytics:view',
        label: 'Analytics & Feedback',
        description: 'View platform metrics, revenue trends, app ratings, and user reviews',
      },
      {
        key: 'skills:manage',
        label: 'Skills Taxonomy',
        description: 'Manage platform skills, tags, and category hierarchies',
      },
      {
        key: 'support:manage',
        label: 'Support Tickets',
        description: 'Manage helpdesk inquiries and user support tickets',
      },
    ],
  },
];

export const PRESETS: { name: string; description: string; permissions: AdminPermission[] }[] = [
  {
    name: 'KYC Officer',
    description: 'Strictly restricted to KYC document reviews and approvals',
    permissions: ['kyc:view', 'kyc:manage'],
  },
  {
    name: 'Dispute Specialist',
    description: 'Handles contract disputes and arbitration',
    permissions: ['disputes:view', 'disputes:manage'],
  },
  {
    name: 'Support Agent',
    description: 'Manages support tickets and inspects user profiles',
    permissions: ['support:manage', 'users:view'],
  },
  {
    name: 'Auditor',
    description: 'Read-only access to audit logs, system health, and analytics',
    permissions: ['audit:view', 'system:view', 'analytics:view'],
  },
  {
    name: 'Super Admin',
    description: 'Full platform access including admin permission management',
    permissions: [...ADMIN_PERMISSIONS],
  },
];

export function AdminPermissionsDialog({
  open,
  onOpenChange,
  user,
  onPermissionsSaved,
}: AdminPermissionsDialogProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<AdminPermission>>(new Set());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && user) {
      const perms = user.permissions;
      // If permissions array is empty or undefined, or includes '*' or 'admin:manage',
      // it's a Super Admin by default
      const isSuper =
        !perms ||
        perms.length === 0 ||
        (perms as string[]).includes('*') ||
        perms.includes('admin:manage');

      if (isSuper) {
        setSelectedPermissions(new Set(ADMIN_PERMISSIONS));
      } else {
        setSelectedPermissions(new Set(perms));
      }
    }
  }, [open, user]);

  if (!user) return null;

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
      onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
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
                    title={preset.description}
                  >
                    {active && <CheckCircle2 className="size-3.5" />}
                    {preset.name}
                  </Button>
                );
              })}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => setSelectedPermissions(new Set())}
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Super Admin Notice */}
          {hasSuperAdminPerm ? (
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 flex items-start gap-3 text-xs">
              <ShieldCheck className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-foreground">Super Admin Access Enabled:</span>{' '}
                <span className="text-muted-foreground">
                  With <code className="bg-background px-1 py-0.5 rounded text-foreground font-mono">admin:manage</code>, this admin can modify platform settings and manage other admins.
                </span>
              </div>
            </div>
          ) : selectedPermissions.size === 0 ? (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 flex items-start gap-3 text-xs">
              <AlertTriangle className="size-4 text-amber-500 shrink-0 mt-0.5" />
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
              const someGroupChecked =
                !allGroupChecked && group.items.some((item) => selectedPermissions.has(item.key));

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
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-2xs px-2 text-muted-foreground hover:text-foreground"
                      onClick={toggleAllGroup}
                    >
                      {allGroupChecked ? 'Deselect group' : 'Select all'}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {group.items.map((item) => {
                      const isChecked = selectedPermissions.has(item.key);
                      return (
                        <div
                          key={item.key}
                          onClick={() => togglePermission(item.key)}
                          className={`flex items-start gap-3 p-2.5 rounded-md border transition-colors cursor-pointer select-none ${
                            isChecked
                              ? 'bg-primary/5 border-primary/30'
                              : 'bg-muted/30 border-transparent hover:bg-muted/60'
                          }`}
                        >
                          <Checkbox
                            id={item.key}
                            checked={isChecked}
                            onCheckedChange={() => togglePermission(item.key)}
                            className="mt-0.5 shrink-0"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="space-y-0.5 min-w-0">
                            <Label
                              htmlFor={item.key}
                              className="text-xs font-medium cursor-pointer block text-foreground leading-tight"
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
              onClick={() => onOpenChange(false)}
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
      </DialogContent>
    </Dialog>
  );
}
