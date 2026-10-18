'use client';

import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2, Wand2 } from 'lucide-react';
import type { ContractOfferInput, OfferMilestoneDraft } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, useField } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import { formatAmount } from '@/lib/format';
import { useEthPhpRate } from '@/hooks/use-eth-php-rate';
import { autoBalanceMilestones, floorToUnits, roundEth, toUnits, todayIso, validateOfferDraft } from '@/lib/contract-terms';

type EntryCurrency = 'PHP' | 'ETH';

/**
 * Money input that stores ETH (the contract currency) but can be typed in pesos:
 * peso input is converted at the live rate and rounded to contract precision.
 */
function MoneyControl({ value, onChange, currency, rate }: { value: number; onChange: (eth: number) => void; currency: EntryCurrency; rate: number }) {
  const field = useField();
  const toDisplay = (eth: number) => {
    if (!Number.isFinite(eth)) return '';
    return currency === 'ETH' ? String(eth) : String(Math.round(eth * rate * 100) / 100);
  };
  const [text, setText] = useState(() => toDisplay(value));
  const textEth = text.trim() === '' ? Number.NaN : currency === 'ETH' ? Number(text) : roundEth(Number(text) / rate);
  const inSync = (!Number.isFinite(textEth) && !Number.isFinite(value)) || toUnits(textEth) === toUnits(value);
  // Show what the user typed unless the value changed elsewhere (auto-balance, defaults).
  const display = inSync ? text : toDisplay(value);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          {...field}
          type="number"
          inputMode="decimal"
          step="any"
          min="0"
          className="pr-12 tabular-nums"
          value={display}
          onChange={(e) => {
            const next = e.target.value;
            setText(next);
            if (next.trim() === '') return onChange(Number.NaN);
            const typed = Number(next);
            onChange(currency === 'ETH' ? typed : roundEth(typed / rate));
          }}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs font-medium text-muted-foreground" aria-hidden="true">
          {currency === 'ETH' ? 'ETH' : '₱'}
        </span>
      </div>
      {Number.isFinite(value) && value > 0 && (
        <p className="text-2xs text-muted-foreground tabular-nums">
          {currency === 'PHP'
            ? `= ${formatAmount(value, { currency: 'ETH', fractionDigits: 4 })}`
            : `≈ ${formatAmount(value * rate, { currency: 'PHP' })}`}
        </p>
      )}
    </div>
  );
}

function RushControl({ isRush, percentage, onToggle, onPercentage }: {
  isRush: boolean;
  percentage: number;
  onToggle: (on: boolean) => void;
  onPercentage: (value: number) => void;
}) {
  const field = useField();
  return (
    <div className="flex h-10 items-center gap-3">
      <Switch id={field.id} aria-describedby={field['aria-describedby']} checked={isRush} onCheckedChange={(checked) => onToggle(Boolean(checked))} />
      <span className="text-sm text-muted-foreground">{isRush ? 'On' : 'Off'}</span>
      {isRush && (
        <div className="relative ml-auto w-28">
          <Input
            aria-label="Rush fee percentage"
            aria-invalid={field['aria-invalid']}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            max="100"
            className="pr-7 tabular-nums"
            value={Number.isFinite(percentage) ? String(percentage) : ''}
            onChange={(e) => onPercentage(e.target.value === '' ? Number.NaN : Number(e.target.value))}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground" aria-hidden="true">%</span>
        </div>
      )}
    </div>
  );
}

function DateControl({ value, onChange, max }: { value: string; onChange: (v: string) => void; max?: string }) {
  const field = useField();
  return <Input {...field} type="date" min={todayIso()} max={max || undefined} value={value} onChange={(e) => onChange(e.target.value)} />;
}

function TextControl({ value, onChange, maxLength }: { value: string; onChange: (v: string) => void; maxLength: number }) {
  const field = useField();
  return <Input {...field} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />;
}

function AreaControl({ value, onChange, maxLength, rows = 2 }: { value: string; onChange: (v: string) => void; maxLength: number; rows?: number }) {
  const field = useField();
  return <Textarea {...field} rows={rows} value={value} maxLength={maxLength} onChange={(e) => onChange(e.target.value)} />;
}

type OfferBuilderProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDraft: ContractOfferInput;
  floor: number;
  maxMilestones: number;
  isCounter: boolean;
  submitting: boolean;
  /** Used when rush is switched on (the project's rush %, else 25). */
  defaultRushFeePercentage?: number;
  onSubmit: (draft: ContractOfferInput) => void;
};

export function OfferBuilderDialog(props: OfferBuilderProps) {
  const { open, onOpenChange, submitting } = props;
  return (
    <Dialog open={open} onOpenChange={(next) => { if (!submitting) onOpenChange(next); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        {/* Mounted per opening so every open starts from a fresh draft. */}
        {open && <OfferBuilderForm {...props} />}
      </DialogContent>
    </Dialog>
  );
}

function OfferBuilderForm({
  onOpenChange,
  initialDraft,
  floor,
  maxMilestones,
  isCounter,
  submitting,
  defaultRushFeePercentage = 25,
  onSubmit,
}: OfferBuilderProps) {
  const [draft, setDraft] = useState<ContractOfferInput>(initialDraft);
  const [showErrors, setShowErrors] = useState(false);
  const [currency, setCurrency] = useState<EntryCurrency>('PHP');
  const { rate, formatEthToPhp } = useEthPhpRate();

  const validation = useMemo(() => validateOfferDraft(draft, floor, { maxMilestones }), [draft, floor, maxMilestones]);
  const err = (key: string) => (showErrors ? validation.errors[key] ?? null : null);
  const eth = (value: number) => formatAmount(Number.isFinite(value) ? value : 0, { currency: 'ETH', fractionDigits: 4 });
  const ethWithPhp = (value: number) => `${eth(value)} (≈ ${formatEthToPhp(Number.isFinite(value) ? value : 0)})`;
  const minimum = floorToUnits(floor);

  const update = (patch: Partial<ContractOfferInput>) => setDraft((d) => ({ ...d, ...patch }));
  const updateMilestone = (index: number, patch: Partial<OfferMilestoneDraft>) =>
    setDraft((d) => ({ ...d, milestones: d.milestones.map((m, i) => (i === index ? { ...m, ...patch } : m)) }));
  const moveMilestone = (index: number, delta: -1 | 1) =>
    setDraft((d) => {
      const next = [...d.milestones];
      const target = index + delta;
      if (target < 0 || target >= next.length) return d;
      [next[index], next[target]] = [next[target]!, next[index]!];
      return { ...d, milestones: next };
    });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    if (!validation.valid) return;
    onSubmit({
      ...draft,
      rushFeePercentage: draft.isRush ? draft.rushFeePercentage : 0,
      message: draft.message?.trim() || undefined,
      milestones: draft.milestones.map((m) => ({ ...m, title: m.title.trim(), description: (m.description ?? '').trim() })),
    });
  };

  const { totals } = validation;

  return (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <DialogHeader>
            <DialogTitle>{isCounter ? 'Send a counter-offer' : 'Propose contract terms'}</DialogTitle>
            <DialogDescription>
              The base amount can&apos;t go below the freelancer&apos;s proposed rate of {ethWithPhp(minimum)}. Milestones must add up to the total.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border p-2 pl-3">
            <p className="text-xs text-muted-foreground">
              Enter amounts in {currency === 'PHP' ? 'pesos — converted to ETH at today\u2019s rate' : 'ETH'}. Contracts are paid in ETH.
            </p>
            <div role="group" aria-label="Amount currency" className="flex rounded-md bg-muted p-0.5">
              {(['PHP', 'ETH'] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={currency === option}
                  onClick={() => setCurrency(option)}
                  className={`rounded px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    currency === option ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {option === 'PHP' ? '₱ Peso' : 'ETH'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Base amount" description={`Minimum ${eth(minimum)}`} error={err('baseAmount')} required>
              <MoneyControl key={`base-${currency}`} currency={currency} rate={rate} value={draft.baseAmount} onChange={(v) => update({ baseAmount: v })} />
            </Field>
            <Field label="Additional pay" description="Bonus or extra scope on top of the base" error={err('additionalPay')}>
              <MoneyControl key={`extra-${currency}`} currency={currency} rate={rate} value={draft.additionalPay} onChange={(v) => update({ additionalPay: v })} />
            </Field>
            <Field label="Contract deadline" description="Last day for the final delivery" error={err('deadline')} required>
              <DateControl value={draft.deadline} onChange={(v) => update({ deadline: v })} />
            </Field>
            <Field label="Rush delivery" description="Optional fee charged on the base amount" error={err('rushFeePercentage')}>
              <RushControl
                isRush={draft.isRush}
                percentage={draft.rushFeePercentage}
                onToggle={(on) => update({
                  isRush: on,
                  ...(on && !(draft.rushFeePercentage > 0) ? { rushFeePercentage: defaultRushFeePercentage } : {}),
                })}
                onPercentage={(v) => update({ rushFeePercentage: v })}
              />
            </Field>
          </div>

          <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted p-3 text-sm sm:grid-cols-4" aria-live="polite">
            {[
              { label: 'Rush fee', value: totals.rushFee, className: 'font-semibold' },
              { label: 'Total', value: totals.totalAmount, className: 'font-semibold text-primary' },
              { label: 'Allocated', value: totals.allocated, className: 'font-semibold' },
              { label: 'Remaining', value: totals.remaining, className: totals.remaining === 0 ? 'font-semibold text-success' : 'font-semibold text-warning' },
            ].map((item) => (
              <div key={item.label}>
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className={`${item.className} tabular-nums`}>{eth(item.value)}</dd>
                <dd className="text-2xs text-muted-foreground tabular-nums">≈ {formatEthToPhp(Number.isFinite(item.value) ? item.value : 0)}</dd>
              </div>
            ))}
          </dl>

          <fieldset className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <legend className="text-sm font-semibold">Milestones ({draft.milestones.length}/{maxMilestones})</legend>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => update({ milestones: autoBalanceMilestones(draft.milestones, totals.totalAmount) })}
                  disabled={draft.milestones.length === 0}
                >
                  <Wand2 aria-hidden="true" /> Auto-balance
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={draft.milestones.length >= maxMilestones}
                  onClick={() => update({ milestones: [...draft.milestones, { title: '', description: '', amount: 0, dueDate: draft.deadline }] })}
                >
                  <Plus aria-hidden="true" /> Add milestone
                </Button>
              </div>
            </div>
            {showErrors && validation.errors.milestones && (
              <Alert tone="destructive" title={validation.errors.milestones} />
            )}

            <ol className="space-y-3">
              {draft.milestones.map((m, i) => (
                <li key={i} className="space-y-3 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">Milestone {i + 1}</span>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move milestone ${i + 1} up`} disabled={i === 0} onClick={() => moveMilestone(i, -1)}>
                        <ArrowUp aria-hidden="true" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Move milestone ${i + 1} down`} disabled={i === draft.milestones.length - 1} onClick={() => moveMilestone(i, 1)}>
                        <ArrowDown aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Remove milestone ${i + 1}`}
                        disabled={draft.milestones.length === 1}
                        onClick={() => update({ milestones: draft.milestones.filter((_, idx) => idx !== i) })}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid items-start gap-3 sm:grid-cols-[1fr_10rem_10rem]">
                    <Field label="Title" error={err(`milestones.${i}.title`)} required>
                      <TextControl value={m.title} maxLength={255} onChange={(v) => updateMilestone(i, { title: v })} />
                    </Field>
                    <Field label="Amount" error={err(`milestones.${i}.amount`)} required>
                      <MoneyControl key={`m-${i}-${currency}`} currency={currency} rate={rate} value={m.amount} onChange={(v) => updateMilestone(i, { amount: v })} />
                    </Field>
                    <Field label="Due date" error={err(`milestones.${i}.dueDate`)} required>
                      <DateControl value={m.dueDate} max={draft.deadline} onChange={(v) => updateMilestone(i, { dueDate: v })} />
                    </Field>
                  </div>
                  <Field label="Description" error={err(`milestones.${i}.description`)}>
                    <AreaControl value={m.description ?? ''} maxLength={2000} onChange={(v) => updateMilestone(i, { description: v })} />
                  </Field>
                </li>
              ))}
            </ol>
          </fieldset>

          <Field label="Message (optional)" description="Explain the changes. You can also discuss them in chat.">
            <AreaControl value={draft.message ?? ''} maxLength={2000} rows={3} onChange={(v) => update({ message: v })} />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting} loadingText="Sending…">
              {isCounter ? 'Send counter-offer' : 'Send offer'}
            </Button>
          </DialogFooter>
        </form>
  );
}
