"use client";

/**
 * The enquiry form, used inside the drawer and inline on the Contact page. Full client-side validation with the
 * shared zod schema; the POST goes to /api/enquiry and every outcome is shown honestly: success only when the
 * server says so, a plain explanation when delivery is not switched on, and never a pretend "sent".
 * Owner: pages-lead.
 */
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FilledButton } from "@/components/ui/Button";
import { cn } from "@/components/ui/cn";
import { TextLink } from "@/components/ui/TextLink";
import { en } from "@/content/i18n/en";
import { ConsentField, Honeypot, RadioChips, SelectField, TextAreaField, TextField } from "./EnquiryFields";
import { NotConfiguredPanel, SuccessPanel } from "./EnquiryStatus";
import { buildInitialValues, fieldId, FIELD_ORDER, toInput, type FormValues } from "./form-state";
import { BUDGET_VALUES, INTEREST_VALUES } from "./options";
import { formatPhone, normalizePhone } from "./phone";
import {
  addDaysIso,
  MAX_VISIT_DAYS_AHEAD,
  MESSAGE_MAX,
  MIN_FILL_MS,
  NAME_MAX,
  todayInIndia,
  validateEnquiry,
  type EnquiryField,
  type EnquiryFieldErrors,
} from "./schema";
import { submitEnquiry } from "./submit";
import type { EnquiryConfig, EnquiryPrefill } from "./types";

/** Extra wait on top of the 3 s time trap, so a slightly fast client clock never trips it. */
const CLOCK_MARGIN_MS = 500;

type Phase =
  | { kind: "form" }
  | { kind: "success"; name: string; visitDate: string; interestLabel: string; projectName: string }
  | { kind: "not-configured" };

type SubmitProblem = "error" | "network" | "rate-limited" | "too-fast" | "rejected";

export interface EnquiryFormProps {
  config: EnquiryConfig;
  prefill?: EnquiryPrefill;
  /**
   * Epoch milliseconds when the form opened (the drawer passes the moment of the click). The server rejects a submit
   * under 3 s after it. Left out, the form uses the moment it mounted in the browser (the inline Contact form).
   */
  openedAt?: number;
  /** Prefix for element ids, so two forms on one page never share ids. */
  scope: string;
  /** Values typed earlier (a closed and reopened drawer). */
  initialDraft?: Partial<FormValues>;
  onDraftChange?: (values: FormValues) => void;
  /** Called after a confirmed delivery, so the owner can drop its saved draft. */
  onSuccess?: () => void;
  /** Drawer: the success state offers "Done", which closes the drawer. */
  onDone?: () => void;
  /** Called when a link inside the form is followed (the drawer closes itself). */
  onNavigate?: () => void;
  variant?: "drawer" | "inline";
}

function errorMessage(code: EnquiryFieldErrors[EnquiryField]): string | undefined {
  return code ? en.enquiry.errors[code] : undefined;
}

