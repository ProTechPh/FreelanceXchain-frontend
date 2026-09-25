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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { adminApi } from '@/lib/api';
import { ADMIN_PERMISSIONS, type AdminPermission, type AdminUser, type UserRole } from '@/types';
import {
  UserPlus,
  Shield,
  Check,
  Copy,
  Eye,
  EyeOff,
  User,
  Briefcase,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Mail,
  Key,
} from 'lucide-react';
import { PERMISSION_GROUPS, PRESETS } from './AdminPermissionsDialog';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: (newUser: AdminUser) => void;
  canManageAdmins: boolean;
}

export function AddUserDialog({
  open,
  onOpenChange,
  onUserAdded,
  canManageAdmins,
}: AddUserDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('freelancer');
  const [passwordMode, setPasswordMode] = useState<'auto' | 'custom'>('auto');
  const [customPassword, setCustomPassword] = useState('');
  const [showCustomPassword, setShowCustomPassword] = useState(false);
  const [autoVerifyEmail, setAutoVerifyEmail] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<AdminPermission>>(
    new Set(['users:view', 'disputes:view', 'kyc:view', 'analytics:view'])
  );
  const [submitting, setSubmitting] = useState(false);

  // Success view state
  const [createdSuccess, setCreatedSuccess] = useState<{
    user: AdminUser;
    temporaryPassword?: string;
  } | null>(null);
  const [showTempPassword, setShowTempPassword] = useState(true);
  const [copied, setCopied] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('freelancer');
    setPasswordMode('auto');
    setCustomPassword('');
    setShowCustomPassword(false);
    setAutoVerifyEmail(true);
    setSelectedPermissions(new Set(['users:view', 'disputes:view', 'kyc:view', 'analytics:view']));
    setCreatedSuccess(null);
    setCopied(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const applyPreset = (presetPermissions: AdminPermission[]) => {
    setSelectedPermissions(new Set(presetPermissions));
  };

  const togglePermission = (perm: AdminPermission) => {
    const updated = new Set(selectedPermissions);
    if (updated.has(perm)) {
      updated.delete(perm);
    } else {
      updated.add(perm);
    }
    setSelectedPermissions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Please enter the user full name');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (role === 'admin' && !canManageAdmins) {
      toast.error('You do not have permission to create administrator accounts');
      return;
    }

    if (passwordMode === 'custom') {
      if (!customPassword || customPassword.length < 8) {
        toast.error('Custom password must be at least 8 characters long');
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await adminApi.createUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        password: passwordMode === 'custom' ? customPassword : undefined,
        permissions: role === 'admin' ? Array.from(selectedPermissions) : undefined,
        autoVerifyEmail,
      });

      const { user, temporaryPassword } = response.data;
      onUserAdded(user);

      if (temporaryPassword) {
        setCreatedSuccess({ user, temporaryPassword });
        toast.success(`Account created for ${user.email}`);
      } else {
        toast.success(`Account created for ${user.email}`);
        handleOpenChange(false);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to create user account. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const copyFullCredentials = async () => {
    if (!createdSuccess) return;
    const creds = [
      `FreelanceXchain Credentials`,
      `Name: ${createdSuccess.user.name}`,
      `Email: ${createdSuccess.user.email}`,
      `Role: ${createdSuccess.user.role}`,
      createdSuccess.temporaryPassword ? `Temporary Password: ${createdSuccess.temporaryPassword}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    await copyToClipboard(creds);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        {createdSuccess ? (
          <div className="space-y-6 py-2">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl">User Account Created</DialogTitle>
                  <DialogDescription>
                    The user has been registered in Appwrite Auth and public marketplace database.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">User Details</span>
                <Badge
                  variant="outline"
                  className={
                    createdSuccess.user.role === 'admin'
                      ? 'bg-info-subtle text-info border-info/30'
                      : createdSuccess.user.role === 'employer'
                      ? 'bg-cyan/10 text-cyan border-cyan/30'
                      : 'bg-primary/10 text-primary border-primary/30'
                  }
                >
                  {createdSuccess.user.role.toUpperCase()}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  <p className="font-semibold text-foreground">{createdSuccess.user.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email Address</p>
                  <p className="font-semibold text-foreground truncate">{createdSuccess.user.email}</p>
                </div>
              </div>

              {createdSuccess.user.role === 'admin' && createdSuccess.user.permissions && (
                <div className="pt-2 border-t border-border/60">
                  <p className="text-xs text-muted-foreground mb-1.5">Assigned Permissions</p>
                  <div className="flex flex-wrap gap-1">
                    {createdSuccess.user.permissions.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px] font-mono px-1.5 py-0">
                        {p}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {createdSuccess.temporaryPassword && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-amber-500 font-semibold text-sm">
                    <Key className="size-4" />
                    <span>Temporary Credentials</span>
                  </div>
                  <Badge variant="outline" className="border-amber-500/40 text-amber-500 text-[10px]">
                    Action Required
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">
                  Provide this temporary password to the user. For security reasons, it will not be displayed again.
                </p>

                <div className="flex items-center gap-2 bg-background border border-border rounded-md px-3 py-2 font-mono text-sm">
                  <span className="flex-1 select-all tracking-wider text-foreground">
                    {showTempPassword ? createdSuccess.temporaryPassword : '••••••••••••••••••'}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowTempPassword(!showTempPassword)}
                    aria-label={showTempPassword ? 'Hide password' : 'Show password'}
                  >
                    {showTempPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copyToClipboard(createdSuccess.temporaryPassword!)}
                    aria-label="Copy password"
                  >
                    {copied ? <Check className="size-4 text-emerald-500" /> : <Copy className="size-4" />}
                  </Button>
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={copyFullCredentials}
                    className="text-xs"
                  >
                    <Copy className="size-3.5 mr-1.5" />
                    Copy All Credentials
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={resetForm}
              >
                Add Another User
              </Button>
              <Button
                type="button"
                variant="gradient"
                onClick={() => handleOpenChange(false)}
              >
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <DialogHeader>
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <UserPlus className="size-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl">Add or Invite User</DialogTitle>
                  <DialogDescription>
                    Create a new user account with role assignment and permission controls.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="add-user-name" className="text-xs font-semibold">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="add-user-name"
                      placeholder="e.g. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="add-user-email" className="text-xs font-semibold">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      id="add-user-email"
                      type="email"
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Select Account Role</Label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Freelancer Card */}
                  <button
                    type="button"
                    onClick={() => setRole('freelancer')}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                      role === 'freelancer'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border bg-card hover:border-foreground/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
                        <User className="size-4 text-primary" />
                        <span>Freelancer</span>
                      </div>
                      {role === 'freelancer' && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Can bid on projects, manage milestones, and submit KYC.
                    </p>
                  </button>

                  {/* Employer Card */}
                  <button
                    type="button"
                    onClick={() => setRole('employer')}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                      role === 'employer'
                        ? 'border-cyan bg-cyan/5 ring-1 ring-cyan'
                        : 'border-border bg-card hover:border-foreground/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
                        <Briefcase className="size-4 text-cyan" />
                        <span>Employer</span>
                      </div>
                      {role === 'employer' && <Check className="size-4 text-cyan" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Can post jobs, hire talent, and deposit into escrow.
                    </p>
                  </button>

                  {/* Admin Card */}
                  <button
                    type="button"
                    disabled={!canManageAdmins}
                    onClick={() => {
                      if (canManageAdmins) setRole('admin');
                    }}
                    className={`flex flex-col text-left p-3 rounded-lg border transition-all ${
                      role === 'admin'
                        ? 'border-info bg-info/5 ring-1 ring-info'
                        : !canManageAdmins
                        ? 'border-border/60 bg-muted/40 opacity-60 cursor-not-allowed'
                        : 'border-border bg-card hover:border-foreground/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
                        <Shield className="size-4 text-info" />
                        <span>Administrator</span>
                      </div>
                      {role === 'admin' && <Check className="size-4 text-info" />}
                      {!canManageAdmins && <Lock className="size-3 text-muted-foreground" />}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {canManageAdmins
                        ? 'Dashboard access with customizable granular permissions.'
                        : 'Requires Super Admin (admin:manage) permission.'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Granular Permissions Section (Only for Admin Role) */}
              {role === 'admin' && (
                <div className="space-y-3 rounded-lg border border-info/30 bg-info/5 p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="size-4 text-info" />
                      <span className="text-sm font-semibold text-foreground">
                        Granular Admin Permissions
                      </span>
                    </div>
                    <Badge variant="outline" className="border-info/40 text-info text-[10px]">
                      {selectedPermissions.size} selected
                    </Badge>
                  </div>

                  {/* Presets */}
                  <div className="space-y-1.5">
                    <span className="text-xs text-muted-foreground font-medium">Quick Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESETS.map((preset) => {
                        const isSelected =
                          preset.permissions.length === selectedPermissions.size &&
                          preset.permissions.every((p) => selectedPermissions.has(p));
                        return (
                          <Button
                            key={preset.name}
                            type="button"
                            size="sm"
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => applyPreset(preset.permissions)}
                            className="text-xs h-7 px-2.5"
                          >
                            {preset.name}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Permission Groups */}
                  <div className="space-y-3 pt-2 max-h-48 overflow-y-auto pr-1">
                    {PERMISSION_GROUPS.map((group) => (
                      <div key={group.name} className="space-y-1.5">
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {group.name}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                          {group.items.map((item) => {
                            const checked = selectedPermissions.has(item.key);
                            return (
                              <label
                                key={item.key}
                                className={`flex items-start gap-2 p-2 rounded border cursor-pointer transition-colors ${
                                  checked
                                    ? 'bg-background border-primary/40'
                                    : 'bg-background/60 border-border hover:bg-background'
                                }`}
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={() => togglePermission(item.key)}
                                  className="mt-0.5"
                                />
                                <div className="space-y-0.5">
                                  <p className="text-xs font-medium text-foreground leading-tight">
                                    {item.label}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground leading-tight line-clamp-1">
                                    {item.description}
                                  </p>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Password Setting Mode */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold">Initial Password Option</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPasswordMode('auto')}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      passwordMode === 'auto'
                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/20'
                    }`}
                  >
                    <Key className="size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Auto-generate (Recommended)</p>
                      <p className="text-[10px] text-muted-foreground">Secure random 18-char password</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPasswordMode('custom')}
                    className={`flex items-center gap-2 p-2.5 rounded-lg border text-left transition-all ${
                      passwordMode === 'custom'
                        ? 'border-primary bg-primary/5 text-foreground ring-1 ring-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-foreground/20'
                    }`}
                  >
                    <Lock className="size-4 shrink-0 text-primary" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Set custom password</p>
                      <p className="text-[10px] text-muted-foreground">Specify initial password manually</p>
                    </div>
                  </button>
                </div>

                {passwordMode === 'custom' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="relative">
                      <Input
                        type={showCustomPassword ? 'text' : 'password'}
                        placeholder="Enter password (minimum 8 characters)"
                        value={customPassword}
                        onChange={(e) => setCustomPassword(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
                        onClick={() => setShowCustomPassword(!showCustomPassword)}
                      >
                        {showCustomPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Auto Verify Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id="auto-verify-email"
                  checked={autoVerifyEmail}
                  onCheckedChange={(checked) => setAutoVerifyEmail(Boolean(checked))}
                />
                <Label htmlFor="auto-verify-email" className="text-xs font-normal text-muted-foreground cursor-pointer">
                  Mark email as verified in Appwrite Auth (allows immediate login without confirmation email)
                </Label>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={submitting}
              >
                {submitting ? 'Creating User...' : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
