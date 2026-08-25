"use client"

import * as React from "react"
import { AlertCircle } from 'lucide-react'

import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

/**
 * Form field wrapper: label, optional description, control, and error message.
 *
 * SKILL.md requires every component to define an error state and requires that
 * accessibility rules be testable. Wiring `id`, `aria-describedby` and
 * `aria-invalid` by hand at every call site is exactly where that slips, so this
 * does it once. The control receives the wiring via context — see `useField`.
 *
 * The error is rendered with `role="alert"` so it is announced when it appears,
 * and it is never conveyed by colour alone: there is an icon and text.
 */

interface FieldContextValue {
  id: string
  descriptionId?: string
  errorId?: string
  invalid: boolean
  required: boolean
  disabled: boolean
}

const FieldContext = React.createContext<FieldContextValue | null>(null)

/**
 * Props to spread onto the control inside a Field.
 * @example <Input {...useField()} value={...} onChange={...} />
 */
export function useField() {
  const field = React.useContext(FieldContext)
  if (!field) {
    throw new Error("useField must be used inside a <Field>")
  }
  const describedBy = [field.descriptionId, field.errorId].filter(Boolean).join(" ")
  return {
    id: field.id,
    "aria-describedby": describedBy || undefined,
    "aria-invalid": field.invalid || undefined,
    "aria-required": field.required || undefined,
    disabled: field.disabled || undefined,
  } as const
}

interface FieldProps extends Omit<React.ComponentProps<"div">, "children"> {
  label: React.ReactNode
  /** Helper text shown under the label. Explain the constraint, not the obvious. */
  description?: React.ReactNode
  /** Presence of a message puts the field into its error state. */
  error?: string | null
  required?: boolean
  disabled?: boolean
  /** Hides the label visually but keeps it for assistive tech. */
  labelHidden?: boolean
  children: React.ReactNode
  htmlFor?: string
}

function Field({
  label,
  description,
  error,
  required = false,
  disabled = false,
  labelHidden = false,
  className,
  children,
  htmlFor,
  ...props
}: FieldProps) {
  const generatedId = React.useId()
  const id = htmlFor ?? generatedId
  const invalid = Boolean(error)

  const value = React.useMemo<FieldContextValue>(
    () => ({
      id,
      descriptionId: description ? `${id}-description` : undefined,
      errorId: invalid ? `${id}-error` : undefined,
      invalid,
      required,
      disabled,
    }),
    [id, description, invalid, required, disabled],
  )

  return (
    <FieldContext.Provider value={value}>
      <div
        data-slot="field"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn("flex flex-col gap-(--space-field)", className)}
        {...props}
      >
        <Label htmlFor={id} className={cn(labelHidden && "sr-only")}>
          {label}
          {required && (
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>

        {description && (
          <p id={value.descriptionId} className="text-xs text-muted-foreground">
            {description}
          </p>
        )}

        {children}

        {invalid && (
          <p
            id={value.errorId}
            role="alert"
            className="flex items-start gap-1.5 text-xs font-medium text-destructive"
          >
            <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
      </div>
    </FieldContext.Provider>
  )
}

export { Field }
