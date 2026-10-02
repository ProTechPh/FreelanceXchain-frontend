'use client';

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  User as UserIcon,
  Mail,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Clock,
  AlertTriangle,
  Key,
  Ban,
  UserCheck,
  LogIn,
  Copy,
  Check,
  Wallet,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { formatDate } from '@/lib/format';
import { toast } from 'sonner';
import type { AdminUser, UserRole } from '@/types';

interface UserDetailDrawerProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageUsers?: boolean;
  canManageAdmins?: boolean;
  canManageKyc?: boolean;
  onLoginAs?: (user: AdminUser) => void;
  onManagePermissions?: (user: AdminUser) => void;
  onVerifyKyc?: (user: AdminUser) => void;
  onSuspend?: (user: AdminUser) => void;
  onUnsuspend?: (user: AdminUser) => void;
  pendingActionId?: string | null;
}

const roleColors: Record<UserRole, string> = {
  freelancer: 'bg-primary/10 text-primary border-primary/20',
  employer: 'bg-cyan/10 text-cyan border-cyan/20',
  admin: 'bg-info-subtle text-info border-info/20',
};

const statusColors: Record<string, string> = {
  active: 'bg-success-subtle text-success border-success-border',
  suspended: 'bg-destructive-subtle text-destructive border-destructive/20',
};