function problemMessage(problem: SubmitProblem): string {
  switch (problem) {
    case "network":
      return en.enquiry.networkError;
    case "rate-limited":
      return en.enquiry.rateLimited;
    case "too-fast":
      return en.enquiry.tooFast;
    default:
      return en.enquiry.error;
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function EnquiryForm({
  config,
  prefill,
  openedAt,
  scope,
  initialDraft,
  onDraftChange,
  onSuccess,
  onDone,
  onNavigate,
  variant = "drawer",
}: EnquiryFormProps) {
  const [values, setValues] = useState<FormValues>(() => buildInitialValues(config, prefill, initialDraft));
  const [errors, setErrors] = useState<EnquiryFieldErrors>({});
  const [showErrors, setShowErrors] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [sending, setSending] = useState(false);
  const [problem, setProblem] = useState<SubmitProblem | null>(null);

  const sendingRef = useRef(false);
  const mountedRef = useRef(true);
  const mountedAtRef = useRef(0);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    mountedRef.current = true;
    mountedAtRef.current = Date.now();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // The date limits depend on today's date, so they are set on the input after mount (never in the server HTML).
  const visitDateId = fieldId(scope, "visitDate");
  useEffect(() => {
    if (phase.kind !== "form") return;
    const input = document.getElementById(visitDateId);
    if (!(input instanceof HTMLInputElement)) return;
    const today = todayInIndia(new Date());
    input.min = today;
    input.max = addDaysIso(today, MAX_VISIT_DAYS_AHEAD);
  }, [phase.kind, visitDateId]);

  useEffect(() => {
    if (phase.kind === "success") successHeadingRef.current?.focus();
  }, [phase.kind]);

  // Read in event handlers only: the mount time lives in a ref, so nothing time-dependent is rendered.
  function currentMeta() {
    return {
      openedAt: openedAt ?? mountedAtRef.current,
      plot: prefill?.plot,
      unit: prefill?.unit,
    };
  }

  function runValidation(next: FormValues): EnquiryFieldErrors {
    const result = validateEnquiry(toInput(next, currentMeta()));
    return result.ok ? {} : result.errors;
  }

  function update<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    const next = { ...values, [field]: value };
    setValues(next);
    onDraftChange?.(next);
    if (field in errors || showErrors) {
      const code = runValidation(next)[field as EnquiryField];
      setErrors((previous) => {
        const copy = { ...previous };
        if (code) copy[field as EnquiryField] = code;
        else delete copy[field as EnquiryField];
        return copy;
      });
    }
  }

  function validateOnBlur(field: EnquiryField) {
    if (values[field as keyof FormValues] === "" && field !== "phone" && field !== "name") return;
    const code = runValidation(values)[field];
    setErrors((previous) => {
      const copy = { ...previous };
      if (code) copy[field] = code;
      else delete copy[field];
      return copy;
    });
  }

  function focusFirstError(found: EnquiryFieldErrors) {
    const first = FIELD_ORDER.find((field) => found[field]);
    if (!first) return;
    // Look inside this form only, and only if it is still mounted when the frame arrives.
    window.requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[id="${fieldId(scope, first)}"]`)?.focus());
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;

    const meta = currentMeta();
    const payload = toInput(values, { ...meta, source: window.location.pathname });
    const checked = validateEnquiry(payload);
    if (!checked.ok) {
      setErrors(checked.errors);
      setShowErrors(true);
      setProblem(null);
      focusFirstError(checked.errors);
      return;
    }

    sendingRef.current = true;
    setSending(true);
    setProblem(null);
    setErrors({});

    // The server rejects a submit under 3 s after the form opened. Autofill can be that fast, so wait it out.
    const remaining = MIN_FILL_MS + CLOCK_MARGIN_MS - (Date.now() - meta.openedAt);
    if (remaining > 0) await wait(remaining);

    const outcome = await submitEnquiry(payload);
    sendingRef.current = false;
    if (!mountedRef.current) return;
    setSending(false);

    switch (outcome.kind) {
      case "success": {
        onSuccess?.();
        const project = config.projects.find((item) => item.slug === values.project);
        setPhase({
          kind: "success",
          name: values.name,
          visitDate: values.visitDate,
          interestLabel: en.enquiry.interest[values.interest],
          projectName: project?.name ?? en.brand.flagship,
        });
        return;
      }
      case "not-configured":
        setPhase({ kind: "not-configured" });
        return;
      case "invalid":
        setErrors(outcome.errors);
        setShowErrors(true);
        focusFirstError(outcome.errors);
        return;
      default:
        setProblem(outcome.kind);
    }
  }

  function startAnother() {
    setValues(buildInitialValues(config, prefill));
    setErrors({});
    setShowErrors(false);
    setProblem(null);
    setPhase({ kind: "form" });
  }

  if (phase.kind === "success") {
    return (
      <SuccessPanel
        name={phase.name}
        visitDate={phase.visitDate}
        projectName={phase.projectName}
        interestLabel={phase.interestLabel}
        whatsapp={config.whatsapp}
        onDone={onDone}
        onAnother={variant === "inline" ? startAnother : undefined}
        headingRef={successHeadingRef}
      />
    );
  }

  if (phase.kind === "not-configured") {
    return <NotConfiguredPanel config={config} onBack={() => setPhase({ kind: "form" })} />;
  }

  const id = (field: EnquiryField) => fieldId(scope, field);
  const normalizedPhone = normalizePhone(values.phone);
  const hasErrors = Object.keys(errors).length > 0;
  const interestOptions = INTEREST_VALUES.map((value) => ({ value, label: en.enquiry.interest[value] }));
  const budgetOptions = BUDGET_VALUES.map((value) => ({ value, label: en.enquiry.budget[value] }));
  const projectOptions = config.projects.map((project) => ({ value: project.slug, label: project.name }));
  const wide = variant === "inline";
  const span = wide ? "md:col-span-2" : undefined;

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} className={wide ? "grid gap-x-6 gap-y-6 md:grid-cols-2" : "grid gap-6"} data-enquiry-form="">
      {prefill?.plot !== undefined ? (
        <p className={cn("chip w-fit", span)}>
          {en.enquiry.aboutPlot} {prefill.plot}
        </p>
      ) : null}
      {prefill?.unit ? (
        <p className={cn("chip w-fit", span)}>
          {en.enquiry.aboutUnit} {prefill.unit}
        </p>
      ) : null}

      <TextField
        id={id("name")}
        name="name"
        label={en.enquiry.fields.name}
        value={values.name}
        onChange={(value) => update("name", value)}
        onBlur={() => validateOnBlur("name")}
        error={errorMessage(errors.name)}
        autoComplete="name"
        maxLength={NAME_MAX + 20}
      />
      <TextField
        id={id("phone")}
        name="phone"
        label={en.enquiry.fields.phone}
        type="tel"
        inputMode="tel"
        value={values.phone}
        onChange={(value) => update("phone", value)}
        onBlur={() => validateOnBlur("phone")}
        error={errorMessage(errors.phone)}
        hint={normalizedPhone ? `${en.enquiry.fields.phoneConfirm} ${formatPhone(normalizedPhone)}` : en.enquiry.fields.phoneHint}
        autoComplete="tel"
        maxLength={24}
      />
      <TextField
        id={id("email")}
        name="email"
        label={en.enquiry.fields.email}
        type="email"
        inputMode="email"
        value={values.email}
        onChange={(value) => update("email", value)}
        onBlur={() => validateOnBlur("email")}
        error={errorMessage(errors.email)}
        optional
        autoComplete="email"
        maxLength={254}
      />
      {projectOptions.length > 1 ? (
        <SelectField
          id={id("project")}
          name="project"
          label={en.enquiry.fields.project}
          value={values.project}
          onChange={(value) => update("project", value)}
          options={projectOptions}
          error={errorMessage(errors.project)}
        />
      ) : (
        <div className="grid content-start gap-1.5">
          <span className="t-mono-sm text-ink">{en.enquiry.fields.project}</span>
          <p className="m-0 border-b border-line-strong py-3 text-ink">{projectOptions[0]?.label}</p>
        </div>
      )}
      <div className={span}>
        <RadioChips
          name={`${scope}-interest`}
          legend={en.enquiry.fields.interest}
          value={values.interest}
          onChange={(value) => update("interest", value as FormValues["interest"])}
          options={interestOptions}
        />
      </div>
      <SelectField
        id={id("budget")}
        name="budget"
        label={en.enquiry.fields.budget}
        value={values.budget}
        onChange={(value) => update("budget", value as FormValues["budget"])}
        options={budgetOptions}
        error={errorMessage(errors.budget)}
      />
      <TextField
        id={id("visitDate")}
        name="visitDate"
        label={en.enquiry.fields.visitDate}
        type="date"
        value={values.visitDate}
        onChange={(value) => update("visitDate", value)}
        onBlur={() => validateOnBlur("visitDate")}
        error={errorMessage(errors.visitDate)}
        hint={en.enquiry.fields.visitDateHint}
        optional
      />
      <div className={span}>
        <TextAreaField
          id={id("message")}
          name="message"
          label={en.enquiry.fields.message}
          value={values.message}
          onChange={(value) => update("message", value)}
          onBlur={() => validateOnBlur("message")}
          error={errorMessage(errors.message)}
          optional
          placeholder={en.enquiry.fields.messagePlaceholder}
          maxLength={MESSAGE_MAX}
        />
      </div>
      <div className={span}>
        <ConsentField
          id={id("consent")}
          checked={values.consent}
          onChange={(checked) => update("consent", checked)}
          label={en.enquiry.fields.consent}
          error={errorMessage(errors.consent)}
        />
      </div>

      <Honeypot value={values.website} onChange={(value) => update("website", value)} />

      <div className={cn("grid gap-4", span)}>
        {showErrors && hasErrors ? (
          <p role="alert" className="t-small border-l-2 border-brick pl-3 text-brick-ink">
            {en.enquiry.fixFields}
          </p>
        ) : null}
        {problem ? (
          <p role="alert" className="t-small border-l-2 border-brick pl-3 text-brick-ink">
            <strong className="font-medium">{en.enquiry.errorTitle}.</strong> {problemMessage(problem)}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <FilledButton type="submit" disabled={sending} aria-busy={sending} arrow={!sending}>
            {sending ? en.enquiry.sending : en.enquiry.submit}
          </FilledButton>
          <p className="t-small m-0 text-ink-muted">
            {en.enquiry.privacyNote}{" "}
            <TextLink href="/privacy" onClick={onNavigate}>
              {en.enquiry.privacyLink}
            </TextLink>
          </p>
        </div>
        <p className="sr-only" role="status">
          {sending ? en.enquiry.sendingNote : ""}
        </p>
      </div>
    </form>
  );
}
