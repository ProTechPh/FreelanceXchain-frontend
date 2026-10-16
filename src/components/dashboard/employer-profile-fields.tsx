'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, FileText, Landmark } from 'lucide-react';
import { employersApi } from '@/lib/api';
import {
  BUSINESS_DOCUMENT_LABELS,
  BUSINESS_TYPE_OPTIONS,
  getBusinessFieldLabel,
  getRegistrationNumberLabel,
  groupMissingByTab,
  isEmployerProfileTab,
  type EmployerProfileForm,
  type EmployerProfileTab,
} from '@/lib/profile-form';
import { formatDateTime } from '@/lib/format';
import type { BusinessProfileCompleteness, EmployerProfile } from '@/types';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BusinessDocumentsCard } from '@/components/dashboard/business-documents-card';

function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

export function BusinessProfileCompletenessAlert({
  completeness,
  action,
  summary = false,
}: {
  completeness: BusinessProfileCompleteness;
  /** Optional next step, e.g. a link to the profile page. */
  action?: React.ReactNode;
  /** One-line count instead of the full list (the profile tabs list the items themselves). */
  summary?: boolean;
}) {
  if (completeness.complete) {
    return (
      <Alert
        tone="success"
        live={false}
        title="Business profile complete"
        description="You can post projects. Keep your business details and documents up to date."
      />
    );
  }

  const missing = [
    ...completeness.missingFields.map(getBusinessFieldLabel),
    ...completeness.missingDocuments.map((type) => BUSINESS_DOCUMENT_LABELS[type]),
  ];

  if (summary) {
    const fieldCount = completeness.missingFields.length;
    const documentCount = completeness.missingDocuments.length;
    const parts = [
      fieldCount > 0 ? pluralize(fieldCount, 'detail') : null,
      documentCount > 0 ? pluralize(documentCount, 'document') : null,
    ].filter(Boolean);
    return (
      <Alert
        tone="warning"
        title="Complete your business profile to post projects"
        description={`Still needed: ${parts.join(' and ')}. Tabs marked with a number have missing items.`}
        action={action}
      />
    );
  }

  return (
    <Alert
      tone="warning"
      title="Complete your business profile to post projects"
      description="Fill in every business detail (the website is optional) and upload the required documents."
      action={action}
    >
      <ul className="list-disc space-y-0.5 pl-5 text-xs sm:text-sm">
        {missing.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </Alert>
  );
}

function StillNeeded({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <p className="text-sm text-warning">
      <span className="font-semibold">Still needed:</span> {items.join(', ')}
    </p>
  );
}

function TabCount({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <Badge variant="destructive" className="ml-1 h-5 min-w-5 justify-center px-1.5" aria-label={`${count} missing`}>
      {count}
    </Badge>
  );
}

export function EmployerProfileFields({
  form,
  profile,
  updateField,
  identityCard,
}: {
  form: EmployerProfileForm;
  profile: EmployerProfile | null;
  updateField: <K extends keyof EmployerProfileForm>(field: K, value: EmployerProfileForm[K]) => void;
  /** Account identity card, shown on the Company profile tab. */
  identityCard?: React.ReactNode;
}) {
  const [completeness, setCompleteness] = useState<BusinessProfileCompleteness | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const activeTab: EmployerProfileTab = isEmployerProfileTab(tabParam) ? tabParam : 'company';

  const changeTab = (value: unknown) => {
    if (typeof value !== 'string' || !isEmployerProfileTab(value) || value === activeTab) return;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('tab', value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const missing = completeness
    ? groupMissingByTab(completeness)
    : { company: [], business: [], documents: [] };

  const refreshCompleteness = useCallback(async () => {
    try {
      const { data } = await employersApi.getCompleteness();
      setCompleteness(data);
    } catch {
      setCompleteness(null);
    }
  }, []);

  // Re-check after each save (updatedAt changes); document changes call refreshCompleteness.
  const profileUpdatedAt = profile?.updatedAt;
  useEffect(() => {
    if (!profileUpdatedAt) return;
    let active = true;
    employersApi
      .getCompleteness()
      .then(({ data }) => {
        if (active) setCompleteness(data);
      })
      .catch(() => {
        if (active) setCompleteness(null);
      });
    return () => {
      active = false;
    };
  }, [profileUpdatedAt]);

  return (
    <>
      {completeness && <BusinessProfileCompletenessAlert completeness={completeness} summary />}

      <Tabs value={activeTab} onValueChange={changeTab} className="gap-4">
        <TabsList className="w-full flex-nowrap sm:w-fit">
          <TabsTrigger value="company" className="px-2 sm:px-3">
            <Building2 aria-hidden="true" className="hidden sm:block" />
            <span className="truncate">Company<span className="hidden sm:inline"> profile</span></span>
            <TabCount count={missing.company.length} />
          </TabsTrigger>
          <TabsTrigger value="business" className="px-2 sm:px-3">
            <Landmark aria-hidden="true" className="hidden sm:block" />
            <span className="truncate">Business<span className="hidden sm:inline"> details</span></span>
            <TabCount count={missing.business.length} />
          </TabsTrigger>
          <TabsTrigger value="documents" className="px-2 sm:px-3">
            <FileText aria-hidden="true" className="hidden sm:block" />
            <span className="truncate">Documents</span>
            <TabCount count={missing.documents.length} />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <StillNeeded items={missing.company} />
          {identityCard}

          <Card>
            <CardHeader>
              <CardTitle>Company details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" htmlFor="company-name" required>
                <Input
                  id="company-name"
                  value={form.companyName}
                  onChange={(event) => updateField('companyName', event.target.value)}
                />
              </Field>
              <Field label="Industry" htmlFor="industry" required>
                <Input id="industry" value={form.industry} onChange={(event) => updateField('industry', event.target.value)} />
              </Field>
              <Field label="Year established" htmlFor="year-established" required>
                <Input
                  id="year-established"
                  type="number"
                  inputMode="numeric"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={form.yearEstablished}
                  onChange={(event) => updateField('yearEstablished', event.target.value)}
                />
              </Field>
              <Field label="Website (optional)" htmlFor="website">
                <Input
                  id="website"
                  type="url"
                  placeholder="https://"
                  value={form.website}
                  onChange={(event) => updateField('website', event.target.value)}
                />
              </Field>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="company-description">
                  Company description
                  <span className="text-destructive" aria-hidden="true">
                    *
                  </span>
                </Label>
                <Textarea
                  id="company-description"
                  rows={6}
                  value={form.description}
                  onChange={(event) => updateField('description', event.target.value)}
                />
              </div>
              {profile && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Company profile last updated {formatDateTime(profile.updatedAt)}.
                </p>
              )}
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <StillNeeded items={missing.business} />

          <Card>
            <CardHeader>
              <CardTitle>Business registration</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business type" htmlFor="business-type" required>
                <Select
                  value={form.businessType || undefined}
                  onValueChange={(value) => {
                    if (value) updateField('businessType', value as EmployerProfileForm['businessType']);
                  }}
                >
                  <SelectTrigger id="business-type">
                    <SelectValue placeholder="Select business type" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUSINESS_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="TIN" htmlFor="tin" required>
                <Input
                  id="tin"
                  inputMode="numeric"
                  placeholder="123-456-789-000"
                  aria-describedby="tin-hint"
                  value={form.tin}
                  onChange={(event) => updateField('tin', event.target.value)}
                />
                {/* Below the input so it lines up with Business type, which has no hint. */}
                <p id="tin-hint" className="text-xs text-muted-foreground">
                  Format 123-456-789 or 123-456-789-000
                </p>
              </Field>
              <Field
                label={getRegistrationNumberLabel(form.businessType)}
                htmlFor="registration-number"
                description="DTI for sole proprietorships, SEC for partnerships, corporations and cooperatives"
                required
                className="sm:col-span-2"
              >
                <Input
                  id="registration-number"
                  maxLength={50}
                  value={form.registrationNumber}
                  onChange={(event) => updateField('registrationNumber', event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business address" htmlFor="business-address" required className="sm:col-span-2">
                <Textarea
                  id="business-address"
                  rows={2}
                  maxLength={500}
                  value={form.businessAddress}
                  onChange={(event) => updateField('businessAddress', event.target.value)}
                />
              </Field>
              <Field label="Business phone" htmlFor="business-phone" required>
                <Input
                  id="business-phone"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  value={form.businessPhone}
                  onChange={(event) => updateField('businessPhone', event.target.value)}
                />
              </Field>
              <Field label="Business email" htmlFor="business-email" required>
                <Input
                  id="business-email"
                  type="email"
                  value={form.businessEmail}
                  onChange={(event) => updateField('businessEmail', event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <StillNeeded items={missing.documents} />
          <p className="text-sm text-muted-foreground">Uploads save immediately — no need to press Save profile.</p>
          {profile ? (
            <BusinessDocumentsCard businessType={form.businessType} onDocumentsChange={() => void refreshCompleteness()} />
          ) : (
            <Alert tone="info" live={false} title="Save your company profile first" description="You can upload business documents once your employer profile exists." />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
