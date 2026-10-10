"use client";

/**
 * Field building blocks for the enquiry form: labelled controls with hints and linked error text. Visible labels
 * only (never placeholder-only), errors tied to their control with aria-describedby, 44 px touch targets.
 * Owner: pages-lead.
 */
import type { ReactNode } from "react";
import { cn } from "@/components/ui/cn";
import { Icon } from "@/components/ui/Icon";
import { en } from "@/content/i18n/en";

interface ShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
  children: ReactNode;
}

function describedBy(id: string, error?: string, hint?: ReactNode): string | undefined {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

function FieldShell({ id, label, error, hint, optional, className, children }: ShellProps) {
  return (
    <div className={cn("grid content-start gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="t-mono-sm text-ink">
          {label}
        </label>
        {optional ? <span className="t-mono-sm text-ink-muted">{en.enquiry.optionalHint}</span> : null}
      </div>
      {children}
      {error ? (
        <p id={`${id}-error`} className="t-small text-brick-ink">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="t-small text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  type?: "text" | "tel" | "email" | "date";
  inputMode?: "text" | "tel" | "email" | "numeric";
  autoComplete?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  className?: string;
}

export function TextField({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  error,
  hint,
  optional,
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  min,
  max,
  className,
}: TextFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <input
        id={id}
        name={name}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        autoCapitalize={type === "email" ? "none" : undefined}
        spellCheck={type === "email" || type === "tel" ? false : undefined}
        maxLength={maxLength}
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input"
      />
    </FieldShell>
  );
}

interface TextAreaFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  optional?: boolean;
  placeholder?: string;
  maxLength: number;
}

export function TextAreaField({ id, name, label, value, onChange, onBlur, error, optional, placeholder, maxLength }: TextAreaFieldProps) {
  const remaining = maxLength - value.length;
  const hint = remaining <= 150 ? `${remaining} ${en.enquiry.charsLeft}` : undefined;
  return (
    <FieldShell id={id} label={label} error={error} optional={optional} hint={hint}>
      <textarea
        id={id}
        name={name}
        rows={4}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy(id, error, hint)}
        className="field-input min-h-28 resize-y"
      />
    </FieldShell>
  );
}

interface SelectFieldProps {
  id: string;
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
  error?: string;
  hint?: ReactNode;
}

export function SelectField({ id, name, label, value, onChange, options, error, hint }: SelectFieldProps) {
  return (
    <FieldShell id={id} label={label} error={error} hint={hint}>
      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className="field-input appearance-none pr-10"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Icon name="chevron-right" size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-ink-muted" />
      </div>
    </FieldShell>
  );
}

interface RadioChipsProps {
  name: string;
  legend: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}

export function RadioChips({ name, legend, value, onChange, options }: RadioChipsProps) {
  return (
    <fieldset className="m-0 grid min-w-0 gap-2 border-0 p-0">
      <legend className="t-mono-sm mb-1 p-0 text-ink">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="radio-chip">
            <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onChange(option.value)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

interface ConsentFieldProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  error?: string;
}

export function ConsentField({ id, checked, onChange, label, error }: ConsentFieldProps) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-3 py-1.5">
        <input
          id={id}
          type="checkbox"
          name="consent"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-brick"
        />
        <span className="t-small text-ink">{label}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="t-small text-brick-ink">
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface HoneypotProps {
  value: string;
  onChange: (value: string) => void;
}

/** A field no person sees or reaches: a bot that fills it is rejected by the server. */
export function Honeypot({ value, onChange }: HoneypotProps) {
  return (
    <div className="hp-field" aria-hidden="true">
      <label>
        Leave this field empty
        <input
          type="text"
          name="url_confirm"
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </label>
    </div>
  );
}