export function UserDetailDrawer({
  user,
  open,
  onOpenChange,
  canManageUsers = false,
  canManageAdmins = false,
  canManageKyc = false,
  onLoginAs,
  onManagePermissions,
  onVerifyKyc,
  onSuspend,
  onUnsuspend,
  pendingActionId,
}: UserDetailDrawerProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!user) return null;

  const isKycApproved = user.kycVerified || user.kycStatus === 'approved';
  const isKycPending = user.kycStatus === 'pending' || user.kycStatus === 'in_progress';
  const isKycRejected = user.kycStatus === 'rejected';

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    try {
      void navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error(`Could not copy ${fieldName.toLowerCase()}`);
    }
  };

  const hasAnyMutationPermission = canManageUsers || canManageAdmins || canManageKyc;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-6 flex flex-col gap-6"
        data-testid="user-detail-drawer"
        aria-label={`User details for ${user.name || user.email}`}
      >
        <SheetHeader className="p-0 text-left">
          <div className="flex items-center gap-3">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-lg">
              {user.name ? user.name.slice(0, 2).toUpperCase() : user.email ? user.email.slice(0, 2).toUpperCase() : <UserIcon className="size-6" />}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-lg font-bold truncate">
                User details for {user.name || user.email}
              </SheetTitle>
              <SheetDescription className="truncate text-xs text-muted-foreground">
                {user.email}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Status badges summary */}
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="outline" className={roleColors[user.role]}>
            {user.role}
          </Badge>
          <Badge variant="outline" className={statusColors[user.isActive ? 'active' : 'suspended']}>
            {user.isActive ? 'Active' : 'Suspended'}
          </Badge>
          {user.emailVerified ? (
            <Badge variant="outline" className="bg-success-subtle text-success border-success-border text-xs inline-flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Email Verified
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-warning-subtle text-warning border-warning-border text-xs inline-flex items-center gap-1 font-medium">
              <XCircle className="w-3.5 h-3.5" />
              Email Unverified
            </Badge>
          )}
          {isKycApproved ? (
            <Badge variant="outline" className="bg-success-subtle text-success border-success-border text-xs inline-flex items-center gap-1 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              KYC Approved
            </Badge>
          ) : isKycPending ? (
            <Badge variant="outline" className="bg-warning-subtle text-warning border-warning-border text-xs inline-flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5" />
              KYC Pending
            </Badge>
          ) : isKycRejected ? (
            <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs inline-flex items-center gap-1 font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              KYC Rejected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs inline-flex items-center gap-1 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              KYC Not Started
            </Badge>
          )}
        </div>

        <Separator />

        {/* Account Attributes */}
        <div className="space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Account Attributes
          </h4>

          <div className="space-y-3 text-sm">
            {/* User ID */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40">
              <div className="min-w-0">
                <span className="text-2xs text-muted-foreground block">User ID</span>
                <span className="font-mono text-xs truncate block select-all">{user.id}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                title="Copy User ID"
                aria-label="Copy User ID"
                onClick={() => copyToClipboard(user.id, 'User ID')}
              >
                {copiedField === 'User ID' ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              </Button>
            </div>

            {/* Email Address */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40">
              <div className="min-w-0">
                <span className="text-2xs text-muted-foreground flex items-center gap-1">
                  <Mail className="size-3" />
                  Email Address
                </span>
                <span className="text-xs truncate block select-all">{user.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0"
                title="Copy Email Address"
                aria-label="Copy Email Address"
                onClick={() => copyToClipboard(user.email, 'Email Address')}
              >
                {copiedField === 'Email Address' ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
              </Button>
            </div>

            {/* Wallet Address */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-muted/40">
              <div className="min-w-0">
                <span className="text-2xs text-muted-foreground flex items-center gap-1">
                  <Wallet className="size-3" />
                  Wallet Address
                </span>
                <span className="font-mono text-xs truncate block select-all">
                  {user.walletAddress ? user.walletAddress : 'No wallet connected'}
                </span>
              </div>
              {user.walletAddress && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 shrink-0"
                  title="Copy Wallet Address"
                  aria-label="Copy Wallet Address"
                  onClick={() => copyToClipboard(user.walletAddress, 'Wallet Address')}
                >
                  {copiedField === 'Wallet Address' ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
                </Button>
              )}
            </div>

            {/* Registration Date */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Joined Platform</span>
              </div>
              <span className="text-xs font-medium">{formatDate(user.createdAt)}</span>
            </div>

            {/* Admin Permissions (if admin) */}
            {user.role === 'admin' && (
              <div className="p-2.5 rounded-lg bg-muted/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="size-4 text-primary" />
                    <span className="text-xs font-medium">Assigned Permissions</span>
                  </div>
                  <span className="text-2xs text-muted-foreground">
                    {user.permissions?.length ?? 0} active
                  </span>
                </div>
                {user.permissions && user.permissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {user.permissions.map((p) => (
                      <Badge key={p} variant="outline" className="text-2xs bg-background">
                        {p}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-2xs text-muted-foreground italic">Super Admin (full system access)</p>
                )}
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Management Actions */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Management Actions
          </h4>

          {hasAnyMutationPermission ? (
            <div className="flex flex-col gap-2">
              {canManageAdmins && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs"
                  disabled={pendingActionId === user.id}
                  onClick={() => {
                    onOpenChange(false);
                    onLoginAs?.(user);
                  }}
                >
                  <LogIn className="size-4 mr-2" />
                  <span>Login as this user</span>
                </Button>
              )}

              {user.role === 'admin' && canManageAdmins && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs text-primary"
                  onClick={() => {
                    onOpenChange(false);
                    onManagePermissions?.(user);
                  }}
                >
                  <Key className="size-4 mr-2" />
                  <span>Manage permissions for {user.name || user.email}</span>
                </Button>
              )}

              {canManageKyc && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 text-xs text-primary"
                  disabled={pendingActionId === user.id || isKycApproved}
                  onClick={() => {
                    onOpenChange(false);
                    onVerifyKyc?.(user);
                  }}
                >
                  <ShieldCheck className="size-4 mr-2" />
                  <span>{isKycApproved ? 'KYC Already Approved' : `Manually verify KYC for ${user.name || user.email}`}</span>
                </Button>
              )}

              {canManageUsers && (
                user.isActive ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-9 text-xs text-warning border-warning/30 hover:bg-warning/10"
                    disabled={pendingActionId === user.id}
                    onClick={() => {
                      onOpenChange(false);
                      onSuspend?.(user);
                    }}
                  >
                    <Ban className="size-4 mr-2" />
                    <span>Suspend account ({user.name || user.email})</span>
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-9 text-xs text-success border-success/30 hover:bg-success/10"
                    disabled={pendingActionId === user.id}
                    onClick={() => {
                      onOpenChange(false);
                      onUnsuspend?.(user);
                    }}
                  >
                    <UserCheck className="size-4 mr-2" />
                    <span>Unsuspend account ({user.name || user.email})</span>
                  </Button>
                )
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-border/80 bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Read-only Permissions</p>
              <p>
                You are viewing this user profile with read-only permissions. Mutation actions such as account suspension, KYC verification, and impersonation require elevated administrative privileges.
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
