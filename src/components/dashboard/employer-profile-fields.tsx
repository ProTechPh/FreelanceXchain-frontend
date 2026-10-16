'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Building2, FileText, Landmark } from 'lucide-react';
import { employersApi } from '@/lib/api';
import {
  BUSINESS_DOCUMENT_LABELS,
  BUSINESS_TYPE_OPTIONS,
  EMPLOYER_PROFILE_TABS,
  EMPLOYER_PROFILE_TAB_LABELS,
  EMPLOYER_STEP_FIELDS,
  getBusinessFieldLabel,
  getEmployerFieldErrors,
  getEmployerStepErrors,
  getFirstStepWithErrors,
  getNextEmployerTab,
  getPreviousEmployerTab,
  getRegistrationNumberLabel,
  groupMissingByTab,
  isEmployerProfileTab,
  type EmployerFieldErrors,
  type EmployerProfileForm,
  type EmployerProfileTab,
} from '@/lib/profile-form';
import { formatDateTime } from '@/lib/format';
import type { BusinessProfileCompleteness, EmployerProfile } from '@/types';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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

/** Input element id for each employer form field (matches the Field htmlFor). */
const FIELD_INPUT_IDS: Record<keyof EmployerProfileForm, string> = {
  companyName: 'company-name',
  industry: 'industry',
  yearEstablished: 'year-established',
  website: 'website',
  description: 'company-description',
  businessType: 'business-type',
  tin: 'tin',
  registrationNumber: 'registration-number',
  businessAddress: 'business-address',
  businessPhone: 'business-phone',
  businessEmail: 'business-email',
};

/** Bring a field into view and put the cursor in it. */
function focusField(field: keyof EmployerProfileForm) {
  const element = document.getElementById(FIELD_INPUT_IDS[field]);
  if (!element) return;
  element.scrollIntoView({ block: 'center', behavior: 'instant' });
  element.focus({ preventScroll: true });
}

export interface EmployerOnboardingControls {
  /** Save and switch to employer; called from the last step. */
  onFinish: () => void;
  finishing: boolean;
}

/** Back / Next (or Finish) controls under each step of the employer setup. */
function StepFooter({
  tab,
  onBack,
  onContinue,
  finishing,
}: {
  tab: EmployerProfileTab;
  onBack: (tab: EmployerProfileTab) => void;
  /** Next on steps 1-2, Finish on the last step; the caller checks the step first. */
  onContinue: (tab: EmployerProfileTab) => void;
  finishing: boolean;
}) {
  const previous = getPreviousEmployerTab(tab);
  const next = getNextEmployerTab(tab);
  const step = EMPLOYER_PROFILE_TABS.indexOf(tab) + 1;

  return (
    <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {previous && (
          <Button type="button" variant="outline" onClick={() => onBack(previous)}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
        )}
        <span className="text-sm text-muted-foreground">
          Step {step} of {EMPLOYER_PROFILE_TABS.length}
        </span>
      </div>
      {next ? (
        <Button type="button" onClick={() => onContinue(tab)}>
          Next: {EMPLOYER_PROFILE_TAB_LABELS[next]}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Button>
      ) : (
        <Button type="button" onClick={() => onContinue(tab)} loading={finishing} loadingText="Finishing…">
          Finish &amp; switch to employer
        </Button>
      )}
    </div>
  );
}

export function EmployerProfileFields({
  form,
  profile,
  updateField,
  identityCard,
  onboarding,
}: {
  form: EmployerProfileForm;
  profile: EmployerProfile | null;
  updateField: <K extends keyof EmployerProfileForm>(field: K, value: EmployerProfileForm[K]) => void;
  /** Account identity card, shown on the Company profile tab. */
  identityCard?: React.ReactNode;
  /** "Become an employer" setup: adds Back / Next / Finish under each tab. */
  onboarding?: EmployerOnboardingControls;
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

  // Back / Next open the step at the top of the page. The scroll waits until
  // the new step has rendered and is instant: an animated scroll started
  // before the swap gets cancelled when the page height changes.
  const scrollToTopOnStepChange = useRef(false);
  // A field to focus once its step has rendered (Finish jumping back to a gap).
  const pendingFocusField = useRef<keyof EmployerProfileForm | null>(null);
  const goToStep = (tab: EmployerProfileTab) => {
    scrollToTopOnStepChange.current = true;
    changeTab(tab);
  };

  useEffect(() => {
    if (pendingFocusField.current) {
      focusField(pendingFocusField.current);
      pendingFocusField.current = null;
      scrollToTopOnStepChange.current = false;
      return;
    }
    if (!scrollToTopOnStepChange.current) return;
    scrollToTopOnStepChange.current = false;
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  // Inline errors from the step checks; editing a field clears its error.
  const [fieldErrors, setFieldErrors] = useState<EmployerFieldErrors>({});
  const setField = <K extends keyof EmployerProfileForm>(field: K, value: EmployerProfileForm[K]) => {
    updateField(field, value);
    if (fieldErrors[field]) {
      setFieldErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const missing = completeness
    ? groupMissingByTab(completeness)
    : { company: [], business: [], documents: [] };

  // Next only moves on once everything on the current step is filled in;
  // Finish re-checks every step and the required documents first.
  const continueFromStep = (tab: EmployerProfileTab) => {
    const next = getNextEmployerTab(tab);
    if (next) {
      const errors = getEmployerStepErrors(form, tab);
      const fields = tab === 'documents' ? [] : EMPLOYER_STEP_FIELDS[tab].filter((field) => errors[field]);
      if (fields.length > 0) {
        setFieldErrors((current) => ({ ...current, ...errors }));
        toast.error(`Complete ${fields.length === 1 ? 'the highlighted field' : `the ${fields.length} highlighted fields`} before continuing.`);
        focusField(fields[0]!);
        return;
      }
      goToStep(next);
      return;
    }

    const allErrors = getEmployerFieldErrors(form);
    const firstStep = getFirstStepWithErrors(allErrors);
    if (firstStep) {
      setFieldErrors(allErrors);
      toast.error(`Some ${EMPLOYER_PROFILE_TAB_LABELS[firstStep].toLowerCase()} are still missing.`);
      pendingFocusField.current = EMPLOYER_STEP_FIELDS[firstStep].find((field) => allErrors[field]) ?? null;
      changeTab(firstStep);
      return;
    }
    if (missing.documents.length > 0) {
      toast.error(`Upload the required documents: ${missing.documents.join(', ')}.`);
      return;
    }
    onboarding?.onFinish();
  };

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
              <Field label="Company name" htmlFor="company-name" required error={fieldErrors.companyName}>
                <Input
                  id="company-name"
                  value={form.companyName}
                  onChange={(event) => setField('companyName', event.target.value)}
                />
              </Field>
              <Field label="Industry" htmlFor="industry" required error={fieldErrors.industry}>
                <Input id="industry" value={form.industry} onChange={(event) => setField('industry', event.target.value)} />
              </Field>
              <Field label="Year established" htmlFor="year-established" required error={fieldErrors.yearEstablished}>
                <Input
                  id="year-established"
                  type="number"
                  inputMode="numeric"
                  min={1800}
                  max={new Date().getFullYear()}
                  value={form.yearEstablished}
                  onChange={(event) => setField('yearEstablished', event.target.value)}
                />
              </Field>
              <Field label="Website (optional)" htmlFor="website" error={fieldErrors.website}>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://"
                  value={form.website}
                  onChange={(event) => setField('website', event.target.value)}
                />
              </Field>
              <Field
                label="Company description"
                htmlFor="company-description"
                required
                error={fieldErrors.description}
                className="sm:col-span-2"
              >
                <Textarea
                  id="company-description"
                  rows={6}
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                />
              </Field>
              {profile && (
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Company profile last updated {formatDateTime(profile.updatedAt)}.
                </p>
              )}
            </CardContent>
          </Card>

          {onboarding && (
            <StepFooter tab="company" onBack={goToStep} onContinue={continueFromStep} finishing={onboarding.finishing} />
          )}
        </TabsContent>

        <TabsContent value="business" className="space-y-6">
          <StillNeeded items={missing.business} />

          <Card>
            <CardHeader>
              <CardTitle>Business registration</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business type" htmlFor="business-type" required error={fieldErrors.businessType}>
                <Select
                  // null (not undefined) keeps the Select controlled before a type is picked.
                  value={form.businessType || null}
                  onValueChange={(value) => {
                    if (value) setField('businessType', value as EmployerProfileForm['businessType']);
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
              <Field label="TIN" htmlFor="tin" required error={fieldErrors.tin}>
                <Input
                  id="tin"
                  inputMode="numeric"
                  placeholder="123-456-789-000"
                  aria-describedby="tin-hint"
                  value={form.tin}
                  onChange={(event) => setField('tin', event.target.value)}
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
                error={fieldErrors.registrationNumber}
                className="sm:col-span-2"
              >
                <Input
                  id="registration-number"
                  maxLength={50}
                  value={form.registrationNumber}
                  onChange={(event) => setField('registrationNumber', event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Business contact</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Business address" htmlFor="business-address" required error={fieldErrors.businessAddress} className="sm:col-span-2">
                <Textarea
                  id="business-address"
                  rows={2}
                  maxLength={500}
                  value={form.businessAddress}
                  onChange={(event) => setField('businessAddress', event.target.value)}
                />
              </Field>
              <Field label="Business phone" htmlFor="business-phone" required error={fieldErrors.businessPhone}>
                <Input
                  id="business-phone"
                  type="tel"
                  placeholder="+63 912 345 6789"
                  value={form.businessPhone}
                  onChange={(event) => setField('businessPhone', event.target.value)}
                />
              </Field>
              <Field label="Business email" htmlFor="business-email" required error={fieldErrors.businessEmail}>
                <Input
                  id="business-email"
                  type="email"
                  value={form.businessEmail}
                  onChange={(event) => setField('businessEmail', event.target.value)}
                />
              </Field>
            </CardContent>
          </Card>

          {onboarding && (
            <StepFooter tab="business" onBack={goToStep} onContinue={continueFromStep} finishing={onboarding.finishing} />
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <StillNeeded items={missing.documents} />
          <p className="text-sm text-muted-foreground">Uploads save immediately — no need to press Save profile.</p>
          {profile ? (
            <BusinessDocumentsCard businessType={form.businessType} onDocumentsChange={() => void refreshCompleteness()} />
          ) : (
            <Alert tone="info" live={false} title="Save your company profile first" description="You can upload business documents once your employer profile exists." />
          )}
          {onboarding && (
            <StepFooter tab="documents" onBack={goToStep} onContinue={continueFromStep} finishing={onboarding.finishing} />
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}
